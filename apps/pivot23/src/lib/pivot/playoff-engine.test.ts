import assert from "node:assert/strict";
import test from "node:test";
import { PLAYOFF_SEEDS } from "./data.ts";
import {
  freshPlayer,
  playoffWinChance,
  qualifiesPlayoffs,
  resolvePlayoffRound,
  withPlayer,
} from "./engine.ts";
import {
  CHOICE_BONUS_CAP,
  advanceBracket,
  boundedChoiceBonus,
  matchupChance,
  playoffSeriesFormat,
  settleYearTitle,
  simulateSeries,
} from "./league.ts";
import { createRng } from "./rng.ts";
import type { SeasonRow, StandingRow } from "./types.ts";

function row(seed: number | null, abbr = "BOS"): SeasonRow {
  return {
    season: 1,
    yearLabel: "2026-27",
    age: 22,
    team: abbr,
    teamAbbr: abbr,
    teamColor: "#000",
    teamSecondary: "#fff",
    overall: 70,
    gp: 70,
    min: 30,
    ppg: 18,
    rpg: 4,
    apg: 5,
    spg: 1,
    bpg: 0.3,
    fg: 0.46,
    tp: 0.36,
    ft: 0.8,
    tov: 2,
    ts: 0.56,
    per: 16,
    plusMinus: 1,
    wins: 50,
    losses: 32,
    seed,
    conf: "East",
    awards: [],
    playoff: "",
    salaryM: 8,
  };
}

function standing(abbr: string, seed: number, power: number): StandingRow {
  return {
    abbr,
    name: abbr,
    city: abbr,
    color: "#111",
    secondary: "#eee",
    conf: "East",
    div: "Atlantic",
    w: 50,
    l: 32,
    seed,
    power,
    star: abbr,
    ppg: 112,
    oppPpg: 108,
    rpg: 44,
    apg: 25,
    netRtg: 4,
    pace: 98,
    note: "",
    starPpg: 22,
    starRpg: 6,
    starApg: 5,
  };
}

test("EuroLeague and NBA qualification follow the 8-team bracket, not win percentage", () => {
  const euro = freshPlayer("Euro", "PG", "ITA", 7, "pro", 11);
  euro.league = "EuroLega";
  const nba = freshPlayer("Nba", "PG", "USA", 7, "pro", 12);
  assert.equal(PLAYOFF_SEEDS, 8);
  assert.equal(qualifiesPlayoffs(euro, row(8)), true);
  assert.equal(qualifiesPlayoffs(euro, row(9)), false);
  assert.equal(qualifiesPlayoffs(euro, row(10)), false);
  assert.equal(qualifiesPlayoffs(nba, row(8)), true);
  assert.equal(qualifiesPlayoffs(nba, row(9)), false);
});

test("NBA series are best of seven and stop at four wins", () => {
  const format = playoffSeriesFormat("NBA", 0);
  const bags = [() => 0, () => 0.99, () => (Math.imul(1, 1) ? 0.2 : 0)];
  for (const random of [() => 0, () => 0.99]) {
    const series = simulateSeries(0.5, format, false, 1, 8, random);
    assert.ok(series.wins <= 4);
    assert.ok(series.losses <= 4);
    assert.equal(Math.max(series.wins, series.losses), 4);
    assert.ok(series.games.length >= 4 && series.games.length <= 7);
  }
  assert.equal(bags.length, 3);
  assert.equal(format.winsNeeded, 4);
});

test("a much stronger side is likelier, and a weaker side still has a chance", () => {
  const strong = matchupChance(90, 60);
  const even = matchupChance(75, 75);
  const weak = matchupChance(60, 90);
  assert.ok(strong > even);
  assert.ok(even > weak);
  assert.ok(weak > 0);
  assert.ok(strong < 1);
});

