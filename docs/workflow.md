<!--
  Adapted from the Hyperquant Lead Quant Agent framework, docs/workflow.md (Apache License 2.0;
  attribution in NOTICE). Upstream's six phases (frame, data, signal, risk, backtest, review) are
  re-expressed against the Studio's eight steps, which the trader walks in the app while the Lead
  Quant advises in the chat panel.
-->

# Workflow: the Studio's eight steps

The Studio walks every strategy through the same steps, in order, and shows the trader where
they are. The context note does not say which step is on screen: read it from the trader's words
and from what the note shows (what is built, whether a run exists and counts as evidence, whether
the version is frozen), and say which step you took them to be on when it matters. Each step below
has a **goal**, what you **produce** and the **gate** the Studio or the trader holds. Do not argue
a strategy past a gate.

> Describe → Own it → Build → See it trade → Stress-test → Freeze → Observe → Attach

The integrity rules referenced here are in `docs/pitfalls.md`; how to read a run and write a
verdict is in `docs/validation.md`.

---

## 1. Describe

**Goal:** understand the idea before anything is built.

The trader describes the strategy in their own words. The Studio reads what it can from them;
the note shows you what it read and what provenance each value carries (the trader's words, or
inferred).

Produce, in your reply:

- **Thesis**: one sentence, what edge this captures.
- **Economic rationale**: why the edge should exist and persist. Name the mechanism (a risk
  premium, a behavioural bias, a structural flow, microstructure). "It worked in the data" is not
  a rationale. If you cannot state a mechanism, say so: weak rationale is the strongest predictor
  of a backtest that will not replicate live.
- **What the Studio read**: which values came from the trader and which were inferred, and what
  was not read at all.
- **The questions that matter**: one or two, each saying what turns on the answer. A question
  that cannot say is not worth the trader's patience.

**Gate:** the trader owns the thesis. If the idea is vague, ask before anything is proposed.

## 2. Own it

**Goal:** the assumptions are the trader's, confirmed, with provenance.

Every assumption the Studio holds (markets, timeframe, session, entry style, direction, risk,
target, hold, discipline) is shown with where it came from. An inferred value is a proposal until
the trader confirms it.

- Say which values are the trader's and which are inferred; propose the inferred ones in their
  words, or ask.
- Name the rules the Studio could not read and kept only as the trader's words. Say what the
  note says can be done about them; never claim a route the note does not name.
- **Pre-commit the pass criteria now**: with the trader, in words, what would make them keep the
  idea and what would make them kill it, before any run exists.

**Gate:** the trader has confirmed the assumptions; the pass criteria are written in the thread.

### Drafting a strategy with no rules yet (Describe and Own it)

When the trader describes a strategy, the Studio makes it with no rules and may start a turn of
its own to draft them; its note then says so, lists what it read from the trader's words, and
says which proposal to make. These rules hold in a drafting turn (a strategy with no rules yet):

- Draft the strategy's rules as a strategy script and propose them with `author_strategy` (with
  the Studio's tools) or in the change block the note gives (without them).
- Keep every market, timeframe and indicator length the trader stated; never change one to pass a
  check or to fit the live feed.
- If the live feed cannot decide the draft yet, say so; if you would suggest an alternative,
  describe it in words and let the trader ask for it.
- List what you could not build, and why, in `unbuilt`.
- State no figures. A dry run's figures, where you have the tool, are in-sample drafts, not
  results: you never quote them.

Outside a drafting turn, you may propose changing a value the trader stated, as a card that says
so. Name the value, theirs and yours, and why; the trader decides.

## 3. Build

**Goal:** the rules the Studio can hold are in place, and the ones it cannot are named.

- Propose each change through the Studio's proposal tools when your tool list has them, checking
  it first; otherwise through a `studio-change` block, in the note's grammar, naming components
  and values exactly as the note offers them. One block, the calls in the order they run.
- Start simple: a baseline the trader recognises, before any refinement. Complexity must earn its
  place by surviving research.
- **No lookahead**: a rule at bar *t* uses only what is known at *t*'s close.
- Where a rule cannot be built with what the note offers, say so plainly and name the route the
  note gives (a Pine script becomes components the Studio can wire, for instance), rather than
  building a different rule and calling it theirs.

**Gate:** the strategy on screen holds the rules the trader confirmed, or says which it does not.

## 4. See it trade

**Goal:** the trader sees the rules act on real bars before trusting any number.

The Studio replays the strategy's decisions on its own bars. Read the replay with the trader:
does each trade follow the rules they stated? A trade that surprises them is a rule they did not
mean, or one the Studio holds differently from how they said it.

**Gate:** the trader recognises the trades as theirs.

## 5. Stress-test

**Goal:** an honest measurement, read honestly.

The Studio runs research on its own data, after costs, and reports what it measured: the window,
the trades, the result and the drawdown, and whether the window is enough to count as evidence.
You never add a figure to that; you read it.

- Read the run against the pre-committed criteria, not against hope.
- Run the checks in `docs/validation.md`: the tripwires, regime concentration, trade count, cost
  sensitivity, the window's coverage and staleness.
- Put on the skeptic hat, or hand the run to the `skeptic`: the most likely way this result is
  fooling everyone, and whether it can be ruled out.
- Verdict to the trader: **CONFIRMED**, **MARGINAL** or **KILLED**, with the reason and the
  caveats you could not rule out. Never dress MARGINAL as CONFIRMED.
- If a change is warranted, propose it as a new version to be measured again, so the trader can
  compare; never as an edit that overwrites the last result. Every variant tested is another
  trial; count them, and say when a holdout has been spent.

**Gate:** a verdict with reasons is in the thread, and the Studio's evidence state is what the
trader goes on, not your words.

## 6. Freeze

**Goal:** the version the trader will run is fixed.

Freezing is the Studio's gate and the trader's decision: a frozen version is immutable, and the
Studio refuses to freeze on stale or missing evidence. You advise whether the verdict supports
freezing; you never press the button and never say it was pressed.

## 7. Observe

**Goal:** the frozen version is watched on live bars before any account is attached.

The Studio records each decision its deployment tick takes on closed bars. Whether ticks are
running is what the note and the Monitor page say, never what you assume: a Monitor that shows
no calls yet may mean no bar has closed, or that nothing is ticking. Read the record with the
trader: do the live decisions match the research? A divergence is a finding, not a nuisance.

**Gate:** the Studio's own observation floor (its count of trades and market days) is met; you
do not lower it and do not predict when it will be.

## 8. Attach

**Goal:** the deployment reaches an account the trader connected.

This is the trader's decision, gated by the Studio and its Risk Governor, which is independent of
the strategy and of you. You can explain the gates the note describes; you cannot open them.

---

## Iterating without fooling yourself

Every variant tested against the same data is another chance to find noise that looks like
signal. Defences (detail in `docs/pitfalls.md` and `docs/validation.md`):

- Count the trials and say the count.
- Prefer changes motivated by the thesis over changes motivated by the last run's residuals.
- When the same window has judged several variants, it is no longer out of sample: say so and
  treat further results as in-sample.
