/* P1-INJ (#87) retirement recalibration, per difficulty. Careers from RULES_INJURY_SINCE (2.19.0) get
   load-based injuries, which flattened early exits across difficulties with a single set of bars.
   TUNING.injuryRetireBars219 holds one set per difficulty. Owner targets (Pello, 2026-10-13), careers
   whose last season is at 29-32, per 1000: Esordio <= 20; Pro, All-Star, Leggenda 300-340.
   Measured on fixed seeds 91000 + 13i, 1000 careers per difficulty (default sim, no UI).
   Older careers keep the A2 bars and the shipped 2.5 bar from 33.
   2.20.0: the 2.19 bars are measured on careers forced to 2.19.0-beta (as the version-gate fixtures do);
   new 2.20 careers add the Leggenda minutes bars (TUNING.minutesRetireBars220) and nothing else. */
import assert from "node:assert/strict";
import test from "node:test";
import { advanceCareerSim, ENGINE_VERSION, openCareerSim } from "./engine.ts";
import { seedRookieClass } from "./league.ts";
import { injuryRetireBarsOf, resetTuning, TUNING } from "./tuning.ts";

const DIFFS = ["esordio", "pro", "allstar", "leggenda"] as const;
const N = 1000;
const BAND: Record<(typeof DIFFS)[number], [number, number]> = {
  esordio: [0, 20],
  pro: [300, 340],
  allstar: [300, 340],
  leggenda: [300, 340],
};

function lastAge(seed: number, difficulty: (typeof DIFFS)[number], version = "2.19.0-beta") {
  const job = openCareerSim({ seed, difficulty });
  if (version !== job.s.engineVersion) {
    job.s.engineVersion = version;
    // The rookie class is drawn at career start by the running engine: redraw it for the forced version.
    job.s.royClass = [];
    seedRookieClass(job.s);
  }
  assert.equal(job.s.engineVersion, version, `engine ${job.s.engineVersion}`);
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

/* 2.20.0 Leggenda retirements: on 2.19 the Leggenda injury bars are saturated (every career still playing
   at 29-32 has injuryDrag 0), so 2.20 Leggenda careers also close on a fading role at 31-32. Same seeds. */
test(`2.20: Leggenda early exits (last season at 29-32) within ${BAND.leggenda[0]}-${BAND.leggenda[1]} per 1000, no fewer than 2.19`, () => {
  resetTuning();
  assert.equal(ENGINE_VERSION, "2.20.0-beta");
  let early = 0;
  let early219 = 0;
  for (let i = 0; i < N; i++) {
    const age = lastAge(91000 + i * 13, "leggenda", ENGINE_VERSION);
    const age219 = lastAge(91000 + i * 13, "leggenda");
    if (age >= 29 && age <= 32) early++;
    if (age219 >= 29 && age219 <= 32) early219++;
    assert.ok(age <= age219, `seed ${91000 + i * 13}: 2.20 ended at ${age}, after 2.19 (${age219})`);
  }
  const [lo, hi] = BAND.leggenda;
  assert.ok(early >= lo && early <= hi, `2.20 leggenda early exits 29-32: ${early}/${N}`);
  assert.ok(early >= early219, `2.20 ${early} < 2.19 ${early219}`);
});

for (const d of ["esordio", "pro", "allstar"] as const) {
  test(`2.20: ${d} careers end exactly where 2.19 careers end (200 seeds)`, () => {
    resetTuning();
    for (let i = 0; i < 200; i++) {
      const seed = 91000 + i * 13;
      assert.equal(lastAge(seed, d, ENGINE_VERSION), lastAge(seed, d), `seed ${seed}`);
    }
  });
}
