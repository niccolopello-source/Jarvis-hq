# PIVOT 23 — Balance experiments (DESIGN DECISIONS REQUIRED)

Branch `grokbot/demo-stability`, measured 2026-10-03. Code: `apps/pivot23/src/lib/pivot/tuning.ts`. **Every flag defaults to the shipped rule; the game never changes them.** The comparison harness (offline, not committed: it writes large JSON) runs `playCareerSim` with a tuning object.

## 1. Proof that the hooks change nothing by default

300 Esordio + 300 Pro careers, same seeds, `origin/main` (778a561) vs this branch with the D-01 fix reverted: identical career hashes (`fa6f3e01…`, `4c233191…`) and identical league-award hashes. `determinism.test.ts` keeps the defaults and same-seed reproducibility (per difficulty, per variant, and across save/resume) in the unit suite.

## 2. Main run: origin/main vs this branch (defaults), 4,000 careers

1,000 careers per difficulty; seeds Esordio 100000+, Pro 200000+, All-Star 300000+, Leggenda 400000+. Same seeds on both sides.

| Difficulty | Version | Season rows | Invariant violations | Errors | DPOY to non-NBA player | Non-NBA leader of NBA DPOY race | Top champion | Pot ≥85 / bust (peak ≤ pot−8) | End 32 / 36 | MVPs | Titles | Max DPOY streak |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Esordio | main | 17,259 | 0 | 0 | 5,535 | 16,239 | BOS 14.9% | 125 / 0 | 0.0% / 93.9% | 112 | 851 | 10 |
| Esordio | branch | 17,259 | 0 | 0 | **0** | **0** | BOS 14.9% | 125 / 0 | 0.0% / 93.9% | 112 | 851 | 10 |
| Pro | main | 15,857 | 0 | 0 | 5,177 | 14,908 | BOS 15.9% | 115 / 0 | 33.8% / 59.0% | 27 | 456 | 7 |
| Pro | branch | 15,857 | 0 | 0 | **0** | **0** | BOS 15.9% | 115 / 0 | 33.8% / 59.0% | 27 | 456 | 7 |
| All-Star | main | 15,462 | 0 | 0 | 5,279 | 14,584 | BOS 16.2% | 96 / 0 | 44.6% / 50.6% | 19 | 140 | 6 |
| All-Star | branch | 15,462 | 0 | 0 | **0** | **0** | BOS 16.2% | 96 / 0 | 44.6% / 50.6% | 19 | 140 | 6 |
| Leggenda | main | 15,441 | 0 | 0 | 5,098 | 14,471 | BOS 16.2% | 53 / 0 | 45.2% / 49.6% | 1 | 20 | 2 |
| Leggenda | branch | 15,441 | 0 | 0 | **0** | **0** | BOS 16.2% | 53 / 0 | 45.2% / 49.6% | 1 | 20 | 2 |

The only gameplay difference is D-01 (the league DPOY is now always an NBA player). Everything the player owns (seasons, titles, MVPs, ages) is unchanged; career hashes differ only because the stored league snapshot lists different DPOY candidates.

DPOY check on the audit sample (300 mixed careers, seeds 900000+): NBA seasons whose DPOY went to a non-NBA player: main 1,570 / 4,730 (33.2%) → branch 0 / 4,730.

Throughput: ~75–106 s per 1,000 careers per process, peak RSS ~160–175 MB, same on both sides.

## 3. Alternatives (each 1,000 careers: 250 per difficulty, same seeds)

