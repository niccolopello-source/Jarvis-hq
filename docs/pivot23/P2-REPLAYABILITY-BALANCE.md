# P2 — Replayability and simulation balance

Base: `f1141fc` (main, after the P1 measurement merge).

Same seeds as P1: `(i + 1) * 9973 + 11`, difficulty Pro, draft policy `random`. N = 1000.

This phase changes causes. It does not chase a target histogram. Peak age stays inside 26–28. That window is a certified regression (`P0-LIFE`), not a knob.

## Baseline (before)

| Measure | Result |
|---|---|
| Unique identities | 1000 / 1000 |
| Identical pairs | 0 |
| Mean similarity | 0.522 |
| High similarity (≥ 0.82) | 0.5% |
| Macro identities | 355 / 1000 |
| Draft | lottery 0, picks 15–30 1.3%, 31–45 51.3%, 46–60 47.4% |
| Draft stock | mean −4.70, p10 −11.2, p90 1.4, max 12.8 |
| League path | NBA only 87.7%, NBA→Euro→NBA 7.5%, ends in Euro 4.3% |
| Team changes | 3 or more 98.9%. Longest stay of 8+ years: 0.8%. None of 12+ |
| Titles | none 94.3%. Role 0.5%, starter 6.6%, star 16%, superstar 39%, legend 32% |
| Game 7 | 22.6% of series, 49.2% of careers. Sweeps 22.9% |
| Injury drag | max 3.50. Serious bin (drag ≥ 4): 0 |
| Apex age | 26 / 27 / 28 only |
| Hall of Fame | out 91.4% |

## Root causes

**Draft.** `playerDraftStock` compared a rookie's weighted skill with 62. A rookie is born at talent 40, and after the draft cards the skill is still about 40. Every prospect paid the same ~20 point tax. The pick map then centered that cloud on pick 45 and clamped the good tail before the lottery. Potential was in the formula. It could not reach the board. Overall does not separate anyone: it starts at 60 for the whole class.

**League.** `revealDraftLanding` always opens in the NBA. A EuroLeague offer existed only at age 30+, and it was the cheap offer. The simulator took the highest salary 64% of the time, so Europe was almost never chosen. There is no G League destination. The G League is an origin path into the draft, not a league you can be sent to. No new league was added.

**Team changes.** Three causes stacked. Optional trades were accepted by the simulator whenever they were offered. A forced trade started at 22% even for a content player. Free agency ranked offers by salary, and the richest offer is a different team (1.12× market) while the extension pays less. Rookie deals for the common second-round pick last two years, so free agency arrives immediately.

**Titles and Game 7.** `playoffWinChance` used `team.power * 0.72` against the opponent's full power. The player term could not fill a hole of about twenty power points, so the user was an underdog on their own contender. The CPU bracket does not take that discount. Role players almost never won (0.5%). Stars did win sometimes (a legend 32% of careers). Game 7 in half of careers was "at least one series went long", not "half of series are Game 7s". Series Game 7 rate was 22.6%. That is not a rubber band by itself. The 0.72 scale was the artificial part.

**Injury.** The worst scripted outcome added 3.5 drag. The serious bin starts at 4. Recovery then subtracts drag. A career-altering injury was unreachable, not rare.

**Peak age.** `rollApexAge` only returns 26, 27, or 28, and `overallSpine` places the observed peak on that year. Widening it would break the certified P0-LIFE test. Not changed.

## What changed

- Draft stock uses the rookie talent baseline (40), not a league-average 62. The pick map is linear in that stock: a potential-72 prospect lands around the turn, a generational stock can reach the lottery, a bust can reach the late second. Scouting noise is the same ±8 picks.
- The simulator no longer takes the richest offer by default. Appeal weighs money, ego, trust, years on the team, a ring chase, and a buried role. Explicit `trade: "accept" | "refuse"` still overrides.
- An optional trade is accepted only when the situation leans that way (trust, role, tier, a title chase). A forced trade no longer starts at 22%. The push is low trust, a buried veteran, ego on a non-contender, or a good player on a rebuild.
- A EuroLeague offer also exists, before age 30, when an NBA role is not there: overall under 64 and trust under 50, or a European origin who is still buried. Stars are not pushed abroad. The league follows the team's conference, so extending in Europe stays in Europe.
- Playoff win chance keeps 80% of team power and adds the player only from overall 74 up, capped. The best-of-seven is untouched.
- A fragile body can come out of the bad injury choices above the serious line. Healing above that line is slower. The event is not more common.
- Choosing to retire at 35 closes the career. It no longer deals another season at the same age.
- `macroIdentity` names a path only when the career's own numbers support it. No label is rolled.

