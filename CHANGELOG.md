# Changelog

All notable changes to this workspace are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow semver and are the
contents of `VERSION`.

## [Unreleased]

### Changed (authoring the strategy script)

- `CLAUDE.md` gains *Authoring the strategy script*: read the language reference; check with
  `check_script` when it is offered; propose the whole script (`author_strategy`,
  `revise_strategy`, or a proposal's `set-script` edit to measure it first); quote the trader for
  every rule and value, or mark the value as your choice, and say when one changes a value the
  trader stated; a stop the trader did not give is `platform-required`; what cannot be held goes
  in `unbuilt`, never approximated, pairs, rotation and model-driven signals included; no figures;
  what to do when the Studio says a script was not held.
- `signal-architect` drafts entries, filters and exits as script rules (or canvas components),
  value by value with whose each is. Its hard rule "Never invent a threshold, a lookback or a
  market the trader did not state …" becomes "Mark every value that is not the trader's as your
  choice, and say when one changes a value the trader stated": as written it forbade the choices
  the script records as the Lead Quant's, and a proposed change to a stated value, which the
  trader now decides on the card.
- `risk-architect` drafts stops, targets, sizing and discipline, a stop the trader did not give as
  `platform-required`.
- `skeptic` runs `check_script` when it is offered, and otherwise reads the Studio's checks the
  Lead Quant hands it.
- No persona gains a tool, and no frontmatter changes.

## [1.0.1] - 2026-10-19

### Changed

- `CLAUDE.md`, *The team*: every teammate runs in the foreground, inside the Lead Quant's turn,
  and is waited for. None is launched in the background or left running after the reply, and a
  finished teammate is briefed afresh rather than continued by message, since a continued
  teammate resumes in the background. At most two delegations in a turn; four for a debate the
  trader asked for; three for a turn the Studio's note says it started to draft a strategy (none
  does yet; until one does, the cap is two). In 1.0.0 the Lead Quant was told to keep the trader's
  turn short, and could do so by launching a teammate in the background: its report then landed
  after the reply and never reached the Studio's record of the turn, so the trader saw that a
  teammate was launched and nothing of what it found.
- `CLAUDE.md`, *The team*, also names the turn's bound: the Studio ends a turn after fifteen
  minutes and a teammate takes about two, so the turn's delegations are planned inside it; a
  foreground task holds the turn open while the Lead Quant waits, inside that bound.
- `README.md` says the same in one sentence, and no longer says the control plane cannot report
  which commit a sandbox holds: it checks the configured ref out at each session open and reports
  the commit and `VERSION` it observed, and the Studio attributes the voice by that commit.
- No persona changes: none holds the `Agent` tool, so none can delegate. No frontmatter, report
  format or tool list changes.

## [1.0.0] - 2026-10-13

The first content. Before this, the repository held one `.gitignore` and the sandboxed agent ran
with no instructions beyond the Studio's per-turn context note.

### Added

- `CLAUDE.md`: the Lead Quant constitution, adapted from the Hyperquant Lead Quant Agent
  framework for an agent that answers inside Vanta Strategy Studio's chat panel, whose strategy
  lives in the Studio's database, and which changes it only by proposing `studio-change` blocks
  the trader confirms.
- `docs/workflow.md`, `docs/pitfalls.md`, `docs/validation.md`: the depth the constitution points
  at, re-expressed against the Studio's eight steps (Describe, Own it, Build, See it trade,
  Stress-test, Freeze, Observe, Attach) and the Studio's own measurements.
- `.claude/agents/`: six Claude Code sub-agent personas the Lead Quant delegates to: `data-scout`,
  `signal-architect`, `risk-architect`, `research-engineer`, `skeptic` (the veto) and `advocate`.
  Each reports to the Lead Quant; none talks to the trader.
- `README.md`, `VERSION`, `CHANGELOG.md`, `NOTICE`, and `LICENSE` (Apache License 2.0: the
  licence this repository is under, and the one the adapted files came with).

### Known limits

- A sub-agent sees nothing of the Studio by itself: the Lead Quant hands it the facts from the
  context note. Reading the strategy or a run directly waits on the Studio's MCP bridge.
- The deterministic Skeptic and Advocate checks that run inside the Studio are not yet tools the
  personas can call; the personas reason from what they are handed.
- The Studio records the version it declares a session runs with, not the commit the sandbox
  actually cloned.
