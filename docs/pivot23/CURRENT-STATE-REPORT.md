# PIVOT-23 — Current State Report (Phase Zero)

Analyzed commit: `800a2402af81f747b15f92a371f14f441875c31e` (main, 2026-10-23 10:42 CEST, "Merge pull request #115…"). Audit date: 2026-10-24. Author: Jarvis (Grok Bot). Docs-only; no product change.

Evidence classes: VERIFIED, HYPOTHESIS, NOT RUN, BLOCKED, PASS, FAIL, NOT APPLICABLE. "Run now" = executed on 2026-10-24 in worktree `/workspace/phase0` on the SHA above.

## 1. Baseline
| Item | Value | Class |
|---|---|---|
| main SHA | `800a240` = historical baseline (no newer commits) | VERIFIED |
| App dir | `apps/pivot23` (Vite 8 + React 19 + TS 5.7, Tailwind 4) | VERIFIED |
| Engine | `ENGINE_VERSION = "2.22.0-beta"` (src/lib/pivot/config.ts) | VERIFIED |
| Package manager | pnpm, `pnpm-lock.yaml`, install --frozen-lockfile OK; Node 20.19.2; Playwright 1.63.0 | VERIFIED |
| Scripts | dev, build, preview, lint, typecheck, test (45 unit files), test:stats (6), test:all, test:e2e, test:e2e:preview, check:headers, lab | VERIFIED |
| Remote branches | 75 (34 grokbot/*, 7 dallak/*) | VERIFIED |
| CI on main | last runs on 800a240 "PIVOT 23 beta" = success | VERIFIED |
| Vercel prod | `dpl_6S1VZgG845g7YhBqoDWfTRgsNNsj` READY, githubCommitSha = 800a240, project pivot23, team jarvis-hq-vercel | VERIFIED |

## 2. Domains (curl, 2026-10-24)
| URL | Result | Class |
|---|---|---|
| https://www.pivot23.com | 200 (canonical) | VERIFIED |
| https://pivot23.com | 308 → www | VERIFIED |
| https://pivot23.vercel.app | 200 (duplicate; fix in #119, unmerged) | VERIFIED |
| https://jarvis-hq-pgoc.vercel.app | 200 (public 2nd copy; fix in #119/#126, unmerged) | VERIFIED |

## 3. Tests run now on 800a240
| Suite | Result | Class |
|---|---|---|
| lint | exit 0 | PASS |
| typecheck | exit 0 | PASS |
| unit (`pnpm test`) | 387/387 | PASS |
| stats (`pnpm test:stats`) | 24/24 (≈237 s) | PASS |
| build | exit 0 (largest chunk catalog-en 410.6 kB / 137 kB gz) | PASS |
| e2e Chromium, production preview | 131 passed, 4 skipped, 0 failed, 0 flaky (5.6 min) | PASS |
| e2e WebKit, production preview | 131 passed, 4 skipped, 0 failed (6.1 min) | PASS |
| Real devices (iPhone/Android) | none available; emulation only | NOT RUN |
| Engine metrics re-measure (peak median/age, early retirements) | not re-run; stats gates (incl. retire bars) pass. Last measured numbers (earlier reports, 2.22): random 12/304/320/326 per 1000, always-prudent 0/46/115/135 (Esordio/Pro/All-Star/Leggenda) | NOT RUN (earlier report) |
| Production smoke / Lighthouse | not run | NOT RUN |

Environment notes: Playwright browser cache was missing and WebKit host libs absent; installed (local box only) before the runs. One e2e run rewrote `e2e/fixtures/path-saves.json` (1 line) — tests mutate a tracked fixture (restored, see OPEN-RISKS R9).

## 4. Analytics / admin / monetization
| Area | State | Class |
|---|---|---|
| Ads | code present (src/ads), gated by `VITE_ADS_ENABLED`, off in prod; prod CSP `script-src 'self'` blocks Google scripts | VERIFIED |
| Vercel plan | Hobby (no commercial use) — ads blocked by P0 owner decision | VERIFIED (earlier session) |
| Analytics | only Vercel Web Analytics (`@vercel/analytics` 2.0.1, cookieless page views, only `/`); no persistent/independent analytics | VERIFIED |
| Admin panel | none in repo | VERIFIED |
| Meta Pixel / accounts / NFT | none | VERIFIED |

## 5. main vs PRs vs preview
Production = main = 800a240. All open PRs are drafts (except #102) and unmerged; nothing in them is live. See PR-TRIAGE.md.
