# PIVOT-23 Complete Diagnostic

> **Correction, 2026-09-28.** This audit was written when PR #1 was open and there was no public URL. Both of those statements are now false. `main` is `421a4a0`. The public demo is https://pivot23.vercel.app and returned HTTP 200 for HTML, JS and CSS. The black/white root cause is still unknown. Current facts: [`docs/memory/FACTS.md`](../../docs/memory/FACTS.md).

Audit updated: 2026-09-27
Checkout at the time of the audit: `demo/pivot23-readiness` (later merged)

## Executive Summary

PIVOT-23 builds and serves in Vite development and production-preview modes. Local lint, typecheck, and all 13 engine/persistence tests pass. GitHub Actions run #2 (ID `36326001307`) passed on the PR head SHA `93e0e3dd1ca7ceef6ffa5d8b8ab02da1bf90e767`, including Chromium E2E for career creation, first-season simulation, browser-local save, reload/resume, runtime/console/request errors, and horizontal overflow at three mobile viewport sizes. The configured Chromium cannot run on this local macOS 13 host.

The reported black/white screen could not be reproduced in a browser here, so its root cause remains **UNKNOWN**. Startup and React error fallbacks were added to ensure an entry-module failure or render exception shows feedback instead of an empty root; that mitigation is not evidence that the original incident is resolved.

## Current Status

- The app is an isolated React/Vite game in `apps/pivot23`; it uses browser storage and does not require an account, database, or AI provider.
- JARVIS HQ orchestration and the AI Gateway remain specifications, not runtime services. They are not dependencies of the PIVOT-23 demo.
- `pnpm install --frozen-lockfile`, lint, typecheck, engine tests, and production build passed locally on 2026-09-27.
- PR #1 is merged. Do not describe it as open.
- GitHub Actions run #2 passed install, Chromium setup, lint, typecheck, unit tests, production build, and browser E2E, on the pre-merge head.
- Public deployment: https://pivot23.vercel.app from `421a4a0`, state READY. HTTP 200 on HTML, JS and CSS is not a paint test and not a launch acceptance.

## Black/White Screen Root Cause

**Not established.** No browser reproduction or captured failing session was available. Successful HTTP requests and a successful build do not establish the cause of an earlier blank screen.

The client now has two recovery layers: an HTML startup shell remains visible until the app mounts, and a React error boundary renders a reload action after a render failure. Technical error text and console logging are limited to development mode. The main cause classification stays `UNKNOWN` until the failure can be reproduced with browser evidence.

The public HTML shell says «Avvio dell'applicazione…» until JavaScript mounts. A fetcher that does not run JavaScript will report that shell. That is not a reproduction of the original incident.

## Evidence

| Check | Result | Evidence |
|---|---|---|
| Development server | PASS | Started on `127.0.0.1:4176`; HTML and `/src/main.tsx` returned HTTP 200. |
| Production preview | PASS | Built preview on `127.0.0.1:4177`; HTML, JS bundle, and CSS returned HTTP 200. |
| Public URL | PASS for HTTP only | 2026-09-28, https://pivot23.vercel.app HTML, JS (694334 bytes) and CSS returned HTTP 200. Bundle contains `2.11.0-beta`. |
| Local fetch timings | Observed, not paint timings | Latest one-shot Node fetch measured preview HTML at 39 ms, JS at 50 ms, CSS at 8 ms; dev HTML at 143 ms and entry module at 25 ms. These are single local HTTP measurements, not browser FCP/LCP or app-interactive measurements. |
| Root and entry fallback | Static review | `index.html` keeps a visible startup/reload shell in `#app`; `main.tsx` wraps `PivotApp` in an error boundary. |
| Lazy chart | Static/build review | `CareerChart` is lazy-loaded under a visible Suspense fallback; its generated asset was requested successfully from production preview. |
| Storage bootstrap | Static/unit review | Save reads guard unavailable, corrupt, or quota-limited browser storage; archive writes fall back to memory for the current session. |
| CSS visibility classes | Static review | No CSS hide rule for `pivot-live` or `pivot-ready` was found. `pivot-lean` disables selected animations; `pivot-asleep` pauses them. No global hide behavior was found for these classes. |
| Database/auth | Repository review | No PGlite, database bootstrap, auth provider, or preview-host bridge is present in this app. The README specifies local guest saves. |
| Secret scan | Static scan | No matches for common API-key/private-key/token patterns were found in tracked project files. |

## Reproduction Steps

1. `pnpm --dir apps/pivot23 dev -- --host 127.0.0.1 --port 4176` (or `pnpm exec vite --host 127.0.0.1 --port 4176` from the app directory).
2. Open the local app and inspect browser console, failed requests, first paint, and the start-to-season flow.
3. `pnpm --dir apps/pivot23 build`.
4. `pnpm --dir apps/pivot23 exec vite preview --host 127.0.0.1 --port 4177` and repeat the browser checks against the production bundle.
5. On a supported Playwright host, run `pnpm --dir apps/pivot23 test:e2e`.
6. Open https://pivot23.vercel.app in a real browser. HTTP 200 from a fetcher is not this step.

