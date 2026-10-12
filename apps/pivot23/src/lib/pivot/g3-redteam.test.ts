import assert from "node:assert/strict";
import test from "node:test";
import {
  ARCHIVE_BACKUP_KEY,
  ARCHIVE_KEY,
  acceptForcedPreseasonTrade,
  advanceCareerSim,
  archiveEntrySchema,
  lastArchiveWrite,
  loadArchive,
  openCareerSim,
  playCareerSim,
  resetArchiveMemory,
  saveArchive,
  toArchive,
} from "./engine.ts";
import { createRng } from "./rng.ts";
import { isCareerOver } from "./peak.ts";
import {
  ARCHIVE_SCHEMA,
  BACKUP_KEY,
  LIVE_SAVE_VERSION,
  SAVE_KEY,
  clearLive,
  lastLoadReport,
  loadLive,
  saveLive,
} from "./save.ts";
import { SAVE_VERSION } from "./config.ts";
import { sha256 } from "./card.ts";
import { NBA_TEAMS } from "./teams.ts";
import type { PlayerState } from "./types.ts";

/*
 * G3 red team: adversarial save/load matrix, archive schema safety, choice log, replay through the
 * real storage chain, invariants. Every case states the expected behaviour:
 *   REJECT   = not opened, original kept (backup key), user told by lastLoadReport
 *   MIGRATE  = explicit migration, original backed up first
 *   PARTIAL  = readable part shown, unreadable part kept aside (backup), never silently dropped
 *   LIMIT    = accepted on purpose; documented limit (local checksum is not anti-tamper)
 */

class MemoryStorage implements Storage {
  values = new Map<string, string>();
  quotaKeys = new Set<string>();
  readOnly = false;
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { if (!this.readOnly) this.values.delete(key); }
  setItem(key: string, value: string) {
    if (this.readOnly) throw new DOMException("read only", "SecurityError");
    if (this.quotaKeys.has(key)) throw new DOMException("Storage full", "QuotaExceededError");
    this.values.set(key, String(value));
  }
}

function install() {
  const ld = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const sd = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  const local = new MemoryStorage();
  const session = new MemoryStorage();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: local });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: session });
  resetArchiveMemory();
  clearLive();
  return {
    local,
    session,
    restore() {
      local.readOnly = false;
      session.readOnly = false;
      clearLive();
      resetArchiveMemory();
      if (ld) Object.defineProperty(globalThis, "localStorage", ld);
      else Reflect.deleteProperty(globalThis, "localStorage");
      if (sd) Object.defineProperty(globalThis, "sessionStorage", sd);
      else Reflect.deleteProperty(globalThis, "sessionStorage");
    },
  };
}

function withStores(fn: (st: ReturnType<typeof install>) => void) {
  const st = install();
  try {
    fn(st);
  } finally {
    st.restore();
  }
}

const finished = (seed: number) => playCareerSim({ seed, difficulty: "pro", name: "Red Team" });
const live = (p: PlayerState, logSeq = 1) => ({ player: p, pending: null, log: [], screen: "career" as const, tab: "log" as const, logSeq });
const checksum = (body: object) => sha256(JSON.stringify(body)).slice(0, 16);

function midCareer(seed: number, seasons = 3): PlayerState {
  const job = openCareerSim({ seed, difficulty: "pro", name: "Mid" });
  for (let i = 0; i < seasons; i++) if (advanceCareerSim(job)) break;
  job.s.rngState = job.rng.getState();
  return job.s;
}

/** Rewrites a stored save with `edit` and a recomputed (valid) checksum. */
function tamper(raw: string, edit: (save: Record<string, unknown>) => void): string {
  const save = JSON.parse(raw) as Record<string, unknown>;
  delete save.c;
  edit(save);
  return JSON.stringify({ ...save, c: checksum(save) });
}

