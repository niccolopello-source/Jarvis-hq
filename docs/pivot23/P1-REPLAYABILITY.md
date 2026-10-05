# P1 — Replayability architecture

Baseline measured: `e483b09` (certified core `4e94e1c`, plus the phase-1 visual tokens from PR #54).

This phase does not change the simulation, the RNG, saves, the archive, playoffs, or retirement. It measures whether two careers are the same career.

## A. Current state

| System | State | Notes |
|---|---|---|
| Seeded RNG | Exists | `createRng`. No `Math.random()` under `src/lib/pivot`. |
| New-career entropy | Exists | `newSeed()` uses crypto, then the career is seeded. In-career rolls do not use it again. |
| Same-seed replay | Exists | Covered by `determinism`, `rng-determinism`, `sim-parity`. |
| Save/resume RNG | Exists | `rngState` is stored. Not changed here. |
| Event selection | Exists | `pickStoryEvent`: used-id filter, quiet years, phase pool, `eventWeight`. Not the bible's full multiplier stack, but it is contextual. |
| Repetition guard | Exists | Pool ids are stored in `usedEventIds` and skipped. The window keeps the last 48. |
| Draft / role / path | Exists | Random role, path, and nationality when a sim does not pin them. |
| Difficulty | Exists | `esordio` / `pro` / `allstar` / `leggenda` already change growth, injury, awards, minutes. |
| Injuries | Partial | `injuryRisk` and `injuryDrag`. Not a typed injury record. |
| Awards, playoffs, trades, FA | Exists | Certified. |
| National team | Partial | `international` and `medal` flags. |
| Career card fingerprint | Exists | SHA-256 of the archive card. That is integrity, not diversity. |
| Legacy | Partial | `hofTier`: hall / borderline / out. Not Career DNA. |
| World, rivalries, sponsors, callbacks | Partial or absent | Rival name and coach name exist. Sponsors and a memory ledger do not. |

## B. Gap

What this phase does not build, on purpose:

- coaches, sponsors, media, and rivalries as systems that change the career
- a typed injury record
- difficulty retune
- award-race retune
- Career DNA and the Career Card visual
- any change to draft odds, trade frequency, or playoff series length

## C. Priority map

1. Replayability — this phase, as measurement and identity.
2. Simulation and balance — next. The narrow dimensions below are its input, not a randomness knob.
3. Basketball authenticity — role lines are real but compressed (a Pro center averages about 6 points and 5 rebounds).
4. Narrative memory — events are contextual; there is no importance-ranked memory ledger.
5. Career DNA and the card — `hofTier` and the archive card exist. The dynamic fifth dimension does not.

## D. What was implemented

`src/lib/pivot/replayability.ts`

- `careerShape` — structural bins, not the box score
- `identityKey` — the seed is not part of the key. A collision is a duplicate career.
- `careerSimilarity` — 0 to 1, from bins
- `analyzeReplayability` — 100-career report
- `careerTelemetry` — the development metric list. Not wired to any analytics service.

The narrow dimensions are named in the sample below, not in player-facing copy.

The module is imported only by tests. The client bundle does not load it.

## E. Tests

- Fast: same seed, different seed, trade decision, retirement 35 vs 36, pool-event uniqueness, no `Math.random()`.
- Stats (`pnpm test:stats`): 100 Pro careers, seeds `(i+1)*9973+11`.

## Sample, 100 Pro careers

| Metric | Result |
|---|---|
| Unique identities | 100 / 100 |
| Identical pairs | 0 |
| Mean similarity | 0.510 |
| Pairs at similarity ≥ 0.82 | 0.6% |
| Roles | PG 19, SG 15, SF 19, PF 26, C 21 |
| Paths | NCAA 43, G-League 32, Europa 25 |
| Peak bins | role 58, starter 26, star 5, superstar 7, legend 4 |
| Hall of Fame tier | hall 5, borderline 7, out 88 |
| Titles | 0 titles 94, one title 4, two or three 2 |
| Stat shape | scorer 36, balanced 27, rebounder 26, creator 10, defender 1 |
| National team | none 75, called 14, medal 11 |
| Ending age | 32: 39, 33: 1, 34: 9, 35: 5, 36: 46 |

Apex age stays inside 26–28. That is the certified peak window, not a cluster to break.

## Narrow dimensions, and the system that causes each

| Dimension | Share of the top bin | System |
|---|---|---|
| Draft bin | 98% second round (picks 31–60) | Certified draft landing. Picks still vary inside that round (the identity uses the exact pick). |
| League | 96% NBA | Landing path. EuroLega happens, rarely. |
| Team changes | 99% three or more teams | Free agency and trades. A long stay with one club is the rare branch. |
| Titles | 94% none | Pro championship rarity. Do not add random titles. |

Final `injuryDrag` never reached the serious bin in this sample. Comebacks are not yet a measured career type. Game 7 showed up in about half of the memory flags. Both are recorded for later phases. Neither was retuned here.

## Not changed

RNG, save format, archive, playoff engine, retirement rule, development, event weights, narrative text.
