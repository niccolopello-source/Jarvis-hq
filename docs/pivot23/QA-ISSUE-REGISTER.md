# QA issue register — Bot C (QA view)

SHA `21764f3c6de01c447191f98c3f45a211aad008fc`. The project register is [ISSUE-REGISTER.md](ISSUE-REGISTER.md); this file lists only QA findings and does not duplicate it.

| ID | Severity | Finding | Repro | Evidence | Owner | Status |
|---|---|---|---|---|---|---|
| QA-01 | coverage | Physical phones not tested on this SHA | checklist in QA-EXECUTION-PLAN.md | no devices for agents | Pello | BLOCKED |
| QA-02 | P2 | Docs on main/#92 describe 39129c9 | read #92 docs | #92 head 9f2f885 | Pello (merging) | OPEN until #92/#95 land |
| QA-03 | P3 | 33-char name cut to 32 | type `Massimiliano Della Valle-Giordano` | g5-smoke expects the slice | Pello | OPEN, by design |
| QA-04 | P3 | "Fifteen seasons, or more: 16 years" phrasing | finish a 16-season career | earlier EN run | Bot B (#93) | OPEN, not re-checked here |
| QA-05 | P3 | "23" mark briefly over career on reload | resume mid-career | earlier screenshot | frontend | OPEN |
| QA-06 | note | g5-smoke flake reported earlier | repeat suite | 3/3 pass on 21764f3c6de01c447191f98c3f45a211aad008fc locally | Bot C | NOT REPRODUCED |
| QA-07 | ? | Parallel prod e2e run: axe EN can't find "The last winter", readiness overflow checks fail in desktop-chromium project, WebKit chunk/reduced-motion fails | see /workspace/reports/jarvis-prod-e2e/run.log | same tests pass 3/3 locally on identical bytes; likely project/fixture setup | prod-e2e task | INCONCLUSIVE |
| QA-08 | P2 (branch) | #93 CI fails `demo-readiness:225 year sheet` | CI run 38534610852 | 2/2 attempts | Lucille | OPEN on #93, not main |
