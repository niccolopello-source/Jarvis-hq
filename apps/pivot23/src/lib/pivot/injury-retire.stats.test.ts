/* P1-INJ (#87) retirement recalibration, per difficulty. Careers from RULES_INJURY_SINCE (2.19.0) get
   load-based injuries, which flattened early exits across difficulties with a single set of bars.
   TUNING.injuryRetireBars219 holds one set per difficulty. Owner targets (Pello, 2026-10-13), careers
   whose last season is at 29-32, per 1000: Esordio <= 20; Pro, All-Star, Leggenda 300-340.
   Measured on fixed seeds 91000 + 13i, 1000 careers per difficulty (default sim, no UI).
   Older careers keep the A2 bars and the shipped 2.5 bar from 33. */
import assert from "node:assert/strict";
import test from "node:test";
import { advanceCareerSim, openCareerSim } from "./engine.ts";
import { injuryRetireBarsOf, resetTuning, TUNING } from "./tuning.ts";

const DIFFS = ["esordio", "pro", "allstar", "leggenda"] as const;
const N = 1000;
const BAND: Record<(typeof DIFFS)[number], [number, number]> = {
  esordio: [0, 20],
  pro: [300, 340],
  allstar: [300, 340],
  leggenda: [300, 340],
};

function lastAge(seed: number, difficulty: (typeof DIFFS)[number]) {
  const job = openCareerSim({ seed, difficulty });
  assert.equal(job.s.engineVersion.startsWith("2.19."), true, `engine ${job.s.engineVersion}`);
  let done = false;
  for (let n = 0; !done && n < 5000; n++) done = advanceCareerSim(job);
  return job.s.seasonHistory.at(-1)?.age ?? job.s.age;
}

test("P1-INJ: 2.19 careers use the per-difficulty bars, 2.14-2.18 keep the A2 bars", () => {
  resetTuning();
  for (const v of ["2.14.0-beta", "2.16.0-beta", "2.18.0-beta"]) for (const difficulty of DIFFS) {
    assert.equal(injuryRetireBarsOf({ engineVersion: v, difficulty }), TUNING.injuryRetireBars);
  }
  for (const difficulty of DIFFS) {
    assert.equal(injuryRetireBarsOf({ engineVersion: "2.19.0-beta", difficulty }), TUNING.injuryRetireBars219[difficulty]);
  }
  assert.equal(injuryRetireBarsOf({ engineVersion: "2.19.0-beta" }), TUNING.injuryRetireBars219.pro);
  assert.deepEqual(TUNING.injuryRetireBars, { 30: 5.0, 31: 3.6, 32: 3.2 });
  assert.equal(33 in TUNING.injuryRetireBars, false, "pre-2.19 careers keep the shipped 2.5 bar from 33");
});

for (const d of DIFFS) {
  test(`P1-INJ: 2.19 early exits (last season at 29-32) on ${d} within ${BAND[d][0]}-${BAND[d][1]} per 1000`, () => {
    resetTuning();
    let early = 0;
    for (let i = 0; i < N; i++) {
      const age = lastAge(91000 + i * 13, d);
      if (age >= 29 && age <= 32) early++;
    }
    const [lo, hi] = BAND[d];
    assert.ok(early >= lo && early <= hi, `${d} early exits 29-32: ${early}/${N}`);
  });
}
