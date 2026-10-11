import assert from "node:assert/strict";
import test from "node:test";
import { advanceCareerSim, ENGINE_VERSION, openCareerSim, playCareerSim } from "./engine.ts";
import { createRng } from "./rng.ts";
import { buildLiveSave } from "./save.ts";
import { BALANCE_SINCE, dpoyStreakStepOf, LEGACY_DPOY_STREAK_STEP, versionAtLeast, versionCore, worldOf, WORLD_SINCE, dpoyFatigueOf, LEGACY_RULES, resetTuning, scriptSlotFor, scriptWindowsOf, TUNING, TUNING_DEFAULTS, usesBalance } from "./tuning.ts";
import type { PlayerState } from "./types.ts";

/* Same seed => same career, under shipped settings and under every balance experiment. */

const DIFFS = ["esordio", "pro", "allstar", "leggenda"] as const;

function fingerprint(s: PlayerState) {
  return JSON.stringify({
    created: [s.name, s.role, s.potential, s.hidden, s.draftPick, s.startAge, s.apexAge],
    progression: s.seasonHistory.map((r) => [r.age, r.overall, r.ppg, r.rpg, r.apg, r.teamAbbr]),
    events: s.usedEventIds,
    choices: s.choiceLog,
    awards: s.seasonHistory.map((r) => r.awards),
    standings: s.seasonHistory.map((r) => [r.wins, r.losses, r.league?.east?.map((x) => x.abbr), r.league?.west?.map((x) => x.abbr)]),
    playoffs: s.seasonHistory.map((r) => r.playoff),
    champions: s.championLog,
    retirement: [s.age, s.seasonHistory.at(-1)?.age, s.seasonHistory.length],
  });
}

test("tuning defaults: D-09, D-11 and D-23 on, every other experiment on the shipped rule", () => {
  assert.deepEqual({ ...TUNING }, { ...TUNING_DEFAULTS });
  assert.equal(TUNING_DEFAULTS.scriptWindows, "seeded");
  assert.equal(TUNING_DEFAULTS.dpoyFatigue, "streak");
  assert.equal(TUNING_DEFAULTS.world, "regress"); // D-09, gated on WORLD_SINCE
  for (const key of ["retirement", "bust", "rolePeak"] as const) assert.equal(TUNING_DEFAULTS[key], "current", key);
  assert.equal(TUNING_DEFAULTS.dpoyMinGames.NBA, 58, "DPOY games threshold unchanged");
  // The pre-2.12 calendar is still available, for careers created before the change.
  for (let seed = 1; seed < 50; seed++) {
    const slots = Array.from({ length: 20 }, (_, i) => scriptSlotFor(seed, i + 1, "fixed"));
    assert.deepEqual(
      slots.map((x, i) => (x ? `${i + 1}:${x}` : null)).filter(Boolean),
      ["1:rookie", "6:rival", "8:injury", "10:nation"],
    );
  }
});

test("careers created before BALANCE_SINCE keep the rules they started with", () => {
  for (const v of ["2.11.0-beta", "2.10.3", "1.0.0", "", "garbage"]) {
    assert.equal(usesBalance({ engineVersion: v }), false, v);
    assert.equal(scriptWindowsOf({ engineVersion: v }), LEGACY_RULES.scriptWindows, v);
    assert.equal(dpoyFatigueOf({ engineVersion: v }), LEGACY_RULES.dpoyFatigue, v);
  }
  assert.equal(usesBalance({}), false, "missing version");
  for (const v of [BALANCE_SINCE, `${BALANCE_SINCE}-beta`, "2.12.1", "2.13.0", "3.0.0"]) {
    assert.equal(usesBalance({ engineVersion: v }), true, v);
    assert.equal(scriptWindowsOf({ engineVersion: v }), "seeded", v);
    assert.equal(dpoyFatigueOf({ engineVersion: v }), "streak", v);
  }
  const fresh = playCareerSim({ seed: 7300, difficulty: "pro" });
  assert.equal(usesBalance(fresh), true, "new careers use the new rules");
});

test("seeded story windows keep order, stay distinct and depend only on the seed", () => {
  try {
    for (const mode of ["seeded", "seeded-wide"] as const) {
      TUNING.scriptWindows = mode;
      const tuples = new Set<string>();
      for (let seed = 1; seed < 400; seed++) {
        const at = (slot: string) => Array.from({ length: 20 }, (_, i) => i + 1).filter((n) => scriptSlotFor(seed, n) === slot);
        const [r, i, n] = [at("rival"), at("injury"), at("nation")];
        assert.equal(r.length, 1);
        assert.equal(i.length, 1);
        assert.equal(n.length, 1);
        assert.ok(r[0]! > 1 && r[0]! < i[0]! && i[0]! < n[0]! && n[0]! <= 12, `${mode} seed ${seed}: ${r}/${i}/${n}`);
        assert.deepEqual(at("rival"), r, "stable for the same seed");
        tuples.add(`${r}/${i}/${n}`);
      }
      assert.ok(tuples.size > 5, `${mode}: schedules vary (${tuples.size})`);
    }
  } finally {
    resetTuning();
  }
});

test("same seed gives an identical career on every difficulty", () => {
  for (const [i, difficulty] of DIFFS.entries()) {
    const a = playCareerSim({ seed: 5000 + i, difficulty });
    const b = playCareerSim({ seed: 5000 + i, difficulty });
    assert.equal(fingerprint(a), fingerprint(b), difficulty);
  }
});

