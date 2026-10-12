import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { advanceCareerSim, ENGINE_VERSION, freshPlayer, openCareerSim } from "./engine.ts";
import { seedRookieClass } from "./league.ts";
import { settleRoy } from "./awards-helpers.ts";
import { AWARD_MIN_GAMES, PLAYER_KEY, mvpFatigueV2, mvpHistoryV2, rookieClassPlanV2, royScoreV2 } from "./awards-v2.ts";
import { AWARDS_SINCE, RULES_215_SINCE, usesAwardsV2 } from "./tuning.ts";
import { liveStar } from "./world.ts";
import { AWARD_GATE_DIFFS, AWARD_GATE_SEEDS, AWARD_GATE_VERSIONS, awardFingerprint, playAwardsAt } from "../../../scripts/awards-gate-fingerprints.ts";
import type { PlayerState, RoyCandidate, SeasonRow } from "./types.ts";

/* Awards v2 (AW-01..AW-06, docs/pivot23/ISSUE-REGISTER.md). Repro seeds are on engine 2.14.0-beta. */

function play(seed: number, difficulty: string, version: string, each?: (s: PlayerState, r: SeasonRow) => void): PlayerState {
  const job = openCareerSim({ seed, difficulty: difficulty as never });
  job.s.engineVersion = version;
  job.s.royClass = [];
  seedRookieClass(job.s);
  let done = false;
  let last: SeasonRow | undefined;
  while (!done) {
    done = advanceCareerSim(job);
    const r = job.s.seasonHistory.at(-1);
    if (r && r !== last) { last = r; each?.(job.s, r); }
  }
  return job.s;
}

test("2.15.0 gate: shared with #83, new careers use v2, older ones do not", () => {
  assert.equal(AWARDS_SINCE, "2.15.0");
  assert.equal(AWARDS_SINCE, RULES_215_SINCE);
  assert.equal(usesAwardsV2({ engineVersion: ENGINE_VERSION }), true);
  for (const v of ["2.14.0-beta", "2.14.9", "2.13.0-beta", undefined, "garbage"]) assert.equal(usesAwardsV2({ engineVersion: v as string }), false, String(v));
  for (const v of ["2.15.0-beta", "2.15.0", "3.0.0"]) assert.equal(usesAwardsV2({ engineVersion: v }), true, v);
});

test("2.14 / 2.13 / 2.12 careers are byte-identical to main before awards v2 (300 careers)", () => {
  const ref = JSON.parse(readFileSync(new URL("./fixtures/awards-gate-fp.json", import.meta.url), "utf8")) as Record<string, string>;
  let n = 0;
  for (const v of AWARD_GATE_VERSIONS) for (const d of AWARD_GATE_DIFFS) for (const seed of AWARD_GATE_SEEDS) {
    const key = `${v}|${d}|${seed}`;
    assert.equal(awardFingerprint(playAwardsAt(seed, d, v)), ref[key], key);
    n += 1;
  }
  assert.equal(n, 300);
});

test("2.15 careers are deterministic: same seed, same awards and RNG state", () => {
  for (const seed of [57919, 65838, 4242]) {
    assert.equal(awardFingerprint(playAwardsAt(seed, "pro", "2.15.0-beta")), awardFingerprint(playAwardsAt(seed, "pro", "2.15.0-beta")));
  }
});

test("AW-01 repro: esordio seed 57919 season 8 — 2.14 player tops the MVP vote and loses it; 2.15 never", () => {
  let repro = "";
  play(57919, "esordio", "2.14.0-beta", (_s, r) => {
    if (r.season === 8 && r.league?.mvpBoard?.[0]?.isPlayer && !r.awards.includes("MVP")) repro = r.league.awards.find((a) => a.title === "MVP")!.name;
  });
  assert.ok(repro, "2.14 bug no longer reproduces at seed 57919 season 8");
  for (const seed of [57919, 65838, 1348716, 287570]) for (const d of ["esordio", "pro"]) {
    play(seed, d, "2.15.0-beta", (s, r) => {
      const top = r.league?.mvpBoard?.[0];
      if (top?.isPlayer && r.awards.includes("All-Star") && r.gp >= AWARD_MIN_GAMES) assert.ok(r.awards.includes("MVP"), `${d} ${seed} s${r.season}: leads the vote without trophy`);
      assert.equal(r.league?.awards.find((a) => a.title === "MVP")?.isPlayer ?? false, r.awards.includes("MVP"), `${s.seed} s${r.season}`);
    });
  }
});

test("AW-01: MVP fatigue reads the streak from past league awards, the same way for player and CPU", () => {
  const row = (name: string, isPlayer = false) => ({ league: { awards: [{ title: "MVP", name, team: "", teamAbbr: "", note: "", isPlayer }] } }) as unknown as SeasonRow;
  const h = mvpHistoryV2([row("A"), row("Me", true), row("Me", true), row("B"), row("B")]);
  assert.deepEqual(h.get("B"), { count: 2, streak: 2 });
  assert.deepEqual(h.get(PLAYER_KEY), { count: 2, streak: 0 });
  assert.deepEqual(h.get("A"), { count: 1, streak: 0 });
  assert.equal(mvpFatigueV2(undefined), 0);
  assert.equal(mvpFatigueV2({ count: 2, streak: 2 }), 10);
  assert.equal(mvpFatigueV2({ count: 20, streak: 20 }), 19, "bounded");
});

