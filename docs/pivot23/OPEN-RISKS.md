# Open Risks & Ordered Problem List — Phase Zero

Analyzed commit: `800a2402af81f747b15f92a371f14f441875c31e`. Date 2026-10-24. Roles: Jarvis (tech lead/engine), John (dev), Al (QA), Rebecca (UX/i18n), James (ops/analytics); Dallak (recovery agent: save*, storage, legacy-report.ts, Career Card/archive UI, career-card.spec, s3-viewports.spec, save-recovery tests). Jarvis keeps memory.ts/engine/tuning/i18n/narrative/vercel.json/CSP.

| # | Pri | Problem | Evidence | Cause | Demo impact | Fix | Deps | Acceptance test | Owner |
|---|---|---|---|---|---|---|---|---|---|
| R1 | P0 (owner) | Ads cannot go live | Hobby plan; prod CSP script-src 'self' | VERIFIED | none for demo (ads off) | Pro upgrade + CSP change | owner decision, cost | ads e2e + CSP header check on prod | Owner / James |
| R2 | P1 | Career Card crashes on damaged teamColor (e.replace) | #123 repro test | VERIFIED by Dallak's test (CI green); not re-run by Jarvis | Card/archive blank on corrupted saves | merge #123 | review | career-card.spec + legacy-report.test | Dallak |
| R3 | P1 | Italian narrative uses "mestiere" phrases that are unclear; engine selects events by reading Italian text | earlier report (canvas) | VERIFIED (earlier report) | confusing copy; translation changes can alter logic | decouple selection from IT strings (stable keys) then rewrite 14 lines | none | determinism goldens unchanged + i18n tests | Jarvis / Rebecca |
| R4 | P1 | #102 privacy claims Vercel Pro + DPA | PR diff | VERIFIED | legal inaccuracy if published | revert to Hobby wording or wait for Pro | R1 | doc review | Lucille / owner |
| R5 | P2 | Duplicate public hosts pivot23.vercel.app & jarvis-hq-pgoc.vercel.app (200) | curl | VERIFIED | SEO dup, AdSense 2nd origin | merge #119; optionally disconnect jarvis-hq/jarvis-hq-pgoc projects | owner ok (#119); Vercel settings ok | curl 308 → www after deploy | Jarvis |
| R6 | P2 | Displayed Peak OVR ≠ best season OVR | #127 | VERIFIED by Dallak (unit) | stats look inconsistent | merge #127 after #123, close #124/#113 | R2 | peak-display.test + full e2e | Dallak |
| R7 | P2 | Only page `/` tracked; no persistent analytics independent of Vercel | code | VERIFIED | no funnel data | design event spec (ANALYTICS-EVENT-SPEC.md exists) → provider choice | owner (privacy/cost) | — | James |
| R8 | P2 | No real-device QA (iOS Safari is majority of mobile traffic) | none available | BLOCKED | Safari regressions unseen | owner/tester manual pass per DEVICE-MANUAL-QA.md | device access | checklist signed | Al / owner |
| R9 | P3 | e2e mutates tracked fixture e2e/fixtures/path-saves.json | git diff after run | VERIFIED | dirty tree, possible flake | write to temp dir instead | none | clean `git status` after e2e | Al |
| R10 | P3 | Local e2e flaky under heavy load (2/25 Chromium dev) | earlier report | HYPOTHESIS (load) | low; preview run 131/131 now | keep monitoring; CI uses preview | none | 3 consecutive green preview runs | Al |
| R11 | P3 | Stale branches (75 remote) and #114 still open | gh | VERIFIED | noise | close #114 (approved), list stale branches for owner | owner ok for deletes | — | Jarvis |
| R12 | P3 | Engine metrics not re-measured on 800a240 this session | — | NOT RUN | none (stats gates pass) | run lab measurement with documented seeds | none | report numbers + seeds | Jarvis |
| R13 | P3 | Production smoke/Lighthouse not run | — | NOT RUN | unknown perf | run perf-probe + Lighthouse vs prod | none | report | Al |
