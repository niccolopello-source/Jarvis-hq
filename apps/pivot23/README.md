# PIVOT 23

Browser-based basketball career simulation extracted from the supplied PIVOT 23 source dump and made runnable as an isolated app inside JARVIS HQ.

## Run locally

Install dependencies with `pnpm install`, then use `pnpm dev` and open `http://localhost:8080`.
Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` (fast suite, ~10 s) before `pnpm build` for a production bundle. `pnpm test:stats` runs the two statistical engine checks (~4 min); `pnpm test:all` runs both.

Browser tests: `pnpm test:e2e` against the dev server, or `pnpm test:e2e:preview` against a production build served by `vite preview` with the same security headers as `vercel.json` (this is what CI runs). `pnpm check:headers` validates `vercel.json`; `node scripts/check-headers.mjs <url>` compares a deployment's live headers.

The game stores its career in the browser (`localStorage` and `sessionStorage`). Clearing site data deletes that save. No account, database, or AI provider is required by this demo.

## Current demo scope

The included dump contains the game engine, UI, styles, career chart, and browser save logic. It did not include the original build configuration, public assets, authentication provider, preview bridge, or the scripts named by its original `package.json`. This app therefore uses a small standalone Vite setup and does not depend on those missing services.

## Saves, languages, headers

- Save format, backups and migrations: [docs/pivot23/SAVE-FORMAT-AND-MIGRATIONS.md](../../docs/pivot23/SAVE-FORMAT-AND-MIGRATIONS.md)
- Interface strings live in `src/lib/pivot/i18n.ts` (Italian is the source, English must be complete; `i18n.test.ts` and `i18n-coverage.test.ts` enforce it). Story text stays Italian in this phase.
- Security headers: [docs/pivot23/SECURITY-HEADERS.md](../../docs/pivot23/SECURITY-HEADERS.md)
- Balance experiments (default-off flags in `src/lib/pivot/tuning.ts`): [docs/pivot23-balance-experiments.md](../../docs/pivot23-balance-experiments.md)

## Readiness audits

- [Complete diagnostic](DIAGNOSTIC-REPORT.md)
- [Demo readiness report](DEMO-READINESS-REPORT.md)