function expectRejectKept(st: ReturnType<typeof install>, raw: string, state: string) {
  assert.equal(loadLive(), null);
  assert.equal(lastLoadReport().state, state);
  assert.equal(lastLoadReport().backedUp, true);
  assert.equal(st.local.getItem(SAVE_KEY), raw, "original left in place");
  assert.equal(JSON.parse(st.local.getItem(BACKUP_KEY)!).raw, raw, "original copied to backup");
}

/* ------------------------------ live save matrix ------------------------------ */

test("M01 malformed JSON: REJECT as corrupt, raw kept and backed up", () => withStores((st) => {
  const raw = '{"v":2,"player":{';
  st.local.setItem(SAVE_KEY, raw);
  expectRejectKept(st, raw, "corrupt");
}));

test("M02 missing required fields: REJECT as corrupt, kept", () => withStores((st) => {
  saveLive(live(midCareer(301)));
  const raw = tamper(st.local.getItem(SAVE_KEY)!, (s) => { delete (s.player as Record<string, unknown>).attrs; });
  st.local.setItem(SAVE_KEY, raw);
  st.session.clear();
  assert.equal(JSON.parse(raw).player.attrs, undefined);
  resetMem();
  expectRejectKept(st, raw, "corrupt");
}));

function resetMem() {
  /* clearLive() drops MEM; the stores are restored right after so only memory is forgotten. */
  const l = (globalThis.localStorage as MemoryStorage);
  const s = (globalThis.sessionStorage as MemoryStorage);
  const lv = new Map(l.values);
  const sv = new Map(s.values);
  clearLive();
  l.values = lv;
  s.values = sv;
}

test("M03 wrong types: REJECT; out-of-range numbers with a recomputed checksum: LIMIT (accepted)", () => withStores((st) => {
  saveLive(live(midCareer(302)));
  const good = st.local.getItem(SAVE_KEY)!;
  st.session.clear();
  const wrongType = tamper(good, (s) => { (s.player as Record<string, unknown>).age = "ventiquattro"; });
  st.local.setItem(SAVE_KEY, wrongType);
  resetMem();
  expectRejectKept(st, wrongType, "corrupt");

  const outOfRange = tamper(good, (s) => { (s.player as Record<string, unknown>).overall = 9999; });
  st.local.setItem(SAVE_KEY, outOfRange);
  resetMem();
  const loaded = loadLive();
  assert.ok(loaded, "documented limit: a hand-edited save with a recomputed checksum opens");
  assert.equal(loaded!.player.overall, 9999);
}));

test("M04 huge arrays are bounded on load; deep nesting does not throw", () => withStores((st) => {
  saveLive(live(midCareer(303)));
  const good = st.local.getItem(SAVE_KEY)!;
  st.session.clear();
  const huge = tamper(good, (s) => {
    const p = s.player as Record<string, unknown>;
    p.choiceLog = Array.from({ length: 50_000 }, (_, i) => ({ season: 1, title: `t${i}`, pick: "x" }));
    p.heardLines = Array.from({ length: 50_000 }, (_, i) => `line-${i}`);
  });
  st.local.setItem(SAVE_KEY, huge);
  resetMem();
  const t0 = performance.now();
  const loaded = loadLive();
  const ms = performance.now() - t0;
  assert.ok(loaded);
  assert.equal(loaded!.player.choiceLog.length, 80);
  assert.ok(loaded!.player.heardLines.length <= 360);
  assert.ok(ms < 5_000, `load of a ${(huge.length / 1e6).toFixed(1)} MB save took ${ms.toFixed(0)} ms`);

  let deep = "0";
  for (let i = 0; i < 100_000; i++) deep = `[${deep}]`;
  const nested = good.replace('"pending":null', `"pending":{"x":${deep}}`);
  st.local.setItem(SAVE_KEY, nested);
  resetMem();
  assert.doesNotThrow(() => loadLive());
  assert.equal(loadLive(), null);
  assert.equal(st.local.getItem(SAVE_KEY), nested);
}));

