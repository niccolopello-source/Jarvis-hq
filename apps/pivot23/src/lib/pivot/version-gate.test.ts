import assert from "node:assert/strict";
import test from "node:test";
import ref from "./fixtures/version-gate-fp.json" with { type: "json" };
import { careerFingerprint, GATE_DIFFS, GATE_SEEDS, GATE_VERSIONS, playAt } from "../../../scripts/version-gate-fingerprints.ts";
import { ENGINE_VERSION, openCareerSim } from "./engine.ts";
import { awardProfile, diffOf } from "./difficulty.ts";
import { AWARDS_SINCE, DECISIONS_SINCE, RETIRE_SINCE, usesBustB, usesDecisions, usesRetireSpread } from "./tuning.ts";

/* #83 owner decisions are gated on 2.16.0. Careers from 2.15.0 (#86 awards v2) and 2.14.0 (#78), both
   already in production, plus 2.13 and 2.12, must replay byte-identical to main @ cba5a29: the fixture was generated there with
   scripts/version-gate-fingerprints.ts (40 seeds × 4 difficulties × 4 versions = 640 careers). */

const FP = ref as Record<string, string>;

test("fixture covers 640 careers frozen on main", () => {
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

test("new careers are 2.16 and get the #83 rules; 2.15 and 2.14 keep theirs", () => {
  assert.equal(ENGINE_VERSION, "2.16.0-beta");
  assert.equal(DECISIONS_SINCE, "2.16.0");
  assert.equal(AWARDS_SINCE, "2.15.0", "#86 gate unchanged");
  assert.equal(RETIRE_SINCE, "2.14.0", "#78 gate unchanged");
  assert.equal(openCareerSim({ seed: 9100 }).s.engineVersion, ENGINE_VERSION);
  for (const v of ["2.16.0-beta", "2.16.0", "3.0.0"]) {
    assert.equal(usesDecisions({ engineVersion: v }), true, v);
    assert.equal(usesBustB({ engineVersion: v }), true, v);
    assert.equal(usesRetireSpread({ engineVersion: v }), true, v);
  }
  for (const v of ["2.15.0-beta", "2.15.0", "2.14.0-beta", "2.14.0", "2.13.0-beta", "2.12.0", ""]) {
    assert.equal(usesDecisions({ engineVersion: v }), false, v);
    assert.equal(usesBustB({ engineVersion: v }), false, v);
  }
  assert.equal(usesRetireSpread({ engineVersion: "2.14.0-beta" }), true, "A2 stays on for 2.14");
  // Award curve: 2.16 uses the difficulty table, 2.15 and 2.14 the shipped one.
  for (const id of GATE_DIFFS) {
    assert.deepEqual(awardProfile({ difficulty: id, engineVersion: "2.16.0-beta" }), diffOf({ difficulty: id }));
    for (const v of ["2.15.0-beta", "2.14.0-beta"]) {
    const old = awardProfile({ difficulty: id, engineVersion: v });
    assert.equal(old.royDelta, 0);
    assert.equal(old.dpoyBar, 1);
    assert.equal(old.dpoyHelp, 0.05);
    }
  }
  assert.equal(awardProfile({ difficulty: "allstar", engineVersion: "2.14.0-beta" }).awardP, 0.68);
  assert.equal(awardProfile({ difficulty: "leggenda", engineVersion: "2.14.0-beta" }).awardP, 0.42);
  assert.equal(awardProfile({ difficulty: "allstar", engineVersion: "2.15.0-beta" }).awardP, 0.68);
});

test("2.16 careers differ from 2.15 on the same seeds (the new rules are live)", () => {
  let differ = 0;
  for (const d of GATE_DIFFS) for (const seed of GATE_SEEDS) {
    if (careerFingerprint(playAt(seed, d, "2.16.0-beta")) !== FP[`2.15.0-beta|${d}|${seed}`]) differ += 1;
  }
  assert.ok(differ > 0, `2.16 must change some careers (changed ${differ}/160)`);
  console.log(`VERSION_GATE 2.16 vs 2.15: ${differ}/160 careers differ`);
});

test("2.16 award coherence: positive MVP help halves per MVP won, ROY shift on the v2 score", async () => {
  const { mvpHelpOf } = await import("./league.ts");
  const { royDeltaV2 } = await import("./difficulty.ts");
  const at = (engineVersion: string, mvpCount: number) => ({ engineVersion, mvpCount }) as never;
  assert.equal(mvpHelpOf(at("2.16.0-beta", 0), 2.5), 2.5);
  assert.equal(mvpHelpOf(at("2.16.0-beta", 1), 2.5), 1.25);
  assert.equal(mvpHelpOf(at("2.16.0-beta", 3), 4.5), 4.5 / 8);
  assert.equal(mvpHelpOf(at("2.16.0-beta", 3), -0.8), -0.8, "a malus is never scaled");
  assert.equal(mvpHelpOf(at("2.15.0-beta", 3), 2.5), 2.5, "2.15 keeps the flat value");
  for (const v of ["2.15.0-beta", "2.14.0-beta"]) for (const id of GATE_DIFFS) assert.equal(royDeltaV2({ difficulty: id, engineVersion: v }), 0, `${v} ${id}`);
  const r = GATE_DIFFS.map((id) => royDeltaV2({ difficulty: id, engineVersion: "2.16.0-beta" }));
  assert.ok(r[0]! > r[1]! && r[1]! > r[2]! && r[2]! > r[3]!, `ROY shift falls with difficulty: ${r}`);
});
