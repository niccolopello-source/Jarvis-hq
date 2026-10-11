/* D-08 target: 10–15% of careers labelled bust. Measured, not tuned: if this fails after an engine
   change, report the new rate instead of moving the thresholds silently. */
import assert from "node:assert/strict";
import test from "node:test";
import { careerBust } from "./bust.ts";
import { playCareerSim } from "./engine.ts";

test("D-08 bust rate lands in 10–15% over 1,200 careers (300 per difficulty)", () => {
  const roles = ["PG", "SG", "SF", "PF", "C"] as const;
  const paths = ["NCAA", "Europa", "G-League"] as const;
  let busts = 0, n = 0;
  for (const [difficulty, base] of [["esordio", 100000], ["pro", 200000], ["allstar", 300000], ["leggenda", 400000]] as const) {
    for (let i = 0; i < 300; i++, n++) {
      const s = playCareerSim({ name: "Misura", role: roles[i % 5], nationality: "ITA", number: 23, difficulty, path: paths[i % 3], seed: base + i, draft: "random" });
      if (careerBust(s).bust) busts++;
    }
  }
  const rate = (100 * busts) / n;
  assert.ok(rate >= 10 && rate <= 15, `bust rate ${rate.toFixed(1)}%`);
});
