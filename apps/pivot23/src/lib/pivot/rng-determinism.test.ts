import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { NBA_TEAMS } from "./data.ts";
import {
  applyAutoOffseason,
  buildTradeOffer,
  freshPlayer,
  loadArchive,
  playCareerSim,
  revealDraftLanding,
  startProPath,
  withPlayer,
} from "./engine.ts";
import { initPlayoffs, settleYearTitle } from "./league.ts";
import { fallbackDraws } from "./rng.ts";
import type { PlayerState } from "./types.ts";

function boot(seed: number) {
  const s = freshPlayer("Seed", "PG", "ITA", 23, "pro", seed);
  while (s.round < 10 && s.draftHand.length) {
    s.round += 1;
  }
  s.round = 10;
  withPlayer(s, () => {
    startProPath(s, "NCAA");
    revealDraftLanding(s);
  });
  return s;
}

test("the same seed builds the same player and a different seed can diverge", () => {
  const a = freshPlayer("A", "C", "USA", 11, "pro", 12345);
  const b = freshPlayer("B", "C", "USA", 11, "pro", 12345);
  assert.equal(a.potential, b.potential);
  assert.equal(a.hidden.workEthic, b.hidden.workEthic);
  assert.deepEqual(a.draftHand.map((c) => c.name), b.draftHand.map((c) => c.name));
  const other = freshPlayer("C", "C", "USA", 11, "pro", 12346);
  const same =
    other.potential === a.potential && other.hidden.workEthic === a.hidden.workEthic;
  assert.equal(same && other.draftHand[0]?.name === a.draftHand[0]?.name, false);
});

test("draft, training, trade and rival replay from the same seed", () => {
  const play = (seed: number) => {
    const s = boot(seed);
    const offer = buildTradeOffer(s);
    withPlayer(s, () => {
      s.rivalName = s.rivalName || "Devon Marsh";
      applyAutoOffseason(s, 1);
    });
    return { pick: s.draftPick, team: s.team.abbr, trade: offer.team.abbr, rival: s.rivalName, ovr: s.overall };
  };
  assert.deepEqual(play(77), play(77));
  const left = play(77);
  const right = play(78);
  assert.equal(typeof right.pick, "number");
  assert.ok(left.pick !== right.pick || left.trade !== right.trade || left.ovr !== right.ovr);
});

test("injury, national call-up and playoff champion replay, and title settlement does not draw", () => {
  const play = (seed: number) => {
    const s = boot(seed);
    s.seasonHistory = [{ ...s.seasonHistory[0], season: 1, yearLabel: "2026-27", seed: 1, teamAbbr: s.team.abbr, playoff: "" } as PlayerState["seasonHistory"][number]];
    if (!s.seasonHistory[0]) {
      s.seasonHistory = [{
        season: 1, yearLabel: "2026-27", age: 22, team: s.team.name, teamAbbr: s.team.abbr, teamColor: "#111", teamSecondary: "#eee",
        overall: 70, gp: 70, min: 28, ppg: 16, rpg: 4, apg: 6, spg: 1, bpg: 0.3, fg: 0.46, tp: 0.36, ft: 0.8, tov: 2, ts: 0.56, per: 16,
        plusMinus: 1, wins: 48, losses: 34, seed: 1, conf: "East", awards: [], playoff: "", salaryM: 8,
      }];
    }
    s.currentLeague = {
      yearLabel: "2026-27",
      east: [{ abbr: s.team.abbr, name: s.team.name, city: s.team.city, color: s.team.color, secondary: s.team.secondary, conf: "East", div: "Atlantic", w: 48, l: 34, seed: 1, power: 78, star: "x", ppg: 110, oppPpg: 106, rpg: 44, apg: 25, netRtg: 4, pace: 99, note: "", starPpg: 20, starRpg: 5, starApg: 6 }],
      west: [],
      euro: [],
      awards: [],
      leaders: [],
      royRace: [],
    };
    const before = s.rngState;
    withPlayer(s, () => initPlayoffs(s, s.currentLeague!));
    const champ = s.playoff?.pairs.map((p) => p.winnerAbbr).join(",");
    withPlayer(s, () => settleYearTitle(s, false));
    return { champ, rng: s.rngState, before };
  };
  const a = play(404);
  const b = play(404);
  assert.equal(a.champ, b.champ);
  assert.equal(a.rng, b.rng);
});

test("save and resume keep the same future, and a render does not spend the career stream", () => {
  const s = boot(505);
  const snap = s.rngState;
  const continued = structuredClone(s);
  withPlayer(continued, () => applyAutoOffseason(continued, 2));
  const resumed = structuredClone(s);
  assert.equal(resumed.rngState, snap);
  withPlayer(resumed, () => applyAutoOffseason(resumed, 2));
  assert.equal(resumed.overall, continued.overall);
  assert.equal(resumed.rngState, continued.rngState);
  const draws = fallbackDraws();
  const untouched = structuredClone(s);
  assert.equal(untouched.rngState, snap);
  assert.equal(fallbackDraws(), draws);
});

test("archive load does not move the live career stream", () => {
  const s = boot(606);
  const before = s.rngState;
  loadArchive();
  assert.equal(s.rngState, before);
  assert.equal(s.seed, 606);
});

test("a simulated career replays from the seed", () => {
  const a = playCareerSim({ seed: 909, difficulty: "pro", name: "Sim", nationality: "ITA", number: 23, role: "SF", path: "NCAA" });
  const b = playCareerSim({ seed: 909, difficulty: "pro", name: "Sim", nationality: "ITA", number: 23, role: "SF", path: "NCAA" });
  assert.equal(a.seasonHistory.length, b.seasonHistory.length);
  assert.equal(a.seasonHistory.at(-1)?.overall, b.seasonHistory.at(-1)?.overall);
  assert.equal(a.rngState, b.rngState);
});
test("gameplay sources do not call Math.random", () => {
  const files = ["engine.ts", "league.ts", "peak.ts", "world.ts", "summer.ts", "awards-helpers.ts", "rng.ts"];
  for (const file of files) {
    const text = readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
    assert.equal(text.includes("Math.random"), false, file);
  }
  assert.ok(NBA_TEAMS.length > 0);
});