test("choice bonus is applied once and stays inside the cap", () => {
  assert.equal(boundedChoiceBonus(0.4), CHOICE_BONUS_CAP);
  assert.equal(boundedChoiceBonus(-0.4), -CHOICE_BONUS_CAP);
  const s = freshPlayer("Scelta", "SG", "USA", 23, "pro", 21);
  s.team.power = 75;
  s.overall = 75;
  const plain = playoffWinChance(s, 0, 0, 75);
  const boosted = playoffWinChance(s, 0, 0.4, 75);
  assert.ok(boosted > plain);
  assert.ok(boosted - plain <= CHOICE_BONUS_CAP + 1e-9);
  assert.equal(playoffWinChance(s, 0, 0.4, 75), playoffWinChance(s, 3, 0.4, 75));
});

test("the same seed replays the same series and another seed can diverge", () => {
  const play = (seed: number) => {
    const s = freshPlayer("Serie", "PG", "ITA", 23, "pro", seed);
    s.seed = seed;
    s.rngState = seed;
    s.overall = 74;
    s.team.power = 74;
    return playoffWinChance(s, 0, 0, 68);
  };
  assert.equal(play(4401), play(4401));
  const series = (seed: number) => {
    const rng = createRng(seed);
    return simulateSeries(0.52, playoffSeriesFormat("NBA", 1), false, 2, 6, () => rng.next());
  };
  assert.deepEqual(series(4401), series(4401));
  const base = JSON.stringify(series(4401));
  const diverged = [4402, 4403, 4410, 4500].some((seed) => JSON.stringify(series(seed)) !== base);
  assert.equal(diverged, true);
});

test("settling the title twice does not replace the bracket champion", () => {
  const s = freshPlayer("Titolo", "C", "USA", 11, "pro", 77);
  s.seasonHistory = [row(1, s.team.abbr)];
  s.currentLeague = {
    yearLabel: "2026-27",
    east: [standing(s.team.abbr, 4, 70), standing("MIA", 5, 78)],
    west: [standing("DEN", 1, 84)],
    euro: [],
    awards: [],
    leaders: [],
    royRace: [],
  };
  s.playoff = {
    conf: "East",
    seed: 4,
    round: 0,
    pairs: [{ a: standing(s.team.abbr, 4, 70), b: standing("MIA", 5, 78) }],
    otherChamp: standing("DEN", 1, 84),
  };
  s.seed = 77;
  s.rngState = 77;
  withPlayer(s, () => advanceBracket(s, false));
  const sealed = s.playoff?.settledChampion?.abbr;
  assert.ok(sealed);
  assert.notEqual(sealed, s.team.abbr);
  withPlayer(s, () => settleYearTitle(s, false));
  const first = s.championLog.at(-1)?.teamAbbr;
  assert.equal(first, sealed);
  s.championLog = [];
  const before = s.rngState;
  withPlayer(s, () => settleYearTitle(s, false));
  assert.equal(s.championLog.at(-1)?.teamAbbr, sealed);
  assert.equal(s.rngState, before);
  assert.equal(s.currentLeague?.champion?.teamAbbr, sealed);
});

test("a completed player series has one winner and only that winner is the champion", () => {
  const s = freshPlayer("Finale", "PF", "FRA", 5, "pro", 90);
  const mine = standing(s.team.abbr, 1, 88);
  s.currentLeague = {
    yearLabel: "2026-27",
    east: [mine],
    west: [],
    euro: [],
    awards: [],
    leaders: [],
    royRace: [],
  };
  s.seasonHistory = [row(1, s.team.abbr)];
  s.playoff = { conf: "East", seed: 1, round: 3, pairs: [{ a: mine, b: standing("DEN", 1, 70) }] };
  s.seed = 90;
  s.rngState = 90;
  const out = resolvePlayoffRound(s, 1, 3, 0, { ...s.team, abbr: "DEN", name: "DEN", power: 70 });
  assert.equal(out.series.wins >= 4 || out.series.losses >= 4, true);
  assert.notEqual(out.series.wins >= 4, out.series.losses >= 4);
  if (out.champion) {
    assert.equal(s.playoff?.settledChampion?.abbr, s.team.abbr);
    assert.equal(s.seasonHistory.at(-1)?.playoff, "Campione");
  } else {
    assert.equal(s.playoff?.settledChampion?.abbr, "DEN");
    assert.match(s.seasonHistory.at(-1)?.playoff ?? "", /Elim/);
  }
});
