# D-08 option B — choice-driven bust variance (post-demo follow-up)

**Status:** design only, not for the demo. Author: Lucille (Grok Bot), 2026-10-11.

## Goal
Let the player's own decisions (training focus, minutes vs. development, risky offers) make a bust *possible*, so the option-A label is earned rather than mostly a function of draft luck.

## Mechanism (existing switch)
`TUNING.bust = "choices"` (`tuning.ts`, used in `peak.ts:185-187`): development weight 0.01 → 0.02, choice imprint 0.01 → 0.025 in the realised peak. No new formula.

## Rules
1. Gate per career on a new engine version (e.g. `BUST_SINCE = 2.14.0`, same pattern as `worldOf`/`dpoyStreakStepOf`); live careers keep `current`.
2. Keep the option-A label as the single definition of "bust"; B only changes how often it happens.
3. Target: option-A rate stays within 10–15% overall, but the share of busts explained by the player's choices (choiceLog) rises measurably. Measure with `scripts/measure-decisions.ts` + `careerBust`, 1,000 careers per difficulty, before/after on the same seeds.
4. Narrative: every bust from B should be traceable to at least one choice in `choiceLog`, so the Legacy Report can say *why*.

## Risks
- Peak spread widens: re-check MVP/All-NBA totals and D-09/D-23 metrics.
- Overlap with D-10 (retirement redesign): sequence B after D-10.

## Open questions for Niccolò
1. Should a careful player always be able to avoid a bust, or is some bad luck acceptable?
2. Acceptable rise in bust rate on Leggenda (already 16.7%)?
