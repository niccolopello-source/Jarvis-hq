# A4 — OKC edge: measurement and decision (Lucille, main 6ded767)

Same G4 seeds, Pro, 1000 worlds. Script: `apps/pivot23/scripts/g4/team-power-trace.ts`.

## Initial table and decay
- teams.ts: OKC 92, then CLE 85, BOS 84, NYK/DEN 83 (+7 over #2), league mean 71.3.
- OKC mean power: 92 (s0) → 88 (s5) → 82.1 (s10) → 77.3 (s15). League mean 71.3 → 67.9.
- Gap to the league mean halves in ~12 seasons. CLE/BOS decay the same way (85→75, 84→74.5 by s10): it is a structural property, OKC simply starts highest.
- OKC star OVR 86.6 → 78.2 (s10); star pull ((star−78)×0.22) partly offsets the 0.07 reversion.
- OKC title share by title index: 17.8% (first simulated) → 11.7% (idx 10) → ~8% (idx 15-18); uniform = 3.3%. Whole-career share 11.7%, Gini 0.302, longest dynasty p90 3 / max 6.

## Tested candidate (2.15-gated, CPU-only star pull; not committed)
| cpuStarPull | OKC share | Gini | dyn ≥4 | P0 end<34 | reach 36 |
|---|---|---|---|---|---|
| 0.22 (main) | 11.7% | 0.302 | 4.4% | 321 | 598 |
| 0.15 | 11.6% | 0.301 | 2.2% | 339 | 574 |
| 0.11 | 10.4% | 0.280 | 2.4% | 359 | 563 |

Barely moves OKC share and noticeably shifts P0-LIFE (more early ends). Star pull is not the driver; the initial +7 is, and teams.ts is off-limits.

## Decision
Document as a **plausible dynasty**: a deliberately strongest 2025-26 roster that fades to ~2.4× uniform over 15 seasons, with no runaway dynasties. No engine change proposed. If the owner wants less, the honest lever is the teams.ts value (e.g. OKC 92→88), which needs the TASKS.md owner's sign-off.
