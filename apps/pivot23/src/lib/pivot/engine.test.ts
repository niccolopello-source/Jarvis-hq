import assert from "node:assert/strict";
import test from "node:test";
import { ARCHIVE_KEY, eventAfterMarket, isPlayoffSeed, loadArchive, openCareerSim, playCareerSim, saveArchive, simulateFullCareer, toArchive, withPlayer } from "./engine";
import { EURO_TITLE_LINES, playoffSeriesFormat, SERIES_WIN_LINES, seriesWinProbability, simulateSeries } from "./league";
import { clearLive, loadLive, SAVE_KEY, saveLive, buildLiveSave } from "./save";

const demoCareer = {
  name: "Giulia Rossi",
  role: "PG" as const,
  nationality: "ITA",
  number: 23,
  difficulty: "pro" as const,
  path: "NCAA" as const,
  seed: 230023,
};

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  throwOnWrite = false;
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) {
    if (this.throwOnWrite) throw new DOMException("Storage full", "QuotaExceededError");
    this.values.set(key, String(value));
  }
}

function installMemoryStorage() {
  const localDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const sessionDescriptor = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  const local = new MemoryStorage();
  const session = new MemoryStorage();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: local });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: session });
  return {
    local,
    restore() {
      clearLive();
      if (localDescriptor) Object.defineProperty(globalThis, "localStorage", localDescriptor);
      else Reflect.deleteProperty(globalThis, "localStorage");
      if (sessionDescriptor) Object.defineProperty(globalThis, "sessionStorage", sessionDescriptor);
      else Reflect.deleteProperty(globalThis, "sessionStorage");
    },
  };
}

test("a seeded career reaches a valid final state", () => {
  const player = playCareerSim(demoCareer);

  assert.equal(player.name, demoCareer.name);
  assert.equal(player.role, demoCareer.role);
  assert.equal(player.simulated, true);
  assert.ok(player.seasonHistory.length > 0);
  assert.ok(player.seasonHistory.length <= 20);
  assert.ok(player.age >= 20 && player.age <= 36);
  assert.ok(Number.isFinite(player.overall));
  assert.ok(player.overall >= 48 && player.overall <= 99);
  assert.ok(player.team.name.length > 0);
});

test("the same career seed produces the same demo summary", () => {
  const first = simulateFullCareer(demoCareer);
  const second = simulateFullCareer(demoCareer);

  assert.deepEqual(second, first);
});

test("career simulations stay within valid bounds across all entry paths", () => {
  for (const path of ["NCAA", "Europa", "G-League"] as const) {
    for (const seed of [1, 23, 987654321]) {
      const player = playCareerSim({ ...demoCareer, path, seed });
      assert.ok(player.seasonHistory.length > 0, `${path} seed ${seed} has no seasons`);
      assert.ok(player.seasonHistory.length <= 20, `${path} seed ${seed} exceeded career limit`);
      assert.ok(player.age >= 20 && player.age <= 36, `${path} seed ${seed} has invalid age`);
      assert.ok(Number.isFinite(player.overall), `${path} seed ${seed} has invalid overall`);
      for (const [index, season] of player.seasonHistory.entries()) {
        for (const field of ["age", "overall", "gp", "wins", "losses", "ppg", "rpg", "apg"] as const) {
          assert.ok(Number.isFinite(season[field]), `${path} seed ${seed} season ${index + 1} has invalid ${field}`);
        }
      }
    }
  }
});

test("playoff formats match the league and round", () => {
  assert.deepEqual(playoffSeriesFormat("NBA", 0), {
    winsNeeded: 4,
    maxGames: 7,
    homeCourtBySeed: true,
  });
  assert.deepEqual(playoffSeriesFormat("EuroLega", 0), {
    winsNeeded: 3,
    maxGames: 5,
    homeCourtBySeed: true,
  });
  assert.deepEqual(playoffSeriesFormat("EuroLega", 1), {
    winsNeeded: 1,
    maxGames: 1,
    homeCourtBySeed: false,
  });
  assert.deepEqual(playoffSeriesFormat("EuroLega", 2), {
    winsNeeded: 1,
    maxGames: 1,
    homeCourtBySeed: false,
  });
});

test("playoff qualification requires a valid seed in the bracket", () => {
  assert.equal(isPlayoffSeed(1), true);
  assert.equal(isPlayoffSeed(8), true);
  assert.equal(isPlayoffSeed(9), false);
  assert.equal(isPlayoffSeed(0), false);
  assert.equal(isPlayoffSeed(null), false);
  assert.equal(isPlayoffSeed(undefined), false);
});

