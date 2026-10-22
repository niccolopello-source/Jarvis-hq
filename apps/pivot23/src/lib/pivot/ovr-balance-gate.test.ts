import assert from "node:assert/strict";
import test from "node:test";
import ref from "./fixtures/ovr-balance-fp-220.json" with { type: "json" };
import { careerFingerprint, GATE_DIFFS, GATE_SEEDS } from "../../../scripts/version-gate-fingerprints.ts";
import { OVR_GATE_VERSIONS, playCreatedAt } from "../../../scripts/ovr-balance-fingerprints.ts";
import { ENGINE_VERSION, freshPlayer, openCareerSim } from "./engine.ts";
import { DIFF_MAP, potentialShiftOf } from "./difficulty.ts";
import { twilightOf } from "./peak.ts";
import {
  LEGACY_LEGGENDA_POTENTIAL_SHIFT,
  LEGACY_TWILIGHT_BASE_WEAR,
  OVR_BALANCE_LEGGENDA_POTENTIAL_SHIFT,
  OVR_BALANCE_SINCE,
  OVR_BALANCE_TWILIGHT_BASE_WEAR,
  twilightBaseWearOf,
  usesOvrBalance220,
} from "./tuning.ts";

/* OVR balance (engine 2.21.0): careers CREATED on 2.16-2.20 must replay byte-identical to main @ 815b1ad
   (engine 2.20.0-beta, #112 merged). Fixture frozen there with scripts/ovr-balance-fingerprints.ts (40 seeds x 4 difficulties x 5 versions). */
const FP = ref as Record<string, string>;

test("OVR balance fixture covers 800 careers frozen on main @ 815b1ad", () => {
  assert.equal(Object.keys(FP).length, OVR_GATE_VERSIONS.length * GATE_DIFFS.length * GATE_SEEDS.length);
});

for (const v of OVR_GATE_VERSIONS) {
  test(`${v} careers (created as ${v}) replay identical to main @ 815b1ad (160 careers)`, () => {
    const bad: string[] = [];
    for (const d of GATE_DIFFS) for (const seed of GATE_SEEDS) {
      const key = `${v}|${d}|${seed}`;
      if (careerFingerprint(playCreatedAt(seed, d, v)) !== FP[key]) bad.push(key);
    }
    assert.deepEqual(bad, []);
  });
}

test("gate constants and version rule", () => {
  assert.equal(OVR_BALANCE_SINCE, "2.21.0");
  assert.equal(DIFF_MAP.leggenda!.potential, LEGACY_LEGGENDA_POTENTIAL_SHIFT, "the shipped spec keeps -6 for old careers");
  assert.equal(LEGACY_LEGGENDA_POTENTIAL_SHIFT, -6);
  assert.equal(OVR_BALANCE_LEGGENDA_POTENTIAL_SHIFT, -4);
  assert.equal(LEGACY_TWILIGHT_BASE_WEAR, 15.4);
  assert.equal(OVR_BALANCE_TWILIGHT_BASE_WEAR, 11.4);
  for (const v of ["2.20.0-beta", "2.20.0", "2.19.0-beta", "2.19.9", "2.18.0-beta", "2.12.0", "", undefined, "garbage"]) {
    assert.equal(usesOvrBalance220({ engineVersion: v as string }), false, String(v));
    assert.equal(twilightBaseWearOf({ engineVersion: v as string }), 15.4, String(v));
    assert.equal(potentialShiftOf("leggenda", v as string), -6, String(v));
  }
  for (const v of ["2.21.0-beta", "2.21.0", "2.22.0", "3.0.0"]) {
    assert.equal(usesOvrBalance220({ engineVersion: v }), true, v);
    assert.equal(twilightBaseWearOf({ engineVersion: v }), 11.4, v);
    assert.equal(potentialShiftOf("leggenda", v), -4, v);
  }
  for (const d of ["esordio", "pro", "allstar"] as const) {
    for (const v of ["2.20.0-beta", "2.21.0-beta"]) assert.equal(potentialShiftOf(d, v), DIFF_MAP[d]!.potential, `${d} ${v}`);
  }
});

