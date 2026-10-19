# hq-quant-lean-agent-workspace

The agent workspace of **Vanta Strategy Studio**: the instructions the sandboxed **Lead Quant**
runs with, and the Claude Code sub-agent personas it delegates to. This repository holds
instructions, not application code.

## What it is for

The Studio gives every trader a private sandbox. The sandbox control plane (hq-web, the
hyperquant-app) clones this repository into `/home/sandbox/agent-workspace` and starts a Claude
Code session there with no system prompt of its own. Claude Code reads `CLAUDE.md` from the
working directory as its project instructions and `.claude/agents/` as its project sub-agents,
so what is in this repository is what the agent is.

The Studio adds, on every message, a **context note**: the strategy on screen with its rules and
values, what the Studio can build today, and the exact grammar for proposing a change. The note
is authoritative for the current state; this repository says who the agent is and how it works.

## The files

| File                                 | Role                                                                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                          | The Lead Quant constitution: where it is, the prime directive, the hard rules, the loop over the Studio's steps, the team. Always loaded; kept short. |
| `docs/workflow.md`                   | The Studio's eight steps (Describe, Own it, Build, See it trade, Stress-test, Freeze, Observe, Attach) and what the Lead Quant does at each. |
| `docs/pitfalls.md`                   | The research-integrity checklist, with what the Studio handles and what stays in the design and the reading.                      |
| `docs/validation.md`                 | How to read a run, which checks to ask of it, and how to write a verdict.                                                         |
| `.claude/agents/data-scout.md`       | Markets, timeframe, session, coverage.                                                                                            |
| `.claude/agents/signal-architect.md` | The trader's rules as rules and components the Studio can hold.                                                                    |
| `.claude/agents/risk-architect.md`   | Design-time stop, target, hold, sizing, exposure.                                                                                 |
| `.claude/agents/research-engineer.md`| What a run measures and how to read it.                                                                                           |
| `.claude/agents/skeptic.md`          | The veto: the attack before anything reaches the trader.                                                                          |
| `.claude/agents/advocate.md`         | The steelman: the strongest honest case, answering the Skeptic by id.                                                             |
| `VERSION`, `CHANGELOG.md`            | The workspace version (semver) and what changed.                                                                                  |
| `NOTICE`                             | Upstream attribution.                                                                                                             |
| `LICENSE`                            | Apache License 2.0: this repository's licence, and the one the adapted files came with.                                            |

Only the Lead Quant talks to the trader. Each persona works from what the Lead Quant hands it and
hands back a finding, a proposal or a verdict in a short structured block. Every delegation runs in
the foreground, inside the Lead Quant's turn, and is waited for, so each report is on the turn's
record. None of them can read the Studio by itself, run research, or change a strategy; the Lead
Quant proposes, the trader confirms.

## How hq clones it

`provisionWorkspaces` in hq-web (`packages/core/src/frameworks/framework-sandbox.ts`) runs, inside
the sandbox as the `sandbox` user, once the sandbox is up:

```
git clone --bare https://github.com/taoshidev/hq-quant-lean-agent-workspace.git .git
git config --unset core.bare
git checkout --force
```

in `/home/sandbox/agent-workspace`, so the working tree is populated without disturbing the
pre-existing `strategy-workspace/` directory (ignored by `.gitignore`). The default branch is what
gets checked out at the clone; `AGENT_WORKSPACE_REPO_URL` on hq-web overrides the URL, and
`AGENT_WORKSPACE_REF` names the tag or branch hq-web brings the checkout to at each session open,
recording the commit and `VERSION` it observed there.

## Versioning

One token, two spellings, and which goes where:

- `VERSION` holds the semver of this workspace, bare (`1.0.0`); `CHANGELOG.md` says what changed.
  Bump both in the same change.
- The git tag on the merge commit is `v` + the contents of `VERSION` (`v1.0.0`).
- The Studio's `STUDIO_AGENT_WORKSPACE_VERSION` is the contents of `VERSION` of the tag its
  sandboxes hold (`1.0.0`, no `v`). The Studio records it with each session it opens and shows it
  on the reply's hover as "expected to run Lead Quant workspace 1.0.0". Unset, it records
  `unversioned` and shows no version. Any declared value of `1.0.0` or later tells the Studio the
  sandbox carries this `CLAUDE.md`, so its per-turn note stops repeating what *Where you are* says;
  a value below `1.0.0`, or a commit hash, keeps the note saying it.
- The control plane checks the configured ref out at each session open and reports the commit and
  `VERSION` it observed. The Studio shows the declared version and attributes the voice by the
  observed commit: a sandbox at a commit the Studio holds no release manifest for is not named the
  Lead Quant, whatever the deployment declares. Set the variable once the deployment's sandboxes
  are brought to the tag and the Studio holds that release's manifest.

## Checking it locally

With the Claude Code CLI installed, from a checkout of this repository. Two checks, because they
prove different things: a listing proves `CLAUDE.md` was loaded (its *The team* table names the
six), and only a delegation proves `.claude/agents/` were registered as sub-agents.

```
claude -p "Which sub-agents can you delegate to, by name?" --max-turns 2
```

The answer names the six personas above. Then:

```
claude -p "Delegate exactly one question to your skeptic sub-agent and wait for its report: the \
candidate is a long-only breakout on ZEC-USD, 4-hour closed bars, entry on a close above the \
20-bar high, stop 1% below the entry, no target, no research run yet. Then say what the Skeptic \
handed back (its VERDICT line and the id of each objection) and which other sub-agents you have, \
by name." --allowedTools Agent,Task,Read,Grep,Glob --max-turns 4 --output-format json
```

The JSON result's `subagent_stats.by_type` reads `{"skeptic": 1}` and the reply quotes a
`VERDICT:` line; a result with `spawned: 0` means the personas were listed, not run.

## Licence and attribution

This repository is licensed under the Apache License 2.0; the text is in `LICENSE`. `CLAUDE.md`
and the three `docs/` files are adapted from the
[Hyperquant Lead Quant Agent framework](https://github.com/taoshidev/hyperquant-framework), under
the same licence. See `NOTICE` for the attribution and what changed on the way across.
