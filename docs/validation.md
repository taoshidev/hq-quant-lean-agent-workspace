<!--
  Adapted from the Hyperquant Lead Quant Agent framework, docs/validation.md (Apache License 2.0;
  attribution in NOTICE). Upstream tells an agent how to prove an edge with code it writes; here
  the Studio measures and you read, so this is how to read a run, which checks to ask for, and
  how to write a verdict the trader can act on.
-->

# Validation: how to earn the right to call an edge real

`docs/pitfalls.md` is what not to do. This is what must be true before a result is called real.
Avoiding mistakes is not enough; the strategy has to survive an honest attempt to disprove it.

You run these at **Stress-test** and again before any verdict. You never produce a figure
(hard rule 1); every number here is one the Studio measured, read as it labels it.

---

## 1. Pre-registration

Written at **Own it**, enforced here:

- The **pass criteria** were agreed with the trader before the run: what would make them keep
  the idea, what would make them kill it. Read the run against those. Do not move them after
  seeing the result.
- A change to the rules and a new run is a **new trial**. Count it (section 5).

This one discipline stops most p-hacking before it starts.

## 2. Out of sample

- A run measured over one window says what happened in that window. A result that only exists in
  the window the rules were tuned on is in-sample, whatever it looks like.
- Expect a second window to be **worse**. A small, consistent degradation is healthy. A collapse
  means overfit; a second window **better** than the first means a leak or a fluke: investigate,
  do not celebrate.
- When the Studio offers a second window, a holdout or a comparison between runs, use it and say
  what it showed. When it does not, say the result is one window and untested beyond it.
- Never read the same held-out window twice to settle an argument. Each pass spends it.

## 3. The reading checks

Three cheap questions, each aimed at a specific way a result can be fake. Ask them of every run.

### a. Does the replay match the rules?

Walk the run's trades. Each entry and exit follows a rule the trader stated and the Studio holds.
A trade that follows no stated rule is a rule the Studio holds differently from how the trader
said it, or a rule they did not mean. That is a finding before any figure is.

### b. Does the result move the way the rule should?

Tighten a filter and the trade count should fall, not rise. Widen a stop and the drawdown per
trade should widen. When a change moves the result the wrong way, something is not wired the way
the story says.

### c. Does the window carry the result?

Where in the window did the gain come from? One stretch, one regime, one trade? The Studio's run
shows its trades over time; read them for concentration before reading the total.

## 4. Robustness

A real edge is not a knife-edge. Ask:

- **Costs.** Would it survive twice the cost? If you cannot know, say the edge is untested
  against that; if the net result is thin on many trades, say it is a cost illusion in waiting.
- **Parameter neighbourhood.** Would a slightly different setting (a lookback 20% longer, a stop
  a little wider) still work? A lone sharp peak is overfit; a broad plateau is an edge. Propose
  the neighbour as a new version to be measured, never as a guess at the figure.
- **Regime and period stability.** The gain should appear in most slices of the window, not live
  in one.
- **Trade count.** Prefer 100 or more; be very skeptical under 30.
- **Coverage.** The run's window is enough to count as evidence only when the Studio says it is;
  a thin window is shown in full and is not evidence.

## 5. Multiple-trials accounting

Every variant is another lottery ticket.

- Keep the count of distinct variants measured against the same data, and say it.
- The more trials, the higher the bar each must clear; a result that would impress as the first
  trial is unremarkable as the fiftieth.
- When the same window has judged a handful of variants, it is no longer out of sample. Say so;
  either a fresh window or further results read as in-sample.
- Prefer the next variant motivated by the thesis, not by the last run's residuals.

## 6. Tripwires and the verdict

The overfit signatures (also in `docs/pitfalls.md`). If any fires, the burden of proof is on the
strategy:

| Tripwire                                              | Default reading                                     |
| ----------------------------------------------------- | --------------------------------------------------- |
| Result far better than the mechanism could explain    | Overfit or leaking until proven otherwise           |
| Win rate near perfect                                 | Check the payoff; else lookahead or regime bias     |
| Under 30 trades                                       | Not statistically meaningful                        |
| One window, nothing held out                          | Untested                                            |
| All the gain in one regime or period                  | The headline misleads; caveat heavily               |
| Great on one window, collapses on another             | Classic overfit                                     |
| Newest bar old, or the window thin                    | Not evidence yet, whatever the figures              |

### Verdict guide

- **CONFIRMED.** Meets the pre-committed criteria, the replay matches the rules, no unresolved
  tripwire, the window counts as evidence, and there is an economic rationale. Present with the
  Studio's real, modest figures and the caveats that remain.
- **MARGINAL.** Meets some criteria but a tripwire fired, robustness is shaky or the trade count
  is thin. Say so, and say what would resolve it: a longer window, fewer rules, another market.
  Never dress it as CONFIRMED.
- **KILLED.** Fails the criteria, a reading check lit up, the edge vanishes under costs, or there
  is no plausible mechanism. Report it plainly. A clean kill is a successful outcome and saves the
  trader money.

When unsure between two verdicts, choose the more skeptical one and tell the trader exactly what
you could not rule out.
