import test from "node:test";
import assert from "node:assert/strict";
import { TUNING, usesCareerState, usesDepthMood225, usesEngine226 } from "./tuning";
import { applyFx, advanceCareerSim, openCareerSim, playCareerSim, settleCareerMemory, simulateRegularSeason } from "./engine";
import { careerStateOf, choiceMorale, CS226 } from "./career-state";
import { fallbackDraws } from "./rng";
import type { DifficultyId, PlayerState } from "./types";

// ENGINE 2.26 (behind TUNING.engine226): Career State model + award fixes. Live careers stay on 2.24.
function with226<T>(on: boolean, fn: () => T): T {
  const prev = TUNING.engine226;
  TUNING.engine226 = on ? "on" : "off";
  try { return fn(); } finally { TUNING.engine226 = prev; }
}
const DIFFS: DifficultyId[] = ["esordio", "pro", "allstar", "leggenda"];
const PATHS = ["NCAA", "Europa", "G-League"] as const;
const fp = (s: PlayerState) => JSON.stringify([s.seasonHistory, s.choiceLog, s.milestones, s.attrs, s.hidden, s.rngState, s.expOvr, s.overall, s.peakOverall, s.morale, s.coachTrust]);
const opts = (i: number, engineVersion?: string) => ({ seed: (i * 7919 + 13) >>> 0, difficulty: DIFFS[i % 4]!, path: PATHS[i % 3]!, draft: "random" as const, ...(engineVersion ? { engineVersion } : {}) });
function midCareer(engineVersion: string, seasons = 5): PlayerState {
  const job = openCareerSim({ seed: 4242, difficulty: "pro", path: "NCAA", draft: "random", engineVersion });
  for (let k = 0; k < seasons && !advanceCareerSim(job); k++);
  job.s.rngState = job.rng.getState();
  return job.s;
}

test("TUNING.engine226 ships off and gates only 2.26.0+ careers", () => {
  assert.equal(TUNING.engine226, "off");
  assert.equal(usesEngine226({ engineVersion: "2.26.0" }), false);
  with226(true, () => {
    assert.equal(usesEngine226({ engineVersion: "2.24.0-beta" }), false);
    assert.equal(usesEngine226({ engineVersion: "2.25.0" }), false);
    assert.equal(usesEngine226({ engineVersion: "2.26.0" }), true);
    assert.equal(usesCareerState({ engineVersion: "2.26.0" }), true);
    assert.equal(usesDepthMood225({ engineVersion: "2.26.0" }), false);
    assert.equal(usesDepthMood225({ engineVersion: "2.25.0" }), true);
  });
});

test("flag on never reaches live 2.24 or 2.25 careers, and draws nothing from the fallback RNG", () => {
  const before = fallbackDraws();
  for (const v of [undefined, "2.25.0"]) {
    const off = [0, 1, 2, 3].map((i) => fp(with226(false, () => playCareerSim(opts(i, v)))));
    const on = [0, 1, 2, 3].map((i) => fp(with226(true, () => playCareerSim(opts(i, v)))));
    assert.deepEqual(on, off, `engine ${v ?? "live"}`);
  }
  assert.equal(fallbackDraws() - before, 0);
});

test("a 2.26 career with the flag off plays exactly like 2.25 (same seed)", () => {
  for (const i of [0, 1, 2, 3]) {
    const a = playCareerSim(opts(i, "2.25.0"));
    const b = playCareerSim(opts(i, "2.26.0"));
    assert.equal(b.cs, undefined);
    assert.equal(JSON.stringify([a.seasonHistory, a.peakOverall, a.mvpCount]), JSON.stringify([b.seasonHistory, b.peakOverall, b.mvpCount]));
  }
});

test("2.26 on: deterministic per seed, max age 36, state stays inside its caps", () => {
  const before = fallbackDraws();
  for (const i of [0, 1, 2, 3, 4, 5, 6, 7]) {
    const a = with226(true, () => playCareerSim(opts(i, "2.26.0")));
    const b = with226(true, () => playCareerSim(opts(i, "2.26.0")));
    assert.equal(fp(a), fp(b));
    assert.ok(Math.max(...a.seasonHistory.map((r) => r.age)) <= 36);
    const cs = careerStateOf(a);
    const d = CS226.difficulty[a.difficulty];
    assert.equal(a.cs?.v, 1);
    assert.ok(Math.abs(cs.perm) <= d.permCap + 1e-9 && Math.abs(cs.potShift) <= CS226.potential.cap + 1e-9);
    for (const add of Object.values(cs.addByAge ?? {})) assert.ok(Math.abs(add) <= d.totalCap + 1e-9);
    assert.ok(a.peakOverall <= Math.min(99, a.potential + 1.4 + CS226.potential.cap + d.overCap + TUNING.depth225.expCap) + 1);
  }
  assert.equal(fallbackDraws() - before, 0);
});