test("AW-02 repro: 2.14 ROY rescores every CPU rookie with the player's minutes; 2.15 keeps each rookie's own line", () => {
  const base = (min: number, version: string) => {
    const s = freshPlayer("Roy", "PG", "Italia", 23, "pro", 7);
    s.engineVersion = version;
    s.league = "NBA";
    s.royClass = [
      { name: "Big", team: "X", teamAbbr: "BOS", teamColor: "#000", ppg: 8, rpg: 7, apg: 1, score: 0, isPlayer: false, gp: 75, min: 26 },
    ] as RoyCandidate[];
    const r = { season: 1, ppg: 5, rpg: 2, apg: 2, gp: 75, min, per: 12, ts: 0.55, plusMinus: 0, awards: [] as string[], league: { awards: [], royRace: [] } } as unknown as SeasonRow;
    return settleRoy(s, r, 1).find((c) => !c.isPlayer)!.score;
  };
  assert.notEqual(base(12, "2.14.0-beta"), base(34, "2.14.0-beta"), "2.14 bug: CPU score follows the player's minutes");
  assert.equal(base(12, "2.15.0-beta"), base(34, "2.15.0-beta"));
  assert.equal(base(12, "2.15.0-beta"), royScoreV2({ ppg: 8, rpg: 7, apg: 1, gp: 75, min: 26 }));
});

test("AW-02: v2 rookie class is seeded (names, roles, picks, teams) and RNG-free", () => {
  const names = new Set<string>();
  const roles = new Set<string>();
  for (let seed = 1; seed <= 200; seed++) {
    const plan = rookieClassPlanV2(seed, 29);
    assert.deepEqual(plan, rookieClassPlanV2(seed, 29));
    assert.equal(new Set(plan.map((p) => p.name)).size, 5);
    assert.equal(new Set(plan.map((p) => p.pick)).size, 5);
    assert.equal(new Set(plan.map((p) => p.teamIndex)).size, 5);
    for (const p of plan) { names.add(p.name); roles.add(p.role); assert.ok(p.pick >= 1 && p.pick <= 14 && p.gp >= 58 && p.gp <= 82); }
  }
  assert.ok(names.size >= 20, `names ${names.size}`);
  assert.equal(roles.size, 5);
});

test("AW-04/05/06 in 2.15: 65 games, All-NBA 1st/2nd are All-Stars, DPOY goes to a race member", () => {
  const LABELS = ["MVP", "DPOY", "Rookie of the Year", "Most Improved Player", "Sixth Man", "All-NBA First Team", "All-NBA Second Team", "All-NBA Third Team"];
  let seasons = 0;
  for (let i = 0; i < 24; i++) {
    const seed = 50000 + i * 7919;
    play(seed, AWARD_GATE_DIFFS[i % 4], "2.15.0-beta", (s, r) => {
      seasons += 1;
      const tag = `${s.difficulty} ${seed} s${r.season}`;
      for (const a of LABELS) if (r.awards.includes(a)) assert.ok(r.gp >= AWARD_MIN_GAMES, `${tag}: ${a} with ${r.gp} games`);
      if (r.awards.some((a) => a === "All-NBA First Team" || a === "All-NBA Second Team")) assert.ok(r.awards.includes("All-Star"), `${tag}: All-NBA without All-Star`);
      const race = r.league?.dpoyRace ?? [];
      const aw = r.league?.awards.find((a) => a.title === "DPOY");
      if (race.length && aw && !aw.isPlayer) assert.ok(race.some((c) => c.name === aw.name), `${tag}: DPOY ${aw.name} not in race`);
      assert.equal(new Set(r.awards).size, r.awards.length, `${tag}: duplicate award`);
    });
  }
  assert.ok(seasons > 200);
});

test("AW-04/05/06 repro on 2.14 (documents the old behaviour kept for running careers)", () => {
  let six = "", an = "", dpoy = "";
  play(65838, "pro", "2.14.0-beta", (_s, r) => { if (r.season === 7 && r.awards.includes("Sixth Man") && r.gp < 58) six = `gp ${r.gp}`; });
  play(57919, "allstar", "2.14.0-beta", (_s, r) => { if (r.season === 7 && r.awards.includes("All-NBA Second Team") && !r.awards.includes("All-Star")) an = "yes"; });
  play(57919, "esordio", "2.14.0-beta", (_s, r) => {
    const aw = r.league?.awards.find((a) => a.title === "DPOY");
    if (r.season === 6 && aw && !aw.isPlayer && !(r.league?.dpoyRace ?? []).some((c) => c.name === aw.name)) dpoy = aw.name;
  });
  assert.ok(six && an && dpoy, `six=${six} an=${an} dpoy=${dpoy}`);
});

test("perf refactor: best star per team equals liveStar() for every team", () => {
  const job = openCareerSim({ seed: 31337, difficulty: "pro" });
  for (let k = 0; k < 4; k++) advanceCareerSim(job);
  const w = job.s.world!;
  const abbrs = new Set(w.stars.map((p) => p.teamAbbr));
  const best = new Map<string, (typeof w.stars)[number]>();
  for (const p of w.stars) { if (p.retired) continue; const c = best.get(p.teamAbbr); if (!c || p.overall > c.overall) best.set(p.teamAbbr, p); }
  for (const a of abbrs) assert.equal(best.get(a), liveStar(w, a), a);
});
