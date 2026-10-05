import assert from "node:assert/strict";
import test from "node:test";
import { applyAging, applyOffseason, draftStockOf, freshPlayer, withPlayer } from "./engine.ts";
import { computeOverall, profileDelta, weightedSkill } from "./peak.ts";
import type { AttrKey, PlayerState } from "./types.ts";

const KEYS: AttrKey[] = ["shooting", "handle", "passing", "defense", "rebounding", "athleticism", "strength", "iq"];

function fill(s: PlayerState, value: number) {
  for (const key of KEYS) s.attrs[key] = value;
  return s;
}

test("same attribute total, different shape, different role-weighted overall", () => {
  const passer = fill(freshPlayer("Pass", "PG", "ITA", 23, "pro", 31), 55);
  const shooter = fill(freshPlayer("Shot", "PG", "ITA", 23, "pro", 32), 55);
  passer.attrs.passing = 84;
  passer.attrs.handle = 80;
  passer.attrs.iq = 78;
  passer.attrs.shooting = 58;
  shooter.attrs.shooting = 86;
  shooter.attrs.passing = 48;
  shooter.attrs.handle = 60;
  shooter.potential = 90;
  passer.potential = 90;
  assert.ok(weightedSkill(passer) > weightedSkill(shooter));
  assert.ok(computeOverall(passer) > computeOverall(shooter));
});

test("a big with defense, rebounding and strength outrates a stretch big", () => {
  const rim = fill(freshPlayer("Rim", "C", "USA", 11, "pro", 41), 58);
  const stretch = fill(freshPlayer("Stretch", "C", "USA", 11, "pro", 42), 58);
  rim.attrs.defense = 82;
  rim.attrs.rebounding = 84;
  rim.attrs.strength = 80;
  rim.attrs.shooting = 48;
  stretch.attrs.shooting = 84;
  stretch.attrs.defense = 52;
  stretch.attrs.rebounding = 50;
  stretch.attrs.strength = 54;
  rim.potential = 88;
  stretch.potential = 88;
  assert.ok(weightedSkill(rim) > weightedSkill(stretch));
  assert.ok(computeOverall(rim) > computeOverall(stretch));
});

test("shooting focus raises shooting more than passing", () => {
  const s = fill(freshPlayer("Tiro", "SG", "FRA", 5, "pro", 51), 64);
  s.potential = 92;
  s.seed = 51;
  s.rngState = 51;
  const beforeShot = s.attrs.shooting;
  const beforePass = s.attrs.passing;
  withPlayer(s, () => applyOffseason(s, 1, "shooting"));
  assert.ok(s.attrs.shooting - beforeShot > s.attrs.passing - beforePass);
  assert.ok(s.attrs.shooting <= 99);
});

test("potential stays a ceiling and overall does not walk past it", () => {
  const s = fill(freshPlayer("Tetto", "PF", "SRB", 4, "pro", 61), 96);
  s.potential = 74;
  s.age = 27;
  s.development = 12;
  s.form = 8;
  assert.ok(s.potential >= 64);
  assert.ok(computeOverall(s) <= s.potential + 1.41);
});

test("role switch reweights overall and leaves attributes alone", () => {
  const s = fill(freshPlayer("Ruolo", "SG", "USA", 7, "pro", 71), 60);
  s.attrs.shooting = 84;
  s.attrs.passing = 50;
  s.potential = 90;
  const before = { ...s.attrs };
  const asGuard = computeOverall(s);
  s.role = "PG";
  const asPoint = computeOverall(s);
  assert.notEqual(asGuard, asPoint);
  assert.deepEqual(s.attrs, before);
  assert.ok(profileDelta(s) !== 0 || weightedSkill(s) !== 60);
});

test("aging lowers athleticism later and the same seed repeats the development", () => {
  const young = fill(freshPlayer("Young", "PG", "ITA", 23, "pro", 81), 70);
  const old = fill(freshPlayer("Old", "PG", "ITA", 23, "pro", 82), 70);
  young.age = 22;
  old.age = 33;
  young.seed = 81;
  old.seed = 82;
  const youngAth = young.attrs.athleticism;
  const oldAth = old.attrs.athleticism;
  withPlayer(young, () => applyAging(young));
  withPlayer(old, () => applyAging(old));
  assert.ok(old.attrs.athleticism < oldAth);
  assert.ok(young.attrs.athleticism >= youngAth - 0.2);
  const a = fill(freshPlayer("A", "C", "USA", 11, "pro", 90), 66);
  const b = fill(freshPlayer("B", "C", "USA", 11, "pro", 90), 66);
  a.seed = 90;
  b.seed = 90;
  a.rngState = 90;
  b.rngState = 90;
  a.potential = 86;
  b.potential = 86;
  withPlayer(a, () => applyOffseason(a, 2, "defense"));
  withPlayer(b, () => applyOffseason(b, 2, "defense"));
  assert.equal(a.attrs.defense, b.attrs.defense);
  assert.equal(a.overall, b.overall);
});

test("draft stock follows the role profile, with room left for scouting noise", () => {
  const fit = fill(freshPlayer("Fit", "PG", "ITA", 23, "pro", 101), 60);
  const poor = fill(freshPlayer("Poor", "PG", "ITA", 23, "pro", 102), 60);
  fit.attrs.passing = 86;
  fit.attrs.handle = 82;
  fit.attrs.iq = 80;
  poor.attrs.passing = 42;
  poor.attrs.handle = 44;
  poor.attrs.iq = 46;
  fit.potential = 82;
  poor.potential = 82;
  fit.seed = 101;
  poor.seed = 101;
  fit.rngState = 101;
  poor.rngState = 101;
  const fitStock = withPlayer(fit, () => draftStockOf(fit));
  poor.rngState = 101;
  const poorStock = withPlayer(poor, () => draftStockOf(poor));
  assert.ok(fitStock > poorStock + 4);
});
