import assert from "node:assert/strict";
import test from "node:test";
import { ATTR_LABELS } from "../../lib/pivot/data.ts";
import {
  DELTA_FADE_MS,
  DELTA_READABLE_MS,
  UI_SEASON_ORIGIN,
  calendarLabel,
  chipsFromFx,
  chipsFromSnapshot,
  consequenceSchedule,
  formatCareerTotal,
  getSeasonDisplayLabel,
  isHighStakesPresentation,
} from "./presentation.ts";

test("season label starts at the UI origin and advances with the index", () => {
  assert.equal(UI_SEASON_ORIGIN, 2026);
  assert.equal(getSeasonDisplayLabel(1), "2026-27");
  assert.equal(getSeasonDisplayLabel(2), "2027-28");
  assert.equal(getSeasonDisplayLabel(3), "2028-29");
  assert.equal(getSeasonDisplayLabel(16), "2041-42");
  assert.equal(calendarLabel(3), getSeasonDisplayLabel(3));
});

test("season label boundaries stay on a calendar string", () => {
  assert.equal(getSeasonDisplayLabel(0), "2026-27");
  assert.equal(getSeasonDisplayLabel(-4), "2026-27");
  assert.equal(getSeasonDisplayLabel(Number.NaN), "2026-27");
  assert.equal(getSeasonDisplayLabel(75), "2100-01");
});

test("consequence chips stay readable for 1200ms before fade", () => {
  assert.equal(DELTA_READABLE_MS, 1200);
  assert.ok(DELTA_FADE_MS > 0);
  const schedule = consequenceSchedule(0);
  assert.equal(schedule.fadeStartsAt, 1200);
  assert.equal(schedule.removeAt, 1200 + DELTA_FADE_MS);
  assert.ok(schedule.removeAt > schedule.fadeStartsAt);
});

test("a later consequence schedule does not reuse an earlier removal time", () => {
  const first = consequenceSchedule(0);
  const next = consequenceSchedule(first.removeAt);
  assert.ok(next.fadeStartsAt > first.removeAt);
  assert.equal(next.fadeStartsAt - next.removeAt, first.fadeStartsAt - first.removeAt);
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

test("career totals use the active locale thousands separator", () => {
  assert.equal(formatCareerTotal(999, "en"), "999");
  assert.equal(formatCareerTotal(999, "it"), "999");
  assert.equal(formatCareerTotal(999, "es"), "999");
  assert.equal(formatCareerTotal(1000, "en"), "1,000");
  assert.equal(formatCareerTotal(1000, "it"), "1.000");
  assert.equal(formatCareerTotal(1000, "es"), "1.000");
  assert.equal(formatCareerTotal(25000, "en"), "25,000");
  assert.equal(formatCareerTotal(25000, "it"), "25.000");
  assert.equal(formatCareerTotal(25000, "es"), "25.000");
});

test("gold treatment is limited to Finals and MVP cards", () => {
  assert.equal(isHighStakesPresentation({ finals: true }), true);
  assert.equal(isHighStakesPresentation({ title: "Corsa all'MVP" }), true);
  assert.equal(isHighStakesPresentation({ awards: ["MVP"] }), true);
  assert.equal(isHighStakesPresentation({ awards: ["FMVP"] }), true);
  assert.equal(isHighStakesPresentation({ title: "Mercato estivo", awards: ["All-Star"] }), false);
  assert.equal(isHighStakesPresentation({ finals: false, title: "L'ultimo inverno" }), false);
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
