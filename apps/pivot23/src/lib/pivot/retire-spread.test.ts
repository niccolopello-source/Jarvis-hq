import assert from "node:assert/strict";
import test from "node:test";
import { careerEndingSignal } from "./peak.ts";
import { RETIRE_SINCE, TUNING, usesRetireSpread } from "./tuning.ts";
import type { PlayerState } from "./types.ts";

const at = (age: number, injuryDrag: number, engineVersion: string) =>
  ({ age, injuryDrag, engineVersion, seasonHistory: [{ min: 25 }] }) as unknown as PlayerState;

test("A2: only careers from RETIRE_SINCE get the early injury bars", () => {
  assert.equal(RETIRE_SINCE, "2.14.0");
  for (const v of ["2.13.0-beta", "2.12.0", ""]) assert.equal(usesRetireSpread({ engineVersion: v }), false, v);
  for (const v of ["2.14.0-beta", "2.14.0", "3.0.0"]) assert.equal(usesRetireSpread({ engineVersion: v }), true, v);
});

test("A2: heavy injury load ends a 2.14 career at 30–32 summers; a 2.13 career keeps the 33 rule", () => {
  assert.equal(TUNING.retirement, "current");
  for (const [age, bar] of Object.entries(TUNING.injuryRetireBars)) {
    assert.equal(careerEndingSignal(at(Number(age), bar, "2.14.0-beta")), "injury", `age ${age} at bar`);
    assert.equal(careerEndingSignal(at(Number(age), bar - 0.01, "2.14.0-beta")), null, `age ${age} below bar`);
    assert.equal(careerEndingSignal(at(Number(age), 18, "2.13.0-beta")), null, `legacy age ${age}`);
  }
  assert.equal(careerEndingSignal(at(29, 18, "2.14.0-beta")), null, "never before the 30 summer");
  assert.equal(careerEndingSignal(at(33, 2.5, "2.14.0-beta")), "injury", "33+ unchanged");
  assert.equal(careerEndingSignal(at(33, 2.5, "2.13.0-beta")), "injury");
});
