# PIVOT-23 Demo Readiness Report

> **Correction, 2026-09-28.** PR #1 was merged to `main` as `421a4a0`. Production is https://pivot23.vercel.app (Vercel project `pivot23`, state READY). Sentences below that say the PR is open, or that no public URL exists, were true on 2026-09-27 and are false after the merge. Current status lives in [`docs/memory/FACTS.md`](../../docs/memory/FACTS.md). The career-distribution audit is [`docs/pivot23/AUDIT-GROK-001.md`](../../docs/pivot23/AUDIT-GROK-001.md) and was not run on this commit. The HTML, JS and CSS of the public URL returned HTTP 200 on 2026-09-28. That does not close the black/white cause, Lighthouse, or a full-career check.

Audit updated: 2026-09-27
Version: `2.11.0-beta`
Branch at the time of the audit: `demo/pivot23-readiness`

## Executive Summary

The beta passes lint, typecheck, all 13 unit tests, production build, and the configured Playwright browser smoke test in GitHub Actions on Ubuntu. The CI run (run #2, ID `36326001307`) completed successfully on the PR head before the merge. Its E2E test exercises startup, career creation, draft flow, first-season simulation, local save, reload/resume, runtime/console/request errors, and horizontal overflow at three mobile viewport sizes. The local macOS 13 host still cannot launch the configured Chromium, so browser evidence comes from CI rather than a local browser.

**DEMO STATUS: PUBLIC URL LIVE, LAUNCH NOT ACCEPTED.** Core interactive flow and browser save/reload passed in Linux CI. Visual/touch mobile acceptance, Lighthouse, the black/white cause, and the career distribution remain open. Shipping the URL did not close them.

## Current Version

- App version: `2.11.0-beta` engine label; package version `0.1.0`.
- Runtime: React 19 + Vite 8, browser-only guest mode.
- Persistence: local/session storage; no account or backend is required.
- JARVIS HQ runtime/AI Gateway: documented specification only; not required by this game demo.
- Git state after 2026-09-28: the readiness branch is merged. See FACTS.md. Do not describe PR #1 as open.

## Gate Status

| Gate | Status | Evidence | Blocker |
|---|---|---|---|
| Build | PASS | `pnpm --dir apps/pivot23 build` completed; Vite emitted the production bundle. | Vite reports a 694.33 kB minified main chunk before gzip; measure impact with Lighthouse. |
| Typecheck | PASS | `pnpm --dir apps/pivot23 typecheck` passed. | — |
| Tests | PASS | `pnpm --dir apps/pivot23 test`: 13 passed, 0 failed. | UI/browser transitions and career distributions are not covered by this suite. |
| Lint | PASS | `pnpm --dir apps/pivot23 lint` passed with ESLint and React Hooks rules. | — |
| Gameplay | PASS for the first season | GitHub Actions run #2 passed the Chromium E2E flow through draft, career start, and first-season recap. | Longer career progression and generated narrative quality are not covered. |
| Save/Load | PASS | E2E observed the browser save, reloaded the page, and asserted the season recap resumed; unit tests cover long-career reload, archive deduplication, quota fallback, and corrupt data. | This is browser-local persistence; no account or cloud sync is provided. |
| Long Career | BLOCKED | Nine deterministic full-career simulations stayed within 20 seasons, valid age/overall bounds, and finite core stats; archive tests pass. | Distribution defects are recorded as open tasks in `docs/memory/TASKS.md`. The 40,000-career audit was not run on `421a4a0`. |
| Browser Smoke | PASS | GitHub Actions run #2 passed `pnpm run test:e2e` on Ubuntu with Chromium. | The local macOS 13 host still cannot run Chromium. |
| Mobile | PARTIALLY VERIFIED | E2E checked 390×844, 375×667, and 393×852 and passed the horizontal-overflow assertion at each size. | Visual layout, touch gestures, safe areas, and Safari/WebKit remain unverified. |
| Auth/Guest | PASS | App README and source show no mandatory login/auth provider; PIVOT-23 runs as a local guest game. | — |
| Security | PASS for a secret scan only | Static scan found no common hardcoded key/token/private-key patterns; production error UI does not display technical error details. | A local save can be rewritten by the client. That matters if a career is ever treated as a collectible. It is not a secret-key finding. |
| Deployment | PASS as a URL, not as a launch | https://pivot23.vercel.app served HTML, JS and CSS with HTTP 200 on 2026-09-28 from commit `421a4a0`. | Franchise names and `age>=36` are in that bundle. See FACTS.md. |

## Critical Blockers

- **Incident diagnosis:** the original black/white screen has not been reproduced; the root cause remains unknown. Startup/error fallbacks improve feedback but do not establish that the incident is resolved.
- **Launch:** a public URL exists. A launch does not. Open simulation tasks and the unanswered trademark question block a launch claim.

## High Priority Issues

- Visual mobile and touch behavior have not been verified.
- Long-career memory growth, browser save size, and frame/interaction performance have not been measured against a documented threshold.
- Lighthouse results are missing; Vite flags the main JS chunk size for review.
- The app’s EuroLeague model is a simplified 16-team/34-game model, not the official [2026–27 format](https://mediacentre.euroleague.net/en/app/2/communication/communication/preview/24407): 20 teams, 38 regular-season rounds, a play-in, four best-of-five playoff series, and a Final Four.
- Career length, award streaks, busts and franchise title share are open in `docs/memory/TASKS.md`.

## Medium/Low Priority

- PIVOT-23 includes narrative/event code, but no captured interactive play log was available for a full procedural-text audit. Voice rules are in `docs/pivot23/VOICE.md`.
- JARVIS orchestration and provider adapters remain unimplemented specifications; they are separate from the standalone PIVOT-23 demo path.

## Tests Executed

| Command | Result |
|---|---|
| `pnpm --store-dir /Users/niccolopelizzon/Documents/Codex/2026-09-25/new-chat/.pnpm-store --dir apps/pivot23 install --frozen-lockfile` | PASS — already up to date, frozen lockfile accepted. |
| `pnpm --dir apps/pivot23 lint` | PASS — local run with Node 24; `eslint . --max-warnings=0`. |
| `pnpm --dir apps/pivot23 typecheck` | PASS — local run with Node 24; `tsc --noEmit`. |
| `pnpm --dir apps/pivot23 test` | PASS — local run, 13 tests, 0 failures; includes 9 full-career path/seed combinations and storage/playoff cases. |
| `pnpm --dir apps/pivot23 build` | PASS — GitHub Actions run #2 completed the production build; large-chunk warning remains. |
| `pnpm --dir apps/pivot23 test:e2e` | PASS in GitHub Actions run #2 on Ubuntu/Chromium. Not run locally because Chromium is unsupported on this macOS 13 host. |
| Browser smoke + save/resume | PASS in GitHub Actions run #2 on Ubuntu/Chromium; the tested path starts and simulates a season, observes a localStorage save, reloads, resumes the recap, and checks three viewport widths. |
| Dev/preview HTTP fetch | PASS — Vite dev HTML/module and production preview HTML/JS/CSS returned HTTP 200. |
| Public URL fetch, 2026-09-28 | PASS for HTTP — HTML, JS and CSS returned 200. Not a browser paint test. |
| `git diff --check` | PASS — no whitespace errors before the 27 September commits. |

## Fixes Applied

Recorded by the 27 September audit, and present on `main` after the merge:

- Added persistent startup feedback and a global React error boundary with a development-only technical error detail.
- Modeled EuroLeague quarterfinals as best-of-five and Final Four semifinal/final as single neutral games; NBA remains best-of-seven.
- Made CPU playoff bracket advancement use exact series win probability rather than one per-series Bernoulli draw.
- Required an actual bracket seed for playoff qualification; added tests for formats, neutral games, home-court advantage, probability monotonicity, and series stopping.
- Corrected single-game score presentation and removed playoff copy that claimed four wins or an NBA ring in EuroLeague outcomes.
- Made archive persistence survive blocked/quota-limited storage within the current session and covered save/load, deduplication, and corrupt-save handling.
- Reduced redundant React state updates and removed unused code/imports found by the new lint gate.
- Added ESLint/React Hooks linting, a CI lint step, browser failure diagnostics, screenshot-on-failure attachment, navigation/paint timing capture, first-season/save/reload smoke flow, and three mobile viewport checks.
- Corrected two Italian team-description grammar errors.

## Remaining Work

- Reproduce the black/white report in a browser (or obtain a failing URL/session capture) and record causal evidence; validate whether the startup/error fallbacks address that incident.
- Complete visual mobile/touch checks at the configured sizes, including Safari/WebKit if available.
- Measure long-career memory/save size and performance; obtain an acceptance threshold from project requirements if none exists.
- Run Lighthouse on the public URL and assess the bundle warning from measured results.
- Re-run the distribution audit on `main` and then implement `docs/memory/TASKS.md` without closing the path to age 36.
- Review a real generated play log and career progression for event continuity, unresolved placeholders, and narrative plausibility.

## Demo Acceptance Criteria

The demo is accepted as a launch only after build, typecheck, tests, lint, interactive gameplay, browser save/reload, long-career distribution checks, browser smoke, mobile, security, and deployment all pass, with the black/white cause resolved. A public URL is no longer the missing piece. The app remains short of a launch because visual/touch acceptance, Lighthouse, the reported incident's cause, and the simulation tasks are outstanding.
