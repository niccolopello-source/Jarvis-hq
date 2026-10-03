import assert from "node:assert/strict";
import test from "node:test";
import { acceptForcedPreseasonTrade, acceptForcedSummerTrade, acceptTrade, allDraftRounds, applyAutoOffseason, applyDraftCard, applyFx, ARCHIVE_KEY, buildTradeOffer, careerEndAge, eventAfterMarket, finishDraft, freshPlayer, isArchivePersisted, isCareerOver, isPlayoffSeed, loadArchive, offseasonStep, openCareerSim, playCareerSim, recordRetirementChoice, revealDraftLanding, saveArchive, shouldOfferExtraYear, simulateFullCareer, simulateRegularSeason, startProPath, storyEventById, toArchive, withPlayer } from "./engine";
import { COACH_NAMES, RIVAL_NAMES } from "./data";
import { pick, rand } from "./rng";
import { NBA_TEAMS } from "./teams";
import { fingerprintOf, sha256 } from "./card";
import { SAVE_VERSION } from "./config";
import { EURO_TITLE_LINES, playoffSeriesFormat, SERIES_WIN_LINES, seriesWinProbability, simulateSeries } from "./league";
import { careerCommentary } from "./legacy";
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
    session,
    restore() {
      clearLive();
      if (localDescriptor) Object.defineProperty(globalThis, "localStorage", localDescriptor);
      else Reflect.deleteProperty(globalThis, "localStorage");
      if (sessionDescriptor) Object.defineProperty(globalThis, "sessionStorage", sessionDescriptor);
      else Reflect.deleteProperty(globalThis, "sessionStorage");
    },
  };
}

function resetArchive(storage: ReturnType<typeof installMemoryStorage>) {
  storage.local.setItem(ARCHIVE_KEY, "[]");
  storage.session.setItem(ARCHIVE_KEY, "[]");
  loadArchive();
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
  assert.equal(simulateFullCareer(demoCareer).ageEnd, careerEndAge(player));
});

test("the same career seed produces the same demo summary", () => {
  const first = simulateFullCareer(demoCareer);
  const second = simulateFullCareer(demoCareer);
  const otherSeed = simulateFullCareer({ ...demoCareer, seed: demoCareer.seed + 1 });

  assert.deepEqual(second, first);
  assert.notDeepEqual(otherSeed, first, "different seeds should be able to produce different career outcomes");
});

test("late viability loss or serious injury ends a career while an eligible age-35 player can continue to a recorded age-36 season", () => {
  const healthy = playCareerSim({ ...demoCareer, seed: 73117 });
  const at33 = {
    ...healthy,
    age: 33,
    injuryDrag: 0,
    seasonHistory: [...healthy.seasonHistory.slice(0, -1), { ...healthy.seasonHistory.at(-1)!, age: 33, min: 18 }],
  };
  assert.equal(isCareerOver(at33), false);
  assert.equal(isCareerOver({ ...at33, injuryDrag: 2.5 }), true);
  assert.equal(isCareerOver({
    ...at33,
    seasonHistory: [...at33.seasonHistory.slice(0, -1), { ...at33.seasonHistory.at(-1)!, min: 11.5 }],
  }), true);

  const healthyAt35 = {
    ...at33,
    age: 35,
    seasonHistory: [...at33.seasonHistory.slice(0, -1), { ...at33.seasonHistory.at(-1)!, age: 35, min: 18 }],
  };
  assert.equal(isCareerOver(healthyAt35), false);
  assert.equal(shouldOfferExtraYear(healthyAt35), true);
  const enteringFinalSeason = { ...healthyAt35, age: 36, extraSeason: true };
  assert.equal(isCareerOver(enteringFinalSeason), false);
  assert.equal(isCareerOver({
    ...enteringFinalSeason,
    seasonHistory: [...enteringFinalSeason.seasonHistory, { ...enteringFinalSeason.seasonHistory.at(-1)!, age: 36 }],
  }), true);
});

