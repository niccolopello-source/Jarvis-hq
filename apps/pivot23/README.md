# PIVOT 23

Browser-based basketball career simulation extracted from the supplied PIVOT 23 source dump and made runnable as an isolated app inside JARVIS HQ.

## Run locally

Install dependencies with `pnpm install`, then use `pnpm dev` and open `http://localhost:8080`.
Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` before `pnpm build` for a production bundle. Use `pnpm preview` to serve that bundle locally and `pnpm test:e2e` for the browser smoke flow.

The game stores its career in the browser (`localStorage` and `sessionStorage`). Clearing site data deletes that save. No account, database, or AI provider is required by this demo.

## Current demo scope

The included dump contains the game engine, UI, styles, career chart, and browser save logic. It did not include the original build configuration, public assets, authentication provider, preview bridge, or the scripts named by its original `package.json`. This app therefore uses a small standalone Vite setup and does not depend on those missing services.

## Readiness audits

- [Complete diagnostic](DIAGNOSTIC-REPORT.md)
- [Demo readiness report](DEMO-READINESS-REPORT.md)
