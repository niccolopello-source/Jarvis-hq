# Legacy compatibility audit (synthetic only)

## Purpose and acceptance

Point 1 only: compare pinned main, draft #152 and cumulative #153 without changing engine rules or real saves. `ENGINE_VERSION` remains `2.24.0-beta`. This is a bounded regression audit, not a proof for all seeds or a release approval.

Acceptance is deliberately split:
1. **Cross-revision full JSON identity** of PlayerState, actual RNG, pending and complete save envelope at every emitted checkpoint. No gameplay field is excluded.
2. **Uninterrupted vs save/load/resume full identity** is measured separately, with the first differing JSON path. Existing lossy save compaction is not normalized away or called a PASS. An additional persisted-envelope comparison checks the representation actually written; it is not substituted for full-state identity.
3. **Future/malformed input handling** is characterized, not assigned a new product policy. Matching main is not evidence that the policy is safe. Opening a future engine and permitting a subsequent synthetic write are findings, not accepted behavior for a future safeguard.
4. Existing unit/statistical checks and thresholds remain untouched.

## Reproduction

Prepare separate worktrees at these exact commits (the runner never fetches, checks out, or changes source):

- main: `33810f74ebfb3e1a9ffd5daa0db646993ebb3d7f`
- #152: `490bc861f44a48d9b22cdf1aec63bf8c30ec0705`
- cumulative #153 / parent of this branch: `3393f524fd32c3f1b9a42a9341e7c9295ba54a03`

In each `apps/pivot23`, install the committed lockfile with `pnpm install --frozen-lockfile`. From this branch's `apps/pivot23`:

```sh
pnpm run test:compat:tools
pnpm run test:compat:types
pnpm run test:compat /absolute/main/apps/pivot23 /absolute/empty-output /absolute/pr152/apps/pivot23
```

The third argument is optional; omitting it compares main with this branch only. Use a fresh output directory outside the repository. Compressed snapshots can occupy several GB across all runs. No browser, network call, real localStorage or registered user machine is used. Each target imports its own engine/save/RNG module graph in a separate Node process, with isolated in-memory stores. Do not use a real save as input.

Individual equivalent commands, useful when reusing an already completed baseline:

```sh
node --import=tsx scripts/compatibility/worker.ts /absolute/target/apps/pivot23 /absolute/target.jsonl.gz
node --import=tsx scripts/compatibility/phases-worker.ts /absolute/target/apps/pivot23 /absolute/target-phases.jsonl.gz
node scripts/compatibility/compare.mjs /absolute/main.jsonl.gz /absolute/target.jsonl.gz /absolute/result
```

The comparison exits nonzero for a cross-revision mismatch or missing/reordered checkpoint. Exit zero **only** means that comparison passed; it does not assert uninterrupted/full-state identity or a safe future-save policy. Those are separate, explicitly reported fields in `*-resume.jsonl` and `*-summary.json`.

## Sample, checkpoints, serialization

13 versions `2.12.0-beta` through `2.24.0-beta`. 24 scenarios each: 3 paths × 4 difficulties × 2 explicit choice policies (first/last). Seeds `61200 + index*97`, index 0–23 in the nested loop order above. Roles rotate PG/SG/SF/PF/C. Draft random/mixed, optional trades accept/refuse and retirement play36/retire rotate with index. This is a coverage sample, not a causal experiment or a frequency estimate.

Each scenario has independently created uninterrupted and resumed jobs. The latter writes/loads with the real save module after every nonfinal simulated season, then restores its actual RNG stream. Every initial, season and final snapshot retains the full player plus envelope and current job RNG/counter. Before a snapshot/save, rngState is synchronized from that job’s actual rng.getState(), as in the existing legacy-save test; it is never reset to the seed or copied from the other job. The actual RNG object state is also captured independently. Full final states, not only selected statistics/fingerprints, are compared across revisions.

`worker.ts` also covers serialized draft rounds, pending story/call/recap/playoff/FA/trade and retirement checkpoints. `phases-worker.ts` adds paired uninterrupted/resumed engine-API sequences, so the next engine action is executed after reload. Forced postseason/retirement fixtures are labeled. They do **not** exercise React `hydratePending`, actual clicks, Safari or browser boot.

Boundary fixtures use ages 29/31/33/35/36 and low-minute, forced-injury and healthy-star states (195 per target). These are synthetic branch probes, not plausible naturally reached careers or measured rates. Lab WeakMap experiments are not serialized or advertised as normal save data.

