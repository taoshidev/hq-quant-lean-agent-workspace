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
