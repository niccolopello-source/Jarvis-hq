# QA evidence — Bot C

SHA `21764f3c6de01c447191f98c3f45a211aad008fc`. Worktree `/workspace/botc`, box: 8 vCPU Intel Xeon, Linux, headless Chromium (Playwright 1.62), Node + pnpm 10.34.6. Shared box, other agents running: timings are lab numbers, not device numbers. Raw logs: `/workspace/reports/botc/`.

## Commands and results

| Command (in `apps/pivot23`) | Result |
|---|---|
| `pnpm install --frozen-lockfile` | OK |
| `pnpm build` | OK; sha256 11/11 equal to production |
| `pnpm test` | 308 pass, 0 fail |
| `pnpm lint` | exit 0 |
| `E2E_PREVIEW=1 E2E_PORT=4391 pnpm exec playwright test` ×3 | 125 pass, 2 skip (perf probes), 0 fail, each run (7.1 / 5.5 / 5.2 min) |
| `PERF=1 E2E_PREVIEW=1 pnpm exec playwright test perf-probe` ×3 | 2/2 each run |
| a11y spec copied with viewport 320×640, separate config, outside repo | 2/2 (IT, EN), 0 axe violations |
| `node --import=tsx scripts/lab-runner.ts 200 23000` ×3 | 400 careers each, 8.9–12.1 s, 0 mismatches, 0 integrity failures |
| CI run 38512203898 (push, 21764f3c6de01c447191f98c3f45a211aad008fc) | success, both jobs |

`pnpm test:stats` and `typecheck` were not rerun separately by Bot C: `build` runs `tsc --noEmit`, and CI ran stats on this SHA.

## Performance (4× CPU throttling via CDP, 390×844, preview build)

Startup probe, 12 cold loads per run, 3 runs:

| Metric | run 1 p50/p95 | run 2 | run 3 |
|---|---|---|---|
| ready (Inizia visible) | 150 / 206 ms | 155 / 273 | 153 / 240 |
| FCP | 64 / 100 | 68 / 124 | 68 / 92 |
| DCL | 51 / 78 | 53 / 88 | 54 / 72 |
| tap Inizia → setup | 143 / 253 | 133 / 234 | 135 / 236 |
| max long task | 0 / 116 | 0 / 110 | 0 / 101 |

Profiled taps (single measurement per run): tap-inizia 238 / 184 / 233 ms; story choice 1573 / 1572 / 1539 ms (includes the designed hold before the next card); next card 828 / 827 / 811 ms. Node simulation: ~22–30 ms per full career under load. `jsTransfer: 1200` from the probe is a cached transferSize, not bundle size.

## Saves and storage

Reused existing specs only (`save-safety`, `save-recovery`, `lifecycle-flush`, `init-failure`, `demo-readiness` "failed write"): damaged JSON kept, newer-version save not opened nor deleted, no-storage notice, full archive warning, quota error keeps previous save. All 3/3. A real full device disk was NOT RUN.

## Flakiness

0 intermittent failures in 3 full local runs (375 test executions). CI on #93 (run 38534610852) failed `demo-readiness.spec.ts:225 year sheet` twice (with retry) — that is on #93's branch, not on main; owned by Lucille.

## Limits

No physical device. No Safari/WebKit by Bot C (parallel task covers WebKit). Prod Playwright run of the parallel task (`/workspace/reports/jarvis-prod-e2e/run.log`, 538 pass, some fail) not yet analysed by its owner; see QA-07.
