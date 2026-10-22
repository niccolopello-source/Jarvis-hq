# OVR balance 2.21.0 (changelog)

File name keeps "2.20" (branch `grokbot/ovr-balance-2.20`). The gate is **2.21.0**: #112 (Leggenda retirements, `LEGEND_RETIRE_SINCE` 2.20.0) was merged to main (815b1ad) and is live as 2.20.0-beta on 21 Oct 2026, so live 2.20 careers must not move.

Owner: Grok Bot (engine ownership moved from Lucille, Pello 21 Oct 2026). Branch `grokbot/ovr-balance-2.20`, draft PR. Source audit: `/workspace/reports/ovr-audit-1019/REPORT.md` (box), before/after: `/workspace/reports/ovr-balance-2.20/compare.json`.

## What changes (careers created by 2.21.0 or later only, `OVR_BALANCE_SINCE` in `tuning.ts`)
- Leggenda potential shift at creation: −6 → −4 (`potentialShiftOf`, `difficulty.ts`). The `DIFF_MAP.leggenda.potential` spec stays −6 for old careers.
- Twilight base wear: 15.4 → 11.4 ("decline option B", `twilightBaseWearOf`, used by `peak.ts` `twilightOf`).
- `ENGINE_VERSION` 2.20.0-beta → 2.21.0-beta. `SAVE_VERSION` stays 11. No RNG draw added or removed; no save field added.

## Old careers
2.20 and older careers replay byte-identical: `fixtures/ovr-balance-fp-220.json` (800 careers, 2.16–2.20, frozen on main @ 815b1ad), existing version-gate/awards fixtures, `GOLDEN_2_19` and `GOLDEN_2_20`. Rules drawn at creation are gated on the creating version: `freshPlayer(…, potentialRulesVersion)` and `openCareerSim({ engineVersion })` (test/lab only). Harnesses that force an older version now create the career as that version.

## Measured (seeds 910000–910999, 1000 careers per difficulty, main 2.20.0-beta @ 815b1ad → this branch 2.21.0-beta)
| | Esordio | Pro | All-Star | Leggenda |
|---|---|---|---|---|
| OVR at 31 / 34 (median) | 65/56 → 67/58 | 63/53 → 64/55 | 59/50 → 60/52 | 56/48 → 59/51 |
| Peak median | 74 → 74 | 71 → 71 | 68 → 68 | 65 → 67 |
| Peak never > 64 | 0.2% → 0.2% | 11.8% → 11.8% | 28.4% → 28.4% | 47.8% → 34.9% |
| Touches the 48 floor | 34.7% → 19.0% | 36.6% → 22.7% | 43.8% → 34.4% | 54.9% → 39.7% |
| Peak ≥ 90 | 6.0% → 6.0% | 4.6% → 4.6% | 2.7% → 2.7% | 0.9% → 2.3% |
| Last season at 29–32 (per 1000) | 15 → 18 | 298 → 313 | 339 → 336 | 325 → 296 |

Interaction: the Leggenda potential lift keeps more Leggenda careers in the rotation, so fewer close at 31–32 on the #112 minutes bars (325 → 296 on these seeds, just under the 300–340 owner band). See the stats test result in the PR body; re-tuning `minutesRetireBars220` would be a separate decision.

## Combining with other work
- PR #112 (Leggenda retirements, `LEGEND_RETIRE_SINCE` 2.20.0): already merged on main and included in this branch (rebased on 815b1ad). Its 2.19/2.20 tests now create careers as the forced version (`lastAge` in `injury-retire.stats.test.ts`, `playAt` in `scripts/version-gate-fingerprints.ts`).
- PR #114 (procedural depth, Dallak): rebase on this branch and gate depth on the same version: set `DEPTH_SINCE = "2.21.0"` in `memory.ts` (or call `usesOvrBalance220` / compare against `OVR_BALANCE_SINCE` from `tuning.ts`) and create `memory` for new careers in `freshPlayer`/`openCareerSim` when `versionAtLeast(engineVersion, "2.21.0")`. Expected textual conflicts: `openCareerSim` (the potential line now uses `potentialShiftOf`), `SimOpts` (both add fields), `package.json` test list.
- Then regenerate the 2.21 goldens once: `GOLDEN` in `engine-invariants.test.ts`, 2.21 values in `src/lab/experiment.test.ts`. The 2.19 and 2.20 goldens and fixtures must not move.
