# D-08 option B — choice-driven development busts (PROPOSAL, measured, OFF by default)

Author: Lucille (Grok Bot), 2026-10-12. Follows `D-08-OPTION-B-FOLLOWUP.md`. Draft, do not merge without an owner decision.

## Step 1 — the existing switch does not work
`TUNING.bust = "choices"` doubles the weight of development and choice imprint in `realizationOf`.
- Choices are almost always positive (for pot ≥ 80 at the apex, `choiceOvr` p5–p95 is 2.9–5.0), so the switch *raises* realisation.
- Measured on Pro i = 0..999: the p90 potential−peak gap goes 2.6 → 1.8.
- `"events"` (injury weight) gives 1/131 lab bust and is not choice-driven.

## Proposed mechanism (`bust = "choices-b"`, `peak.ts bustBDrag`)
- **Formula:** `drag = 0.12 · max(0, 4.0 − choiceOvr) + 0.04 · max(0, 6.0 − development)`, subtracted from realisation.
  - Downside only: choices above the reference never add.
  - The reference points are the median imprint and development of pot ≥ 80 careers at their apex.
- **When it is judged:** three seasons before the apex, then **locked** in a new optional state field `bustLock` (validated in `save.ts`). The drag cannot change the age of the peak.
  - An unlocked version moved 36–41 of 1,000 peaks to 23–25, breaking P0-LIFE. With the lock, 1000/1000 peaks stay at 26–28.
- **Gate:** careers from `BUST_SINCE = 2.17.0` only (rebased 2026-10-12 on main 2.15; 2.16 left free for PR #83), **and** the switch is OFF by default (`TUNING.bust = "current"`).
  - `ENGINE_VERSION` goes to 2.17.0-beta. With the switch off, 2.17 careers behave exactly like main 2.15: all goldens unchanged.
  - 300/300 Pro careers stamped 2.13 replay bit-identical.
  - Turning it on is the one-line owner decision.

## Update 2026-10-12 — rebased on main 2.15.0-beta (A2 retirement spread + awards v2)
**Gate proof:** 240 careers forced to 2.12/2.13/2.14/2.15/2.16 (4 difficulties × 12 seeds, awards-gate fingerprint incl. RNG state): main vs branch B off 240/240 identical, main vs branch B **on** 240/240 identical.

Re-measured, 1,000 careers each, same seeds (`(i+1)*1000+17`):

| Metric | main 2.15 | branch B off (2.17) | branch B on (2.17) |
|---|---|---|---|
| careerBust Pro / Leggenda | 14.1% / 15.7% | 14.1% / 15.7% | **16.8% / 17.0%** |
| High-pot bust (pot ≥ 85, peak ≤ pot−8) Pro / Leg | 0/131 / 0/64 | same | 1/131 / 3/64 |
| Reach potential Pro / Leg | 55.5% / 41.5% | same | 28.2% / 15.2% |
| Gap median / p90 Pro | 0.9 / 2.6 | same | 1.9 / 3.7 |
| All-Star / All-NBA / MVP / titles Pro | 700 / 934 / 103 / 296 | same | 555 / 766 / 78 / 256 |
| Mean seasons Pro / Leg | 15.62 / 14.21 | same | 15.60 / 14.15 |

Conclusion unchanged: B off is a no-op; B on still mostly hits non-star careers and cuts awards ~20%. Recommendation: keep OFF.

## Results (original, on 2.13) — 4,000 Pro careers + 1,000 each on Esordio/All-Star/Leggenda, same G4 seeds
`main` 3bb757b (2.13, Pro run fresh and engine-identical to G4 `f7ca03d`: 1000/1000 same fingerprints) vs this branch with `bust = "choices-b"` (2.14).

| Metric | main | option B | B soft (k 0.08 / 0.02, Pro 1,000) |
|---|---|---|---|
| High-potential bust (pot ≥ 85, peak ≤ pot−8) | 0/419 (0–0.9%) | **2/419 (0.5%, 0.1–1.7)** | 0/131 (0–2.8) |
| careerBust option A, Pro | 14.9% (13.8–16.0) | **17.5% (16.4–18.7)** | 15.1% (13.0–17.5) |
| careerBust by difficulty E/P/A/L | 7.7 / 14.9 / 17.7 / 15.7 | 9.3 / 17.5 / 18.7 / 17.4 | — |
| … by potential band <70 / 70–75 / 75–80 / 80–85 / 85+ | 14.8 / 23.1 / 15.3 / 1.1 / 0 | 14.8 / 24.1 / 24.2 / 5.9 / 0 | 17.0 / 21.9 / 16.1 / 2.0 / 0 |
| Progression share of option-A busts | 11.3% | 40.4% | 24.5% |
| Gap pot−peak median / p90 / max | 1.0 / 2.5 / 6.9 | 1.9 / 3.7 / 10.9 | 1.4 / 3.1 / 7.9 |
| Reach potential (peak ≥ pot−1) | 54.1% | 27.0% | 39.4% |
| P0-LIFE 1,000: < 34 / reach 36 / peak 26–28 | 321 / 598 / 1000 | 319 / 582 / 1000 | 324 / 600 / 1000 |
| Mean seasons | 15.87 | 15.83 | 15.91 |
| All-Star / All-NBA 1st / MVP / DPOY (Pro 4,000) | 2208 / 827 / 35 / 218 | **1799 / 647 / 28 / 167** | — |
| Player titles (Pro 4,000) | 1015 | 931 | — |
| D-09 Gini (simulated) | 0.303 | 0.305 | 0.304 |

High-potential bust repro seeds (option B): 300017 (pot 94.9 → peak 84) and 1339017 (89.1 → 80).

## Findings
1. **The target effect is not reached.** High-potential careers make above-reference choices, so B mostly hits 70–85 potential players. The high-potential bust share stays at about 0.5%, statistically indistinguishable from "almost never".
2. **The side effects are large.** All-Stars −18.5%, All-NBA 1st −22%, MVP −20%, DPOY −23%, titles −8%. The careerBust rate leaves the 10–15% band (17.5%).
3. The soft variant keeps careerBust in band, but produces no high-potential busts at all.
4. **Recommendation: do not turn it on.** A real "high potential, wrong choices" bust needs per-choice risk data (which picks are risky), which `choiceLog` does not encode today.
   - Next design: tag risky choices in the event data, then apply a drag scaled by potential (so pressure grows with expectations).
   - That is a content and data change; it needs the owner, and Jarvis for the copy.

## Open decision for the owner
1. Keep B off and pursue risk-tagged choices (recommended), or accept B / B soft knowing the side effects?
2. Is a ~0% high-potential bust rate acceptable for the product (stars always become stars)?
3. B is gated on 2.17.0; if #83 does not take 2.16, the gate can move down without other changes.