test("playoff series stop as soon as a team reaches the required wins", () => {
  const sweep = (league: "NBA" | "EuroLega", round: number) =>
    simulateSeries(playoffSeriesFormat(league, round).winsNeeded, playoffSeriesFormat(league, round), league === "EuroLega", 1, 8, () => 0);

  const nba = sweep("NBA", 0);
  assert.equal(nba.wins, 4);
  assert.equal(nba.losses, 0);
  assert.equal(nba.games.length, 4);

  const euroQuarterfinal = sweep("EuroLega", 0);
  assert.equal(euroQuarterfinal.wins, 3);
  assert.equal(euroQuarterfinal.losses, 0);
  assert.equal(euroQuarterfinal.games.length, 3);

  const euroFinalFour = sweep("EuroLega", 1);
  assert.equal(euroFinalFour.wins, 1);
  assert.equal(euroFinalFour.losses, 0);
  assert.equal(euroFinalFour.games.length, 1);
});

test("a neutral Final Four game does not receive a seed-based home bonus", () => {
  const format = playoffSeriesFormat("EuroLega", 2);
  const result = simulateSeries(0.5, format, true, 1, 8, () => 0.52);

  assert.equal(result.wins, 0);
  assert.equal(result.losses, 1);
  assert.equal(result.games.length, 1);
});

test("series probability respects neutral games, home court and stronger per-game odds", () => {
  const euroFinal = playoffSeriesFormat("EuroLega", 2);
  const nba = playoffSeriesFormat("NBA", 0);

  assert.equal(seriesWinProbability(0.37, euroFinal, 1, 8), 0.37);
  assert.ok(seriesWinProbability(0.5, nba, 1, 8) > 0.5);
  assert.ok(Math.abs(seriesWinProbability(0.5, nba, 1, 8) + seriesWinProbability(0.5, nba, 8, 1) - 1) < 1e-12);
  assert.ok(seriesWinProbability(0.5, nba, 1, 8) > seriesWinProbability(0.5, nba, 8, 1));
  assert.ok(seriesWinProbability(0.6, nba, 4, 5) > seriesWinProbability(0.5, nba, 4, 5));
});

test("playoff copy does not claim a fixed series length or an NBA ring in EuroLeague", () => {
  assert.ok(SERIES_WIN_LINES.every((line) => !/quattro vittorie|quattro sere/i.test(line)));
  assert.ok(EURO_TITLE_LINES.every((line) => !/anello|giugno|sette/i.test(line)));
});

test("a long career save reloads without losing its final season", () => {
  const storage = installMemoryStorage();
  try {
    clearLive();
    const player = playCareerSim(demoCareer);
    assert.equal(saveLive({
      player,
      pending: null,
      log: [],
      screen: "career",
      tab: "career",
      logSeq: player.seasonHistory.length,
    }), true);

    const raw = storage.local.getItem(SAVE_KEY);
    assert.ok(raw);
    const loaded = loadLive();
    assert.ok(loaded);
    assert.equal(loaded.screen, "career");
    assert.equal(loaded.player.seed, player.seed);
    assert.equal(loaded.player.seasonHistory.length, player.seasonHistory.length);
    assert.equal(loaded.player.seasonHistory.at(-1)?.season, player.seasonHistory.at(-1)?.season);
    assert.equal(loaded.player.seasonHistory.at(-1)?.overall, player.seasonHistory.at(-1)?.overall);
    assert.equal(loaded.player.seasonHistory.at(-1)?.ppg, player.seasonHistory.at(-1)?.ppg);
  } finally {
    storage.restore();
  }
});

test("a completed long career is archived and duplicate saves are collapsed", () => {
  const storage = installMemoryStorage();
  try {
    clearLive();
    const entry = toArchive(playCareerSim(demoCareer));
    saveArchive(entry);
    const returned = saveArchive(entry);
    const raw = storage.local.getItem(ARCHIVE_KEY);

    assert.ok(raw);
    assert.equal(JSON.parse(raw).length, 1);
    assert.equal(returned.length, 1);
    assert.equal(loadArchive()[0]?.id, entry.id);
    assert.equal(loadArchive()[0]?.seasons, entry.seasons);
  } finally {
    storage.restore();
  }
});

test("finishing a career does not crash when the browser refuses archive writes", () => {
  const storage = installMemoryStorage();
  try {
    clearLive();
    storage.local.throwOnWrite = true;
    const entry = toArchive(playCareerSim(demoCareer));
    const returned = saveArchive(entry);

    assert.equal(returned[0]?.id, entry.id);
    assert.equal(loadArchive()[0]?.name, entry.name);
  } finally {
    storage.restore();
  }
});

test("a corrupted browser save is ignored instead of crashing startup", () => {
  const storage = installMemoryStorage();
  try {
    clearLive();
    storage.local.setItem(SAVE_KEY, "{ broken json");
    assert.equal(loadLive(), null);
  } finally {
    storage.restore();
  }
});

