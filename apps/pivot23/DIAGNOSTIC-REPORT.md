# PIVOT-23 Complete Diagnostic

Audit updated: 2026-09-27
Checkout: `demo/pivot23-readiness` at `52045ac` (local; not yet published)

## Executive Summary

PIVOT-23 builds and serves in both Vite development and production-preview modes. Typecheck, lint, and 13 engine/persistence tests pass. The browser smoke test now covers career creation, a first-season simulation, local save, reload/resume, and three mobile viewport sizes, but it could not launch locally because this machine runs macOS 13 and the installed Playwright version has no supported Chromium binary for that OS.

The reported black/white screen could not be reproduced in a browser here, so its root cause remains **UNKNOWN**. Startup and React error fallbacks were added to ensure an entry-module failure or render exception shows feedback instead of an empty root; that mitigation is not evidence that the original incident is resolved.

## Current Status

- The app is an isolated React/Vite game in `apps/pivot23`; it uses browser storage and does not require an account, database, or AI provider.
- JARVIS HQ orchestration and the AI Gateway remain specifications, not runtime services. They are not dependencies of the PIVOT-23 demo.
- `pnpm install --frozen-lockfile`, lint, typecheck, engine tests, and production build pass locally.
- `demo/pivot23-readiness` exists only in the local checkout. GitHub exposes only `main`; the branch cannot currently be pushed through this session.
- There is no public deployment URL and no GitHub Actions run for this branch.

## Black/White Screen Root Cause

**Not established.** No browser reproduction or captured failing session was available. Successful HTTP requests and a successful build do not establish the cause of an earlier blank screen.

The client now has two recovery layers: an HTML startup shell remains visible until the app mounts, and a React error boundary renders a reload action after a render failure. Technical error text and console logging are limited to development mode. The main cause classification stays `UNKNOWN` until the failure can be reproduced with browser evidence.

## Evidence

| Check | Result | Evidence |
|---|---|---|
| Development server | PASS | Started on `127.0.0.1:4176`; HTML and `/src/main.tsx` returned HTTP 200. |
| Production preview | PASS | Built preview on `127.0.0.1:4177`; HTML, JS bundle, and CSS returned HTTP 200. |
| Local fetch timings | Observed, not paint timings | One Node fetch measured preview HTML at 48 ms, JS at 53 ms, CSS at 8 ms; dev HTML at 113 ms and entry module at 27 ms. These are single local HTTP measurements, not browser FCP/LCP or app-interactive measurements. |
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

The server/build and HTTP checks in steps 1–4 were completed. Browser steps were blocked locally before the test could launch.

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

**BLOCKED locally.** `pnpm --dir apps/pivot23 test:e2e` stops at browser launch because the Playwright Chromium executable is missing. `pnpm exec playwright install chromium` reports `Playwright does not support chromium on mac13`. The browser test did not execute its assertions. The configured GitHub workflow uses Ubuntu and installs Chromium, but no run exists because the local branch is not published.

The updated smoke test collects page errors, console errors, failed requests, HTTP error responses, navigation/paint timing entries, and a screenshot attachment on failure. It also exercises a season simulation, save/reload, and 390×844, 375×667, and 393×852 viewports once run on the supported CI host.

## Play Log Findings

No real browser session log was available for manual review. Engine tests simulate full careers across NCAA, Europe, and G-League entry paths with three fixed seeds each and verify season bounds and finite core statistics. Separate tests cover save/load, archive deduplication, quota fallback, corrupt saves, and playoff series behavior. They do not establish that every interactive UI transition or generated narrative log is correct.

## Lighthouse Results

**BLOCKED.** No supported browser/Lighthouse run was available. The production build reports a 694.33 kB minified main JS chunk (219.16 kB gzip), a 379.65 kB lazy chart chunk (100.49 kB gzip), and a 50.61 kB CSS file (10.43 kB gzip). Vite warns that the main chunk exceeds 500 kB before gzip. These sizes identify a follow-up measurement target; they are not Lighthouse scores or evidence of a performance failure.

## Mobile Results

**BLOCKED for visual/touch acceptance.** The Playwright test defines the three requested viewport sizes and checks horizontal document overflow, but could not launch in this environment. No visual inspection, touch gesture, safe-area, or Safari/WebKit result is available.

## Deployment Results

**BLOCKED for public demo.** Production build and local Vite preview serve HTML and assets successfully. No deployment provider/configuration or public URL is present. The GitHub repository is reachable for reads, but writes are denied by the connected integration and HTTPS Git has no configured username credential.

## Remaining Risks

- Original black/white incident and first-paint behavior still need a browser reproduction or a captured failing session.
- The browser smoke test has not run; mobile visuals and touch interactions remain unverified.
- Long-career memory growth and save-size performance have no documented acceptance threshold or browser measurements.
- EuroLeague data/season structure remains a simplified 16-team/34-game model. The official [2026–27 format](https://mediacentre.euroleague.net/en/app/2/communication/communication/preview/24407) is 20 teams over 38 regular-season rounds, with a play-in, four best-of-five playoff series, and a Final Four. The beta should not be presented as a current-season exact simulation.
- The production bundle warning has not been assessed with Lighthouse.
- No public demo URL exists.

## Demo Gate Status

| Gate | PASS | FAIL | BLOCKED | Evidence |
|---|---:|---:|---:|---|
| Typecheck, lint, unit tests, build | ✓ |  |  | Commands and results recorded in `DEMO-READINESS-REPORT.md`. |
| Local development/production HTTP | ✓ |  |  | HTML and JS/CSS entry assets returned HTTP 200. |
| Black/white root cause |  |  | ✓ | Not reproduced in a browser; fallback mitigation is not a causal diagnosis. |
| Browser smoke and mobile visual checks |  |  | ✓ | Chromium unsupported/missing on local macOS 13; CI has not run. |
| Lighthouse |  |  | ✓ | No supported browser run. |
| Public deployment |  |  | ✓ | No deploy target or public URL. |
