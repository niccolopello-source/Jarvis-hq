# PR Triage — Phase Zero

Analyzed commit: `800a2402af81f747b15f92a371f14f441875c31e` (main). Date 2026-10-24. CI = GitHub check rollup on PR head.

| PR | Head | Scope (files) | Mergeable vs main | CI | Overlap | Decision | Owner |
|---|---|---|---|---|---|---|---|
| #123 Career Card teamColor crash | dallak/s2-card-colors 53d946f | legacy-report.ts (+test), e2e/career-card.spec | clean | 8/8 green | #127 also edits legacy-report.ts | KEEP → review, merge first (crash fix) | Dallak |
| #127 Peak OVR v3 | dallak/peak-ovr-display-v3 14245ba | PivotApp.tsx, legacy-report.ts, peak-display.ts(+test), package.json | clean | 8/8 green | #123 (legacy-report.ts); replaces #124/#113 | KEEP → rebase after #123 | Dallak |
| #124 Peak OVR v2 | da8e9b3 | same as #127 | CONFLICTING | green (stale) | superseded by #127 | CLOSE (owner ok needed) | Dallak |
| #113 Peak OVR v1 | 2abef53 | same as #127 | CONFLICTING | green (stale) | superseded by #127 | CLOSE (owner ok needed) | Dallak |
| #119 redirects vercel.app + pgoc | grokbot/vercel-app-redirect ca25e19 | vercel.json, security-headers.test.ts | clean | 8/8 green | contains #126 | KEEP → merge (awaiting Pello ok) | Jarvis |
| #126 pgoc redirect | dallak/pgoc-redirect 2a93d95 | vercel.json, security-headers.test.ts | clean (conflicts with #119 once either merges) | 8/8 green | duplicate of #119 entry | CLOSE after #119 merges | Dallak |
| #122 reduced-motion WebKit | dallak/recovery-sprint1 5993242 | e2e/a11y-i18n.spec only | clean | 8/8 green | none | KEEP → merge (test-only) | Dallak |
| #125 viewport/a11y | dallak/s3-a11y d8dfe15 | e2e/s3-viewports.spec only | clean | 8/8 green | none | KEEP → merge (test-only); full e2e on head NOT RUN by Jarvis | Dallak |
| #114 procedural depth 1–3 (old) | feat/pivot23-procedural-depth-1-3 d39b767 | engine/memory/save/types… | CONFLICTING | stale | superseded by #115 (merged) | CLOSE — **still OPEN**: Pello approved but close form was not submitted | Jarvis |
| #102 legal owner details | lucille/legal-owner-details a1ab2dc | docs/pivot23/legal/*, ADS-GOLIVE-CHECKLIST | clean | 4/4 green | IT text diverges from EN; privacy claims Vercel Pro + DPA (false on Hobby) | UPDATE (revert to Hobby wording) or hold until Pro | Lucille / owner |

Merged since last triage (VERIFIED): #115 (with #116, #121), #117, #118, #120.

Suggested merge order: #122 → #125 → #123 → #127 (rebased) → #119; then close #126, #124, #113, #114.