test("a live save without a valid fingerprint is not reopened", () => {
  const storage = installMemoryStorage();
  try {
    clearLive();
    const player = playCareerSim(demoCareer);
    const payload = buildLiveSave(player, null, [], "career", "career", player.seasonHistory.length);
    const good = JSON.stringify(payload);
    storage.local.setItem(SAVE_KEY, good);
    globalThis.sessionStorage.setItem(SAVE_KEY, good);
    const loaded = loadLive();
    assert.ok(loaded);
    assert.equal(loaded.player.seed, player.seed);

    clearLive();
    const stripped = JSON.parse(good) as { c?: string };
    delete stripped.c;
    const missing = JSON.stringify(stripped);
    storage.local.setItem(SAVE_KEY, missing);
    globalThis.sessionStorage.setItem(SAVE_KEY, missing);
    assert.equal(loadLive(), null);

    clearLive();
    stripped.c = "ffffffffffffffff";
    const wrong = JSON.stringify(stripped);
    storage.local.setItem(SAVE_KEY, wrong);
    globalThis.sessionStorage.setItem(SAVE_KEY, wrong);
    assert.equal(loadLive(), null);
  } finally {
    storage.restore();
  }
});

test("the simulator offers the same scripted seasons as the game", () => {
  const player = playCareerSim(demoCareer);
  const titleAt = (season: number) => player.choiceLog.find((c) => c.season === season)?.title ?? "";
  assert.equal(titleAt(1), "La corsa alla matricola dell'anno");
  assert.match(titleAt(6), /^Lo scontro con /);
  assert.equal(titleAt(8), "Un infortunio serio");
  assert.equal(titleAt(10), "Convocazione internazionale");
});

test("a trade follow-up keeps the scripted card of that season", () => {
  const job = openCareerSim({ ...demoCareer, seed: 3017, role: "SF", path: "G-League" });
  job.s.season = 8;
  const followed = withPlayer(job.s, () => eventAfterMarket(job.s));
  assert.equal(followed.script, "injury");
  assert.equal(followed.event.title, "Un infortunio serio");
  job.s.season = 5;
  const pool = withPlayer(job.s, () => eventAfterMarket(job.s));
  assert.equal(pool.script === "injury" || pool.script === "rival" || pool.script === "nation", false);
});

test("season 12 does not open with a preseason trade", () => {
  const player = playCareerSim({ ...demoCareer, seed: 3017, role: "SF", path: "G-League" });
  assert.equal(
    player.choiceLog.some((c) => c.season === 12 && c.title === "Scambio"),
    false,
  );
});

test("a free-agent summer does not also force a trade", () => {
  const player = playCareerSim({ ...demoCareer, seed: 3017, role: "SF", path: "G-League" });
  const by = new Map<number, string[]>();
  for (const c of player.choiceLog) {
    const bag = by.get(c.season) ?? [];
    bag.push(c.title);
    by.set(c.season, bag);
  }
  for (const titles of by.values()) {
    assert.equal(titles.includes("Agenzia libera") && titles.includes("Scambio estivo"), false);
  }
});

test("the same seed replays the same career", () => {
  const opts = { ...demoCareer, seed: 884122, role: "C" as const, path: "Europa" as const, difficulty: "leggenda" as const };
  const a = playCareerSim(opts);
  const b = playCareerSim(opts);
  const line = (c: { season: number; title: string; pick: string }) => `${c.season}:${c.title}:${c.pick}`;
  assert.deepEqual(a.choiceLog.map(line), b.choiceLog.map(line));
  assert.deepEqual(
    a.seasonHistory.map((r) => r.gp),
    b.seasonHistory.map((r) => r.gp),
  );
  assert.equal(a.mvpCount, b.mvpCount);
  assert.equal(a.titleCount, b.titleCount);
  assert.equal(a.injuryDrag, b.injuryDrag);
});

test("an already-won MVP or title makes the next one less common on Esordio", () => {
  const n = 2000;
  let maxMvp = 0;
  let titles6 = 0;
  let anyMvp = 0;
  let still36 = 0;
  for (let i = 0; i < n; i++) {
    const role = (["PG", "SG", "SF", "PF", "C"] as const)[i % 5];
    const path = (["NCAA", "Europa", "G-League"] as const)[i % 3];
    const player = playCareerSim({
      name: "Repro",
      role,
      nationality: "ITA",
      number: 23,
      difficulty: "esordio",
      path,
      seed: (i + 1) * 1000 + 3,
      draft: "random",
    });
    maxMvp = Math.max(maxMvp, player.mvpCount);
    if (player.titleCount >= 6) titles6 += 1;
    if (player.mvpCount > 0) anyMvp += 1;
    if (player.age >= 36) still36 += 1;
  }
  assert.ok(maxMvp <= 6, `max MVP ${maxMvp}`);
  assert.ok(titles6 / n < 0.02, `six-title share ${titles6 / n}`);
  assert.ok(anyMvp > 0, "MVP disappeared");
  assert.ok(still36 === n, "age-36 path was removed");
});
