import { test } from "node:test";
import assert from "node:assert/strict";
import { advanceCareerSim, openCareerSim } from "./engine";
import { STORY_POOL } from "./data";

/**
 * Rookie slot (gated by ROOKIE_TAGS_SINCE = 2.23.0, dormant while ENGINE_VERSION is 2.22.0-beta):
 * in seasons 2-3 no quiet/procedural beat steals the slot while rookie cards are left, and the
 * pool used is the rookie one. Careers stamped < 2.23.0 keep the legacy picks.
 */
const ROOKIES = STORY_POOL.filter((e) => e.phase === "rookie").map((e) => e.id);

function rookieCounts(engineVersion: string, seeds: number) {
  const c: Record<string, number> = Object.fromEntries(ROOKIES.map((r) => [r, 0]));
  for (let seed = 1; seed <= seeds; seed++) {
    const job = openCareerSim({ difficulty: "pro", seed, draft: "random" });
    job.s.engineVersion = engineVersion;
    const seen = new Set<string>();
    let k = 0;
    while (!advanceCareerSim(job) && k++ < 5000) for (const id of job.s.usedEventIds) seen.add(id);
    for (const id of job.s.usedEventIds) seen.add(id);
    for (const id of seen) if (id in c) c[id]!++;
  }
  return c;
}

test("rookie slot: dormant below 2.23.0, every rookie card reachable from 2.23.0", () => {
  const old = rookieCounts("2.22.0-beta", 300);
  const next = rookieCounts("2.23.0", 300);
  const sum = (c: Record<string, number>) => Object.values(c).reduce((a, b) => a + b, 0);
  for (const id of ["rk1", "rk5", "rk8", "rk10"]) assert.equal(old[id], 0, `${id} unreachable in legacy careers`);
  for (const id of ROOKIES) assert.ok(next[id]! > 0, `${id} appears from 2.23.0`);
  assert.ok(sum(next) >= 2.5 * sum(old), `rookie appearances ${sum(old)} -> ${sum(next)}`);
});