test("M05 duplicate ids: archive keeps one entry per id, live save with duplicate log ids opens", () => withStores((st) => {
  const entry = toArchive(finished(305));
  st.local.setItem(ARCHIVE_KEY, JSON.stringify([entry, { ...entry, name: "Copia" }]));
  const list = loadArchive();
  assert.equal(list.filter((e) => e.id === entry.id).length, 1);
  assert.equal(list[0]!.name, entry.name, "first stored copy wins, deterministically");
}));

test("M06 a live save cannot claim a finished screen; unknown screen is REJECT, kept", () => withStores((st) => {
  saveLive(live(midCareer(306)));
  const raw = tamper(st.local.getItem(SAVE_KEY)!, (s) => { s.screen = "result"; });
  st.local.setItem(SAVE_KEY, raw);
  st.session.clear();
  resetMem();
  expectRejectKept(st, raw, "corrupt");
}));

test("M07 finished career whose card age disagrees with the last season: card follows the season", () => withStores((st) => {
  const s = finished(307);
  const entry = toArchive(s);
  const lastAge = entry.history.at(-1)!.age;
  assert.equal(entry.card!.ageEnd, lastAge, "toArchive: final age = last recorded season");
  const broken = { ...entry, card: { ...entry.card!, ageEnd: lastAge + 1 } };
  delete (broken as Record<string, unknown>).fingerprint;
  st.local.setItem(ARCHIVE_KEY, JSON.stringify([broken]));
  assert.equal(loadArchive()[0]!.card!.ageEnd, lastAge);
}));

test("M08 older save version with no registered migration: REJECT as incompatible, kept", () => withStores((st) => {
  saveLive(live(midCareer(308)));
  const raw = tamper(st.local.getItem(SAVE_KEY)!, (s) => { s.v = LIVE_SAVE_VERSION - 1; });
  st.local.setItem(SAVE_KEY, raw);
  st.session.clear();
  resetMem();
  expectRejectKept(st, raw, "incompatible");
}));

test("M09 newer save version: REJECT as future, never deleted or rewritten", () => withStores((st) => {
  saveLive(live(midCareer(309)));
  const raw = tamper(st.local.getItem(SAVE_KEY)!, (s) => { s.v = LIVE_SAVE_VERSION + 1; });
  st.local.setItem(SAVE_KEY, raw);
  st.session.clear();
  resetMem();
  expectRejectKept(st, raw, "future");
}));

/* ------------------------------ archive schema (G3-B02) ------------------------------ */

test("M10 archive schema: current, legacy (missing) and future are told apart", () => {
  const entry = toArchive(finished(310));
  assert.equal(archiveEntrySchema(entry), "current");
  const legacy = { ...entry } as Record<string, unknown>;
  delete legacy.archiveSchema;
  assert.equal(archiveEntrySchema(legacy), "legacy");
  assert.equal(archiveEntrySchema({ ...entry, archiveSchema: 1 }), "legacy");
  assert.equal(archiveEntrySchema({ ...entry, archiveSchema: ARCHIVE_SCHEMA + 1 }), "future");
  assert.equal(archiveEntrySchema({ ...entry, archiveSchema: "2" }), "invalid");
  assert.equal(archiveEntrySchema({ ...entry, archiveSchema: 0 }), "invalid");
  assert.equal(archiveEntrySchema(null), "invalid");
});

