import assert from "node:assert/strict";
import test from "node:test";
import { bustBDrag } from "./peak.ts";
import { BUST_SINCE, resetTuning, TUNING, usesBustB } from "./tuning.ts";
import type { PlayerState } from "./types.ts";

const player = (over: Partial<PlayerState>) =>
  ({ engineVersion: "2.14.0-beta", age: 24, apexAge: 27, development: 4, potential: 90, choiceOvr: 4, ...over }) as PlayerState;

test("option B is off: older careers and the shipped switch never take a drag", () => {
  resetTuning();
  assert.equal(TUNING.bust, "current");
  assert.equal(BUST_SINCE, "2.14.0");
  assert.equal(usesBustB({ engineVersion: "2.13.0-beta" }), false);
  assert.equal(bustBDrag(player({ engineVersion: "2.14.0-beta" }), 3), 0);
});

test("option B, when switched on, drags only a high ceiling that lagged, then locks", () => {
  resetTuning();
  TUNING.bust = "choices-b";
  const ordinary = player({ potential: 80, choiceOvr: 2, development: 1 });
  assert.equal(bustBDrag(ordinary, 2), 0, "below the ceiling floor");
  const careful = player({ potential: 92, choiceOvr: 6, development: 9 });
  assert.equal(bustBDrag(careful, 6), 0, "choices above the bar pay nothing");
  const lagged = player({ potential: 92, choiceOvr: 3.5, development: 4 });
  const drag = bustBDrag(lagged, 3.5);
  assert.ok(drag > 0 && drag <= TUNING.bustB.cap);
  lagged.choiceOvr = 9;
  assert.equal(bustBDrag(lagged, 9), drag, "locked");
  resetTuning();
});
