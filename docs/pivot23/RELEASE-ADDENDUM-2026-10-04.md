# Release addendum — 4 October 2026

Target, not a promise: a free public demo on 18 October 2026. Recommendation on this date: **NOT READY**. A commercial release is **BLOCKED** until a lawyer reviews the franchise names. Nothing here is legal advice.

Tip when written: `main` `d8fa56d`. Engine identical to `287850b`. P1 numbers below were not re-simulated.

## Assumptions in force, already true in the build

Guest play, local saves, no account, no cloud, no ads, no tokens, no payments. Flags `account`, `tokens`, `nft` are false. Languages offered: Italian and English. Competitions in the sim: NBA and the project's EuroLeague model (16 teams, not a claim to be the official format).

## Names, stats, assets

Checked by reading the source on `d8fa56d`. Not a clearance.

| Asset | Where | What it is | Licence known | Status |
|---|---|---|---|---|
| NBA franchise names, cities, divisions | `teams.ts` | Real clubs | None on file | D-015: keep for the demo. Lawyer before any commercial use. |
| EuroLeague club names | `teams.ts` | Real clubs (Real Madrid, Barcelona, Olympiacos, and the others in that list) | None on file | Same gate. Not replaced. |
| Team colours | `teams.ts` hex values | Close to the public club colours | None on file | Identity risk even without a logo. Do not treat as cleared. |
| Player and CPU names | `ROOKIE_NAMES`, face strings in `teams.ts`, `FIRST`/`LAST` in `world.ts` | Combinations from fixed fictional lists. No roster file, no `fetch` | Original lists | Not a copy of a real roster. Full names checked by eye are not current stars. Given names include Kobe and Luka. A generated full name can still collide with a real person. |
| Stats | `engine.ts`, `peak.ts`, `config.ts` | Formulas on a seed | Original | No external stats dataset. |
| Marks | inline SVG in `TeamMark.tsx` and `index.html` | Original ring, arcs, abbreviation | Original | Not a league or club logo. |
| Font | `font-family: Figtree, …, system-ui` | Name only. No `@font-face`, no font file in the app | Not shipped | The browser uses the next available face. |
| Photos, uniforms, third-party images | none in `apps/pivot23` source | — | — | None found outside `node_modules`. |

The proposed disclaimer in `LEGAL-DISCLAIMER-PROPOSAL.md` is not in the UI. A disclaimer would not clear the names.

## Engine evidence already on file

Do not re-run these to "refresh" the date. Same engine bytes.

| Question | Evidence | Result |
|---|---|---|
| Bust, potential ≥ 85, peak at least 8 under | 1,500 Pro careers, seeds 200000–201499, 4 Oct, engine 2.12.0-beta, recorded in FACTS | 190 high-potential, 0 misses of 8. Median peak is 2.9 above potential. `bustRate` hits CPU stars only. |
| Titles | Same 1,500 careers | Seed history makes Boston 15.9%. Simulated titles: OKC 7.7%, CLE 6.4%, BOS 6.1%. Rank still follows the static power (Spearman 0.95) while end-of-career power has moved. |
| Roles | 200 seeds × 5 roles, 500000+ | Box score separates. Peak overall does not (78.1). That is `rolePeak = current`. |
| Age 36 still reachable | CI statistical job on `287850b`, same engine | The P0-LIFE test is in that job and the job passed. Not re-run here. |

No new bust rate is proposed. No `world=regress`.

## Gates

