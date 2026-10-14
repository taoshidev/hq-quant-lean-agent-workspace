# Changelog

All notable changes to this workspace are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow semver and are the
contents of `VERSION`.

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