| Variant | Ends < 34 | Ends at 36 | Age histogram | Bust / pot ≥85 | Median gap pot−peak | Top champion | Champion Gini | Distinct script windows | MVPs | Titles | DPOY total / max / max streak | Mean peak C/PF/PG/SF/SG |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **default (shipped)** | 33.4% | 61.3% | 32:328 33:6 34:22 35:31 36:613 | 0/100 | 3.0 | BOS 15.9% | 0.373 | 1 (6/8/10) | 38 | 360 | 140 / 9 / 9 | 77.0/77.9/77.1/76.7/76.3 |
| D-11 scriptWindows=seeded | 33.0% | 61.3% | 32:329 33:1 34:16 35:41 36:613 | 0/100 | 3.0 | BOS 16.1% | 0.373 | 21 | 42 | 350 | 128 / 10 / 10 | ≈ |
| D-11 scriptWindows=seeded-wide | 34.8% | 60.8% | 32:347 33:1 34:24 35:20 36:608 | 0/100 | 3.1 | BOS 16.0% | 0.371 | 61 | 40 | 376 | 137 / 8 / 8 | ≈ |
| D-10 retirement=graded | 33.4% | 61.3% | **30:69** 32:259 33:6 34:22 35:31 36:613 | 0/100 | 3.0 | BOS 16.0% | 0.375 | 1 | 38 | 360 | 140 / 9 / 9 | ≈ |
| D-10 retirement=path | 34.6% | **49.5%** | 30:69 32:259 33:18 34:93 35:66 36:495 | 0/100 | 3.0 | BOS 16.1% | 0.377 | 1 | 38 | 360 | 140 / 9 / 9 | ≈ |
| D-08 bust=choices | 33.3% | 61.1% | ≈ default | **0/100** | 3.8 | BOS 16.1% | 0.375 | 1 | 45 | 383 | 129 / 7 / 7 | +0.5 all roles |
| D-08 bust=events | 33.6% | 61.2% | ≈ default | **0/100** | 2.9 | BOS 15.9% | 0.374 | 1 | 37 | 344 | 134 / 9 / 9 | −0.2 |
| D-09 world=jitter | 32.1% | 62.8% | 32:321 34:20 35:31 36:628 | 0/100 | 3.2 | BOS 15.8% | 0.364 | 1 | 40 | 409 | 139 / 10 / 10 | ≈ |
| D-09 world=regress | 34.0% | 60.6% | ≈ default | 0/100 | 3.3 | **BOS 15.1%** | **0.331** | 1 | 37 | 401 | 133 / 9 / 9 | ≈ |
| D-23 dpoyFatigue=steeper | = default | = | = | = | = | = | = | 1 | 38 | 360 | **105 / 5 / 5** | = |
| D-23 dpoyFatigue=streak | = default | = | = | = | = | = | = | 1 | 38 | 360 | 145 / 9 / **5** | = |
| P1-ROLE rolePeak=fit | 33.4% | 60.7% | ≈ | 0/100 | 3.3 | BOS 16.0% | 0.377 | 1 | 37 | 369 | 137 / 7 / 7 | 77.1/77.9/77.6/76.8/76.7 |
| P1-ROLE rolePeak=fit-strong | 32.0% | 61.9% | ≈ | 0/100 | 3.5 | BOS 15.9% | 0.370 | 1 | 44 | 378 | 141 / 9 / 9 | 77.2/77.8/78.0/77.0/77.0 |

0 invariant violations and 0 errors in every variant.

## 4. Reading and recommendations (owner decides)

- **D-11 scripted seasons** — today every career gets its rival/injury/national-team stories in seasons 6/8/10. `seeded` gives 21 distinct patterns with no side effects worth noting; `seeded-wide` 61. *Recommendation: `seeded`.* Caveat: switching it changes which season a running save expects its story in. Gate it on a new `engineVersion` (only careers started after the change) before turning it on.
- **D-10 retirement** — both alternatives create a cluster at 30 (69/1,000) which looks worse than today's 32. `path` also cuts age-36 finishes from 61% to 50%. *Recommendation: keep current; redesign if a smoother 32–36 spread is wanted (the bimodal 32/36 shape stays).*
- **D-08 bust** — neither alternative produces a single bust among potential ≥85 players. *Not solved: needs a design (e.g. an explicit realisation roll tied to injuries/work ethic) and a target rate from the owner.*
- **D-09 title spread** — `regress` lowers concentration (Gini 0.373→0.331, Boston 15.9→15.1%), `jitter` barely moves it. *Recommendation: `regress` if the owner wants less repeat champions; effect is modest.*
- **D-23 DPOY repeats** — `steeper` caps a career at 5 DPOYs (from 9–10) and reduces totals by 25%; `streak` only breaks long streaks. *Recommendation: `streak` keeps the totals and removes the 9-in-a-row cases.*
- **P1-ROLE** — differences are within ±1 overall; not worth shipping as is.

## 5. How to switch one on (after the decision)

Change the default in `TUNING`, bump `ENGINE_VERSION`, gate on the career's engine version where saves are in flight (D-11), re-run this table and `determinism.test.ts` (its first test asserts the defaults are `fixed`/`current`; change that assertion in the same commit, with the reason).