## Before → after (1000 Pro careers)

| Measure | Before | After |
|---|---|---|
| Mean similarity | 0.522 | 0.436 |
| High similarity | 0.5% | 0.1% |
| Macro identities | 355 | 621 |
| Draft lottery / 15–30 / 31–45 / 46–60 | 0 / 1.3% / 51.3% / 47.4% | 1.4% / 36.5% / 53.5% / 8.6% |
| NBA-only path | 87.7% | 68.3% |
| Ends in EuroLeague | 4.3% | 18.8% |
| NBA → Euro → NBA | 7.5% | 13.5% |
| 8+ years with one team | 0.8% | 21.8% |
| 12+ years with one team | 0 | 2.4% |
| Two teams or fewer (changes ≤ 1) | ~1% | 4.3% |
| No title | 94.3% | 80.9% |
| Title rate, role / starter / star / superstar / legend | 0.5 / 6.6 / 16 / 39 / 32% | 8.8 / 21.8 / 45 / 77 / 68% |
| Mean titles | 0.069 | 0.271 |
| Game 7, series / careers | 22.6% / 49.2% | 25.4% / 63.5% |
| Serious injury at the end | 0 | 1.4% (max drag 5.4) |
| Apex 26 / 27 / 28 | 26.5 / 40.1 / 33.4% | unchanged |

A title is still the uncommon career. It is no longer almost impossible for a starter, and a superstar wins more often than a role player. They do not all win.

## Archetypes (emergent, 1000)

Unlabeled 57.2% is intentional. A label is withheld without evidence.

| Archetype | Share |
|---|---|
| Journeyman | 28.8% |
| Ring chaser | 7.4% |
| Franchise icon | 1.8% |
| G League elevator (origin, not a G League year) | 1.1% |
| Injury comeback | 1.0% |
| Loyal star | 0.9% |
| Draft steal | 0.8% |
| International return | 0.5% |
| Defensive specialist | 0.3% |
| Almost great | 0.2% |

One-team careers exist (3 / 1000) but none of them also won a title, so "one-team legend" was not assigned.

## Regression

- Fast suite: 182 tests. Determinism, save, archive, best-of-seven, retirement fork, and the no-`Math.random` scan stay green.
- `test:stats`: P0-LIFE 1000, Esordio 2000, and the 100-career replayability sample.
- Typecheck and lint on the touched files.
- Lab fingerprints for seeds 23017, 23034, and 23102 were regenerated. They lock the no-experiment path. The path changed on purpose.

## Performance

No bundle change intended. `replayability.ts` stays test-only. No worker, no chart swap, no UI edit.

## Not changed

Peak band. Development curve. Best-of-seven. Save schema. Archive. RNG algorithm. Award thresholds. A G League league. Roy rate (still 0 in this sample: the award gate was not opened). Hall of Fame rate (still about 91% out). The played career still chooses trades and offers by hand. The simulator's explicit accept and refuse policies still do what they say.

## Risks

- The lottery is reachable and no longer empty, but it is 1.4% of protagonists. Most of the class is still a second-round talent, because potential averages 74. Steepening the map further would empty the late second. Left as the consequence of the stock, not tuned to a quota.
- Superstars win a title in about three quarters of careers. That is the upper edge of this correction. Another pass that pushes it higher should be rejected.
- "Called up" in the fingerprint rises when a player joins Europe, because that flag was already set by a Euro offer. It is not a pure national-team count.
- Game 7s are slightly more common per career because more series are played, not because a series was pulled toward 3–3.
- Retiring at 35 used to deal extra seasons at the same age. Those phantom seasons are gone. Any tool that counted them will see a shorter retired career. The default simulator still plays the age-36 year.

## Recommendation

Do not merge until the 1000-career table above is accepted. Do not start a peak-age rewrite from this branch. If a later pass touches titles, measure role players and superstars separately and revert if role players move into the teens.