The server/build and HTTP checks in steps 1–4 were completed on 2026-09-27. The interactive browser steps passed in GitHub Actions on Linux/Chromium; they remain unavailable locally on macOS 13.

## Root Cause Classification

**UNKNOWN** — the original black/white screen was not reproduced, and available evidence does not identify one of the specific technical causes.

## Fix Applied

- Added a visible HTML startup/reload shell for cases where JavaScript does not mount.
- Added a global React error boundary with a reload action and development-only error details.
- Kept a visible loading fallback for the lazy career chart.
- Removed redundant initial archive state updates and simplified adjacent-tab mounting to avoid extra renders.
- Hardened archive persistence against browser storage quota/access errors.

These changes improve failure feedback; they do not prove the original incident's root cause is fixed.

## Browser Results

**PASS in GitHub Actions; UNVERIFIED locally.** Run #2 passed `pnpm run test:e2e` using Ubuntu and Chromium. It exercised the home screen, career creation, draft flow, start of a career, first-season simulation, storage save, reload/resume, and asserted no page errors, console errors, failed requests, or HTTP error responses. Local execution remains unavailable because the installed Playwright Chromium is unsupported on macOS 13.

The smoke test collects page errors, console errors, failed requests, HTTP error responses, navigation/paint timing entries, and a screenshot attachment on failure. It passed the season simulation and save/reload flow, and checked horizontal overflow at 390×844, 375×667, and 393×852. A visual/touch review is still outstanding.

## Play Log Findings

No real browser session log was available for manual review. Engine tests simulate full careers across NCAA, Europe, and G-League entry paths with three fixed seeds each and verify season bounds and finite core statistics. Separate tests cover save/load, archive deduplication, quota fallback, corrupt saves, and playoff series behavior. They do not establish that every interactive UI transition or generated narrative log is correct.

A separate 40,000-career distribution was run on a sandbox tree that is not `421a4a0`. It is filed at `docs/pivot23/AUDIT-GROK-001.md` and must not be cited as a result for this commit.

## Lighthouse Results

**BLOCKED.** No supported browser/Lighthouse run was available. The production build reports a 694.33 kB minified main JS chunk (219.16 kB gzip), a 379.65 kB lazy chart chunk (100.49 kB gzip), and a 50.61 kB CSS file (10.43 kB gzip). Vite warns that the main chunk exceeds 500 kB before gzip. These sizes identify a follow-up measurement target; they are not Lighthouse scores or evidence of a performance failure.

## Mobile Results

**PARTIALLY VERIFIED.** CI passed the three configured viewport sizes and horizontal-overflow assertions. No visual inspection, touch gesture, safe-area, or Safari/WebKit result is available.

## Deployment Results

**PUBLIC URL LIVE.** https://pivot23.vercel.app from commit `421a4a0`, Vercel state READY, HTTP 200 for HTML, JS and CSS on 2026-09-28. Not a launch acceptance. The bundle still contains real NBA franchise names and `age>=36`.

## Remaining Risks

- Original black/white incident and first-paint behavior still need a browser reproduction or a captured failing session.
- The browser smoke test passes in Linux CI; mobile visuals and touch interactions remain unverified.
- Long-career memory growth and save-size performance have no documented acceptance threshold or browser measurements.
- EuroLeague data/season structure remains a simplified 16-team/34-game model. The official [2026–27 format](https://mediacentre.euroleague.net/en/app/2/communication/communication/preview/24407) is 20 teams over 38 regular-season rounds, with a play-in, four best-of-five playoff series, and a Final Four. The beta should not be presented as a current-season exact simulation.
- The production bundle warning has not been assessed with Lighthouse.
- Career distributions are not gated in CI. Open tasks: `docs/memory/TASKS.md`.

## Demo Gate Status

| Gate | PASS | FAIL | BLOCKED | Evidence |
|---|---:|---:|---:|---|
| Typecheck, lint, unit tests, build | ✓ |  |  | Commands and results recorded in `DEMO-READINESS-REPORT.md`. |
| Local development/production HTTP | ✓ |  |  | HTML and JS/CSS entry assets returned HTTP 200. |
| Black/white root cause |  |  | ✓ | Not reproduced in a browser; fallback mitigation is not a causal diagnosis. |
| Browser smoke, save/resume, and viewport overflow checks | ✓ |  |  | GitHub Actions run #2 passed Chromium E2E at the pre-merge head; visual mobile/touch review remains outstanding. |
| Lighthouse |  |  | ✓ | No supported browser run. |
| Public deployment | ✓ |  |  | https://pivot23.vercel.app from `421a4a0`. Launch still open. |