test("M10 future archiveSchema is not stamped current, not shown, and survives every write byte-for-byte", () => withStores((st) => {
  const mine = toArchive(finished(311));
  const future = { ...toArchive(finished(312)), id: "from-a-newer-build", archiveSchema: ARCHIVE_SCHEMA + 1, newField: { kept: true } };
  st.local.setItem(ARCHIVE_KEY, JSON.stringify([future, mine]));
  const shown = loadArchive();
  assert.deepEqual(shown.map((e) => e.id), [mine.id], "future entry is not presented as a valid current entry");
  assert.ok(shown.every((e) => e.archiveSchema === ARCHIVE_SCHEMA));

  const third = toArchive(finished(313));
  saveArchive(third);
  assert.equal(lastArchiveWrite().persisted, true);
  const stored = JSON.parse(st.local.getItem(ARCHIVE_KEY)!) as Record<string, unknown>[];
  const kept = stored.find((e) => e.id === future.id)!;
  assert.ok(kept, "future entry still in storage after a write");
  assert.deepEqual(kept, JSON.parse(JSON.stringify(future)), "not downgraded, not trimmed");
  assert.equal(kept.archiveSchema, ARCHIVE_SCHEMA + 1);
  saveArchive(third); // repeat
  const again = JSON.parse(st.local.getItem(ARCHIVE_KEY)!) as Record<string, unknown>[];
  assert.equal(again.filter((e) => e.id === future.id).length, 1, "repeated writes do not duplicate it");
  assert.deepEqual(loadArchive().map((e) => e.id).sort(), [mine.id, third.id].sort());
}));

test("M10 legacy archive without archiveSchema still opens (explicit in-memory migration)", () => withStores((st) => {
  const entry = toArchive(finished(314)) as unknown as Record<string, unknown>;
  delete entry.archiveSchema;
  st.local.setItem(ARCHIVE_KEY, JSON.stringify([entry]));
  const list = loadArchive();
  assert.equal(list.length, 1);
  assert.equal(list[0]!.archiveSchema, ARCHIVE_SCHEMA);
  assert.equal(list[0]!.ppg, entry.ppg);
}));

test("M10 invalid archiveSchema is hidden and the raw archive is backed up before the next write", () => withStores((st) => {
  const good = toArchive(finished(315));
  const bad = { ...toArchive(finished(316)), id: "bad-schema", archiveSchema: "two" };
  const raw = JSON.stringify([bad, good]);
  st.local.setItem(ARCHIVE_KEY, raw);
  assert.deepEqual(loadArchive().map((e) => e.id), [good.id]);
  saveArchive(toArchive(finished(317)));
  const backup = JSON.parse(st.local.getItem(ARCHIVE_BACKUP_KEY)!) as { raws: string[] };
  assert.ok(backup.raws.includes(raw));
}));

/* ------------------------------ checksum ------------------------------ */

test("M11 checksum missing or wrong: REJECT; recomputed after an edit: LIMIT (opens)", () => withStores((st) => {
  saveLive(live(midCareer(321)));
  const good = st.local.getItem(SAVE_KEY)!;
  st.session.clear();
  const missing = JSON.parse(good) as Record<string, unknown>;
  delete missing.c;
  st.local.setItem(SAVE_KEY, JSON.stringify(missing));
  resetMem();
  expectRejectKept(st, JSON.stringify(missing), "corrupt");

  const wrong = { ...JSON.parse(good), c: "0000000000000000" };
  st.local.setItem(SAVE_KEY, JSON.stringify(wrong));
  resetMem();
  expectRejectKept(st, JSON.stringify(wrong), "corrupt");

  const edited = JSON.parse(good);
  edited.player.titleCount = 11;
  st.local.setItem(SAVE_KEY, JSON.stringify(edited));
  resetMem();
  assert.equal(loadLive(), null, "edit without recomputing the checksum is detected");

  st.local.setItem(SAVE_KEY, tamper(good, (s) => { (s.player as Record<string, unknown>).titleCount = 11; }));
  resetMem();
  assert.equal(loadLive()!.player.titleCount, 11, "LIMIT: the local checksum is not an anti-tamper proof");
}));

/* ------------------------------ storage failures ------------------------------ */

