/**
 * Fingerprints of whole careers forced to engine 2.16-2.19, for the Leggenda retirement gate (2.20.0).
 * Same careers and fingerprint as scripts/version-gate-fingerprints.ts. Run on a main checkout to freeze
 * the reference (frozen on main @ d80d1dc, engine 2.19.0-beta); the test replays them on this branch:
 *   node --import=tsx scripts/version-gate-fingerprints-219.ts > src/lib/pivot/fixtures/version-gate-fp-219.json
 */
import { careerFingerprint, GATE_DIFFS, GATE_SEEDS, playAt } from "./version-gate-fingerprints.ts";

export const GATE_VERSIONS_219 = ["2.19.0-beta", "2.18.0-beta", "2.17.0-beta", "2.16.0-beta"] as const;

if (process.argv[1]?.endsWith("version-gate-fingerprints-219.ts")) {
  const out: Record<string, string> = {};
  for (const v of GATE_VERSIONS_219) for (const d of GATE_DIFFS) for (const seed of GATE_SEEDS) out[`${v}|${d}|${seed}`] = careerFingerprint(playAt(seed, d, v));
  process.stdout.write(JSON.stringify(out, null, 0) + "\n");
}
