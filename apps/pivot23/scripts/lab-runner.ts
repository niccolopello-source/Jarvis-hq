/**
 * Headless lab CLI. Reuses src/lib/pivot/lab.ts.
 * Usage: node --import=tsx scripts/lab-runner.ts [count] [seedBase]
 * Prints one JSON report. Does not write saves and does not change tuning.
 */
import { performance } from "node:perf_hooks";
import { DEFINITIONS, LAB_ENGINE, roleBoxScore, runPair, sampleSeeds } from "../src/lab/lab.ts";

const count = Math.max(1, Math.min(200, Number(process.argv[2] ?? 12)));
const base = Number(process.argv[3] ?? 23000);
const seeds = sampleSeeds(count, base);
const roles = ["PG", "SG", "SF", "PF", "C"] as const;
const started = performance.now();
const pairs = seeds.map((seed, i) => runPair({ seed, role: roles[i % 5], path: (["NCAA", "Europa", "G-League"] as const)[i % 3] }));
const elapsedMs = Math.round(performance.now() - started);
const mismatches = pairs.filter((p) => !p.match).length;
const dirty = pairs.filter((p) => p.issues.length > 0);
const highPot = pairs.filter((p) => p.potential >= 85);
const report = {
  engine: LAB_ENGINE,
  commit: process.env.GITHUB_SHA ?? "local",
  count,
  seedBase: base,
  elapsedMs,
  determinismMismatches: mismatches,
  integrityFailures: dirty.length,
  definitions: DEFINITIONS,
  bustAmongPot85: highPot.length ? highPot.filter((p) => p.bust).length / highPot.length : null,
  highPotCount: highPot.length,
  superstarShare: pairs.filter((p) => p.superstar).length / pairs.length,
  meanTpr: Math.round((pairs.reduce((a, p) => a + p.tpr, 0) / pairs.length) * 1000) / 1000,
  endAges: [...new Set(pairs.map((p) => p.endAge))].sort((a, b) => a - b),
  roleBox: roleBoxScore(seeds),
  failures: dirty.slice(0, 5).map((p) => ({ seed: p.seed, issues: p.issues })),
};
console.log(JSON.stringify(report, null, 2));
if (mismatches > 0 || dirty.length > 0) process.exitCode = 1;
