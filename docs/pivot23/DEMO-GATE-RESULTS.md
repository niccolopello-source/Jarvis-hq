# Demo gate results — Bot C

SHA: `21764f3c6de01c447191f98c3f45a211aad008fc` (main, merge #94). Engine `2.19.0-beta`, save version 11.
Production www.pivot23.com: `index.html` and all 10 JS/CSS assets in `dist/assets` match a local `pnpm build` of this SHA (sha256, 11/11, 2026-10-14 ~08:35 UTC). Etag `3bfc95753562f867d4abd27d7787d80e`, last-modified 08:11:23 GMT. Vercel API not used (403).
Replaces the `ae9f1d0` version of this file.

**Recommendation: CONDITIONALLY READY.** Not READY: G7 (physical devices) is BLOCKED, G12 is open until #92/#95 land.

| Gate | Status | Evidence on this SHA | Blocker / closure | Owner |
|---|---|---|---|---|
| G1 Build | PASS | local build OK; CI run 38512203898 success; byte match with prod | none | Bot C |
| G2 Startup | PASS (lab) | perf probe 3×12 cold loads, 4× CPU, 390×844: ready p50 150–155 ms, p95 206–273 ms | phone proof is G7 | Bot C |
| G3 First career | PASS (lab) | e2e suite 3/3 runs, incl. `g5-smoke`, `paths`, `demo` | none | Bot C |
| G4 Progression | PASS (lab) | e2e 3/3; lab 3×200 pairs, 0 determinism mismatches, 0 integrity failures | none | Bot C |
| G5 Persistence | PASS (simulated) | `save-safety`, `save-recovery`, `lifecycle-flush`, `init-failure` e2e 3/3; unit 308/308 | real full disk NOT RUN | Bot C |
| G6 Sim/UI coherence | PASS (lab) | `career-card`, `archive-integrity`, `career-coherence` tests green | none | Bot C |
| G7 Mobile physical | BLOCKED | no iPhone/Android available to agents. Earlier "funziona" was on older builds | Pello runs the checklist in `QA-EXECUTION-PLAN.md` on this SHA | Pello |
| G8 A11y + locale | PASS (Chromium) | axe WCAG 2.1 A/AA IT+EN, 0 violations at 390×844 (suite, 3/3) and 320×640 (extra run). Reduced motion pass | prod-run axe EN failure in parallel task is INCONCLUSIVE (QA-07) | Bot C / Bot B for copy |
| G9 Performance | PASS vs written thresholds | see QA-EVIDENCE: tap→setup p50 133–143 ms; max long task p95 101–116 ms; story choice 1.54–1.57 s incl. designed hold | lab, not a phone | Bot C |
| G10 Production safety | PASS (scope checked) | CSP e2e in suite 3/3; same-origin assets; byte match | none | Bot C |
| G11 CI | PASS | run 38512203898 on 21764f3c6de01c447191f98c3f45a211aad008fc: lint/types/unit/build/e2e + stats success. Locally: lint 0, unit 308/308, e2e 125 pass / 2 skip ×3 | docs-only PRs skip required CI (path filter) | Bot C |
| G12 Release docs | INCONCLUSIVE | #92 (audit of 39129c9) being merged on Pello's approval; #95 updated to this SHA | closes when #92 and #95 are on main and say which SHA they describe | Pello |
