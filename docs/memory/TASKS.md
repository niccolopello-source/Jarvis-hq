# Tasks

Do not start these by changing constants until the test named here fails on `main`.

The owner decision D-001 stands: a player who continues must be able to reach 36. «Every career ends at 36» is the defect. «Nobody can reach 36» would be a new defect.

| ID | Status | Owner | Support | Objective | Acceptance | Do not |
|---|---|---|---|---|---|---|
| P0-LIFE | open | John | James | A career can end before 36 when minutes collapse or a serious injury lands. The offer to continue to 36 remains available when the career is still alive. | On 1,000 Pro careers from `main`, retirement age is not a single value, at least 15% end before 34, and at least some careers still end at 36. Peak ages stay inside 26–28 in this task. | Delete `MAX_AGE` or make 36 unreachable. |
| P0-REPEAT | open | John | James | An MVP or a title already won reduces the chance of the next one. | On 2,000 Esordio careers from `main`, the maximum MVP count is at most 6, and the share with at least 6 titles is under 2%. The test must fail on the code from before the change. | Special-case one difficulty with a hard clamp that the others do not use. |
| P1-BUST | open | James | John | High potential can miss. | Among Pro careers on `main` with potential at least 85, a measured share peaks at least 8 points under that potential. Record the share. Do not pick the share first and tune to it. | Force a bust rate copied from a chat. |
| P1-WORLD | open | John | James | Title concentration comes from team state that can change, not from a power number that never moves. | Across 1,000 independent worlds from `main`, no franchise keeps about 15% of titles merely because its power constant says so. | Subtract points from Boston in `teams.ts` and call it done. |
| P1-ROLE | open | James | Rebecca | Show whether role weights change the box score. | Same seeds, table of PPG, RPG and APG by role. If they separate, write that equal peak overall is intended. If they do not, the weights are dead. | Change peak overall by role inside this task. |

## Already done, not these tasks

Codex, on the branch merged in PR #1, hardened save quota behaviour, EuroLeague series shape, a real playoff seed, an error boundary, lint, and a first-season browser smoke. That work is on `main`. It does not close the table above.

## Where not to implement

Implement on a branch from `main` (`421a4a0` or later). Do not implement on the sandbox history `160b109`. That tree is not this repository.
