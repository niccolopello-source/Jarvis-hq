# QA evidence

SHA under test: `ae9f1d0228cad53a2e9d0b2a5112d3d131055f98`
Date: 2026-10-13, after 22:43 CEST.
Machine: Linux sandbox, Node v22.23.3, Playwright Chromium headless.
Not a phone. Not Safari. Not Firefox.

Production identity at the start and end of this pass: etag `6eee7648efc9264ded0536fe9b1d7c39`, last-modified `Tue, 13 Oct 2026 20:18:15 GMT`. Boot assets `index-6wnsWQXd.js`, `narrative-CsQjyxez.js`, `react-vendor-CyDUuctK.js`, `rolldown-runtime-hePW80VL.js`, `index-PE9pBNvO.css`.

## Commands and results

| Command | Where | Result |
|---|---|---|
| CI run [38454905618](https://github.com/niccolopello-source/Jarvis-hq/actions/runs/38454905618) | GitHub, this SHA | PASS. 306 unit, 0 fail. 125 e2e passed, 2 skipped (`e2e/perf-probe.spec.ts` without `PERF=1`). 12 stats, 0 fail |
| `node --import=tsx scripts/season-timing.ts` | `apps/pivot23`, this SHA | PASS vs checklist (≤ 1.2 s). 937 seasons. Regular season ms p50 0.5 / p95 4.7 / max 19.4. Full step p50 1.7 / p95 12.3 / max 31.9 |
| `node --import=tsx --test src/lib/pivot/save-recovery.test.ts` | this SHA | PASS 16/16. Includes SR-01, SR-02, SR-03 and quota. Storage is a fake `localStorage` |
| `CI=true PERF=1 E2E_PREVIEW=1 E2E_PORT=4173 pnpm exec playwright test e2e/perf-probe.spec.ts` | local preview of this SHA, Chromium, 390×844, CPU ×4 | PASS 2/2 in 35.0 s. See numbers below |
| `pnpm exec playwright test e2e/a11y-i18n.spec.ts e2e/save-recovery.spec.ts --config=/tmp/pw-a11y.config.ts` | baseURL production | PASS 6/6 in 34.8 s |
| English career script `/tmp/en-career.mjs` | production, Chromium 390×844 | PASS. One run. Completed, 0 console errors |
| `g5-smoke` on production | earlier this evening, 1 run, then `--repeat-each=2` | PASS 3/3. No flake in these three |

## Perf probe (lab)

12 startups, CPU ×4, viewport 390×844, local preview:

| Metric | p50 | p75 | p95 |
|---|---:|---:|---:|
| Time until Inizia | 236 ms | 305 ms | 408 ms |
| FCP | 84 ms | 100 ms | 128 ms |
| DOMContentLoaded | 72 ms | 74 ms | 129 ms |
| Tap Inizia → setup heading | 246 ms | 265 ms | 349 ms |
| Longest long task | 0 ms | 59 ms | 136 ms |

Profile wall clock, same throttle: Inizia tap 228 ms (one 81 ms long task); story choice 1691 ms (long tasks 95, 70, 59); next card 878 ms (no long task). The 1691 ms and 878 ms include waiting until the card text changes, so they include the product's hold. They are not the season-sim time. Season sim is the Node table above.

`jsTransfer` printed `1200`. That is `transferSize` on a warm preview cache. The boot payload from `pnpm run build` of this SHA is html 2.36 + css 14.23 + runtime 0.42 + react 68.25 + narrative 89.43 + index 96.44 = **271 kB gzip**. Checklist line is 350 kB.

## English career (production)

`html lang=en`. Draft, NCAA, gym. Double-click on the first choice added 0 log entries (the guard ate it; the loop then continued). Resume at 2 seasons stayed at 2, same name. Ending: Point guard, Italy, 2026–2042, age 21–36, 16 seasons, peak 68, no title. Card, on-screen report and archive all say that. Reopen after reload shows the same card. Console errors: none.

## Axe and recovery (production)

- `main screens pass axe in it`: pass, zero violations reported by the test.
- `main screens pass axe in en`: pass.
- reduced motion: 0 running animations longer than 50 ms.
- CSP: `securitypolicyviolation` list empty on the retire save, three tabs, production headers. This run is the one that has a real CSP.
- SR-02: a future save whose backup cannot be written stays byte-for-byte after starting another career and after reload. The new career stays in the tab.
- SR-C7: a truncated archive stays untouched and the notice is still there after reload.

A real device with a full disk was not used.

## Limits

- iPhone Safari, Android Chrome, desktop Safari: NOT RUN.
- Firefox: NOT RUN.
- Memory growth over a long session: NOT RUN.
- Filling the real browser quota until the disk is full: NOT RUN. The quota tests throw `QuotaExceededError` from a stub or from `setItem`.
- #93 and #94 are not in this build. The English career is the English that is already in production, not the copy branch.
- Game rules, OVR, awards and save format were not modified.
