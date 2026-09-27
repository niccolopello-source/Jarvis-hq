# JARVIS HQ

AI software house orchestration platform for multi-model agents, project memory, tools and development workflows.

The repository now includes the first runnable beta of its basketball career simulation project, PIVOT 23, in [`apps/pivot23`](apps/pivot23/README.md). The app uses the supplied game source dump and keeps the JARVIS HQ foundation documents at the repository root.

## Run the PIVOT 23 demo

```sh
pnpm --dir apps/pivot23 install
pnpm run pivot:dev
```

Open `http://localhost:8080`. Check the app with `pnpm run pivot:lint`, `pnpm run pivot:build`, `pnpm run pivot:test`, and `pnpm run pivot:test:e2e` (the browser test requires Playwright Chromium).

PIVOT 23 stores careers in the browser. No API key, AI provider, database, or account is needed for the demo. See the [app README](apps/pivot23/README.md) for the included scope and known setup differences from the original source dump.