test("M12 storage unavailable (getter throws): no crash, nothing claimed as saved", () => {
  const ld = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const sd = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  const boom = { configurable: true, get() { throw new DOMException("denied", "SecurityError"); } };
  Object.defineProperty(globalThis, "localStorage", boom);
  Object.defineProperty(globalThis, "sessionStorage", boom);
  resetArchiveMemory();
  try {
    const p = midCareer(322);
    assert.equal(saveLive(live(p)), false);
    assert.equal(loadLive()?.player.seed, p.seed, "this tab still has the career in memory");
    saveArchive(toArchive(finished(323)));
    assert.deepEqual(lastArchiveWrite(), { ok: false, persisted: false, reason: "unavailable" });
    assert.equal(loadArchive().length, 1, "memory copy for this tab");
  } finally {
    clearLive();
    resetArchiveMemory();
    if (ld) Object.defineProperty(globalThis, "localStorage", ld); else Reflect.deleteProperty(globalThis, "localStorage");
    if (sd) Object.defineProperty(globalThis, "sessionStorage", sd); else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});

test("M12 read-only storage: write reported as failed, previous save untouched", () => withStores((st) => {
  saveLive(live(midCareer(324, 1)));
  const before = st.local.getItem(SAVE_KEY);
  st.local.readOnly = true;
  st.session.readOnly = true;
  assert.equal(saveLive(live(midCareer(324, 2), 2)), false);
  assert.equal(st.local.getItem(SAVE_KEY), before);
}));

test("M13 quota exceeded during a write: last good save kept, retry after space frees succeeds once", () => withStores((st) => {
  const p1 = midCareer(325, 1);
  assert.equal(saveLive(live(p1)), true);
  const good = st.local.getItem(SAVE_KEY);
  st.local.quotaKeys.add(SAVE_KEY);
  st.session.quotaKeys.add(SAVE_KEY);
  const p2 = midCareer(325, 3);
  assert.equal(saveLive(live(p2, 2)), false);
  assert.equal(st.local.getItem(SAVE_KEY), good, "quota never deletes the last good save");
  st.local.quotaKeys.clear();
  st.session.quotaKeys.clear();
  assert.equal(saveLive(live(p2, 2)), true, "M17: repeating after the error works");
  assert.equal(JSON.parse(st.local.getItem(SAVE_KEY)!).player.season, p2.season);
  assert.equal([...st.local.values.keys()].filter((k) => k === SAVE_KEY).length, 1);
}));

test("M14 interrupted write (truncated local copy): session copy opens, truncated raw kept aside", () => withStores((st) => {
  const p = midCareer(326);
  saveLive(live(p));
  const full = st.local.getItem(SAVE_KEY)!;
  const partial = full.slice(0, Math.floor(full.length / 2));
  st.local.setItem(SAVE_KEY, partial);
  resetMem();
  const loaded = loadLive();
  assert.equal(loaded?.player.seed, p.seed);
  assert.equal(JSON.parse(st.local.getItem(BACKUP_KEY)!).raw, partial);
}));

test("M15 archive with many entries and one corrupted: the rest open, the corrupt one is backed up, not lost", () => withStores((st) => {
  const entries = [330, 331, 332, 333, 334].map((seed) => toArchive(finished(seed)));
  const corrupt = { ...entries[2]!, ppg: "tanti" };
  const raw = JSON.stringify([entries[0], entries[1], corrupt, entries[3], entries[4]]);
  st.local.setItem(ARCHIVE_KEY, raw);
  assert.equal(loadArchive().length, 4);
  saveArchive(toArchive(finished(335)));
  assert.equal(loadArchive().length, 5);
  assert.ok((JSON.parse(st.local.getItem(ARCHIVE_BACKUP_KEY)!) as { raws: string[] }).raws.includes(raw));
}));

test("M17 the same archive operation repeated (double finish) leaves one entry", () => withStores(() => {
  const entry = toArchive(finished(336));
  saveArchive(entry);
  saveArchive(entry);
  saveArchive(entry);
  assert.equal(loadArchive().filter((e) => e.id === entry.id).length, 1);
}));

test("M18 legacy save without optional fields (careerId, rngState, logSeq, tab, world) opens with defaults", () => withStores((st) => {
  const p = midCareer(337);
  saveLive(live(p));
  const raw = tamper(st.local.getItem(SAVE_KEY)!, (s) => {
    const player = s.player as Record<string, unknown>;
    delete player.careerId;
    delete player.rngState;
    delete player.world;
    delete s.logSeq;
    delete s.tab;
  });
  st.local.setItem(SAVE_KEY, raw);
  st.session.clear();
  resetMem();
  const loaded = loadLive()!;
  assert.ok(loaded);
  assert.equal(typeof loaded.player.careerId, "string");
  assert.equal(loaded.player.rngState, p.seed);
  assert.equal(loaded.tab, "log");
  assert.equal(loaded.logSeq, 1);
  assert.equal(lastLoadReport().state, "ok");
}));

/* ------------------------------ choice log: forced preseason trade ------------------------------ */

test("forced preseason trade: team updated, logged once, persisted, not duplicated on reload, in the archive", () => withStores(() => {
  const s = midCareer(340, 2);
  const dest = structuredClone(NBA_TEAMS.find((t) => t.abbr !== s.team.abbr)!);
  const from = acceptForcedPreseasonTrade(s, dest, s.season);
  assert.equal(s.team.abbr, dest.abbr);
  assert.equal(s.contract.teamName, dest.name, "contract follows the team");
  const isTrade = (c: { title: string; pick: string }) => c.title === "Scambio" && c.pick === `${from} → ${dest.name}`;
  assert.equal(s.choiceLog.filter(isTrade).length, 1);
  saveLive(live(s));
  for (let reload = 0; reload < 3; reload++) {
    resetMem();
    const back = loadLive()!;
    assert.equal(back.player.choiceLog.filter(isTrade).length, 1, `reload ${reload}`);
    saveLive(live(back.player));
  }
  const back = loadLive()!.player;
  const job = { rng: createRng(back.seed), s: back, n: back.season + 1, opts: {} };
  job.rng.setState(back.rngState!);
  while (!advanceCareerSim(job)) { /* finish */ }
  assert.equal(toArchive(job.s).choices.filter(isTrade).length, 1, "the final report can rebuild the trade");
}));

/* ------------------------------ replay through the real storage chain + invariants ------------------------------ */

function fingerprint(s: PlayerState) {
  return JSON.stringify({
    history: s.seasonHistory.map((r) => [r.season, r.age, r.teamAbbr, r.overall, r.ppg, r.rpg, r.apg, r.gp, r.awards, r.playoff, r.wins, r.losses]),
    choices: s.choiceLog,
    events: s.usedEventIds,
    milestones: s.milestones.map((m) => [m.season, m.label]),
    // G3-F03 (P3, documented): the save keeps only the last 16 league champions (compactPlayer),
    // the uninterrupted in-memory career keeps all of them. Only the tail can be compared.
    champions: s.championLog.slice(-16),
    end: [s.age, s.team.abbr, s.titleCount, s.mvpCount, s.allStarCount, s.peakOverall, s.contract],
  });
}

function assertInvariants(s: PlayerState, label: string) {
  const seasons = s.seasonHistory.map((r) => r.season);
  assert.equal(new Set(seasons).size, seasons.length, `${label}: no season recorded twice`);
  for (let i = 1; i < s.seasonHistory.length; i++) {
    assert.ok(s.seasonHistory[i]!.season > s.seasonHistory[i - 1]!.season, `${label}: seasons in order`);
    assert.ok(s.seasonHistory[i]!.age >= s.seasonHistory[i - 1]!.age, `${label}: age never goes back`);
  }
  assert.equal(s.contract.teamName, s.team.name, `${label}: contract team = current team`);
  assert.equal(s.titleCount, s.seasonHistory.filter((r) => r.playoff === "Campione").length, `${label}: titles = seasons won`);
}

test("replay: save → storage → reload at every season boundary reproduces the uninterrupted career", () => withStores(() => {
  const seeds = [4100, 4101, 4102, 4103, 4104, 4105, 4106, 4107];
  for (const seed of seeds) {
    const opts = { seed, difficulty: "pro" as const, name: "Replay", nationality: "Italia", number: 9, role: "PG" as const, path: "NCAA" as const };
    const ref = openCareerSim(opts);
    while (!advanceCareerSim(ref)) assertInvariants(ref.s, `ref ${seed}`);
    const job = openCareerSim(opts);
    let done = false;
    let reloads = 0;
    while (!done) {
      done = advanceCareerSim(job);
      job.s.rngState = job.rng.getState();
      assert.equal(saveLive(live(job.s, job.n)), true);
      resetMem();
      const back = loadLive()!;
      assert.ok(back, `seed ${seed}: reload ${reloads}`);
      const rng = createRng(seed);
      rng.setState(back.player.rngState!);
      job.rng = rng;
      job.s = back.player;
      reloads += 1;
      assertInvariants(job.s, `seed ${seed} reload ${reloads}`);
    }
    assert.equal(fingerprint(job.s), fingerprint(ref.s), `seed ${seed} after ${reloads} reloads`);
    assert.ok(isCareerOver(job.s));
    const card = toArchive(job.s).card!;
    assert.equal(card.ageEnd, job.s.seasonHistory.at(-1)!.age, `seed ${seed}: final age = last recorded season`);
    assert.equal(card.seasons, job.s.seasonHistory.length);
    assert.equal(card.championships, job.s.titleCount);
  }
}));

test("invariants over 40 simulated careers: finished state complete, no duplicate seasons, card = career", () => {
  for (let seed = 5000; seed < 5040; seed++) {
    const s = finished(seed);
    assertInvariants(s, `seed ${seed}`);
    assert.ok(isCareerOver(s), `seed ${seed}: finished`);
    assert.ok(s.seasonHistory.length > 0, `seed ${seed}: a finished career has a final season`);
    const entry = toArchive(s);
    assert.equal(entry.card!.ageEnd, s.seasonHistory.at(-1)!.age);
    assert.equal(entry.titles, s.titleCount);
    assert.equal(entry.seasons, s.seasonHistory.length);
    assert.equal(archiveEntrySchema(entry), "current");
  }
});

/* ------------------------------ synthetic performance (not device data) ------------------------------ */

test("synthetic benchmark: save size, write, load, archive load (Node, not a phone)", () => withStores((st) => {
  const s = finished(4200);
  const raw = JSON.stringify(s).length;
  const t0 = performance.now();
  saveLive(live(s));
  const tWrite = performance.now() - t0;
  const stored = st.local.getItem(SAVE_KEY)!.length;
  resetMem();
  const t1 = performance.now();
  loadLive();
  const tLoad = performance.now() - t1;
  for (let i = 0; i < 8; i++) saveArchive(toArchive(finished(4300 + i)));
  resetArchiveMemory();
  const t2 = performance.now();
  const list = loadArchive();
  const tArchive = performance.now() - t2;
  const archiveBytes = st.local.getItem(ARCHIVE_KEY)!.length;
  console.log(`[G3 bench] player JSON ${raw} chars → live save ${stored} chars; write ${tWrite.toFixed(1)} ms; parse+validate ${tLoad.toFixed(1)} ms; archive ${list.length} careers ${archiveBytes} chars, load ${tArchive.toFixed(1)} ms`);
  assert.ok(stored < 2_000_000);
  assert.ok(archiveBytes < 2_000_000);
}));

/* Lucille's review notes on G3-B02 (future archive entries). */
test("M10 future detected only by version > SAVE_VERSION (current archiveSchema) is hidden and kept", () => withStores((st) => {
  const mine = toArchive(finished(321));
  const future = { ...toArchive(finished(322)), id: "newer-version-only", archiveSchema: ARCHIVE_SCHEMA, version: SAVE_VERSION + 1 };
  assert.equal(archiveEntrySchema(future), "future");
  st.local.setItem(ARCHIVE_KEY, JSON.stringify([future, mine]));
  assert.deepEqual(loadArchive().map((e) => e.id), [mine.id]);
  saveArchive(toArchive(finished(323)));
  const stored = JSON.parse(st.local.getItem(ARCHIVE_KEY)!) as Record<string, unknown>[];
  assert.deepEqual(stored.find((e) => e.id === future.id), JSON.parse(JSON.stringify(future)));
}));

test("M10 future entries only in sessionStorage survive a write there", () => withStores((st) => {
  const future = { ...toArchive(finished(324)), id: "session-future", archiveSchema: ARCHIVE_SCHEMA + 1 };
  st.session.setItem(ARCHIVE_KEY, JSON.stringify([future]));
  saveArchive(toArchive(finished(325)));
  const session = JSON.parse(st.session.getItem(ARCHIVE_KEY)!) as Record<string, unknown>[];
  assert.deepEqual(session.find((e) => e.id === future.id), JSON.parse(JSON.stringify(future)));
  const local = JSON.parse(st.local.getItem(ARCHIVE_KEY)!) as Record<string, unknown>[];
  assert.ok(!local.some((e) => e.id === future.id), "not copied into a store that never had it");
}));

test("M13 storage full with future entries: previous archive untouched, future kept, quota warned", () => withStores((st) => {
  const mine = toArchive(finished(326));
  const future = { ...toArchive(finished(327)), id: "full-future", archiveSchema: ARCHIVE_SCHEMA + 1 };
  const before = JSON.stringify([future, mine]);
  st.local.setItem(ARCHIVE_KEY, before);
  st.local.quotaKeys.add(ARCHIVE_KEY);
  st.session.quotaKeys.add(ARCHIVE_KEY);
  saveArchive(toArchive(finished(328)));
  const w = lastArchiveWrite();
  assert.equal(w.persisted, false);
  assert.equal(w.reason, "quota");
  assert.equal(w.futureKept, 1, "the warning says future entries were carried, not trimmed");
  assert.equal(st.local.getItem(ARCHIVE_KEY), before, "nothing deleted to make room");
}));

test("M10 same id on a future and a current entry: both kept, only the current one shown", () => withStores((st) => {
  const mine = toArchive(finished(329));
  const future = { ...mine, archiveSchema: ARCHIVE_SCHEMA + 1, newField: 1 };
  st.local.setItem(ARCHIVE_KEY, JSON.stringify([future]));
  saveArchive(mine);
  const stored = JSON.parse(st.local.getItem(ARCHIVE_KEY)!) as Record<string, unknown>[];
  assert.equal(stored.filter((e) => e.id === mine.id).length, 2);
  assert.ok(stored.some((e) => e.archiveSchema === ARCHIVE_SCHEMA + 1 && e.newField === 1));
  assert.deepEqual(loadArchive().map((e) => e.id), [mine.id]);
  saveArchive(mine);
  assert.equal((JSON.parse(st.local.getItem(ARCHIVE_KEY)!) as unknown[]).length, 2, "repeat does not grow");
}));

test("M10 a reformatted future entry already in the backup does not trigger a new backup each write", () => withStores((st) => {
  const future = { ...toArchive(finished(330)), id: "pretty-future", archiveSchema: ARCHIVE_SCHEMA + 1 };
  st.local.setItem(ARCHIVE_KEY, JSON.stringify([future], null, 2));
  saveArchive(toArchive(finished(331)));
  const first = st.local.getItem(ARCHIVE_BACKUP_KEY);
  saveArchive(toArchive(finished(332)));
  saveArchive(toArchive(finished(333)));
  assert.equal(st.local.getItem(ARCHIVE_BACKUP_KEY)?.replace(/"at":\d+/, ""), first?.replace(/"at":\d+/, ""));
}));
