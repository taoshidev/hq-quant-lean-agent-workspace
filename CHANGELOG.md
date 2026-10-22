# Changelog

All notable changes to this workspace are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow semver and are the
contents of `VERSION`.

## [Unreleased]

## [1.2.0] - 2026-10-22

The Studio's tools: in a conversation Glitch opens with its tools, the Lead Quant reads the
Studio, checks before it proposes and proposes by tool, and each teammate reads and checks with
the tools its `tools:` list names. No teammate's list holds a proposal tool. Without the tools,
everything works as in 1.1.0, through the note and the change block.

### Added

- Persona `tools:` lists name the Studio's tools under the bridge's server name,
  `mcp__studio__<name>`, after `Read`, `Grep` and `Glob`: the Data Scout `read_catalogue`,
  `read_strategy`, `read_screen`; the Signal Architect `read_dsl_reference`, `read_components`,
  `read_strategy`, `check_script`, `dry_run_script`; the Risk Architect `read_strategy`,
  `check_script`, `check_change`; the Research Engineer `list_runs`, `read_run_window`,
  `read_review`, `read_observation`; the Skeptic `check_script`, `read_strategy`, `list_runs`,
  `read_run_window`; the Advocate `read_strategy`, `list_runs`. `release.json` lists the same.
- `bin/check-release.mjs` refuses a release in which a persona lists one of the Studio's
  seventeen proposal tools (`author_strategy`, `revise_strategy`, the edit and wiring tools,
  `run_research`, `freeze`, `deploy`, `propose_change`, `test_change`, `confirm_rulebook`,
  `adopt_candidate`), under either spelling; a persona with no `tools:` line (Claude Code would
  grant it every tool); or a grant of more than one tool (`*`, `mcp__<server>`,
  `mcp__<server>__*`).
- `docs/workflow.md`: the drafting rules for Describe and Own it, which hold in a drafting turn (a
  strategy with no rules yet); outside one, the Lead Quant may propose changing a value the trader
  stated, as a card that says so.

### Changed

- `CLAUDE.md`, *Where you are*: when the tool list has `mcp__studio__*` tools, read the Studio with
  them, check before proposing, and propose with `author_strategy`, `revise_strategy` or the edit
  tools; without them, the change block.
- Hard rule 1 keeps its prohibition word for word; its sources are this turn's note, or a Studio
  tool's result this turn, exactly as given and said as the run's. It adds: "A dry run's figures
  are in-sample drafts, not results: you never quote them." The Signal Architect, which holds
  `dry_run_script`, carries the same sentence under its hard rules.
- *The team*: a teammate with Studio tools reads and checks with them itself; its calls are the
  turn's and count against the same limits as the Lead Quant's. The Lead Quant delegates only to the
  six teammates, never to a general-purpose sub-agent, which would hold every Studio tool. With the
  tools, every proposal the note lists goes by its tool.
- Each persona's *What you are handed* says which tools it reads with, and that without them the
  brief is all it sees; its figures rule names the same two sources as hard rule 1. The Research
  Engineer is told `read_review` needs a note's id, which only a Studio result can give it.

## [1.1.0] - 2026-10-21

The first release with report formats: every teammate's report has a grammar in `formats/`, the
one both `bin/check-report` and Glitch read reports with, and the Lead Quant checks each report
against it. The product is named Glitch.

### Added

- `formats/<persona>.json` for the six personas: each report's sections (label, kind, whether it
  is required), the regular expression an item or a value follows, the persona's template as its
  "What you hand back" block shows it, and the further checks (`lints`) `bin/check-report` makes.
  Format version 2 for each (version 1 is the reading of the 1.0.x blocks, which had no file).
