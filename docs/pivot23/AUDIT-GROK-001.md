# AUDIT PIVOT-GROK-001

Date: 2026-09-28.
Auditor: Grok, independent of the implementation.
Question: does the simulation generate believable career distributions?

## Scope warning

The 40,000 careers were run on a sandbox checkout, branch `demo/readiness`, tip `160b109`. That history is not `niccolopello-source/Jarvis-hq` `main` at `421a4a0`.

What was checked on the production bundle itself, the same day: the file `index-CTuKpHf_.js` (694334 bytes) contains `2.11.0-beta`, `Boston Celtics` and `age>=36`.

Do not quote the tables below as measurements of the live site until James re-runs them on `main`.

## Method

`playCareerSim`. Random draft. Random story choice. Role rotates. Path rotates across NCAA, Europa and G-League. Nationality fixed to Italia, which has a small attribute bonus. Seed `(i+1)*1000+salt`. 10,000 careers per difficulty. The model was not tuned.

This is the engine playing itself, not a human always taking the best choice.

## What did not vary, in 40,000 careers

| Measure | Result |
|---|---|
| Retirement age | 36 in every career |
| Career length | 15 seasons if the path starts at 21 (NCAA), 17 if it starts at 19 |
| Observed peak age | Only 26, 27 or 28 |
| Observed peak age different from the assigned apex | 0 |
| Peak before 26 or after 28 | 0 |
| Overall outside 48–99, NaN, games above 82 | 0 |
| Bust, defined as potential ≥ 85 and peak ≤ 74 | 0 |

Injuries did not end careers. The most games missed in a Leggenda career was 409, and that career still retired at 36.

## Protagonist, by difficulty

| | Esordio | Pro | All-Star | Leggenda |
|---|---:|---:|---:|---:|
| Peak median | 80 | 78 | 74 | 71 |
| Peak mean | 81.2 | 79.2 | 75.7 | 72.7 |
| Peak ≥ 90 | 12.0% | 11.7% | 7.5% | 4.1% |
| Peak ≥ 96 | 7.5% | 5.6% | 3.6% | 1.0% |
| Final overall median | 59 | 56 | 52 | 49 |
| Year-1 PPG median | 8.7 | 8.4 | 8.1 | 7.8 |
| Career PPG median | 12.4 | 11.2 | 9.5 | 8.1 |
| Games missed, median | 49 | 93 | 120 | 150 |
| MVP, mean | 0.65 | 0.25 | 0.06 | 0.01 |
| Titles, mean | 1.31 | 0.85 | 0.21 | 0.04 |
| All-Star, mean | 3.04 | 1.63 | 0.74 | 0.33 |
| ROY | 6.0% | 4.3% | 3.0% | 1.8% |

Difficulty order is real. The medians do not cross. That part is not the failure.

## The tail

On Esordio, 569 of 10,000 careers had at least 6 MVP. The maximum was 12 MVP, 12 titles and 14 All-Star selections, inside 15 or 17 seasons. 778 careers had at least 6 titles.

On Pro, 161 careers had at least 6 MVP (maximum 11) and 499 had at least 6 titles (maximum 13).

All-Star and Leggenda almost do not do this. The mechanism exists on every difficulty. The easy settings leave the player above the award line for half a career.

Season points are clamped at 35.4 in the engine. That ceiling appeared as the maximum in every difficulty. It is a clamp, not a sample result.

Final overall never exceeded 83, including careers that peaked at 99.

## World

About 190,000 NBA titles were recorded across the careers.

| Franchise | Share, the same in every difficulty |
|---|---|
| Boston | 15.1% |
| Oklahoma City | 10.8% |
| Cleveland | 4.7% |

A 30-team league would give each franchise 3.3% if titles were even. Boston's share matched to a tenth of a percent across four separate 10,000-world runs. That is the written team power, not variance. A single era still had about 12 different champions. The league is tilted, not dead. Player difficulty did not move it.

Role changed the peak year by about a year. Peak height by role, on Pro, sat between 78.9 and 79.4. Box score by role was not split in this run. Do not invent that table. P1-ROLE exists to measure it.

## Cause

Not the random generator. Four rooms of 10,000 seeds produced the same cage.

| Defect | Cause in that tree |
|---|---|
| Always 36, only two lengths | Career over is age only. Path fixes the debut age. Injury removes games, not years. |
| Peak only at 26–28, never moved | The curve assigns the year and the overall arrives there. Observed and assigned matched 40,000 times. |
| 6–12 MVP, 6–13 titles | The MVP line can be cleared every year of the plateau. No cost for having won it already. |
| No bust under the definition above | Potential enters the curve as a ceiling that gets reached. |
| Boston and Oklahoma City | Team power is a constant. |
| 35.4 points | An explicit clamp. |

## Severity, for that tree

- P0. Every career has the same ending and the same kind of peak.
- P0. Esordio and Pro systematically produce careers with 6 or more MVP and 6 or more titles.
- P1. High potential did not miss, under the definition used.
- P1. Role did not move peak height.
- P1. Two franchises win the same share in every world.

ROY is not missing. On Pro it was 4.3%. A smaller sample that found zero was noise.

## Production, separate from the tables

Shipping `age>=36` and real franchise names in the public bundle is a fact about `421a4a0`, not about the sandbox. See FACTS.md and decisions P-001 and P-005.