test("2.26 on: Sixth Man never shares a season with All-Star or All-NBA Third Team", () => {
  let sixth = 0;
  with226(true, () => {
    for (let i = 0; i < 60; i++) {
      const s = playCareerSim(opts(i, "2.26.0"));
      for (const r of s.seasonHistory) {
        if (!r.awards.includes("Sixth Man")) continue;
        sixth++;
        assert.ok(!r.awards.includes("All-Star") && !r.awards.includes("All-NBA Third Team"), `seed ${s.seed} season ${r.season}`);
      }
    }
  });
  assert.ok(sixth > 0, "the sample must contain Sixth Man seasons");
});

test("2.26 lever: Leggenda MVP help is -2.5 (applied in league.ts only with 2.26 on)", () => {
  assert.equal(TUNING.awards226.mvpHelpLeggenda, -2.5);
});

test("Career State save field: JSON round trip, malformed values fall back to a fresh state", () => {
  const s = with226(true, () => playCareerSim(opts(1, "2.26.0")));
  const back = JSON.parse(JSON.stringify(s)) as PlayerState;
  assert.deepEqual(careerStateOf(back), careerStateOf(s));
  const bad = { ...back, cs: { v: 2, perm: "x" } } as unknown as PlayerState;
  assert.deepEqual(careerStateOf(bad), { v: 1, chemAdj: 0, momentum: 50, perm: 0, potShift: 0 });
  const wild = { ...back, cs: { v: 1, perm: 99, potShift: -99, momentum: 500, chemAdj: Number.NaN } } as unknown as PlayerState;
  const cs = careerStateOf(wild);
  assert.equal(cs.perm, 4);
  assert.equal(cs.potShift, -CS226.potential.cap);
  assert.equal(cs.momentum, 100);
  assert.equal(cs.chemAdj, 0);
});

test("choiceMorale: declared morale wins, otherwise implied; capped per event", () => {
  assert.equal(choiceMorale({ morale: 5 }), 5);
  assert.equal(choiceMorale({ morale: 40 }), CS226.eventCap);
  assert.equal(choiceMorale({ form: 10, coachTrust: 10 }), 5);
  assert.equal(choiceMorale({}), 0);
});

test("applyFx: with 2.26 on, morale/coachTrust stop spilling into depth225 form and experience", () => {
  const base = midCareer("2.26.0");
  const fx = { morale: 10, coachTrust: 10, flavor: "" };
  const run = (on: boolean) => with226(on, () => {
    const s = structuredClone(base);
    const f0 = s.form, e0 = s.expOvr ?? 0;
    applyFx(s, fx);
    return { dForm: s.form - f0, dExp: (s.expOvr ?? 0) - e0 };
  });
  const off = run(false), on = run(true);
  assert.ok(off.dForm > 0 && off.dExp !== 0, `off ${JSON.stringify(off)}`);
  assert.equal(on.dForm, 0);
  assert.equal(on.dExp, 0);
});

test("settleCareerMemory and the season sim ignore morale/coachTrust via depth225 with 2.26 on", () => {
  const base = midCareer("2.26.0");
  base.memory = undefined;
  const n = base.season + 1;
  const settle = (on: boolean, mood: number) => with226(on, () => {
    const s = structuredClone(base);
    s.morale = mood; s.coachTrust = mood;
    settleCareerMemory(s, n);
    return JSON.stringify([s.expOvr, s.choiceOvr, s.attrs]);
  });
  assert.notEqual(settle(false, 30), settle(false, 85));
  assert.equal(settle(true, 30), settle(true, 85));
  const season = (on: boolean, morale: number) => with226(on, () => {
    const s = structuredClone(base);
    s.morale = morale;
    s.season = n;
    const row = simulateRegularSeason(s, n);
    return JSON.stringify([row.min, row.ppg, row.rpg, row.apg]);
  });
  assert.notEqual(season(false, 25), season(false, 90));
  assert.equal(season(true, 25), season(true, 90));
});
