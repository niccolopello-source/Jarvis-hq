# JARVIS HQ

AI software house orchestration platform for multi-model agents, project memory, tools and development workflows.

The repository includes the basketball career simulation PIVOT 23 in [`apps/pivot23`](apps/pivot23/README.md).

Agent roles are defined only in [`docs/AGENT-REGISTRY.md`](docs/AGENT-REGISTRY.md). Models are not roles.

## Shared project memory

Read [`docs/memory`](docs/memory/README.md) before changing PIVOT 23. Facts, accepted decisions and open tasks live there. If `docs/project-state.md` or the September 27 reports disagree with [`docs/memory/FACTS.md`](docs/memory/FACTS.md), FACTS.md wins.

## Run the PIVOT 23 demo

```sh
pnpm --dir apps/pivot23 install
pnpm run pivot:dev
```

Open `http://localhost:8080`. Check the app with `pnpm run pivot:lint`, `pnpm run pivot:build`, `pnpm run pivot:test`, and `pnpm run pivot:test:e2e` (the browser test requires Playwright Chromium).

The production demo of `main` is https://pivot23.vercel.app. It is a public build, not a finished launch.

PIVOT 23 stores careers in the browser. No API key, AI provider, database, or account is needed for the demo. See the [app README](apps/pivot23/README.md) for the included scope and known setup differences from the original source dump.
