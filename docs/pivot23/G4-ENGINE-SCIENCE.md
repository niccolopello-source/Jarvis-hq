# G4 — Engine science (measurement only)

**Author:** Lucille (Grok Bot), 2026-10-12. **Scope:** tools and docs only. No formula, constant, golden or engine file was changed. Branch `lucille/g4-engine-science`.
**Pinned runs:** see `g4-results/MANIFEST.md`.
- `main` = `f7ca03d` (2.13.0-beta, #66 merged).
- `prev` = `b265a68` (2.12.0-beta).
- Same seeds on both: 4,000 Pro careers + 1,000 each on Esordio/All-Star/Leggenda per commit, 0 errors.
- Aggregates: `g4-results/{main,prev}-aggregate.json`.
- Scripts: `apps/pivot23/scripts/g4/` (`collect.ts`, `analyze.ts`, `gate-check.ts`, `run.sh`). `scripts/measure-decisions.ts` has the same D-09/D-23 logic.

Conventions:
- Proportions are given as k/n, % and Wilson 95% CI.
- Means are given with a normal-approximation 95% CI.
- "Small" means n < 30.
- Each finding is split into: observed / statistically supported / gameplay relevance / possible cause / proposal.

## Gate table

| Gate | Threshold (source) | `main` 2.13 | `prev` 2.12 | Verdict |
|---|---|---|---|---|
| P0-LIFE early endings | ≥150/1000 Pro end < 34 (`TASKS.md`) | **321/1000** (29.3–35.1%); 4,000: 1342 (33.6%, 32.1–35.0) | 346/1000 | **PASS** |
| P0-LIFE reaches 36 | ≥1 | **598/1000** (56.7–62.8%) | 586/1000 | **PASS** |
| P0-LIFE age coherence | ending age = last row; no gaps/duplicates/rows > 36 | 4000/4000 | same | **PASS**, with anomaly A1 |
| P0-LIFE peak window | every peak age 26–28 | assigned 1000/1000; observed 1000/1000 (26:1152 · 27:1499 · 28:1349 of 4,000) | same | **PASS** |
| P1-BUST (lab) | record share of Pro pot ≥85 with peak ≤ pot−8 | **0/419** (0–0.9%) | 0/419 | **RECORDED: 0%**, see A3 |
| D-08 option A rate | 10–15% (owner) | Pro 4,000: **14.9%** (13.8–16.0); 1,200 (300/difficulty): 13.1% (11.3–15.1) | 14.8% / 13.4% | **PASS (upper edge)** |
| D-09 concentration down | Gini current → regress | simulated titles **0.303** | 0.369 | **PASS** (−18%) |
| P1-WORLD | no franchise keeps ~15% from its power constant (`TASKS.md`) | OKC **11.4%** of simulated titles, stable over 4 chunks (11.2–11.7); **15.3% in seasons 1–5** | OKC 12.1% | **PARTIAL**, see A4 |
| D-11 calendars | 21 | **21** | 21 | **PASS** |
| D-23 DPOY streak | max ≤ 5 | Pro **4**, Esordio 3, All-Star 1, Leggenda 1 | 3 / 3 / 3 / 0 | **PASS** |
| Version gate | a 2.12 career on 2.13 code = 2.12 code | **600/600** identical (300 Pro + 300 Esordio) | — | **PASS** |
| Determinism | rerun identical | **500/500 byte-identical**, 3 processes | — | **PASS** |
| D-ROLE / P1-ROLE | roles separate the box score | yes (table §5), same minutes across roles | same | **PASS**: weights are alive |

## 1. P0-LIFE (Pro, 1,000 gate sample + 4,000)

**Ending ages (1,000):** 32: 317 · 33: 4 · 34: 51 · 35: 30 · 36: 598.
- Signals: injury 385, minutes 51, none 564.
- All 321 early endings are injury endings. 0 are unexplained by the injury ≥ 2.5 or minutes ≤ 11.5 rule.
- Seasons: mean 15.9, median 16.
- Start age 19 (Europa/G-League) or 21 (NCAA). NCAA ends < 34 in 36.9% vs G-League 30.9%, because NCAA careers start two years later and are shorter.

**Stability:**
- Over the four 1,000-seed chunks, ending < 34 ranges 32.1–34.8%.
- By difficulty: Esordio 1.0% (0.5–1.8), All-Star 47.4%, Leggenda 48.0%. The P0-LIFE gate covers Pro only.

**Age coherence:**
- `careerEndAge` always equals the last row's age.
- `PlayerState.age − endAge` is 0 for 61.5% and 1 for 38.5% of careers. The state age is already the next season's age after the offseason; this matches the documented `ageEnd` convention. The UI must show `careerEndAge`, not `age`.
- No age gaps, duplicate ages or rows past 36.
- No career reaches the summer at 35 without a signal and without the offer.

**Offseason boundary (35 → 36):**
- The offer (`shouldOfferExtraYear`) fires at `age === 35` with no ending signal.
- `offseasonStep` then gives `play-final` at 36 unless `isCareerOver`, and `isCareerOver` checks the ending signal first.
- Result: 71/4000 careers (1.8%) accepted «Gioca a 36 anni» (`extraSeason = true`) but the injury signal closed them before the 36 season. → **A1**.

**A2 — the "end before 34" share is a cliff at 32:**
- Observed: 1,323 of 4,000 Pro careers end exactly at 32, 0 below 32, and only 4/1000 at 33.
- Cause: `careerEndingSignal` returns `null` while `age < MAX_AGE − 3` (33). Every injury-driven ending therefore lands on the first summer it is allowed: after the age-32 season.
- Statistically supported: yes, structural.
- Gameplay relevance: medium. Early retirements all look alike (always 32), and no career ends at 29–31 even after severe injuries.
- Proposal: see P-2 (D-10, not applied).

## 2. D-08 bust

**Definitions measured:**
- Lab rule (`lab/lab.ts:14`, P1-BUST): `pot ≥ 85 && peak ≤ pot − 8`.
- Option A (`careerBust`, PR #71, re-implemented identically in `analyze.ts`): first-round pick 1–30, no All-Star, ≤ 1 NBA starter season (≥ 28 min, ≥ 50 GP).

**Overall (Pro, 4,000):**
- Lab rule: **0/419** pot ≥ 85 careers (0–0.9%).
- Max pot−peak gap anywhere is 6.9; median 1.0, p90 2.5. Peak ≥ pot−1 ("reaches potential"): 54.1% (52.6–55.7). Gap ≥ 3: 5.5%.
- Option A: 595/4000 = 14.9%.
  - **88.7% of option-A busts (528/595, 85.9–91.0) peak within 2 points of their potential.** They are *opportunity* busts (minutes/role), not *progression* busts. Only 67 (11.3%) progressed poorly.

**Segments (option A, Pro):**
- By potential band:
  - < 70: 14.8%
  - 70–75: **23.1%**
  - 75–80: 15.3%
  - 80–85: 1.1%
  - **85+: 0.0%** (n = 419)
- By role: PG 18.9 · SG 16.4 · SF 12.9 · PF 11.9 · C 14.4.
- By path: **NCAA 25.3% · Europa 16.4% · G-League 2.9%**. The path drives draft slot: first-round share is NCAA 645/1334, Europa 449/1333, G-League 186/1333.
- By pick: picks 1–14: 6.3% (n = 48, small-ish); 15–30: **48.1%**; ≥ 31: 0% by definition.
- Seed sensitivity: the four 1,000-seed chunks give 14.1 / 15.0 / 15.3 / 15.1%.
- By difficulty: Esordio 7.7%, Pro 14.9%, All-Star 17.7%, Leggenda 15.7%.
- Prime NBA minutes (ages 25–29, median) rise with potential: 21 → 35.

**Comparison with 14.3/14.9% (#71):**
- Same rule, different seeds (100000+ blocks there, `(i+1)*1000+17` here).
- The comparable 1,200-career sample gives 13.1% (main) / 13.4% (prev). Inside each other's CIs. Consistent.

**A3 — the engine cannot produce a progression bust:**
- Observed: 0/419 high-potential careers miss by ≥ 8, and option A labels mostly mid-potential late first-rounders who simply didn't get minutes.
- Statistically supported: yes.
- Relevance: high for D-08 semantics. The Career Card label «non è mai esplosa» is accurate about the role, not about development.
- Possible cause: the peak model (`peak.ts`) realises ~potential deterministically; `TUNING.bust` is `current`.
- Proposal: P-3 (option B, post-demo, already written in `D-08-OPTION-B-FOLLOWUP.md`). No change now.

## 3. D-09 worlds (one career = one world, 4,000 Pro worlds)

Seeded starting titles are exactly 3 per world and are reported separately ("simulated" excludes them).

| | prev `current` | main `regress` |
|---|---|---|
| Simulated NBA titles | 60,036 | 60,307 |
| Gini over 30 franchises | 0.369 | **0.303** |
| HHI | 527 | 473 |
| Top-3 share | 28.0% | 25.5% |
| Top 5 | OKC 12.1, CLE 8.3, BOS 7.6, NYK 6.5, DEN 6.4 | OKC 11.4, CLE 7.4, BOS 6.6, NYK 5.9, DEN 5.7 |
| Franchises with ≥ 1 title | 30 | 30 |
| Distinct champions per world (median, range) | 9 (4–15) | 9 (4–16) |
| Top team share per world (median / p90 / max) | 25 / 35.7 / 76.9% | 22.2 / 33.3 / 58.3% |
| Longest dynasty (median / p90 / max) | 2 / 3 / 8 | 2 / 3 / 7 |
| Worlds with a ≥ 4-peat | 3.6% (3.1–4.2) | 3.2% (2.7–3.8) |

- Including the three seeded titles: Gini 0.462 → 0.406, BOS 17.5 → 16.6%. Two of the three seeded titles are BOS, which is the origin of the old "Boston ~15%" figure.
- Excluding the player's own titles changes nothing material (Gini 0.299).

**By era (Gini, simulated):**

| Seasons | prev | main |
|---|---|---|
| 1–5 | 0.546 | 0.529 |
| 6–10 | 0.366 | 0.292 |
| 11–15 | 0.241 | 0.155 |
| 16+ | 0.178 | 0.117 |

**By difficulty (main):** Gini 0.29–0.31 everywhere, top team OKC 11.0–11.6%.

**A4 — persistent OKC edge:**
- OKC leads every chunk (11.2–11.7%) and every era: 15.3% of titles in seasons 1–5, 11.2% in 6–10, 8.3% in 11–15. A uniform share would be 3.3%.
- Statistically supported: yes (n ≈ 60k titles, chunk spread ±0.3 pt).
- Plausibility: early-era dominance matches a strong starting roster (plausible dynasty). The bias fades but is still 2.5× uniform after 10+ seasons. It comes from the starting `teams.ts` power, decaying under regress, not from a dynasty the world built.
- Gameplay relevance: low–medium.
- Proposal: P-4 (measure the starting power table and the half-life; no change now; `TASKS.md` forbids "subtract points from Boston"-style fixes).

## 4. D-11 / D-23

**Variety (Pro, 4,000):**
- 21 distinct story calendars. Bucket sizes 134–305, so not uniform (about 2.3× ratio).
- 4,000/4,000 distinct event sequences; 210 distinct event ids used; 15.9 events per career (12–18).
- Mean pairwise Jaccard of event sets: 0.129 (3,000 pairs), i.e. two careers share about 13% of their events.
- 4,000/4,000 distinct choice paths.
- So the variety is real content, not just calendar ids.

**Awards (Pro, 4,000, main):**
- All-Star 2208 · All-NBA 1st/2nd/3rd 827/1206/1114 · MVP 35 · DPOY 218 · MIP 232 · Sixth Man 1074 · ROY 1224.
- DPOY: 98 careers (2.5%), max 6 per career, max streak 4 (prev: 215 DPOYs, max 7, streak 3).
- The top 1% of careers hold 66% of DPOYs (prev 72%).
- DPOY by role: C 156, PF 36, SF 23, SG 2, PG 1.
- Leggenda: 1 DPOY in 1,000 careers; All-Star: 12. → observation O-1.

**Award–stat coherence (NBA seasons):**
- MVP seasons: median 28.3 PPG, OVR 92, 37.3 min, ≥ 65 GP.
- DPOY seasons: 10.8 RPG, OVR 90, ≥ 60 GP (bar 58).
- Other seasons with ≥ 50 GP: 7.5 PPG, OVR 63.
- Coherent.

**ROY:** 1224/4000 Pro careers win ROY (30.6%). Identical count on prev; the rookie season precedes any D-09 effect. By path: Europa 489, NCAA 441, G-League 294. → observation O-2 (not a bug claim: the protagonist is a strong rookie by design; #61 changed ROY scoring).

**Version gating:**
- On `main`, careers stamped `2.12.0-beta` before the first season replay **bit-identical** to the native `prev` code: 300/300 Pro, 300/300 Esordio.
- Unstamped `main` careers differ from `prev` in 300/300, as expected.
- So live 2.12 careers keep D-09 `current` and step 0.12, and new careers get `regress` and 0.16.

## 5. D-ROLE (Pro, NBA seasons with GP ≥ 20; about 12,000 seasons per role)

| Role | PPG mean (CI) · p10/median/p90 | RPG mean · med | APG mean · med | Median min | Per 36 pts/reb/ast |
|---|---|---|---|---|---|
| PG | 8.11 (8.03–8.18) · 3.8/7.0/13.5 | 1.76 · 1.7 | **3.70** · 3.3 | 21.4 | 12.1 / 2.9 / 5.7 |
| SG | **10.54** (10.44–10.63) · 5.1/9.3/17.4 | 2.11 · 2.0 | 2.07 · 1.9 | 21.6 | 15.7 / 3.4 / 3.2 |
| SF | 9.31 (9.23–9.40) · 4.3/8.1/15.3 | 2.79 · 2.6 | 2.11 · 1.9 | 21.5 | 13.9 / 4.5 / 3.3 |
| PF | 8.28 (8.21–8.36) · 4.1/7.3/13.6 | 4.52 · 4.2 | 1.45 · 1.3 | 21.5 | 12.4 / 7.3 / 2.3 |
| C | 6.89 (6.83–6.95) · 3.4/6.0/11.3 | **5.71** · 5.3 | 1.16 · 1.0 | 21.2 | 10.4 / 9.3 / 1.8 |

- Minutes are equal across roles (21.2–21.6 median), so the separation comes from role weights, not from usage.
- Separation holds in every overall band. For OVR 80+, medians are:
  - PG 19.2/3.1/7.7
  - SG 24.6/3.7/4.2
  - SF 23.0/5.0/4.5
  - PF 19.8/8.0/3.0
  - C 16.9/10.4/2.5
- It also holds in every minutes band and every path; path medians are within 0.4.
- Hybrids are not modelled (one role per career). CPU archetypes exist only for CPU players.
- Answer to P1-ROLE: **the weights are alive**; equal peak overall across roles yields different box scores.
- Observation O-3: C scoring is the lowest even at 80+ (16.9 PPG) and PG rebounding is low (p90 2.5). Plausible but on the conservative side.

## 6. Determinism

- `collect.ts pro 0 500` run in 3 separate processes produced byte-identical JSONL (500/500, including the full season rows, champion log, events, choices and `rngState`).
- Plus the 600/600 cross-version gate check above.
- No nondeterminism found.

## Anomaly list (repro: `node --import=tsx scripts/g4/collect.ts pro <i> 1 out.jsonl`, seed = (i+1)·1000+17)

| ID | What | n | Repro seeds | Cause | Risk to existing careers |
|---|---|---|---|---|---|
| A1 | «Gioca a 36 anni» accepted (`extraSeason = true`) but no age-36 season: the injury signal closes the career at the 36 summer | 71/4000 (1.8%) | 4017, 23017, 49017, 65017, 74017 | `isCareerOver` → `careerEndingSignal` is checked before `play-final` in `offseasonStep` (`peak.ts:86-88`); `injuryDrag` crosses 2.5 during the age-35 season | Display only: a Card/summary reading `extraSeason` would claim a 36 season that never happened |
| A2 | Early endings all at 32 (1323/4000), none at 29–31, 33 rare | structural | any early career, e.g. 4017-type injury careers | `careerEndingSignal` returns null below age 33 (`peak.ts:41`) | None now; a fix changes outcomes → needs a version gate |
| A3 | No progression bust: 0/419 pot ≥ 85 miss by ≥ 8; option-A busts are 89% opportunity busts | structural | — | peak realises about potential; `TUNING.bust = current` | Label semantics only |
| A4 | OKC 11.4% of simulated titles (15.3% in seasons 1–5), every chunk | structural | — | starting team power in `teams.ts`, decaying under regress | None |

Observations, not anomalies: **O-1** DPOY almost absent on All-Star/Leggenda (12 and 1 per 1,000). **O-2** ROY 30.6% of Pro careers. **O-3** conservative C scoring / PG rebounding.

## Change proposals (NOT applied, each a separate PR if approved)

- **P-1 (A1, minimal, no balance change).**
  - Either: when a career finishes with `extraSeason && last row age < 36`, record the ending reason «infortunio prima del 36» and have the Card/Legacy Report use `careerEndAge` + reason instead of `extraSeason`.
  - Or: move the offer check so it is re-validated at the 36 summer (UI wording only).
  - Owner of the Card text: Jarvis (#70).
- **P-2 (A2).** Evaluate D-10 `TUNING.retirement = "graded"` (already in code, `peak.ts:49`), behind a new engine version, with the same G4 harness. Gate to keep: P0-LIFE ≥ 150/1000 < 34 and ≥ 1 at 36.
- **P-3 (A3).** D-08 option B (`D-08-OPTION-B-FOLLOWUP.md`), post-demo, version-gated. Re-measure the lab share and the opportunity/progression split.
- **P-4 (A4).** Measure the starting-power table and the era half-life of the OKC/BOS edge before deciding. No `teams.ts` edits (forbidden by `TASKS.md`).
- **P-5 (O-1/O-2).** Owner decision whether DPOY scarcity on hard difficulties and the ROY rate are intended. No change proposed without a target.

## Recommendation per gate

| Gate | Recommendation |
|---|---|
| P0-LIFE | Close again on `f7ca03d` (passes with margin). Keep A1 for the Card owner. |
| P1-BUST | Record "0% on `main` `f7ca03d`" in `TASKS.md`. The engine has no progression bust, which is an open product question. |
| D-08 option A | Keep; 14.9% Pro sits at the upper edge. Document in the UI that the label is about opportunity. |
| D-09 | Keep `regress`. P1-WORLD stays open (A4). |
| D-11 / D-23 | Accept. |
| D-ROLE | Close P1-ROLE: the weights separate the box score. |
| Determinism and gating | Accept. |

## Suggested updates for files owned by others (not edited here)

`TASKS.md` rows P0-LIFE/P1-BUST/P1-WORLD/P1-ROLE are owned by John/James, and `ISSUE-REGISTER.md` has no owner column; I did not edit them. Suggested lines:
- P0-LIFE: «G4 2026-10-12, `f7ca03d`: 321/1000 < 34, 598 at 36, peaks 26–28 1000/1000 (see G4-ENGINE-SCIENCE.md)».
- P1-BUST: «0/419 Pro pot ≥ 85 on `f7ca03d`».
- P1-ROLE: «roles separate, minutes equal; table in G4».
- P1-WORLD: «OKC 11.4% sim titles, 15.3% in seasons 1–5; open».
