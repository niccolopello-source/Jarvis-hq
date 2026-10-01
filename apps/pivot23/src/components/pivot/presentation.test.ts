import assert from "node:assert/strict";
import test from "node:test";
import { ATTR_LABELS } from "../../lib/pivot/data.ts";
import {
  DELTA_FADE_MS,
  DELTA_READABLE_MS,
  calendarLabel,
  chipsFromFx,
  chipsFromSnapshot,
} from "./presentation.ts";

test("season stamp follows the published calendar", () => {
  assert.equal(calendarLabel(1), "2026–27");
  assert.equal(calendarLabel(3), "2028–29");
  assert.equal(calendarLabel(0), "2026–27");
});

test("consequence chips stay readable before they fade", () => {
  assert.ok(DELTA_READABLE_MS >= 1200);
  assert.ok(DELTA_FADE_MS >= 0);
  assert.ok(DELTA_READABLE_MS + DELTA_FADE_MS > DELTA_READABLE_MS);
});

test("consequence chips show public deltas only", () => {
  const chips = chipsFromFx(
    {
      attrs: { shooting: 3.2, defense: -1.4, handle: 0.2 },
      morale: -1,
    },
    ATTR_LABELS,
  );
  assert.deepEqual(chips.filter((chip) => chip.includes("Morale") || chip.includes(ATTR_LABELS.shooting) || chip.includes(ATTR_LABELS.defense)).length, chips.length);
  assert.equal(chips.length <= 3, true);
  assert.equal(chips.some((chip) => chip.startsWith("+3")), true);
  assert.equal(chips.some((chip) => chip.includes("Morale")), true);
  assert.equal(chips.some((chip) => chip.includes("0")), false);
});

test("snapshot chips ignore noise under one point", () => {
  const before = {
    attrs: { ...blank(), shooting: 70, defense: 60 },
    morale: 50,
    overall: 74.2,
  };
  const after = {
    attrs: { ...blank(), shooting: 70.4, defense: 62.2 },
    morale: 50.2,
    overall: 75.1,
  };
  const chips = chipsFromSnapshot(before, after, ATTR_LABELS);
  assert.deepEqual(chips, [`+2 ${ATTR_LABELS.defense}`]);
});

function blank() {
  return {
    shooting: 0,
    handle: 0,
    passing: 0,
    defense: 0,
    rebounding: 0,
    athleticism: 0,
    strength: 0,
    iq: 0,
  };
}