test("retirement and forced summer-trade transitions preserve their visible action in choiceLog", () => {
  const player = playCareerSim(demoCareer);
  player.age = 35;
  player.season = 15;
  const retirementChoice = structuredClone(player);
  recordRetirementChoice(retirementChoice, false);
  assert.deepEqual(retirementChoice.choiceLog.at(-1), { season: 15, title: "Ritiro", pick: "Chiudi ora" });
  const extraSeasonChoice = structuredClone(player);
  recordRetirementChoice(extraSeasonChoice, true);
  assert.deepEqual(extraSeasonChoice.choiceLog.at(-1), { season: 15, title: "Ritiro", pick: "Gioca a 36 anni" });

  const tradeOffer = withPlayer(player, () => buildTradeOffer(player));
  const from = player.team.name;
  const tradedFrom = acceptForcedSummerTrade(player, tradeOffer.team, 15);
  assert.equal(tradedFrom, from);
  assert.equal(player.team.name, tradeOffer.team.name);
  assert.deepEqual(player.choiceLog.at(-1), {
    season: 15,
    title: "Scambio estivo",
    pick: `${from} → ${tradeOffer.team.name}`,
  });

  const preseason = structuredClone(playCareerSim({ ...demoCareer, seed: 230024 }));
  const preFrom = preseason.team.name;
  const preOffer = withPlayer(preseason, () => buildTradeOffer(preseason));
  acceptForcedPreseasonTrade(preseason, preOffer.team, 4);
  assert.deepEqual(preseason.choiceLog.at(-1), {
    season: 4,
    title: "Scambio",
    pick: `${preFrom} → ${preOffer.team.name}`,
  });
});

test("the final season is played once and then the career closes", () => {
  const player = playCareerSim({ ...demoCareer, seed: 73117 });
  const last = player.seasonHistory.at(-1)!;
  const at35 = {
    ...player,
    age: 35,
    extraSeason: false,
    injuryDrag: 0,
    seasonHistory: [...player.seasonHistory.slice(0, -1), { ...last, age: 35, min: 18 }],
  };
  assert.equal(offseasonStep(at35), "offer");
  const accepted = { ...at35, extraSeason: true };
  assert.equal(offseasonStep(accepted), "summer");
  applyAutoOffseason(accepted, accepted.season);
  assert.equal(accepted.age, 36);
  assert.equal(offseasonStep(accepted), "play-final");
  simulateRegularSeason(accepted, accepted.season + 1);
  assert.equal(accepted.seasonHistory.at(-1)?.age, 36);
  assert.equal(offseasonStep(accepted), "finish");
  assert.equal(isCareerOver(accepted), true);
});

test("the same seed and the same draft picks open the same career", () => {
  const open = (seed: number) => {
    const player = freshPlayer("Stesso", "PG", "ITA", 23, "pro", seed);
    withPlayer(player, () => {
      player.rivalName = pick(RIVAL_NAMES);
      player.coachName = pick(COACH_NAMES);
    });
    while (player.round < allDraftRounds().length) applyDraftCard(player, player.round, 0);
    finishDraft(player);
    const landed = withPlayer(player, () => {
      startProPath(player, "NCAA");
      return revealDraftLanding(player);
    });
    return {
      team: player.team.abbr,
      pick: landed.pick,
      rival: player.rivalName,
      coach: player.coachName,
      overall: player.overall,
      rng: player.rngState,
    };
  };
  assert.deepEqual(open(884122), open(884122));
  assert.notDeepEqual(open(884122), open(884123));
});

test("a market move stays on the career seed even if the fallback RNG was used", () => {
  const boot = (seed: number) => {
    const player = freshPlayer("Market", "SF", "USA", 7, "pro", seed);
    withPlayer(player, () => {
      player.rivalName = pick(RIVAL_NAMES);
      player.coachName = pick(COACH_NAMES);
    });
    while (player.round < allDraftRounds().length) applyDraftCard(player, player.round, 0);
    finishDraft(player);
    withPlayer(player, () => {
      startProPath(player, "NCAA");
      revealDraftLanding(player);
    });
    return player;
  };
  const left = boot(44110);
  const right = boot(44110);
  const dest = NBA_TEAMS.find((team) => team.abbr !== left.team.abbr);
  assert.ok(dest);
  rand();
  acceptTrade(left, dest);
  rand();
  rand();
  acceptTrade(right, dest);
  assert.equal(left.team.abbr, right.team.abbr);
  assert.equal(left.rngState, right.rngState);
  assert.deepEqual(
    left.world?.stars.map((star) => `${star.name}:${star.teamAbbr}:${star.retired}`),
    right.world?.stars.map((star) => `${star.name}:${star.teamAbbr}:${star.retired}`),
  );
});

