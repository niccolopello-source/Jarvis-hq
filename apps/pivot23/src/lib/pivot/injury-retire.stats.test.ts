/* P1-INJ (#87) retirement recalibration. Careers from RULES_INJURY_SINCE (2.19.0) get load-based
   injuries, which left only ~191/1000 careers ending at 29-32 with the A2 bars (2.18: 336).
   TUNING.injuryRetireBars219 brings 2.19 back into the #78 target band, 300-340 per 1000.
   Measured on fixed seeds 42000 + 7i, 250 careers per difficulty. Older careers keep the A2 bars. */
import assert from "node:assert/strict";
import test from "node:test";
import { advanceCareerSim, openCareerSim } from "./engine.ts";
import { seedRookieClass } from "./league.ts";
import { injuryRetireBarsOf, resetTuning, TUNING } from "./tuning.ts";

const DIFFS = ["esordio", "pro", "allstar", "leggenda"] as const;

function lastAge(seed: number, difficulty: (typeof DIFFS)[number], engineVersion: string) {
  const job = openCareerSim({ seed, difficulty });
  job.s.engineVersion = engineVersion;
  job.s.royClass = [];
  seedRookieClass(job.s);
  let done = false;
  for (let n = 0; !done && n < 5000; n++) done = advanceCareerSim(job);
  return job.s.seasonHistory.at(-1)?.age ?? job.s.age;
}

test("P1-INJ: 2.19 careers use the recalibrated bars, 2.14-2.18 keep the A2 bars", () => {
  resetTuning();
  for (const v of ["2.14.0-beta", "2.16.0-beta", "2.18.0-beta"]) assert.equal(injuryRetireBarsOf({ engineVersion: v }), TUNING.injuryRetireBars);
  assert.equal(injuryRetireBarsOf({ engineVersion: "2.19.0-beta" }), TUNING.injuryRetireBars219);
  assert.deepEqual(TUNING.injuryRetireBars, { 30: 5.0, 31: 3.6, 32: 3.2 });
});

test("P1-INJ: 2.19 early exits (last season at 29-32) within 300-340 per 1000 careers", () => {
  resetTuning();
  let early = 0;
  for (const d of DIFFS) for (let i = 0; i < 250; i++) {
    const age = lastAge(42000 + i * 7, d, "2.19.0-beta");
    if (age >= 29 && age <= 32) early++;
  }
  assert.ok(early >= 300 && early <= 340, `early exits 29-32: ${early}/1000`);
});
