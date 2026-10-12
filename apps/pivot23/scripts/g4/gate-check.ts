/**
 * G4 version-gate check. Prints one fingerprint per career.
 * Usage: node --import=tsx scripts/g4/gate-check.ts <asVersion|native> <difficulty> <count>
 * asVersion: stamps job.s.engineVersion before the first season, i.e. replays a career "created by"
 * that version on the current code. Compare with "native" output from the old commit.
 */
import { createHash } from "node:crypto";
import * as engine from "../../src/lib/pivot/engine";

const [as, difficulty, countArg] = process.argv.slice(2);
const roles = ["PG", "SG", "SF", "PF", "C"] as const;
const paths = ["NCAA", "Europa", "G-League"] as const;
const lock = (engine as Record<string, unknown>).lockExperimentEthic as ((s: unknown) => void) | undefined;
for (let i = 0; i < Number(countArg); i++) {
  const opts = { name: "G4", role: roles[i % 5], nationality: "ITA", number: 23, difficulty: difficulty as "pro", path: paths[i % 3], seed: (i + 1) * 1000 + 17, draft: "random" as const };
  let s;
  if (as === "native") s = engine.playCareerSim(opts);
  else {
    const job = engine.openCareerSim(opts);
    job.s.engineVersion = as;
    while (!engine.advanceCareerSim(job)) { /* run */ }
    lock?.(job.s);
    s = job.s;
  }
  console.log(i, createHash("sha256").update(JSON.stringify([s.seasonHistory, s.championLog, s.usedEventIds, s.choiceLog, s.rngState])).digest("hex").slice(0, 16));
}