test("identical seed, state, and choices repeat the draft team, trade offer, and narrative effect", () => {
  const replay = (seed: number) => {
    const player = freshPlayer("Det", "PG", "ITA", 23, "pro", seed);
    while (player.round < allDraftRounds().length) applyDraftCard(player, player.round, 0);
    finishDraft(player);
    const landed = withPlayer(player, () => {
      startProPath(player, "NCAA");
      return revealDraftLanding(player);
    });
    const offer = buildTradeOffer(player);
    const effect = withPlayer(player, () => {
      const event = storyEventById(player, "an5");
      const fx = event.choices[0]!.fx(player);
      applyFx(player, fx);
      return {
        flavor: fx.flavor,
        coach: player.coachName,
        overall: player.overall,
        shooting: player.attrs.shooting,
        rng: player.rngState,
      };
    });
    return {
      seed: player.seed,
      engine: player.engineVersion,
      careerId: player.careerId,
      draftTeam: landed.team.abbr,
      draftPick: landed.pick,
      tradeTeam: offer.team.abbr,
      tradePitch: offer.pitch,
      effect,
    };
  };

  const left = replay(90210);
  rand();
  rand();
  rand();
  const right = replay(90210);
  assert.notEqual(left.careerId, right.careerId);
  assert.equal(left.seed, right.seed);
  assert.ok(left.effect.coach.length > 0);
  assert.match(left.effect.flavor, new RegExp(left.effect.coach));
  const comparable = ({ careerId: _careerId, ...rest }: ReturnType<typeof replay>) => rest;
  assert.deepEqual(comparable(left), comparable(right));
  assert.notDeepEqual(replay(90210).draftTeam + replay(90210).effect.coach, replay(90211).draftTeam + replay(90211).effect.coach);
});

