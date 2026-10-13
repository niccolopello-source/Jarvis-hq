import assert from "node:assert/strict";
import test from "node:test";
import { bustBDrag } from "./peak.ts";
import { BUST_B81_SINCE, resetTuning, TUNING, usesBustB81 } from "./tuning.ts";
import type { PlayerState } from "./types.ts";

const player = (engineVersion: string, age: number, development: number, extra: Partial<PlayerState> = {}) =>
  ({ engineVersion, age, apexAge: 27, development, ...extra }) as unknown as PlayerState;

test("PR #81 B is off by default: no drag even for a 2.18 career", () => {
  resetTuning();
  assert.equal(TUNING.bust, "current");
  assert.equal(bustBDrag(player("2.18.0-beta", 30, 0), -10), 0);
});

test("PR #81 B: gated on BUST_B81_SINCE (2.18.0); older careers never use the #81 formula", () => {
  TUNING.bust = "choices-b";
  assert.equal(BUST_B81_SINCE, "2.18.0");
  for (const v of ["2.12.0", "2.13.0-beta", "2.15.0-beta", "2.16.0-beta", "2.17.0-beta", ""]) {
    assert.equal(usesBustB81({ engineVersion: v }), false, v);
  }
  // Pre-2.16 careers get no drag at all (pot below the #83 floor too).
  for (const v of ["2.13.0-beta", "2.12.0", ""]) assert.equal(bustBDrag(player(v, 30, 0), -10), 0, v);
  assert.equal(usesBustB81({ engineVersion: "2.18.0-beta" }), true);
  resetTuning();
});

test("PR #81 B: downside only, judged from three seasons before the apex, then locked", () => {
  TUNING.bust = "choices-b";
  const b = TUNING.bustB81;
  assert.equal(bustBDrag(player("2.18.0-beta", 23, 0), 0), 0, "too early: not judged yet");
  assert.equal(bustBDrag(player("2.18.0-beta", 24, 99), 99), 0, "choices above the reference never add");
  const s = player("2.18.0-beta", 24, b.devRef - 2);
  const want = Math.round(((b.choiceRef - 1) * b.choiceK + 2 * b.devK) * 1000) / 1000;
  assert.equal(bustBDrag(s, 1), want);
  assert.equal(s.bustLock, want);
  s.development = 99;
  assert.equal(bustBDrag(s, 99), want, "locked value does not move afterwards");
  resetTuning();
});
