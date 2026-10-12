# A2 / P-2 — Early-retirement spread (PROPOSAL, draft, do not merge without owner decision)

Author: Lucille (Grok Bot), 2026-10-12. Gated: only careers created by engine **2.14.0** or later (`RETIRE_SINCE`). Careers from 2.13 and older are unchanged: 300/300 Pro careers stamped 2.13.0-beta replay bit-identical to `main` (`scripts/g4/gate-check.ts`).

## Problem (G4 A2)
`careerEndingSignal` returns null below summer age 33 (`peak.ts:41`). Every injury-driven early ending therefore lands on the age-32 season: 1,323 of 4,000 Pro careers end at 32, none at 29–31.

## Step 1 — the existing D-10 options (`TUNING.retirement`), Pro, i = 0..999, same seeds

| Option | 30 | 32 | 33 | 34 | 35 | 36 | End < 34 |
|---|---|---|---|---|---|---|---|
| current (shipped) | 0 | 317 | 4 | 51 | 30 | 598 | 321 |
| graded | 14 | 303 | 4 | 51 | 30 | 598 | 321 |
| path | 14 | 303 | 11 | 235 | 106 | 331 | 328 |

- `graded` barely moves the cliff: its injury bar before 33 is 4.0, which almost nobody reaches.
- `path` mainly retires journeymen at 34–35 through the minutes rule, and cuts the share reaching 36 from 59.8% to 33.1%.
- Neither one fixes A2.

## Step 2 — why the cliff exists
`injuryDrag` takes a few discrete levels (2.1, 2.5, 3.2, 3.6, 5.0+), usually reached at 26–30. At the age-29 summer the counts are: 2.5: 229, 3.6: 109, 3.2: 24, 5.0+: 10. The career only ends when the 33 gate opens.

## Proposed rule (minimal)
- New table `TUNING.injuryRetireBars = { 30: 5.0, 31: 3.6, 32: 3.2 }`, keyed by summer age (the last season played is one year younger). A heavier load ends the career earlier.
- From 33 the shipped rule applies unchanged: injury ≥ 2.5, minutes ≤ 11.5.
- No new RNG draw, no change to progression, the peak or the minutes rule.

## Result — 4,000 Pro careers, `(i+1)*1000+17`, `main` 3bb757b (2.13.0-beta) vs this branch (2.14.0-beta)

| End age | main | A2 |
|---|---|---|
| 29 | 0 | 33 (0.8%) |
| 30 | 0 | 431 (10.8%) |
| 31 | 0 | 146 (3.7%) |
| 32 | 1323 (33.1%) | 727 (18.2%) |
| 33 | 19 | 10 |
| 34 / 35 / 36 | 194 / 132 / 2332 | 194 / 130 / 2329 |

| Gate / metric | main | A2 |
|---|---|---|
| P0-LIFE 1,000: end < 34 (≥ 150) | 321 (29.3–35.1%) | **321** (29.3–35.1%) |
| P0-LIFE 1,000: reach 36 (≥ 1) | 598 | **598** |
| Peak 26–28 (assigned/observed) | 1000/1000 | **1000/1000** |
| Age coherence (gaps, rows > 36, early unexplained) | none | **none** |
| 4,000: end < 34 | 1342 (32.1–35.0%) | 1347 (32.2–35.2%) |
| 4,000: reach 36 | 2332 (56.8–59.8%) | 2329 (56.7–59.7%) |
| Mean seasons | 15.87 | 15.58 |
| Player titles (sum) | 1015 | 1002 |
| All-Star / MVP / DPOY | 2208 / 35 / 218 | 2181 / 35 / 217 |
| D-09 Gini, simulated titles | 0.303 | 0.305 |
| careerBust option A | 14.9% | 14.9% |

**Side effects:**
- Five careers that used to heal below 2.5 by 33, and played on, now end at 30–31. That is the only change in the share reaching 36.
- Each early-retiring career loses 1–3 late seasons, which explains the small drops in All-Stars (−1.2%) and titles (−1.3%).
- The end-at-33 case is still rare (10), because it needs a new serious injury at 33. It is left as is.

**Tests:**
- `retire-spread.test.ts`: gate, bars, legacy unchanged.
- The full-career golden for seed 1 is updated on purpose: drag 3.6, now retires after the age-30 season instead of 32. The 2.13 values are kept as `GOLDEN_2_13` and checked byte for byte.
- `legacy-report.test.ts`: its "1 stagioni / 1 seasons" pluralisation regex also matched "11 stagioni". The regex was fixed (digit boundary) and the copy is unchanged. This is Jarvis's file; the fix is test-only.

## Open decision for the owner
1. Accept the spread 29–32? Or is end-at-30 at 10.8% too heavy? A softer option is `31: 4.0`.
2. Should early retirement get its own Card/Legacy wording («ritiro per infortunio a 30 anni»)? That is Jarvis's area.
3. Merge order with D-08 option B (#PR), which also targets 2.14.0: they need one combined version bump.