test("1,000 Pro careers meet the P0-LIFE age distribution without changing the peak window", () => {
  const careers = Array.from({ length: 1000 }, (_, i) =>
    playCareerSim({
      name: "P0-LIFE",
      role: (["PG", "SG", "SF", "PF", "C"] as const)[i % 5],
      nationality: "ITA",
      number: 23,
      difficulty: "pro",
      path: (["NCAA", "Europa", "G-League"] as const)[i % 3],
      seed: (i + 1) * 1000 + 17,
      draft: "random",
    }),
  );
  const endingAges = careers.map(careerEndAge);
  const early = careers.filter((career) => careerEndAge(career) < 34);

  assert.ok(early.length >= 150, `${early.length}/1000 ended before age 34`);
  assert.ok(endingAges.some((age) => age === 36), "no career reached age 36");
  assert.ok(endingAges.every((age, i) => age === careers[i]?.seasonHistory.at(-1)?.age),
    "career ending age differs from the last recorded season");
  assert.ok(new Set(endingAges).size > 1, `all careers ended at age ${endingAges[0]}`);
  assert.ok(careers.every((career) => career.apexAge >= 26 && career.apexAge <= 28), "peak age left 26–28");
  assert.ok(early.every((career) => career.injuryDrag >= 2.5 || (career.seasonHistory.at(-1)?.min ?? Number.POSITIVE_INFINITY) <= 11.5));
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

test("an NBA best-of-seven series completes Game 7 and records a 4–3 result", () => {
  const outcomes = [true, false, true, false, true, false, true];
  let draw = 0;
  const result = simulateSeries(0.5, playoffSeriesFormat("NBA", 0), false, 1, 8, () => {
    const slot = draw++ % 3;
    const game = Math.floor((draw - 1) / 3);
    if (slot !== 0) return 0.5;
    return outcomes[game] ? 0 : 0.99;
  });

  assert.equal(result.games.length, 7);
  assert.equal(result.wins, 4);
  assert.equal(result.losses, 3);
  assert.equal(result.games.at(-1)?.n, 7);
  assert.equal(result.games.at(-1)?.win, true);
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

test("same-seed legacy checksums cannot hide an incomplete PlayerState", () => {
  const storage = installMemoryStorage();
  try {
    clearLive();
    const player = playCareerSim(demoCareer);
    const payload = buildLiveSave(player, null, [], "career", "career", player.seasonHistory.length);
    const partial = JSON.parse(JSON.stringify(payload)) as { player: Record<string, unknown>; c?: string };
    delete partial.player.attrs;
    partial.c = sha256(`${payload.player.seed}:${payload.logSeq}:${payload.player.rngState}`).slice(0, 16);
    const encoded = JSON.stringify(partial);
    storage.local.setItem(SAVE_KEY, encoded);
    globalThis.sessionStorage.setItem(SAVE_KEY, encoded);

    assert.equal(loadLive(), null);
  } finally {
    storage.restore();
  }
});

test("new live-save checksum covers gameplay payload fields", () => {
  const storage = installMemoryStorage();
  try {
    clearLive();
    const player = playCareerSim(demoCareer);
    const payload = buildLiveSave(player, null, [], "career", "career", player.seasonHistory.length);
    const changed = { ...payload, player: { ...payload.player, overall: payload.player.overall + 1 } };
    const encoded = JSON.stringify(changed);
    storage.local.setItem(SAVE_KEY, encoded);
    globalThis.sessionStorage.setItem(SAVE_KEY, encoded);

    assert.equal(loadLive(), null);
  } finally {
    storage.restore();
  }
});

test("a completed long career is archived and duplicate saves are collapsed", () => {
  const storage = installMemoryStorage();
  try {
    clearLive();
    resetArchive(storage);
    const entry = toArchive(playCareerSim(demoCareer));
    saveArchive(entry);
    const returned = saveArchive(entry);
    const raw = storage.local.getItem(ARCHIVE_KEY);

    assert.ok(raw);
    assert.equal(JSON.parse(raw).filter((item: { id: string }) => item.id === entry.id).length, 1);
    assert.equal(returned.filter((item) => item.id === entry.id).length, 1);
    assert.equal(loadArchive()[0]?.id, entry.id);
    assert.equal(loadArchive()[0]?.seasons, entry.seasons);
    assert.equal(loadArchive()[0]?.card?.playerName, entry.card?.playerName);
    assert.equal(loadArchive()[0]?.card?.ageEnd, loadArchive()[0]?.history.at(-1)?.age);
    assert.equal(loadArchive()[0]?.fingerprint, entry.fingerprint);
  } finally {
    storage.restore();
  }
});

test("archive load skips incomplete rows and omits a corrupted optional card", () => {
  const storage = installMemoryStorage();
  try {
    resetArchive(storage);
    const career = toArchive(playCareerSim(demoCareer));
    const legacy = { ...career, id: "legacy-without-card", card: undefined, fingerprint: undefined };
    const corruptCard = { ...career, id: "corrupt-card", card: { playerName: "incomplete" } };
    const staleAgeCard = {
      ...career,
      id: "stale-age-card",
      card: { ...career.card!, ageEnd: career.card!.ageEnd + 1 },
    };
    staleAgeCard.fingerprint = fingerprintOf(staleAgeCard.card);
    storage.local.setItem(ARCHIVE_KEY, JSON.stringify([null, { id: "incomplete" }, legacy, corruptCard, staleAgeCard]));

    const loaded = loadArchive();
    assert.equal(loaded.some((entry) => entry.id === "incomplete"), false);
    assert.ok(loaded.some((entry) => entry.id === "legacy-without-card" && entry.card === undefined));
    assert.ok(loaded.some((entry) => entry.id === "corrupt-card" && entry.card === undefined));
    const migratedCard = loaded.find((entry) => entry.id === "stale-age-card");
    assert.equal(migratedCard?.card?.ageEnd, migratedCard?.history.at(-1)?.age);
    assert.equal(migratedCard?.fingerprint, fingerprintOf(migratedCard!.card!));

    const future = { ...career, id: "future-version", version: 99 };
    const current = { ...career, id: "current-version" };
    storage.local.setItem(ARCHIVE_KEY, JSON.stringify([future, current, { id: "broken" }]));
    const mixed = loadArchive();
    assert.equal(mixed.some((entry) => entry.id === "future-version"), false);
    assert.equal(mixed.some((entry) => entry.id === "current-version"), true);
  } finally {
    storage.restore();
  }
});

test("distinct careers completed in the same millisecond remain separate archive entries", () => {
  const storage = installMemoryStorage();
  const originalNow = Date.now;
  try {
    resetArchive(storage);
    Date.now = () => 1_700_000_000_000;
    const first = toArchive(playCareerSim({ ...demoCareer, seed: 230023 }));
    const second = toArchive(playCareerSim({ ...demoCareer, seed: 230024 }));
    saveArchive(first);
    const archived = saveArchive(second);

    assert.notEqual(first.id, second.id);
    assert.ok(archived.some((entry) => entry.id === first.id));
    assert.ok(archived.some((entry) => entry.id === second.id));
  } finally {
    Date.now = originalNow;
    storage.restore();
  }
});

test("archive storage failure preserves the last persisted live save", () => {
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
    const liveSave = storage.local.getItem(SAVE_KEY);
    assert.ok(liveSave);

    storage.local.throwOnWrite = true;
    storage.session.throwOnWrite = true;
    const archive = toArchive(player);
    saveArchive(archive);

    assert.equal(isArchivePersisted(archive.id), false);
    assert.equal(storage.local.getItem(SAVE_KEY), liveSave);
  } finally {
    storage.restore();
  }
});

test("archive writes fall back from localStorage to sessionStorage", () => {
  const storage = installMemoryStorage();
  try {
    resetArchive(storage);
    storage.local.throwOnWrite = true;
    const entry = toArchive(playCareerSim(demoCareer));
    saveArchive(entry);

    assert.equal(isArchivePersisted(entry.id), true);
    assert.ok(storage.session.getItem(ARCHIVE_KEY));
    assert.equal(loadArchive()[0]?.id, entry.id);
  } finally {
    storage.restore();
  }
});

test("finishing a career does not crash when the browser refuses archive writes", () => {
  const storage = installMemoryStorage();
  try {
    clearLive();
    resetArchive(storage);
    storage.local.throwOnWrite = true;
    storage.session.throwOnWrite = true;
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

test("valid checksum-free v2 saves migrate and invalid fingerprints are rejected", () => {
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
    const stripped = JSON.parse(good) as { c?: string; player: { overall: number } };
    delete stripped.c;
    stripped.player.overall = 99;
    const missing = JSON.stringify(stripped);
    storage.local.setItem(SAVE_KEY, missing);
    globalThis.sessionStorage.setItem(SAVE_KEY, missing);
    assert.equal(loadLive(), null);
    assert.equal(storage.local.getItem(SAVE_KEY), missing);

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

test("a legacy metadata checksum cannot validate a rewritten career", () => {
  const storage = installMemoryStorage();
  try {
    clearLive();
    const player = playCareerSim(demoCareer);
    const payload = buildLiveSave(player, null, [], "career", "career", player.seasonHistory.length);
    const legacy = {
      ...payload,
      player: { ...payload.player, overall: 99, age: 22 },
      c: sha256(`${player.seed}:${payload.logSeq}:${player.rngState}`).slice(0, 16),
    };
    const raw = JSON.stringify(legacy);
    storage.local.setItem(SAVE_KEY, raw);
    globalThis.sessionStorage.setItem(SAVE_KEY, raw);

    assert.equal(loadLive(), null);
    assert.equal(storage.local.getItem(SAVE_KEY), raw);
  } finally {
    storage.restore();
  }
});

test("the simulator offers the same scripted seasons as the game", () => {
  const player = playCareerSim(demoCareer);
  const titleAt = (season: number) => player.choiceLog.find((c) => c.season === season)?.title ?? "";
  assert.equal(titleAt(1), "Rookie of the Year");
  assert.match(titleAt(6), /^Lo scontro con /);
  assert.equal(titleAt(8), "Un infortunio serio");
  assert.equal(titleAt(10), "Convocazione internazionale");
});

test("the closing note speaks to the player", () => {
  const player = freshPlayer("Voce Test", "SF", "Italia", 23, "pro", 1);
  player.originPath = "Europa";
  const line = careerCommentary(player);
  assert.match(line, /Sei arrivato dall'Europa/);
  assert.doesNotMatch(line, /È arrivato|Ha cominciato|difensore dell'anno/);
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
  }
  assert.ok(maxMvp <= 6, `max MVP ${maxMvp}`);
  assert.ok(titles6 / n < 0.02, `six-title share ${titles6 / n}`);
  assert.ok(anyMvp > 0, "MVP disappeared");
  // P0-LIFE permits early retirement. The Pro distribution test separately
  // verifies that viable careers still reach the age-36 final season.
});

test("careerId is created once and stays off the simulation seed", () => {
  const storage = installMemoryStorage();
  try {
    clearLive();
    resetArchive(storage);
    const player = freshPlayer("Identità", "SG", "ITA", 11, "pro", 515017);
    assert.match(player.careerId, /^[0-9a-f-]{36}$/i);
    const twin = freshPlayer("Identità", "SG", "ITA", 11, "pro", 515017);
    assert.equal(twin.seed, player.seed);
    assert.equal(twin.rngState, player.rngState);
    assert.notEqual(twin.careerId, player.careerId);

    assert.equal(saveLive({
      player,
      pending: null,
      log: [],
      screen: "career",
      tab: "log",
      logSeq: 1,
    }), true);
    const resumed = loadLive();
    assert.ok(resumed);
    assert.equal(resumed.player.careerId, player.careerId);
    assert.equal(resumed.player.seed, player.seed);
    assert.equal(resumed.player.rngState, player.rngState);

    const archived = toArchive(player);
    assert.equal(archived.careerId, player.careerId);
    assert.equal(archived.seed, player.seed);
    assert.notEqual(archived.id, player.careerId);
    assert.equal(archived.card?.id, `${player.seed}:${SAVE_VERSION}`);
    assert.equal(archived.fingerprint, fingerprintOf(archived.card!));
    saveArchive(archived);
    assert.equal(loadArchive().find((entry) => entry.id === archived.id)?.careerId, player.careerId);

    clearLive();
    const legacy = buildLiveSave(player, null, [], "career", "log", 1);
    const body = JSON.parse(JSON.stringify(legacy)) as { c?: string; player: { careerId?: string; seed: number; rngState: number } };
    delete body.c;
    delete body.player.careerId;
    const encoded = JSON.stringify({ ...body, c: sha256(JSON.stringify(body)).slice(0, 16) });
    storage.local.setItem(SAVE_KEY, encoded);
    storage.session.setItem(SAVE_KEY, encoded);
    const migrated = loadLive();
    assert.ok(migrated);
    assert.match(migrated.player.careerId, /^[0-9a-f-]{36}$/i);
    assert.notEqual(migrated.player.careerId, player.careerId);
    assert.equal(migrated.player.seed, player.seed);
    assert.equal(migrated.player.rngState, player.rngState);
    assert.equal(saveLive({
      player: migrated.player,
      pending: migrated.pending,
      log: migrated.log,
      screen: migrated.screen,
      tab: migrated.tab,
      logSeq: migrated.logSeq,
    }), true);
    assert.equal(loadLive()?.player.careerId, migrated.player.careerId);

    const oldArchive = toArchive(freshPlayer("Vecchia", "C", "ITA", 4, "pro", 17));
    delete oldArchive.careerId;
    storage.local.setItem(ARCHIVE_KEY, JSON.stringify([oldArchive]));
    storage.session.setItem(ARCHIVE_KEY, JSON.stringify([oldArchive]));
    const kept = loadArchive().find((entry) => entry.id === oldArchive.id);
    assert.ok(kept);
    assert.equal(kept.careerId, undefined);
    assert.equal(kept.seed, 17);
  } finally {
    storage.restore();
  }
});