test("new careers are 2.21 and get the Leggenda +2 potential on the same roll", () => {
  assert.equal(ENGINE_VERSION, "2.22.0-beta");
  assert.equal(openCareerSim({ seed: 9100 }).s.engineVersion, ENGINE_VERSION);
  let moved = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const a = freshPlayer("A", "PG", "ITA", 1, "leggenda", seed, "2.20.0-beta");
    const b = freshPlayer("A", "PG", "ITA", 1, "leggenda", seed);
    assert.equal(a.engineVersion, b.engineVersion, "freshPlayer stamps the running engine either way");
    const d = Math.round((b.potential - a.potential) * 10) / 10;
    assert.ok(d >= 0 && d <= 2, `seed ${seed}: ${d}`);
    if (d === 2) moved++;
    // Pro is untouched by the gate.
    assert.equal(freshPlayer("A", "PG", "ITA", 1, "pro", seed, "2.20.0-beta").potential, freshPlayer("A", "PG", "ITA", 1, "pro", seed).potential);
  }
  assert.ok(moved > 100, `${moved}/200 move by exactly +2 (the rest sit on the 64 floor)`);
});

test("twilight is 4.0 higher for 2.21 careers unless a clamp binds", () => {
  const s = openCareerSim({ seed: 4242, difficulty: "pro" }).s;
  s.age = 31;
  s.peakOverall = 80;
  s.injuryDrag = 0;
  const old = twilightOf({ ...s, engineVersion: "2.20.0-beta" });
  const neu = twilightOf({ ...s, engineVersion: "2.21.0-beta" });
  assert.ok(neu >= old, `${neu} >= ${old}`);
  assert.ok(neu - old <= 4.0001, `${neu - old}`);
});

test("A1 (2.22): injury bars differ from 2.19 only at age 32 for Pro and All-Star; 2.19-2.21 keep injuryRetireBars219", async () => {
  const { TUNING, injuryRetireBarsOf } = await import("./tuning.ts");
  for (const d of ["esordio", "pro", "allstar", "leggenda"] as const) {
    for (const v of ["2.19.0-beta", "2.20.0-beta", "2.20.9", "2.21.0-beta", "2.21.9"]) assert.equal(injuryRetireBarsOf({ engineVersion: v, difficulty: d }), TUNING.injuryRetireBars219[d], `${v} ${d}`);
    for (const v of ["2.22.0-beta", "2.22.0", "3.0.0"]) assert.equal(injuryRetireBarsOf({ engineVersion: v, difficulty: d }), TUNING.injuryRetireBars221[d], `${v} ${d}`);
  }
  assert.equal(injuryRetireBarsOf({ engineVersion: "2.22.0-beta" }), TUNING.injuryRetireBars221.pro, "missing difficulty reads as pro");
  const expected = structuredClone(TUNING.injuryRetireBars219) as Record<string, Record<number, number>>;
  expected.pro![32] = 1.8;
  expected.allstar![32] = 1.8;
  assert.deepEqual(TUNING.injuryRetireBars221, expected);
  assert.deepEqual(TUNING.injuryRetireBars219.pro, { 30: 3.6, 31: 2.8, 32: 1.9 });
  assert.deepEqual(TUNING.injuryRetireBars219.allstar, { 30: 3.6, 31: 2.0, 32: 1.7 });
});

/* 2.22.0 stack gate (Pello, 22 Oct 2026): 2.21.0-beta is live on main d800528. Careers CREATED as 2.21 must replay
   byte-identical to main. Frozen on main @ d800528 with playCreatedAt(seed, d, "2.21.0-beta") (scripts/ovr-balance-fingerprints.ts). */
test("2.21 careers replay byte-identical to main @ d800528 (stack-fp-221.json, 160 careers)", async () => {
  const { readFileSync } = await import("node:fs");
  const { careerFingerprint } = await import("../../../scripts/version-gate-fingerprints.ts");
  const { playCreatedAt } = await import("../../../scripts/ovr-balance-fingerprints.ts");
  const ref = JSON.parse(readFileSync(new URL("./fixtures/stack-fp-221.json", import.meta.url), "utf8")) as Record<string, string>;
  assert.equal(Object.keys(ref).length, 160);
  for (const [key, fp] of Object.entries(ref)) {
    const [v, d, seed] = key.split("|");
    assert.equal(careerFingerprint(playCreatedAt(Number(seed), d as "pro", v!)), fp, key);
  }
});