test("same seed stays identical under each balance experiment", () => {
  const variants: Partial<typeof TUNING>[] = [
    { scriptWindows: "seeded" }, { scriptWindows: "seeded-wide" }, { retirement: "graded" }, { retirement: "path" },
    { bust: "choices" }, { bust: "events" }, { world: "jitter" }, { world: "regress" },
    { dpoyFatigue: "steeper" }, { dpoyFatigue: "streak" }, { rolePeak: "fit" }, { rolePeak: "fit-strong" },
  ];
  try {
    for (const v of variants) {
      resetTuning();
      Object.assign(TUNING, v);
      const a = playCareerSim({ seed: 7100, difficulty: "pro" });
      const b = playCareerSim({ seed: 7100, difficulty: "pro" });
      assert.equal(fingerprint(a), fingerprint(b), JSON.stringify(v));
    }
  } finally {
    resetTuning();
  }
});

test("save and resume mid-career reproduces the uninterrupted career", () => {
  for (const [i, difficulty] of DIFFS.entries()) {
    const seed = 6100 + i;
    const opts = { seed, difficulty, name: "Det", nationality: "Italia", number: 23, role: "SF" as const, path: "NCAA" as const };
    const ref = openCareerSim(opts);
    while (!advanceCareerSim(ref)) { /* run to the end */ }
    for (const stop of [1, 4, 9]) {
      const job = openCareerSim(opts);
      let done = false;
      for (let k = 0; k < stop && !done; k++) done = advanceCareerSim(job);
      job.s.rngState = job.rng.getState();
      const saved = JSON.parse(JSON.stringify(buildLiveSave(job.s, null, [], "career", "log", 1))) as { player: PlayerState };
      const rng = createRng(seed);
      rng.setState(saved.player.rngState!);
      const resumed = { ...job, rng, s: saved.player };
      while (!advanceCareerSim(resumed)) { /* continue */ }
      assert.equal(fingerprint(resumed.s), fingerprint(ref.s), `${difficulty} stop ${stop}`);
    }
  }
});

test("the reader's language never changes the career or the save", async () => {
  const { getLang, setLang } = await import("./i18n.ts");
  const before = getLang();
  try {
    for (const [i, difficulty] of DIFFS.entries()) {
      const opts = { seed: 7300 + i, difficulty, name: "Lang", nationality: "Italia", number: 7, role: "PG" as const, path: "NCAA" as const };
      const run = (lang: "it" | "en") => {
        setLang(lang);
        const job = openCareerSim(opts);
        while (!advanceCareerSim(job)) { /* run to the end */ }
        job.s.rngState = job.rng.getState();
        const save = JSON.parse(JSON.stringify(buildLiveSave(job.s, null, [], "career", "log", 1))) as { player: PlayerState & { lang?: string }; c?: string };
        delete save.player.lang;
        delete (save.player as { careerId?: string }).careerId; // random per career, by design
        delete save.c;
        return { fp: fingerprint(job.s), save: JSON.stringify(save) };
      };
      const it = run("it");
      const en = run("en");
      assert.equal(en.fp, it.fp, difficulty);
      assert.equal(en.save, it.save, `${difficulty}: stored text is canonical Italian in both languages`);
    }
  } finally {
    setLang(before);
  }
});

test("version gate: pre-release counts as its release, unreadable counts as older", () => {
  assert.deepEqual(versionCore("2.13.0-beta"), [2, 13, 0]);
  assert.deepEqual(versionCore(" v2.13 "), [2, 13, 0]);
  assert.deepEqual(versionCore("2.13.0-rc.1+abc"), [2, 13, 0]);
  for (const bad of [undefined, null, 213, "", "beta", "2", "2.x.0", "2.13.0beta"]) assert.equal(versionCore(bad), null, String(bad));
  assert.equal(versionAtLeast("2.13.0-beta", "2.13.0"), true);
  assert.equal(versionAtLeast("2.13.1", "2.13.0"), true);
  assert.equal(versionAtLeast("2.12.9", "2.13.0"), false);
  assert.equal(versionAtLeast("2.12.0-beta", "2.13.0"), false);
  assert.equal(versionAtLeast("10.0.0", "2.13.0"), true, "numeric, not lexicographic");
  assert.equal(versionAtLeast("garbage", "2.13.0"), false);
});

test("D-09 world rule: only careers created by WORLD_SINCE or later regress", () => {
  assert.equal(versionAtLeast(ENGINE_VERSION, WORLD_SINCE), true, "new careers get D-09");
  assert.equal(versionAtLeast(ENGINE_VERSION, BALANCE_SINCE), true, "new careers keep D-11/D-23");
  for (const v of ["2.11.0-beta", "2.12.0-beta", "2.12.0", "", undefined]) assert.equal(worldOf({ engineVersion: v }), "current", String(v));
  for (const v of ["2.13.0-beta", "2.13.0", "3.0.0"]) assert.equal(worldOf({ engineVersion: v }), "regress", v);
});

test("D-23 step: 0.16 from 2.13.0, live 2.12 careers keep 0.12", () => {
  for (const v of ["2.12.0-beta", "2.12.0", undefined]) assert.equal(dpoyStreakStepOf({ engineVersion: v }), LEGACY_DPOY_STREAK_STEP, String(v));
  assert.equal(LEGACY_DPOY_STREAK_STEP, 0.12);
  for (const v of ["2.13.0-beta", "2.13.0"]) assert.equal(dpoyStreakStepOf({ engineVersion: v }), 0.16, v);
});
