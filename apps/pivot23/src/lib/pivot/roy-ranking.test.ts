import assert from "node:assert/strict";
import test from "node:test";
import { settleRoy } from "./awards-helpers";
import { freshPlayer, playCareerSim, playIsolatedDraft } from "./engine";
import { seedRookieClass } from "./league";
import { createRng, runWithRng } from "./rng";
import type { RoyCandidate, SeasonRow } from "./types";

function cpu(name: string, ppg: number): RoyCandidate {
  return { name, team: "Boston Celtics", teamAbbr: "BOS", teamColor: "#000", ppg, rpg: 3, apg: 2, score: 0, isPlayer: false };
}
function row(ppg: number, gp = 70): SeasonRow {
  return {
    season: 1,
    yearLabel: "2026-27",
    age: 21,
    team: "Boston Celtics",
    teamAbbr: "BOS",
    teamColor: "#000",
    teamSecondary: "#fff",
    overall: 60,
    gp,
    min: 24,
    ppg,
    rpg: 3,
    apg: 2,
    spg: 0.5,
    bpg: 0.2,
    fg: 45,
    tp: 35,
    ft: 78,
    tov: 1.2,
    ts: 55,
    per: 12,
    plusMinus: 0,
    wins: 30,
    losses: 52,
    seed: 10,
    conf: "East",
    awards: [],
    playoff: "Fuori",
    salaryM: 2.4,
    league: { yearLabel: "2026-27", east: [], west: [], euro: [], awards: [], leaders: [], royRace: [] },
  };
}
function player() {
  const s = freshPlayer("Roy Test", "PG", "Italia", 23, "pro", 7);
  s.league = "NBA";
  s.roy = false;
  s.milestones = [];
  return s;
}

test("a clearly better eligible rookie wins", () => {
  const s = player();
  s.royClass = [cpu("Basso", 4)];
  const box = row(14);
  settleRoy(s, box, 1);
  assert.equal(s.roy, true);
  assert.equal(box.awards.filter((a) => a === "Rookie of the Year").length, 1);
});

test("a clearly better CPU rookie wins", () => {
  const s = player();
  s.royClass = [cpu("Alto", 18)];
  const box = row(6);
  settleRoy(s, box, 1);
  assert.equal(s.roy, false);
});

test("equal production uses a stable name tie-break", () => {
  const s = player();
  s.name = "Aaron";
  s.royClass = [cpu("Aaron", 8)];
  const box = row(8);
  settleRoy(s, box, 1);
  assert.equal(s.roy, true);
});

test("a strong injected class beats the player and a weak class does not", () => {
  const strong = player();
  strong.royClass = [cpu("Star", 20)];
  const strongBox = row(7);
  settleRoy(strong, strongBox, 1);
  const weak = player();
  weak.royClass = [cpu("End", 3)];
  const weakBox = row(7);
  settleRoy(weak, weakBox, 1);
  assert.equal(strong.roy, false);
  assert.equal(weak.roy, true);
});

test("the same seed builds the same isolated class and does not move career RNG", () => {
  const run = () => {
    const s = freshPlayer("Iso", "SG", "Italia", 23, "pro", 42);
    s.team = { ...s.team, abbr: "NYK" };
    const rng = createRng(42);
    return runWithRng(rng, () => {
      const before = rng.getState();
      const cls = seedRookieClass(s).map((c) => [c.name, c.ppg, c.rpg, c.apg]);
      return { cls, unchanged: rng.getState() === before };
    });
  };
  const a = run();
  const b = run();
  assert.deepEqual(a.cls, b.cls);
  assert.equal(a.unchanged, true);
});

test("a different seed can build a different class", () => {
  const one = freshPlayer("Iso", "SG", "Italia", 23, "pro", 3);
  one.team = { ...one.team, abbr: "NYK" };
  const two = freshPlayer("Iso", "SG", "Italia", 23, "pro", 99);
  two.team = { ...two.team, abbr: "NYK" };
  assert.notDeepEqual(seedRookieClass(one).map((c) => c.ppg), seedRookieClass(two).map((c) => c.ppg));
});

test("ROY stays on season 1 NBA with at least 52 games and is not duplicated", () => {
  const s = player();
  s.royClass = [cpu("Basso", 2)];
  const box = row(12, 40);
  settleRoy(s, box, 1);
  assert.equal(s.roy, false);
  const late = row(12);
  settleRoy(s, late, 2);
  assert.equal(s.roy, false);
  const ok = player();
  ok.royClass = [cpu("Basso", 2)];
  const won = row(12);
  settleRoy(ok, won, 1);
  settleRoy(ok, won, 1);
  assert.equal(won.awards.filter((a) => a === "Rookie of the Year").length, 1);
});

test("a simulated career persists at most one rookie award", () => {
  const career = playCareerSim({ name: "Roy Sim", role: "SG", nationality: "ITA", number: 23, difficulty: "pro", path: "NCAA", seed: 96, draft: "random" });
  const rows = career.seasonHistory.filter((r) => r.awards.includes("Rookie of the Year"));
  assert.ok(rows.length <= 1);
  if (rows.length) assert.equal(rows[0].season, 1);
});

test("an isolated draft hand changes attributes before the box", () => {
  const s = freshPlayer("Cards", "PF", "Italia", 23, "pro", 15);
  const shooting = s.attrs.shooting;
  runWithRng(createRng(15), () => playIsolatedDraft(s));
  const moved = Object.values(s.attrs).some((n) => n !== 25);
  assert.equal(moved, true);
  assert.notEqual(s.attrs.shooting + s.attrs.handle + s.attrs.defense, shooting * 3);
});
