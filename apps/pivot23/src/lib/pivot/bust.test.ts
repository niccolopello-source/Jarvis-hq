import assert from "node:assert/strict";
import test from "node:test";
import { BUST_MAX_PICK, careerBust } from "./bust.ts";
import { NBA_TEAMS } from "./teams.ts";
import type { PlayerState } from "./types.ts";

const nba = NBA_TEAMS[0]!.abbr;
const row = (min: number, gp: number, teamAbbr = nba) => ({ min, gp, teamAbbr }) as PlayerState["seasonHistory"][number];
const career = (draftPick: number, allStarCount: number, rows: PlayerState["seasonHistory"]) => ({ draftPick, allStarCount, seasonHistory: rows });

test("first-round pick, no All-Star, at most one starter season = bust", () => {
  assert.equal(careerBust(career(3, 0, [row(20, 70), row(30, 60), row(18, 40)])).bust, true);
  assert.equal(careerBust(career(BUST_MAX_PICK, 0, [])).bust, true);
});

test("second-rounders, All-Stars and real starters are never busts", () => {
  assert.equal(careerBust(career(31, 0, [row(10, 30)])).bust, false, "second round");
  assert.equal(careerBust(career(0, 0, [])).bust, false, "not drafted yet");
  assert.equal(careerBust(career(2, 1, [row(10, 30)])).bust, false, "All-Star");
  assert.equal(careerBust(career(5, 0, [row(30, 60), row(32, 70)])).bust, false, "two starter seasons");
});

test("only NBA seasons with >= 28 min and >= 50 GP count as starter seasons", () => {
  const v = careerBust(career(8, 0, [row(35, 70, "XXX"), row(35, 70, "YYY"), row(28, 49), row(27.9, 80)]));
  assert.equal(v.starterSeasons, 0);
  assert.equal(v.bust, true);
});

test("garbage numbers do not throw and do not label", () => {
  assert.equal(careerBust(career(Number.NaN, Number.NaN, [])).bust, false);
});
