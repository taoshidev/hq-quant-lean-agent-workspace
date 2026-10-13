<!--
  Adapted from the Hyperquant Lead Quant Agent framework, docs/pitfalls.md (Apache License 2.0;
  attribution in NOTICE). Upstream's checklist is for an agent that fetches data and writes the
  backtest itself; here the Studio measures, so each pitfall says what the Studio handles, what is
  yours in the design, and what is yours in the reading.
-->

# Pitfalls: the research-integrity checklist

The ways quant research lies. Most strategies that fail did not fail because the idea was bad:
one of these crept in unnoticed and made a mediocre idea look great. Treat this as a checklist.
Before you trust a result, confirm each relevant item is ruled out, or say which you could not.

**Rule of the house:** never proceed silently past a pitfall. Either confirm it is handled, or
say "I could not rule this out" in the verdict.

The Studio measures every run on its own bars, after costs, on closed bars, and keys evidence to
the exact rules it measured. That removes some pitfalls from your hands and leaves the rest where
they always were: in the design, and in the reading.

---

## The big five

### 1. Lookahead

Using, at bar *t*, information that was not available until later. The deadliest pitfall: it
inflates results enormously and silently.

- **The Studio:** decides on closed bars and runs the rules it holds; a trade is taken after the
  bar the rule read.
- **Yours in the design:** a rule that reads a value not yet known at the bar's close (a session's
  high before the session ends, a level that repaints). When in doubt, lag by one bar. A component
  with a warm-up (a moving average, an ATR) is not valid until it has its bars.
- **Yours in the reading:** a result that is too good is the first symptom.

### 2. Overfitting

Tuning until the rules fit the historical noise rather than a real pattern.

- Complexity must earn its place: every added filter or parameter must make the measured result
  better, not just the story. Start with a baseline and beat it.
- A huge gap between the result on one window and the result on another is the signature.
- One filter and ten filters are both fragile (one is luck, the other is noise-fitting). Favour a
  few rules with a clear rationale.
- **Tripwire:** a near-perfect win rate, a result far better than the idea's mechanism could
  explain, an equity path with no losing stretch: overfit or leak until proven otherwise.

### 3. Data snooping (multiple testing)

The more variants tested, the more likely one looks good by chance.

- Count the trials. Every variant measured against the same data raises the bar the best one must
  clear. Say the count.
- Do not invent the rationale after the result. The thesis comes first; a pattern found first and
  explained second is noise with a story.
- Each pass over the same window consumes it. After a few, it is no longer out of sample; say so.

### 4. Regime sensitivity

A strategy that works in one market environment breaks when it changes, and crypto regimes change
hard and fast.

- Read the run's trades by period and by condition: did the result come from one stretch? If all
  the gain sits in one regime, the headline result is misleading; say so.
- Watch for structural breaks: a venue change, a listing, a liquidation cascade. An edge can be
  real before a break and gone after.
- Prefer a mechanism that should hold across regimes; be suspicious of one that needs a specific
  environment with no reason why.

### 5. Transaction-cost realism

The fastest way a paper edge evaporates.

- **The Studio:** measures after costs and says so on the run.
- **Yours in the reading:** a thin net result on many trades is a cost illusion in waiting; a
  high-turnover rule with a small per-trade edge dies by a thousand fees. Ask what the result
  would be at twice the cost, and if you cannot know, say the edge is untested against that.
- Respect what the venue allows: minimum sizes, leverage caps, the account's rules. The Studio's
  Risk Governor refuses what breaks them; design so it rarely has to.

---

## More pitfalls, grouped

### Data

- **Coverage and staleness.** A run covers the window the Studio's bars cover, no more. The note
  and the run say how old the newest bar is and whether the window is enough; repeat that to the
  trader rather than rounding it away.
- **One venue's bars.** Prices differ across venues. The Studio names the source it measured on;
  a rule designed on another venue's picture may not match.
- **Outliers.** Crypto has 30% days. Do not design a rule that quietly assumes they do not happen.
- **Sufficient history.** Trade count matters more than calendar days. Too few trades is no
  statistical power.

### Design

- **Normalisation leakage.** Any rule that scales by a whole-window figure leaks the future into
  the past. Use rolling windows that only see the past.
- **Window contamination.** A lookback that straddles the boundary of the window being judged
  leaks across it.
- **Redundant filters.** Two filters that read the same thing double-count one signal and make
  the design look more careful than it is.
- **Warm-up.** The leading bars where an indicator is not yet valid are not trades.

### Statistics

- **Multiple testing.** See data snooping; correct for it in your reading, not just in words.
- **Autocorrelation.** Overlapping holds inflate apparent significance. Many bars is not many
  independent observations.
- **Effective sample size.** With autocorrelation the effective count is far below the bar
  count; judge by trades, not bars.
- **Test-then-fit.** Pre-commit the criteria, then read the run. Never the reverse.

### Time series

- **No shuffling.** A time series judged out of order leaks the future into the past. Only
  forward in time.
- **Annualisation.** Crypto trades every day of the year. A ratio annualised on 252 days is
  wrong; do not compute one at all (hard rule 1), and read the Studio's figures as the Studio
  labels them.
- **Volatility clusters.** Returns are not independent; losses arrive together.

### Risk and tail

- **Drawdown is a path.** The sequence of losses matters, not just the deepest point. A strategy
  can have an acceptable worst drawdown and still be unholdable.
- **Correlations go to one in a crash.** Diversification across correlated markets is not
  diversification.
- **Liquidation cascades.** Forced selling creates reflexive moves a calm backtest never shows.
- **Sizing off an overfit edge over-bets.** Be conservative; the `risk-architect` exists for this.

### Reproducibility

- **The Studio keys evidence to the rules it measured.** A change to the logic makes earlier
  evidence stale, and the Studio says so. Never cite a run for rules it did not measure.
- **A result you cannot point at is not a result.** Every figure you quote is the run's, on the
  run's page, as the run labels it.

---

## Overfit tripwires

If any of these fires, stop and treat the strategy as suspect until the concern is actively
disproven. Do not present it as a win first.

- A result far better than the mechanism could explain
- A win rate near perfect
- Fewer than 30 trades (and be wary under 100)
- A single window, judged once, with nothing held out
- No losing stretch at all, or a near-perfectly smooth equity path
- All the gain in one regime or one short period
- A great result on one window that collapses on another

These thresholds are deliberately strict. When in doubt, flag. The reading behind them and the
verdict guide are in `docs/validation.md`.