| # | Gate | State | Evidence |
|---|---|---|---|
| 1 | Boot and main loop, no reproducible black screen | NOT RUN this pass | Older public checks exist. Not repeated on `d8fa56d`. |
| 2 | Career playable into the late years | PASS by the statistical suite | P0-LIFE job on the same engine. Not a manual playthrough of this tip. |
| 3 | Save, reload, resume | PASS on `b806f94` CI | Production-build e2e job of PR #39. The merge run was still open. |
| 4 | Corrupt or failed persistence handled | PASS in unit tests of that same CI | `save.test.ts` / `persistence.test.ts` are in the unit job. Not re-listed case by case here. |
| 5 | No open P0, and no P1 that breaks the loop | PASS for crashes | No P0 reproduced. P1-BUST and P1-WORLD do not stop play. They fail the written task, not the boot. |
| 6 | Engine matches an agreed realism bar | FAIL | The bust task asks for a measured share of 8-point misses. The share is 0. No agreed replacement bar. |
| 7 | Automatic regression | PASS | [Run 37203654421](https://github.com/niccolopello-source/Jarvis-hq/actions/runs/37203654421) on `d8fa56d`, 2026-10-04 12:57 UTC. Both jobs success. Same result on PR #39 head `b806f94`. |
| 8 | Real phone and desktop smoke | NOT RUN | No device in this environment. |
| 9 | Performance against the master-prompt targets | NOT RUN | No TTI, long-task or bundle measurement on this tip. |
| 10 | Privacy and assets | BLOCKED for sale | Privacy inventory matches a local-only guest build. Franchise names are not cleared. |
| 11 | Candidate build equals what would ship | NOT RUN | Production was not re-read after `d8fa56d`. |
| 12 | Explicit approval to merge and deploy | BLOCKED | Not granted by this addendum. |

## Closed beta (5–10 people)

Not a statistics sample. Start only after the owner accepts the two engine risks in writing.

One row per report:

| ID | Device / browser | Steps | Expected | Actual | Shot | Severity | Area | Owner | State |
|---|---|---|---|---|---|---|---|---|---|
| B-001 | | | | | | P0–P3 | | | open |

Keep a second list, not mixed into bugs: decision the tester did not understand; something that felt unrealistic; a repeated sentence; where they got stuck in the first season; whether they would start a second career.

A single opinion is not a distribution. A save loss, a crash, or a result that contradicts the box score is always a bug.

## What is not being built

No accounts, no cloud, no ads, no price, no new competition, no rename of the clubs, no bust-rate change, no visual redesign.

## Flag experiment, 4 October, not shipped

400 Pro careers, seeds `200000`–`200399`, same seeds on every row. Engine `2.12.0-beta` as on `d8fa56d`. Flags were set only inside the offline script. `TUNING` defaults were not changed.

| Setting | High pot | Peak ≤ pot−8 | Peak under pot | Median gap | Mean peak | Ended 36 | Player titles | MVP mean | Top titles (no seed history) | Gini | Spearman |
|---|---|---|---|---|---|---|---|---|---|---|---|
| shipped | 44 | 0 | 0 | +3.3 | 78.53 | 232 | 0.41 | 0.025 | OKC 7.6, CLE 6.6, BOS 6.0 | 0.254 | 0.95 |
| bust=choices | 44 | 0 | 0 | +3.7 | 78.98 | 232 | 0.48 | 0.028 | OKC 7.9, CLE 6.3, BOS 6.0 | 0.253 | 0.93 |
| bust=events | 44 | 0 | 4 | +3.3 | 78.34 | 230 | 0.40 | 0.028 | OKC 7.7, CLE 6.8, BOS 5.8 | 0.259 | 0.93 |
| world=jitter | 44 | 0 | 2 | +3.1 | 78.61 | 251 | 0.50 | 0.028 | OKC 7.1, CLE 6.3, BOS 6.3 | 0.263 | 0.96 |
| world=regress | 44 | 0 | 1 | +3.1 | 78.61 | 229 | 0.48 | 0.048 | OKC 7.5, CLE 5.7, NYK 5.6 | 0.215 | 0.88 |

`bust=choices` and `bust=events` do not create an 8-point miss. Choices raises the peak slightly. Events reaches −1.7 at the worst in this sample. A real miss of 8 needs a different formula, which is not approved.

`world=jitter` does not loosen the ranking and it moves how many careers reach 36 (232 → 251). Not recommended.

`world=regress` is the only switch that spreads titles (Gini 0.254 → 0.215, Boston leaves the top three) while age and peak stay close. It also doubles the MVP mean (0.025 → 0.048). Left off.

## What would move the 18 October call

1. Done: run 37203654421 is green on `d8fa56d`.
2. The owner writes that a zero 8-point bust rate and title ranks that follow the power constant are acceptable for this demo, or chooses a design. Silence is not acceptance. The flag experiment above is the evidence. Neither bust flag is that design.
3. One phone (Safari, Chrome) and one desktop browser, played from boot through a save reload. Record the row.
4. A lawyer, or an explicit "demo only, not commercial" from the owner, against D-015. The second does not clear a later sale.
