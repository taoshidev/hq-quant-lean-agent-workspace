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

Only the Lead Quant talks to the trader. Each persona works from what the Lead Quant hands it and
hands back a finding, a proposal or a verdict in a short structured block. None of them can read
the Studio by itself, run research, or change a strategy; the Lead Quant proposes, the trader
confirms.

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
gets checked out; `AGENT_WORKSPACE_REPO_URL` on hq-web overrides the URL. The clone happens at
sandbox creation: a sandbox that already exists keeps the content it was created with until it is
re-provisioned or updated by hand.

## Versioning

- `VERSION` holds the semver of this workspace; `CHANGELOG.md` says what changed. Bump both in the
  same change, and tag the merge commit `v<VERSION>`.
- The Studio records the version it expects its sessions to run with
  (`STUDIO_AGENT_WORKSPACE_VERSION`, shown on a reply's hover and stored with each session). Set
  it to the tag deployed; leave it unset and the Studio says `unversioned`.
- The control plane does not report which commit a sandbox cloned. Until it does, the version the
  Studio shows is what the deployment declares, not what the container holds.

## Checking it locally

With the Claude Code CLI installed, from a checkout of this repository:

```
claude -p "Which sub-agents can you delegate to, by name?" --max-turns 2
```

The answer should name the six personas above; the session reads `CLAUDE.md` and
`.claude/agents/` from the working directory.

## Licence and attribution

`CLAUDE.md` and the three `docs/` files are adapted from the
[Hyperquant Lead Quant Agent framework](https://github.com/taoshidev/hyperquant-framework)
(Apache License 2.0). See `NOTICE` for the attribution and what changed on the way across.
