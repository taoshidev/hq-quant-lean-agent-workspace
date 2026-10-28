# hq-quant-lean-agent-workspace

The agent workspace of **Glitch**, Vanta Labs' strategy studio: the instructions the sandboxed
**Lead Quant** runs with, the Claude Code sub-agent personas it delegates to, and the formats their
reports follow. This repository holds instructions and two small checks, not application code.

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
| `formats/<persona>.json`             | Each persona's report format: its sections, the shape of each item, its template and further checks. Glitch reads reports with the same files. |
| `bin/check-report`                   | `bin/check-report <persona> [file]`: whether a report follows its format; every reason and the template when it does not.        |
| `bin/check-release.mjs`              | Whether a release is consistent before it is tagged (`docs/releasing.md`).                                                        |
| `release.json`                       | The release: version, tag, and per persona its name, code, description, tools, model and format (with the file's sha256).         |
| `docs/releasing.md`                  | How a release is cut, and the checks every later release runs.                                                                    |
| `test/`                              | `node --test test/release.test.mjs`: sample reports in the old and new shapes, the persona blocks, the release's consistency.     |
| `VERSION`, `CHANGELOG.md`            | The workspace version (semver) and what changed.                                                                                  |
| `NOTICE`                             | Upstream attribution.                                                                                                             |
| `LICENSE`                            | Apache License 2.0: this repository's licence, and the one the adapted files came with.                                            |

Only the Lead Quant talks to the trader. Each persona works from what the Lead Quant hands it and
hands back a finding, a proposal or a verdict in a short structured block, its report format, which
the trader reads verbatim and the Lead Quant checks with `bin/check-report`. Every delegation runs
in the foreground, inside the Lead Quant's turn, and is waited for, so each report is on the turn's
record. In a conversation Glitch opens with its tools, a persona reads and checks the Studio with
the ones its `tools:` list names (`mcp__studio__<name>`); without them it sees only the Lead
Quant's brief. None of them can run research or change a strategy, and none lists a proposal
tool; the Lead Quant proposes, the trader confirms.

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
- From 1.1.0 the manifest is this repository's `release.json` and `formats/*.json`, copied byte
  for byte into Glitch for each tag. The tag, the version in `VERSION` and the deployment's two
  settings move together, and only once the Glitch build that holds the release is deployed
  (`docs/releasing.md`).

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
`VERDICT:` line; a result with `spawned: 0` means the personas were listed, not run. Newer CLI
builds may run a teammate in the background unasked; the check that counts is the next one.

### Through the control plane (ACP)

The sandbox runs this workspace through the Agent Client Protocol adapter and the CLI it bundles,
not the CLI on your PATH, so the delegation check that matters is the same prompt sent through
the control plane to a sandbox brought to the ref under test. Read that session's recorded events
(the Studio's capture script exports them as JSONL) and expect:

- a `tool_call` whose `rawInput.subagent_type` is `skeptic` and whose `rawInput.run_in_background`
  is `false`;
- its completed `tool_call_update`, whose content is the Skeptic's report, which
  `bin/check-report skeptic` accepts; content that reads "Async agent launched successfully" means
  the teammate ran in the background and its report never reached the turn;
- a Bash call that runs `bin/check-report skeptic` on that report before the reply;
- a brief (`rawInput.prompt`) with no fence line of the note and no internal id.

With Glitch's tools in the conversation (from 1.2.0), also expect a teammate's Studio call
(`mcp__studio__check_script`, for the Skeptic) whose `_meta.claudeCode.parentToolUseId` is the
teammate's `Agent` call, so the call is attributed to the teammate and not to the Lead Quant.
From 1.3.0, a Skeptic asked to attack a strategy also calls `mcp__studio__skeptic_findings`,
stamped the same way, and its report cites the ids that call returned.
From 1.4.0, on a drafting turn (a strategy with no rules yet), expect the Lead Quant's own
`mcp__studio__author_strategy` call (no `parentToolUseId`) after the first `check_script` that says
the Studio would hold the script, and before any `Agent` call, unless an earlier check refused the
script or the trader asked for a teammate.

## Licence and attribution

This repository is licensed under the Apache License 2.0; the text is in `LICENSE`. `CLAUDE.md`
and the three `docs/` files are adapted from the
[Hyperquant Lead Quant Agent framework](https://github.com/taoshidev/hyperquant-framework), under
the same licence. See `NOTICE` for the attribution and what changed on the way across.
