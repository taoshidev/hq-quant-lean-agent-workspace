# Changelog

All notable changes to this workspace are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow semver and are the
contents of `VERSION`.

## [Unreleased]

## [1.4.0] - 2026-10-28

A drafting turn puts the card first. In a conversation with Glitch's tools, the Lead Quant proposes
the draft with `author_strategy` as soon as the Studio's script check would hold it, before it
briefs any teammate; the team reviews the card after it is up. Without the tools, and on every turn
that is not a drafting turn, everything works as in 1.3.0.

### Changed

- `CLAUDE.md`, *The team*: a new paragraph, *A drafting turn: the card first*. Once `check_script`
  says the Studio would hold the script, the Lead Quant proposes it with `author_strategy` before it
  briefs any teammate: a proposal held in the turn stays the trader's card even if the turn is cut
  at its time bound or its cost cap, and a draft not yet proposed is lost with it. A teammate is
  briefed before the card only when the check refused the script and the Lead Quant cannot fix the
  refusal itself, or when the trader's words ask for one. Once the card is held, teammates may
  review it within the turn's caps, the Skeptic first; a review that changes the script is checked
  and proposed again, replacing the earlier script, and the reply says what changed. No teammate
  is removed: the six, their tools, their formats and their format retries are 1.3.0's, and a
  drafting turn may still brief three.
- `CLAUDE.md`, *The skeptic hat*: on a drafting turn the Lead Quant wears it before the card goes
  up and names what the draft cannot rule out; the Skeptic's attack follows the card.
- `docs/workflow.md`, the drafting rules: *Put the card up first*.
- `README.md`, *Through the control plane*: what to expect of a drafting turn from 1.4.0.

Seen in an acceptance walk on 1.3.0 (2026-10-28): the script check held the draft 44 seconds into
a drafting turn, the Lead Quant briefed three teammates and two format retries before proposing,
and the turn's cost cap cut it with nothing on the trader's card.

### Changed after review (2026-10-28, still 1.4.0, before its tag)

Opus on this release's first cut (eight fenced drafting turns, the unbuilt-honesty tasks
0039–0046): three drafts were given a stop and no exit, and the Lead Quant added the mirror of the
entry as an exit, labelled as its own choice; the trader had asked for no exit. And none of the
eight fenced drafting turns briefed a teammate: "brief only the teammates that leave you the time
to write it" was read as leave to brief none.

- `CLAUDE.md`, *Authoring the strategy script*: **Write only the rules the trader asked for.** No
  exit, filter or other rule the trader did not ask for, not even the mirror of their entry and not
  as a labelled choice: left out, the Studio's default applies and the card says it is the
  Studio's. An exit the trader asked for in any words is theirs, built and quoted. *The loop* and
  *Working style* say a default is a value of a rule the trader asked for, never a rule.
- `CLAUDE.md`, *A drafting turn: the card first*: a drafting turn is any turn on a strategy with no
  rules yet, whoever started it (a question alone is answered, not drafted). Without the Studio's tools the Lead Quant writes the change block
  first, closed (a block that closed before a cut stays the trader's card), then the Skeptic always
  reviews the card: one brief and its one format retry, no second pass; the reply ends with the
  Skeptic's verdict in the Lead Quant's words, and a review that would change the script is said in
  words, never a second block. With the tools, as before. *Where you are* and *The skeptic hat* say
  so.
- `docs/workflow.md`, the drafting rules, and `README.md`, *Through the control plane*, say both.
- The six persona files, their tools, formats and caps are unchanged.

### Changed after the live re-check (2026-10-29, still 1.4.0, before its tag)

Opus on the fenced drafting turns of this release (five tasks, 2026-10-28): the card was up 56 to
80 seconds into each turn, and the Skeptic's review then took most of the turn (p50 344 s, p90
805 s, about four to five times the turns before it). The Lead Quant's brief ran to 1,135 to 1,493
words, retelling the draft in prose, the engine and what it had told the trader, with a list of
questions, before the checks block; the Skeptic took 152 to 203 seconds and handed back 1,271 to
2,156 words, two of the five read the workspace beyond its two docs to learn its own format, and a
format retry re-sent the whole report and was reviewed afresh (about 150 seconds).

- `CLAUDE.md`, *The team*: **The Skeptic's review of a draft.** On a drafting turn, on either
  transport, the Skeptic reviews the script as written, from a short brief: one line saying it
  reviews the drafted card, the trader's words, the script whole as the card holds it (copied,
  never retold) and the Studio checks block. Nothing that retells the engine, says what the Lead
  Quant told the trader or thinks of the draft, or lists questions. It reads, reasons and runs only
  the read-only checks it holds; it never rebuilds, re-drafts or rewrites the strategy, writes
  another script or reads the workspace beyond its two docs. One report, each finding said once;
  its one format retry changes only the lines the check names. No second pass. The verdict is its
  own, and a veto stands: said to the trader as KILLED, with the card left up for the trader to
  decide.
- `CLAUDE.md`, *A drafting turn: the card first*: without the Studio's tools the Skeptic is the
  only teammate briefed on the turn, as the Studio's note says.
- `docs/workflow.md` and `README.md`, *Through the control plane*, say so.
- The six persona files, their tools, formats and caps are unchanged: the Skeptic's charter
  already says it never modifies the candidate, and its format is the same.

## [1.3.0] - 2026-10-22

The team checks: in a conversation Glitch opens with its tools, the Skeptic, the Advocate and the
Data Scout call the Studio's checks themselves, with the same ids, sentences and digests as the
note's Studio checks block, so what they find does not depend on how the Lead Quant briefed them.
Without the tools, everything works as in 1.2.0.

### Added

- Persona `tools:` lists gain the Studio's team checks, after their 1.2.0 tools: the Skeptic
  `skeptic_findings`, `tripwires`, `warmup_depth`, `candidate_critique`; the Advocate
  `advocate_answer`, `candidate_critique`; the Data Scout `warmup_depth`. `release.json` lists the
  same. No persona lists a proposal tool.
- The Skeptic, the Advocate and the Data Scout are told to call them (*Call the Studio's checks
  yourself*) and to cite the ids they return. The Skeptic is also told that the trader hears of any
  gate refusing at this step that it leaves out of its report.

### Changed

- `CLAUDE.md`, *The Studio checks*: with the Studio's tools, those three teammates call the checks
  themselves; the Lead Quant tells them to and still hands the block verbatim.
- The Skeptic's and the Data Scout's figures rules name `warmup_depth`'s live depth (the bars the
  rules need and the bars the live feed holds), said as the live feed's, beside `check_script`'s.
- The Skeptic's `cites:` names ids as the checks block or a Studio check it called writes them.
- `CLAUDE.md`, *Check every report*: a teammate briefed afresh for its format retry has not seen its
  earlier calls, so when it holds the Studio's checks, ask it to call them again before it rewrites
  its report.

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
  brief is all it sees. Its figures rule names the Lead Quant's brief and, of its own Studio tools,
  only those whose results Glitch accepts as a figure's source (`read_strategy`, `list_runs`,
  `read_run_window`, `read_review`, `read_observation`, and `check_script` for its live depth
  alone), each said as whose figure it is; no other tool's result is a figure it may quote. The
  Research Engineer is told `read_review` needs a review note's id that none of its tools gives and
  no brief carries, so it leaves the tool unused.

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
