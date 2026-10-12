import assert from "node:assert/strict";
import test from "node:test";
import ref from "./fixtures/version-gate-fp.json" with { type: "json" };
import { careerFingerprint, GATE_DIFFS, GATE_SEEDS, GATE_VERSIONS, playAt } from "../../../scripts/version-gate-fingerprints.ts";
import { ENGINE_VERSION, openCareerSim } from "./engine.ts";
import { awardProfile, diffOf } from "./difficulty.ts";
import { DECISIONS_SINCE, RETIRE_SINCE, usesBustB, usesDecisions, usesRetireSpread } from "./tuning.ts";

/* #83 owner decisions are gated on 2.15.0. Careers from 2.14.0 (#78, already in production),
   2.13 and 2.12 must replay byte-identical to main @ 33f0ca2: the fixture was generated there with
   scripts/version-gate-fingerprints.ts (40 seeds × 4 difficulties × 3 versions = 480 careers). */

const FP = ref as Record<string, string>;

test("fixture covers 480 careers frozen on main", () => {
  assert.equal(Object.keys(FP).length, GATE_VERSIONS.length * GATE_DIFFS.length * GATE_SEEDS.length);
});

for (const v of GATE_VERSIONS) {
  test(`${v} careers replay identical to main (160 careers)`, () => {
    const bad: string[] = [];
    for (const d of GATE_DIFFS) for (const seed of GATE_SEEDS) {
      const key = `${v}|${d}|${seed}`;
      if (careerFingerprint(playAt(seed, d, v)) !== FP[key]) bad.push(key);
    }
    assert.deepEqual(bad, []);
  });
}

test("new careers are 2.15 and get the #83 rules; 2.14 keeps #78", () => {
  assert.equal(ENGINE_VERSION, "2.15.0-beta");
  assert.equal(DECISIONS_SINCE, "2.15.0");
  assert.equal(RETIRE_SINCE, "2.14.0", "#78 gate unchanged");
  assert.equal(openCareerSim({ seed: 9100 }).s.engineVersion, ENGINE_VERSION);
  for (const v of ["2.15.0-beta", "2.15.0", "3.0.0"]) {
    assert.equal(usesDecisions({ engineVersion: v }), true, v);
    assert.equal(usesBustB({ engineVersion: v }), true, v);
    assert.equal(usesRetireSpread({ engineVersion: v }), true, v);
  }
  for (const v of ["2.14.0-beta", "2.14.0", "2.13.0-beta", "2.12.0", ""]) {
    assert.equal(usesDecisions({ engineVersion: v }), false, v);
    assert.equal(usesBustB({ engineVersion: v }), false, v);
  }
  assert.equal(usesRetireSpread({ engineVersion: "2.14.0-beta" }), true, "A2 stays on for 2.14");
  // Award curve: 2.15 uses the difficulty table, 2.14 the shipped one.
  for (const id of GATE_DIFFS) {
    assert.deepEqual(awardProfile({ difficulty: id, engineVersion: "2.15.0-beta" }), diffOf({ difficulty: id }));
    const old = awardProfile({ difficulty: id, engineVersion: "2.14.0-beta" });
    assert.equal(old.royDelta, 0);
    assert.equal(old.dpoyBar, 1);
    assert.equal(old.dpoyHelp, 0.05);
  }
  assert.equal(awardProfile({ difficulty: "allstar", engineVersion: "2.14.0-beta" }).awardP, 0.68);
  assert.equal(awardProfile({ difficulty: "leggenda", engineVersion: "2.14.0-beta" }).awardP, 0.42);
});

test("2.15 careers differ from 2.14 on the same seeds (the new rules are live)", () => {
  let differ = 0;
  for (const d of GATE_DIFFS) for (const seed of GATE_SEEDS) {
    if (careerFingerprint(playAt(seed, d, "2.15.0-beta")) !== FP[`2.14.0-beta|${d}|${seed}`]) differ += 1;
  }
  assert.ok(differ > 0, `2.15 must change some careers (changed ${differ}/160)`);
  console.log(`VERSION_GATE 2.15 vs 2.14: ${differ}/160 careers differ`);
});
