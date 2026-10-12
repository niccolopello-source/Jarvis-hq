# G4 results manifest

| Run | Commit (full SHA) | ENGINE_VERSION | Rules a new career gets |
|---|---|---|---|
| `main` (baseline) | `f7ca03d8edf062b8b8530b0cda3d99cf48f2cb06` (merge of #66) | 2.13.0-beta | D-09 `regress`, D-11 `seeded`, D-23 `streak` step 0.16 |
| `prev` (comparison) | `b265a680ff093007d12cdf376655dc6239652926` (main before #66) | 2.12.0-beta | D-09 `current`, D-11 `seeded`, D-23 `streak` step 0.12 |

- Node v20.19.2, tsx from `apps/pivot23/node_modules`, 8-core box, 2026-10-12.
- Seeds: `seed = (i + 1) * 1000 + 17`, role `i % 5` (PG/SG/SF/PF/C), path `i % 3` (NCAA/Europa/G-League), `draft: "random"` — the P0-LIFE test's scheme.
- N: Pro i = 0..3999 (4,000); Esordio, All-Star, Leggenda i = 0..999 (1,000 each). 7,000 careers per commit, same seeds on both commits. 0 errors.
- Commands (from `apps/pivot23`): `scripts/g4/run.sh <worktree> <tag>` (= `collect.ts <difficulty> <from> <count> <out>` ×7, 4 in parallel), then `node --import=tsx scripts/g4/analyze.ts <tag> <out.json> raw/<tag>-*.jsonl`.
- Runtime: about 65 s per 1,000 careers per process; the full two-commit collection took 147 s wall-clock.
- Raw per-career JSONL (about 50 MB per commit) is on the agent box under `/workspace/reports/g4/raw/`, not in the repo. Regenerate it with the commands above.
- Determinism: `collect.ts pro 0 500` run twice more in separate processes. Both are byte-identical to the first 500 lines of `main-pro-0.jsonl`.
- Version gate: `gate-check.ts 2.12.0-beta <d> 300` on `main` vs `gate-check.ts native <d> 300` on `prev`, for Pro and Esordio.
