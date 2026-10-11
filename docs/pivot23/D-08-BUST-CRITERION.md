# D-08 — Bust criterion: design proposal (no engine change)

**Status:** option A chosen by Niccolò (2026-10-11) and implemented as data (`src/lib/pivot/bust.ts`); option B is a post-demo follow-up (`D-08-OPTION-B-FOLLOWUP.md`). Author: Lucille (Grok Bot), 2026-10-11.

## Today
Three unrelated notions of "bust" coexist:
- `world.ts:217` — AI prospects flagged `bust` at creation (`SIM.development.bustRate`), growth × 0.45 (`world.ts:451`).
- `lab/lab.ts:14` — lab metric: `potential >= 85 and peakOverall <= potential - 8`. In the 2026-10 runs the player meets it **0/100** times: the player essentially never busts.
- `TUNING.bust` (`tuning.ts:17`, `peak.ts:185-187`) — experiments `choices` / `events` that weight choices or injuries more in the realised share of potential. Off (`current`).

There is no definition of a player bust the game can show or test against, so D-08 ("bust rate") has no target.

## Options

### A. Outcome-only label (no sim change)
Bust = `potential >= 85 && peakOverall <= potential - 8` (the lab rule), shown in the Career Legacy Report.
- Pro: zero balance risk, no engineVersion bump, testable today.
- Con: rate stays ~0% — the label would almost never appear. Measures, doesn't create, busts.

### B. Choice-driven variance (`TUNING.bust = "choices"`)
Weight development choices more (0.01 → 0.02) and imprint (0.01 → 0.025) in the peak; bust stays the A label.
- Pro: busts come from the player's decisions — explainable in narrative ("hai scelto…").
- Con: changes outcomes → needs a new engineVersion gate; target rate must be decided (proposal: 5–10% of pot ≥85 careers on Pro); measure before/after with `scripts/measure-decisions.ts`-style harness.

### C. Event-driven variance (`TUNING.bust = "events"`)
Injury drag weighs more (0.018 → 0.04).
- Pro: realistic (injury-derailed careers).
- Con: feels random/unfair to the player; overlaps D-10 (retirement by injury), which is still to be redesigned.

## Recommendation
**A now** (label + test, ships with the demo), **B after the demo** behind a new engine version with a target rate Niccolò sets. Avoid C until D-10 is settled.

## Questions for Niccolò
1. Is a bust something the player should be *able* to suffer (B/C), or only a historical label (A)?
2. Target bust rate among high-potential careers (e.g. 5%? 10%?) and on which difficulties?
3. Should the label be visible in the Career Card/Legacy Report, and with what wording?

## Implemented: option A (2026-10-11)

The lab rule (pot ≥ 85, peak ≤ pot − 8) labels **0%** of careers: in 1,200 careers the median pot−peak gap is 1 and the 90th percentile 2.7. A gap rule cannot reach the 10–15% target without becoming noise, so the label compares **draft expectation** with **NBA outcome** instead:

> **Bust** = first-round pick (1–30) **and** never an All-Star **and** ≤ 1 NBA season as a starter (≥ 28 min, ≥ 50 GP).

`careerBust(s)` → `{ bust, draftPick, allStarCount, starterSeasons }`. Pure function of `draftPick`, `allStarCount`, `seasonHistory`; no RNG, no engine change, no save field.

| Sample (300 careers per difficulty, seeds 100000/200000/300000/400000+) | Overall | Esordio / Pro / All-Star / Leggenda |
|---|---|---|
| Engine 2.12.0-beta (main) | **14.3%** | 9.7 / 12.0 / 18.7 / 16.7 |
| Engine 2.13.0-beta (PR #66) | **14.9%** | 10.3 / 13.0 / 19.7 / 16.7 |

Alternatives measured and rejected: pick ≤ 20 (1–2%), pot ≥ 78/80 with no starter seasons (1–4%), pick ≤ 30 with 0 All-Star/All-NBA only (19.6%).

Locked by `bust.test.ts` (rule) and `bust.stats.test.ts` (rate 10–15% on the sample above; if an engine change moves it out, report rather than retune).

**Rendering:** Career Card / Legacy Report belong to Jarvis (`grokbot/career-card-figurine`). This PR adds data only; Jarvis should call `careerBust(s)` and show the label (proposed copy IT: «Bust: scelta al primo giro che non è mai esplosa», EN: «Bust: first-round pick who never broke through»). The label should only show on finished careers (or after the rookie contract) — open point for Jarvis/Niccolò.
