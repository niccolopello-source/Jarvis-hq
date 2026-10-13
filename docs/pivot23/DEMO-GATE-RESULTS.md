# Demo gate results

SHA: `ae9f1d0228cad53a2e9d0b2a5112d3d131055f98`
Production: https://www.pivot23.com/ matches a local build of that SHA (HTML and the five boot assets, sha256, checked in the prior audit and reconfirmed by etag `6eee7648efc9264ded0536fe9b1d7c39` before this write).
Recommendation: **CONDITIONALLY READY**. Not READY: G7 is BLOCKED and G12 is FAIL.

| Gate | Status | Evidence on this SHA | Blocker | Owner |
|---|---|---|---|---|
| G1 Build | PASS | `pnpm run build` in the prior audit; byte match with production. CI run 38454905618 also built | none | Bot C |
| G2 Startup | PASS | Inizia/Start visible, no lasting blank screen, headless Chromium | none for desktop lab | Bot C |
| G3 First career | PASS | IT smoke and EN career both reach the loop | none | Bot C |
| G4 Progression | PASS on one branch each language | First choice each time, NCAA, through age 36. Not every card type forced | none found | Bot C |
| G5 Persistence | PASS for the cases run | Reload resume; corrupt JSON; unit 16/16 including SR-01..03; e2e SR-02 and SR-C7 on production. Real full disk NOT RUN | none found in simulation | Bot A wrote it; Bot C retested |
| G6 Sim/UI | PASS on the two finished careers | Card, report and archive agree (name, years, seasons). Awards not re-added by hand | none found | Bot C |
| G7 Mobile | BLOCKED | No iPhone, no Android. Emulated viewports are not this gate | Pello runs the checklist | Pello |
| G8 A11y and locale | PASS in Chromium only | axe IT and EN, 0 violations, production. Reduced motion 0. EN career completed | physical not included | Bot C ran; Bot B owns #93/#94 |
| G9 Performance | PASS against the written thresholds | Boot gzip 271 kB ≤ 350. Season p50 1.7 ms ≤ 1.2 s. Lab, 4× CPU, not a phone. No long-task budget exists in the checklist, so none was invented | none vs the written lines | Bot C |
| G10 Production safety | PASS on the scope checked | Same-origin scripts, CSP header, no CSP events on the retire path, no live secrets pattern in source. No account/cloud/NFT | none | Bot C |
| G11 CI | PASS | Run 38454905618: 306 unit, 125 e2e (2 perf skips), 12 stats, 0 fail. Local gaps in `QA-EVIDENCE.md` also passed | none | Bot C |
| G12 Release docs | FAIL | `ISSUE-REGISTER.md` is not this SHA. #92 would record `39129c9` | rewrite or drop #92; do not merge it as-is | Pello |

G9 detail worth not misreading: the story-choice wall clock was 1691 ms under 4× CPU. That wait includes the designed hold before the next card. Node season simulation on this SHA is 1.7 ms median. The probe's `jsTransfer: 1200` is a cached `transferSize`, not the bundle.
