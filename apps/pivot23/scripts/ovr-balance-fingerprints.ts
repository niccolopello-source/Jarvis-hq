/**
 * OVR balance gate (engine 2.21.0, tuning.ts OVR_BALANCE_SINCE): whole careers CREATED as engine 2.16-2.20
 * must replay byte-identical to main @ 815b1ad (engine 2.20.0-beta, #112 merged). Unlike playAt in
 * version-gate-fingerprints.ts, the career is created with the forced version (openCareerSim
 * opts.engineVersion), because the Leggenda potential shift is drawn at creation, as in a real old save.
 * Freeze the reference on a main checkout (where opts.engineVersion is ignored and the result is the same):
 *   node --import=tsx scripts/ovr-balance-fingerprints.ts > src/lib/pivot/fixtures/ovr-balance-fp-220.json
 */
import { advanceCareerSim, openCareerSim } from "../src/lib/pivot/engine.ts";
import { seedRookieClass } from "../src/lib/pivot/league.ts";
import type { PlayerState } from "../src/lib/pivot/types.ts";
import { careerFingerprint, GATE_DIFFS, GATE_SEEDS } from "./version-gate-fingerprints.ts";

export const OVR_GATE_VERSIONS = ["2.20.0-beta", "2.19.0-beta", "2.18.0-beta", "2.17.0-beta", "2.16.0-beta"] as const;

export function playCreatedAt(seed: number, difficulty: (typeof GATE_DIFFS)[number], version: string): PlayerState {
  const job = openCareerSim({ seed, difficulty, engineVersion: version } as Parameters<typeof openCareerSim>[0]);
  job.s.engineVersion = version;
  job.s.royClass = [];
  seedRookieClass(job.s);
  let done = false;
  while (!done) done = advanceCareerSim(job);
  return job.s;
}

if (process.argv[1]?.endsWith("ovr-balance-fingerprints.ts")) {
  const out: Record<string, string> = {};
  for (const v of OVR_GATE_VERSIONS) for (const d of GATE_DIFFS) for (const seed of GATE_SEEDS) out[`${v}|${d}|${seed}`] = careerFingerprint(playCreatedAt(seed, d, v));
  process.stdout.write(JSON.stringify(out, null, 0) + "\n");
}
