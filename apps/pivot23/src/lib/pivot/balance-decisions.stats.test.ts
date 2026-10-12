/* Evidence for the approved balance decisions already live since engine 2.12.0 (see tuning.ts).
   Measured, not tuned: if one of these fails after an engine change, report it, don't move the knobs. */
import assert from "node:assert/strict";
import test from "node:test";
import { playCareerSim } from "./engine.ts";
import { resetTuning, scriptSlotFor } from "./tuning.ts";

test("D-11: seeded story windows give 21 distinct calendars over seeds 1..2000", () => {
  resetTuning();
  const calendars = new Set<string>();
  for (let seed = 1; seed <= 2000; seed++) {
    const slots = Array.from({ length: 20 }, (_, i) => scriptSlotFor(seed, i + 1, "seeded"));
    calendars.add(slots.map((x, i) => (x ? `${i + 1}:${x}` : "")).filter(Boolean).join(","));
  }
  assert.equal(calendars.size, 21);
});

test("D-23: no DPOY streak longer than 5 over 300 Esordio careers (seeds 100000+)", () => {
  resetTuning();
  const roles = ["PG", "SG", "SF", "PF", "C"] as const;
  const paths = ["NCAA", "Europa", "G-League"] as const;
  let max = 0;
  for (let i = 0; i < 300; i++) {
    const s = playCareerSim({ name: "Misura", role: roles[i % 5], nationality: "ITA", number: 23,
      difficulty: "esordio", path: paths[i % 3], seed: 100000 + i, draft: "random" });
    let run = 0, prev = -9;
    for (const r of s.seasonHistory) {
      if (!r.awards.includes("DPOY")) continue;
      run = r.season === prev + 1 ? run + 1 : 1;
      prev = r.season;
      max = Math.max(max, run);
    }
  }
  assert.ok(max <= 5, `max DPOY streak ${max}`);
});