- `bin/check-report <persona> [file]` (the report on standard input without a file): exit 0 when
  the report follows its format; exit 1 with every reason and the template when it does not.
  Exit 2 when it cannot judge the report: no format, an unreadable report, or the check itself
  failed. `bin/check-release.mjs`: the release's consistency before a tag, including the dry-run
  sentence in every persona whose `tools:` hold `dry_run_script` under either spelling (the bare
  name or the bridge's `mcp__<server>__dry_run_script`). Both run when reached through a
  symlinked directory, and `bin/check-report` through a symlink to the file itself.
- `release.json`: the release's id, version and tag, the Lead Quant, and per persona its id, name,
  code, description, tools, model and format (id, version, file, sha256).
- `test/`: `node --test test/release.test.mjs` checks sample reports in the old and new shapes,
  the persona blocks against their templates, and the release's consistency.
- `docs/releasing.md`: how a release is cut, and the checks each later one runs.
- `README.md`: the check through the control plane (ACP) beside the CLI one.

### Changed

- The product is **Glitch**: `CLAUDE.md` and every persona name it, and say "the Studio" for it
  after that.
- `CLAUDE.md`, *The team*: the trader sees every brief and report verbatim, so a brief carries no
  fence line of the note and no internal id; no background delegation and no detached job inside
  a team turn; a turn whose note says three teammates (a drafting turn) may use three; the Skeptic
  and the Advocate are handed the note's Studio checks block verbatim; the Advocate the Skeptic's
  `OBJECTIONS` verbatim, and on a second round the Skeptic the Advocate's `ANSWERS` verbatim;
  every report is checked with `bin/check-report`, and a report off its format goes back to its
  teammate with the check's words once: one retry for each teammate in a turn, which does not
  count against the delegation caps (so a requested two-round debate keeps its second round), and
  a retried report that fails the check again is not retried, the Lead Quant saying it did not
  follow its format (and when that is the Skeptic's, no Advocate is briefed and the trader is told
  no debate could be held); a teammate's
  question ends the reply as a `studio-question` block carrying `"from"` with its id, and the
  trader's answer is relayed to the teammate that asked; never ask the trader how strict the team
  should be. After the release's first walk: the checks block and the Skeptic's objection lines
  are copied whole, never shortened; a format retry is a fresh foreground briefing, never
  `SendMessage`; the Advocate is briefed only once the Skeptic's report has passed the check; a
  teammate's question is copied word for word when it carries `"from"`; before relaying a
  second pass, every objection id of the first report is under `OBJECTIONS` or `WITHDRAWN`.
- `skeptic`: each objection carries `(cites: <Studio check ids, or none>; evidence: …)`; a second
  pass lists `WITHDRAWN: S-n — why`; its sorting step: a hard blocker cites the Studio gate check
  that refuses it at this step, and anything else it would block on is a protocol rejection,
  reported in full (the label changes, never what is found); with a hard blocker standing the
  VERDICT is veto; an objection is never both standing and withdrawn, nor listed twice, and a
  second pass never drops one. Prose after an objection's `(cites: …; evidence: …)` is accepted
  and is not its evidence.
- `advocate`: `PROPOSAL: <key> from "<a>" to "<b>" — why` (both values quoted) or
  `PROPOSAL: none`, and a second-pass `CLOSE:`; it is handed the Studio checks block and the Skeptic's `OBJECTIONS` verbatim.
- `signal-architect`: `QUESTIONS` items `Q-n <about> — <question> [options: a | b | c]`, about a
  strategy key or a script rule's id, at most two (the check refuses a third), never about how strict the team should be, the
  Skeptic or the Advocate, and never offering a Studio check or an objection id as an answer;
  its `RULES` items are read field by field (`from: trader "…"` or `from: your choice (…)`).
- Every persona: "Your report is shown to the trader verbatim", the exact block to hand back,
  `none` where a section has nothing, no template placeholder left in, and nothing after the last
  section (a line below an item continues it, and the check says so when that breaks the item).
  A Skeptic's evidence may quote parentheses at any depth ("stop (3 × ATR(14))"): the first cut of
  the grammar took one level and refused such an objection on the release's first walk.
- No persona's tools, model or description changes (`model: inherit` for every one).

## [1.0.1] - 2026-10-19

The tag `v1.0.1` names the merge of the authoring delta (`313da73`), so this release carries both
sections below; the second was listed under *Unreleased* when the tag was cut.

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
