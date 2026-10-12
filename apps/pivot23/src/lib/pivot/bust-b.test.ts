import assert from "node:assert/strict";
import test from "node:test";
import { bustBDrag } from "./peak.ts";
import { BUST_SINCE, resetTuning, TUNING, usesBustB } from "./tuning.ts";
import type { PlayerState } from "./types.ts";

const player = (engineVersion: string, age: number, development: number, extra: Partial<PlayerState> = {}) =>
  ({ engineVersion, age, apexAge: 27, development, ...extra }) as unknown as PlayerState;

test("D-08 B is off by default: no drag even for a 2.17 career", () => {
  resetTuning();
  assert.equal(TUNING.bust, "current");
  assert.equal(bustBDrag(player("2.17.0-beta", 30, 0), -10), 0);
});

test("D-08 B: gated on BUST_SINCE; older careers never get a drag", () => {
  TUNING.bust = "choices-b";
  assert.equal(BUST_SINCE, "2.17.0");
  for (const v of ["2.13.0-beta", "2.12.0", ""]) {
    assert.equal(usesBustB({ engineVersion: v }), false, v);
    assert.equal(bustBDrag(player(v, 30, 0), -10), 0, v);
  }
  assert.equal(usesBustB({ engineVersion: "2.17.0-beta" }), true);
  resetTuning();
});

test("D-08 B: downside only, judged from three seasons before the apex, then locked", () => {
  TUNING.bust = "choices-b";
  const b = TUNING.bustB;
  assert.equal(bustBDrag(player("2.17.0-beta", 23, 0), 0), 0, "too early: not judged yet");
  assert.equal(bustBDrag(player("2.17.0-beta", 24, 99), 99), 0, "choices above the reference never add");
  const s = player("2.17.0-beta", 24, b.devRef - 2);
  const want = Math.round(((b.choiceRef - 1) * b.choiceK + 2 * b.devK) * 1000) / 1000;
  assert.equal(bustBDrag(s, 1), want);
  assert.equal(s.bustLock, want);
  s.development = 99;
  assert.equal(bustBDrag(s, 99), want, "locked value does not move afterwards");
  resetTuning();
});
