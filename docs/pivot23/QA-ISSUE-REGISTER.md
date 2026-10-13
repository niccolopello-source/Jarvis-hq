# QA issue register — Bot C

Candidate: `ae9f1d0228cad53a2e9d0b2a5112d3d131055f98`.
This is not `ISSUE-REGISTER.md`. That file is on PR #92 and still describes an older engine. It was not edited.

| ID | Severity | User impact | Reproduction | Evidence | Owner | Regression | Status |
|---|---|---|---|---|---|---|---|
| QA-01 | coverage | A phone can still fail a path that Chromium passed | Open www.pivot23.com on a real iPhone and a real Android. Follow the checklist in `QA-EXECUTION-PLAN.md` | No device in this environment | Pello | manual | BLOCKED |
| QA-02 | P2 | Someone reading the repo thinks the live site is `39129c9` | Open `ISSUE-REGISTER.md` and PR #92 | #92 head `9f2f885`, base text says production is `39129c9`. Production etag is the `ae9f1d0` build | Pello | do not merge #92 unchanged | OPEN |
| QA-03 | P3 | A 33-character name loses the last letter everywhere | Type `Massimiliano Della Valle-Giordano` | Card, report and archive show `…Giordan` (32-char cap). Same in IT and EN runs | Pello (known cap) | `g5-smoke` already expects the slice | OPEN, by design |
| QA-04 | P3 | The closing line says "fifteen seasons, or more" and then the real number | Finish any 16-season career | EN run: "Fifteen seasons, or more: 16 years in the box scores." IT run the same shape | Bot B | do not edit `i18n` / narrative while #93 and #94 are open | OPEN |
| QA-05 | P3 | On reload the "23" mark sits over the career for a moment | Resume mid-career | Screenshot `06-resumed` in the prior audit. The run continued | frontend | none added | OPEN, not a dead end |
| QA-06 | note | `g5-smoke` was reported flaky on #93 | Repeat on production | 3/3 passed tonight (1 earlier + 2 repeats). Not a fix and not a proof it never flakes | Bot C | existing `e2e/g5-smoke.spec.ts`, not modified | NOT REPRODUCED |

No P0. No reproduced P1. No engine, award, OVR or save-format defect found in the runs below.