Only fixed **inputs** are supplied: synthetic careerId before checksums and a fixed Date.now for backup timestamps. JSON serialization defines the portable boundary (functions/undefined are not JSON save fields). No version, RNG, contract, world, pending, history, statistic or gameplay value is removed or rounded during comparison. Object key order is ignored by the recursive structural comparator; envelope checksum is still compared as a field.

## Recovery matrix and limits

150 cells per target: primary legacy/corrupt/future-schema/future-engine/stale-checksum/incomplete × session none/legacy/corrupt/future-schema/future-engine × backup none/legacy/corrupt/future-schema/future-engine. Three load cycles per cell reset the live in-memory cache while retaining synthetic storage bytes. These are simulated cache-reset restarts, not a real browser reboot. Explicit `restoreLiveBackup` is invoked only **after** recording load outcomes and primary-byte invariants.

Future container schema (`v=3`) is distinct from future `player.engineVersion` in a valid schema-2 envelope. Engine cases: 2.25 beta/release, 3.0, numeric-order 2.9, current 2.24, absent/null/number/empty/garbage. A separate missing-RNG case documents the seed fallback without claiming parity with the lost random stream. Existing recovery unit tests additionally cover quota/security failures and older fixtures.

`compare.mjs` writes all checkpoint ids, PASS/FAIL, SHA-256 digests, first mismatch paths and the first ten full mismatch snapshots. Summary diagnostic records include synthetic raw backup strings. Do not substitute real/personal data. Raw captures and machine logs are kept outside the repository; the dated report identifies their paths and the measured acceptance gaps.

## Product-policy boundary

No automatic rejection, migration, restamping, backup restoration, quarantine or UI reset has been introduced. A future protection must distinguish schema from engine versions, preserve every raw copy, prevent autosave/clear/fallback from erasing or silently replacing a future career, and retain explicit recovery and internal laboratory use. The subsequent `grokbot/future-save-protection` branch implements a conservative, non-destructive boundary in draft only; see the dated FUTURE-SAVE-PROTECTION report. Historical audit results remain historical; a new upper bound in the loader alone is insufficient.

## New protection campaign: explicit diagnostic separation and provenance

```sh
pnpm run test:compat /absolute/pinned-main/apps/pivot23 /absolute/new-output --allow-diagnostic-changes
```

The default remains strict for **all** cross-revision rows. The explicit flag allows intentional diagnostic policy differences only (`engine-version/`, `recovery/`, `missing-rng`); every such row still retains PASS/FAIL, both full hashes and first mismatch, and `fullCrossRevision` still reports its failures. `supportedCrossRevision` must always pass, with no excluded gameplay field. Comparator regression tests ensure the flag never accepts a supported-state mismatch. Full-memory resume failures remain failures, separately from the persistible-equivalent baseline. New natural snapshots also include JSON-serializable `job.opts` alongside `n`; choice callback behavior is the explicit first/last policy in the id, not a serializable function.

The manifest records committed SHA/tree **and** per-file source hashes (including untracked source), aggregate source hash, runtime/tool versions, harness hashes, each command's real exit/signal/log, raw gzip byte lengths/SHA-256 and comparison output hashes. A dirty working tree is not described as the committed source. Targets run in isolated processes; raw evidence contains synthetic fixtures only.

## Conditional downstream compaction diagnostic

The runner now also emits two full snapshots per target (`*-compaction.jsonl.gz`), using actual save/load on a deliberately forced 2.24 synthetic world: seed 89081, empty CPU-star roster, three matching NBA champion entries and a dynasty event at index 10. This is not a natural career or a frequency estimate. It tests whether dropping an event can affect the next `tickWorld`, not only display history. Cross-revision comparison must remain exact; uninterrupted vs resumed RNG/persistible differences are reported as FAIL, never normalized or silently fixed. The old 312-career campaign and this forced counterexample are separate result sets.

```sh
node --import=tsx scripts/compatibility/world-compaction-probe.mjs /absolute/target/apps/pivot23 /absolute/probe.jsonl.gz
```

Exit zero means the diagnostic completed, not that save/resume parity passed. Inspect its printed `persistibleMismatch`/`rngEqual` and comparator resume rows. The pre-existing compaction policy is intentionally unchanged.
