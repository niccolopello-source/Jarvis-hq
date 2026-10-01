# Tasks

Do not start these by changing constants until the test named here fails on `main`.

The owner decision D-001 stands: a player who continues must be able to reach 36. «Every career ends at 36» is the defect. «Nobody can reach 36» would be a new defect.

| ID | Status | Owner | Support | Objective | Acceptance | Do not |
|---|---|---|---|---|---|---|
| P0-LIFE | evidence on `89249ef` | John | James | A career can end before 36 when minutes collapse or a serious injury lands. The offer to continue to 36 remains available when the career is still alive. | The test `1,000 Pro careers meet the P0-LIFE age distribution without changing the peak window` is on `89249ef`. It requires at least 150 of 1,000 Pro careers to end before 34, at least one to end at 36, and every peak inside 26–28. Re-run it on any new commit before calling the task closed again. | Delete `MAX_AGE` or make 36 unreachable. |
| P0-REPEAT | closed | John | James | An MVP or a title already won reduces the chance of the next one. | Met on `main` `8bd1464`. Evidence is below. The test failed on the code from before the change. | Special-case one difficulty with a hard clamp that the others do not use. |
| P1-BUST | open | James | John | High potential can miss. | Among Pro careers on `main` with potential at least 85, a measured share peaks at least 8 points under that potential. Record the share. Do not pick the share first and tune to it. | Force a bust rate copied from a chat. |
| P1-WORLD | open | John | James | Title concentration comes from team state that can change, not from a power number that never moves. | Across 1,000 independent worlds from `main`, no franchise keeps about 15% of titles merely because its power constant says so. | Subtract points from Boston in `teams.ts` and call it done. |
| P1-ROLE | open | James | Rebecca | Show whether role weights change the box score. | Same seeds, table of PPG, RPG and APG by role. If they separate, write that equal peak overall is intended. If they do not, the weights are dead. | Change peak overall by role inside this task. |

## P0-REPEAT evidence

Closed only after the fix was on `main` and the same test was run there.

- Fix commit `d8c589ab`. Merge of pull request #3: `e19516b`. Tree verified: `main` `8bd1464` (that tip also contains the docs merge of pull request #4; it does not change the engine).
- Blobs: `league.ts` `121a063`, `engine.ts` `bb5faf6`, `engine.test.ts` `5c9f1fc`.
- Before the change, the committed test failed with `max MVP 12` (2,000 Esordio careers).
- On `8bd1464`, 2026-09-28, `node --import=tsx --test src/lib/pivot/engine.test.ts` in `apps/pivot23`: 14 pass, 0 fail. The Esordio test passed in about 138 seconds.
- Same seeds, counted again on that tree: max MVP 2, at least 6 titles 18/2000 (0.009), MVP mean 0.135, at least one MVP 223/2000, age 36 is 2000/2000. Histogram: 0 → 1777, 1 → 176, 2 → 47.
- CI on `d8c589ab`: [run 36441494112](https://github.com/niccolopello-source/Jarvis-hq/actions/runs/36441494112), success. Lint, typecheck, unit, build and e2e.

Balance, recorded and not retuned: 1777 of 2000 Esordio careers win zero MVP. `INVARIANTS.md` and this table do not set a minimum MVP share. P-002 is still proposed and does not set that floor. Do not change the constants to raise the rate unless the owner asks.

P0-LIFE stays a watched invariant. The distribution test passed again on 2026-10-01 in the phase-b run of `engine.test.ts` (36 tests, 0 fail), which includes that 1,000-career case. That run was on the phase-b branch before its commit, starting from `89249ef`. Do not retune retirement from this note.

## P0-LIFE candidate evidence — `codex/demo-hardening`

This is an unmerged candidate, not closure evidence. The accepted thresholds in P0-LIFE were implemented without changing the gameplay constants. `ageEnd` in a Career Card/summary now means the age on the last recorded season row; after offseason, `PlayerState.age` may instead be the age for the next season. Legacy archive cards with a valid local fingerprint are normalized to the last recorded season age and receive a matching fingerprint.

- Fixed sample: 1,000 Pro careers using seeds `(i + 1) * 1000 + 17`, cycling PG/SG/SF/PF/C and NCAA/Europa/G-League, random draft. Recorded age histogram: 32 → 336, 34 → 50, 35 → 19, 36 → 595. 336/1,000 (33.6%) ended before age 34; 595 recorded an age-36 season. All 1,000 assigned peak ages were 26–28.
- End signals in that sample: 404 serious-injury signals, 1 minutes-collapse signal, 595 completed age-36 seasons; no career had both signals. Early endings were 404 injury and 1 minutes.
- Representative fixed-seed sample: 30 Pro careers, seeds 82000 through 110913 in steps of 997. Ages, reason and serious-injury flags were emitted during the implementation pass; results included both early exits and complete age-36 seasons.
- `pnpm --dir apps/pivot23 test`: 30 passed, 0 failed on the candidate after the `ageEnd` correction.
- Local E2E was attempted with a fresh configured server but could not launch because Playwright's Chromium headless executable is not installed. `.github/workflows/pivot23.yml` installs Chromium on Ubuntu and runs E2E; CI evidence is still required after PR publication.
- Performance sample (seeded simulator, after GC): 1 career 144 ms / +1.50 MB heap; 10 careers 1,076 ms / +1.08 MB; 100 careers 9,227 ms / +1.42 MB; 1,000 careers 87,241 ms / +1.51 MB. Zero simulation errors. These synchronous batch timings do not measure browser UI responsiveness.

## Already done, not these tasks

Codex, on the branch merged in PR #1, hardened save quota behaviour, EuroLeague series shape, a real playoff seed, an error boundary, lint, and a first-season browser smoke. That work is on `main`. It does not close the table above.

## Where not to implement

Implement on a branch from `main` (`421a4a0` or later). Do not implement on the sandbox history `160b109`. That tree is not this repository.
