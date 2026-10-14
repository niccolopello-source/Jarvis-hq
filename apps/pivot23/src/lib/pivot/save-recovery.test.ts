import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ARCHIVE_BACKUP_KEY, ARCHIVE_KEY, advanceCareerSim, archiveIssues, freshPlayer, lastArchiveLoad, lastArchiveWrite,
  loadArchive, openCareerSim, playCareerSim, resetArchiveMemory, saveArchive, toArchive,
} from "./engine.ts";
import { newLifeAsk } from "./new-life.ts";
import {
  BACKUP_KEY, BACKUP_PREV_KEY, SAVE_KEY, buildLiveSave, clearLive, hasLiveSave, lastLoadReport, liveSaveUnprotected,
  loadLive, readLiveBackup, restoreLiveBackup, saveLive,
} from "./save.ts";
import type { PlayerState } from "./types.ts";

/* Corrupted save & recovery audit (SR). Synthetic data only: every test runs on fresh in-memory stores. */

class Mem implements Storage {
  values = new Map<string, string>();
  limit = 0;
  quotaKeys = new Set<string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(k: string) { return this.values.get(k) ?? null; }
  key(i: number) { return [...this.values.keys()][i] ?? null; }
  removeItem(k: string) { this.values.delete(k); }
  setItem(k: string, v: string) {
    if (this.quotaKeys.has(k)) throw new DOMException("full", "QuotaExceededError");
    if (this.limit) {
      let used = 0;
      for (const [a, b] of this.values) if (a !== k) used += a.length + b.length;
      if (used + k.length + v.length > this.limit) throw new DOMException("full", "QuotaExceededError");
    }
    this.values.set(k, String(v));
  }
}

function stores(local: "ok" | "missing" | "throws" = "ok") {
  const ld = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const sd = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  const l = new Mem();
  const s = new Mem();
  if (local === "ok") Object.defineProperty(globalThis, "localStorage", { configurable: true, value: l });
  else if (local === "missing") Object.defineProperty(globalThis, "localStorage", { configurable: true, value: undefined });
  else Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new DOMException("denied", "SecurityError"); } });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: s });
  resetArchiveMemory();
  return {
    l, s,
    done() {
      l.limit = 0; l.quotaKeys.clear(); s.limit = 0; s.quotaKeys.clear();
      clearLive();
      resetArchiveMemory();
      if (ld) Object.defineProperty(globalThis, "localStorage", ld); else Reflect.deleteProperty(globalThis, "localStorage");
      if (sd) Object.defineProperty(globalThis, "sessionStorage", sd); else Reflect.deleteProperty(globalThis, "sessionStorage");
    },
  };
}
function run(fn: (st: ReturnType<typeof stores>) => void, local?: "ok" | "missing" | "throws") {
  return () => {
    const st = stores(local);
    try { fn(st); } finally { st.done(); }
  };
}

function midCareer(seed = 7100, seasons = 4): PlayerState {
  const job = openCareerSim({ seed, difficulty: "pro", name: "SR Sintetico" });
  for (let i = 0; i < seasons; i++) advanceCareerSim(job);
  job.s.rngState = job.rng.getState();
  return job.s;
}
const data = (p: PlayerState, logSeq = 2) => ({ player: p, pending: null, log: [], screen: "career" as const, tab: "log" as const, logSeq });
const validRaw = (p = midCareer()) => JSON.stringify(buildLiveSave(p, null, [], "career", "log", 2));
function withV(raw: string, v: unknown) { return JSON.stringify({ ...JSON.parse(raw), v }); }
/** A future-build save: valid shape, v above this build. */
const futureRaw = () => {
  const p = freshPlayer("SR Futuro", "PG", "Italia", 7, "pro");
  p.originPath = "NCAA";
  return withV(JSON.stringify(buildLiveSave(p, null, [], "career", "log", 3)), 3);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = Record<string, any>;

/* 1 ---------------- truncated / unparseable live save ---------------- */
test("SR-C1 a live save cut at many lengths never opens, never throws, is reported corrupt and backed up byte for byte", run((st) => {
  const raw = validRaw();
  for (const cut of [0.01, 0.1, 0.33, 0.5, 0.9, 0.999]) {
    const bad = raw.slice(0, Math.max(1, Math.floor(raw.length * cut)));
    st.l.values.clear();
    st.l.setItem(SAVE_KEY, bad);
    assert.equal(loadLive(), null);
    assert.deepEqual(lastLoadReport(), { state: "corrupt", version: undefined, backedUp: true });
    assert.equal(readLiveBackup()?.raw, bad);
    assert.equal(st.l.getItem(SAVE_KEY), bad, "the load itself never rewrites the save");
  }
  for (const junk of ["{", "null", "[]", "42", "\"x\"", "{\"v\":2}"]) {
    st.l.values.clear();
    st.l.setItem(SAVE_KEY, junk);
    assert.equal(loadLive(), null, junk);
    assert.equal(lastLoadReport().state, "corrupt", junk);
  }
}));

/* 2 ---------------- missing player / required fields / wrong types ---------------- */
test("SR-C2 missing player, missing required fields, wrong types and a stale checksum are all refused as corrupt", run((st) => {
  const base = JSON.parse(validRaw()) as Loose;
  const variants: [string, (r: Loose) => void][] = [
    ["no player", (r) => { delete r.player; }],
    ["player null", (r) => { r.player = null; }],
    ["no age", (r) => { delete r.player.age; }],
    ["age string", (r) => { r.player.age = "22"; }],
    ["age NaN-like", (r) => { r.player.age = null; }],
    ["attrs missing key", (r) => { delete r.player.attrs.shooting; }],
    ["seasonHistory not array", (r) => { r.player.seasonHistory = {}; }],
    ["choiceLog bad row", (r) => { r.player.choiceLog = [{ season: "1" }]; }],
    ["bad screen", (r) => { r.screen = "boom"; }],
    ["bad tab", (r) => { r.tab = 7; }],
    ["no checksum", (r) => { delete r.c; }],
    ["edited stat (stale checksum)", (r) => { r.player.overall += 1; }],
  ];
  for (const [label, edit] of variants) {
    const r = structuredClone(base);
    edit(r);
    const raw = JSON.stringify(r);
    st.l.values.clear();
    st.l.setItem(SAVE_KEY, raw);
    assert.doesNotThrow(() => loadLive(), label);
    assert.equal(loadLive(), null, label);
    assert.equal(lastLoadReport().state, "corrupt", label);
    assert.equal(readLiveBackup()?.raw, raw, label);
  }
}));

/* 3 ---------------- future / incompatible version ---------------- */
test("SR-C3 future, older-unknown and non-integer versions are refused with their own state and kept", run((st) => {
  const raw = validRaw();
  const cases: [unknown, string][] = [[3, "future"], [99, "future"], [1, "incompatible"], [0, "incompatible"], ["2", "corrupt"], [2.5, "corrupt"]];
  for (const [v, state] of cases) {
    const bad = withV(raw, v);
    st.l.values.clear();
    st.l.setItem(SAVE_KEY, bad);
    assert.equal(loadLive(), null, String(v));
    assert.equal(lastLoadReport().state, state, String(v));
    assert.equal(st.l.getItem(SAVE_KEY), bad);
    assert.equal(readLiveBackup()?.raw, bad);
  }
}));

/* 4 ---------------- older saves ---------------- */
test("SR-C4 a save written by the c3c4fa5 production build (v2) still opens unchanged on this build", run((st) => {
  const raw = readFileSync(new URL("./fixtures/live-save-v2-c3c4fa5.json", import.meta.url), "utf8");
  st.l.setItem(SAVE_KEY, raw);
  const live = loadLive();
  assert.ok(live, "older v2 save opens");
  assert.equal(lastLoadReport().state, "ok");
  const orig = JSON.parse(raw);
  assert.equal(live!.player.seed, orig.player.seed);
  assert.equal(live!.player.rngState, orig.player.rngState);
  assert.equal(live!.player.season, orig.player.season);
  assert.deepEqual(live!.player.seasonHistory.map((r) => r.season), orig.player.seasonHistory.map((r: { season: number }) => r.season));
  assert.equal(st.l.getItem(SAVE_KEY), raw, "opening does not rewrite it");
}));

/* 5 ---------------- localStorage missing / SecurityError ---------------- */
for (const mode of ["missing", "throws"] as const) {
  test(`SR-C5 localStorage ${mode}: saving never throws, is not reported as persistent, the tab copy reopens`, run((st) => {
    const p = midCareer();
    assert.doesNotThrow(() => saveLive(data(p)));
    assert.equal(saveLive(data(p)), false, "not persistent");
    assert.ok(st.s.getItem(SAVE_KEY));
    assert.equal(loadLive()?.player.seed, p.seed);
    assert.doesNotThrow(() => loadArchive());
    assert.doesNotThrow(() => saveArchive(toArchive(playCareerSim({ seed: 7150, difficulty: "pro" }))));
    assert.equal(lastArchiveWrite().persisted, true, "session copy written (isArchivePersisted decides)");
  }, mode));
}

/* 6 ---------------- quota during write ---------------- */
test("SR-C6 QuotaExceededError while saving keeps the last good save byte for byte", run((st) => {
  const p = midCareer();
  assert.equal(saveLive(data(p, 2)), true);
  const good = st.l.getItem(SAVE_KEY);
  st.l.quotaKeys.add(SAVE_KEY);
  st.s.quotaKeys.add(SAVE_KEY);
  p.age += 1;
  assert.equal(saveLive(data(p, 3)), false);
  assert.equal(st.l.getItem(SAVE_KEY), good);
}));

/* 7 / SR-01 ---------------- archive unparseable, non-array, single corrupt entry ---------------- */
const oldArchive = () => JSON.stringify([
  toArchive(playCareerSim({ seed: 7201, difficulty: "pro", name: "Archiviata Uno" })),
  toArchive(playCareerSim({ seed: 7202, difficulty: "pro", name: "Archiviata Due" })),
]);
for (const [label, mk] of [
  ["truncated JSON", (a: string) => a.slice(0, a.length - 40)],
  ["object, not array", (a: string) => JSON.stringify({ careers: JSON.parse(a) })],
] as const) {
  test(`SR-01 archive ${label} with no room for its copy: never overwritten, career kept in memory`, run((st) => {
    const raw = mk(oldArchive());
    st.l.setItem(ARCHIVE_KEY, raw);
    assert.deepEqual(loadArchive(), []);
    assert.equal(lastArchiveLoad().unreadable, true);
    const entry = toArchive(playCareerSim({ seed: 7203, difficulty: "pro", name: "Nuova" }));
    st.l.limit = raw.length + ARCHIVE_KEY.length + JSON.stringify([entry]).length + 500; // new archive fits, copy does not
    st.s.quotaKeys.add(ARCHIVE_KEY);
    const shown = saveArchive(entry);
    assert.deepEqual(shown.map((e) => e.name), ["Nuova"], "career stays on screen");
    assert.equal(st.l.getItem(ARCHIVE_KEY), raw, "unreadable original kept");
    assert.equal(lastArchiveWrite().persisted, false);
    assert.equal(lastArchiveWrite().reason, "quota", "the UI warns and keeps the live save");
  }));
}

test("SR-C7 one corrupt entry among several: the others load, the drop is counted, the raw is copied before the next write", run((st) => {
  const good = JSON.parse(oldArchive()) as unknown[];
  const raw = JSON.stringify([good[0], { id: 5, name: null }, good[1]]);
  st.l.setItem(ARCHIVE_KEY, raw);

  assert.equal(loadArchive().length, 2);
  assert.equal(lastArchiveLoad().dropped, 1);
  saveArchive(toArchive(playCareerSim({ seed: 7204, difficulty: "pro", name: "Terza" })));
  assert.equal(loadArchive().length, 3);
  assert.ok((JSON.parse(st.l.getItem(ARCHIVE_BACKUP_KEY)!) as { raws: string[] }).raws.includes(raw));
}));

/* 8 / 9 ---------------- Career Card ---------------- */
test("SR-C8/C9 card valid / wrong fingerprint / missing fingerprint / unreadable / record disagreeing: each flagged, none rewritten as verified", run((st) => {
  const e = (seed: number) => toArchive(playCareerSim({ seed, difficulty: "pro", name: `Carta ${seed}` }));
  const valid = e(7301);
  const wrongFp = { ...e(7302) }; wrongFp.card = { ...wrongFp.card!, mvps: wrongFp.card!.mvps + 3 };
  const noFp = { ...e(7303) }; noFp.card = { ...noFp.card!, mvps: noFp.card!.mvps + 3 }; delete (noFp as { fingerprint?: string }).fingerprint;
  const unreadable = { ...e(7304), card: { id: 1 } as never };
  const mismatch = { ...e(7305), titles: 9 };
  st.l.setItem(ARCHIVE_KEY, JSON.stringify([valid, wrongFp, noFp, unreadable, mismatch]));
  const issues = new Map(loadArchive().map((x) => [x.name, archiveIssues(x)]));
  assert.deepEqual(issues.get(valid.name), []);
  assert.ok(issues.get(wrongFp.name)!.includes("card-mismatch"));
  assert.ok(issues.get(noFp.name)!.includes("card-unverified"));
  assert.ok(issues.get(unreadable.name)!.includes("card-dropped"));
  assert.ok(issues.get(mismatch.name)!.includes("record-mismatch"));
  saveArchive(toArchive(playCareerSim({ seed: 7306, difficulty: "pro", name: "Dopo" })));
  const stored = JSON.parse(st.l.getItem(ARCHIVE_KEY)!) as { name: string; fingerprint?: string }[];
  assert.equal(stored.find((x) => x.name === noFp.name)!.fingerprint, undefined, "never given a fresh fingerprint");
  assert.equal(stored.find((x) => x.name === wrongFp.name)!.fingerprint, wrongFp.fingerprint, "stale fingerprint kept as stored");
  assert.equal(loadArchive().length, 6, "no entry lost");
}));

/* 10 / SR-02 / SR-03 ---------------- backup absent, corrupt, full ---------------- */
test("SR-C10 backup absent: restore reports false; corrupt backup: ignored and replaced by the next copy", run((st) => {
  assert.equal(readLiveBackup(), null);
  assert.equal(restoreLiveBackup(), false);
  st.l.setItem(BACKUP_KEY, "{broken");
  assert.equal(readLiveBackup(), null);
  const bad = "{\"v\":2,\"trunc";
  st.l.setItem(SAVE_KEY, bad);
  loadLive();
  assert.equal(lastLoadReport().backedUp, true);
  assert.equal(readLiveBackup()?.raw, bad);
  assert.equal(restoreLiveBackup(), true);
  assert.equal(st.l.getItem(SAVE_KEY), bad, "restore puts the exact original back");
}));

test("SR-02 a future save with no room for its backup is not deleted by a new life nor overwritten by its first save", run((st) => {
  const raw = futureRaw();
  st.l.setItem(SAVE_KEY, raw);
  st.l.quotaKeys.add(BACKUP_KEY);
  assert.equal(loadLive(), null);
  assert.deepEqual(lastLoadReport(), { state: "future", version: 3, backedUp: false });
  assert.equal(liveSaveUnprotected(), true);
  // The home sees no live career, so "Inizia" does not ask: clearLive() must still keep it.
  assert.equal(newLifeAsk({ hasLive: hasLiveSave(), finished: false, archived: false }), "none");
  assert.equal(clearLive(), false);
  assert.equal(st.l.getItem(SAVE_KEY), raw);
  const p = midCareer(7401);
  assert.equal(saveLive(data(p)), false, "the new career is not promised as persistent");
  assert.equal(st.l.getItem(SAVE_KEY), raw, "future save still there");
  assert.ok(st.s.getItem(SAVE_KEY), "new career kept in the tab");
  // Room comes back: the backup is taken first, then the new career is written.
  st.l.quotaKeys.delete(BACKUP_KEY);
  assert.equal(saveLive(data(p, 3)), true);
  assert.equal(readLiveBackup()?.raw, raw);
  assert.equal(liveSaveUnprotected(), false);
}));

test("SR-03 a second damaged save never overwrites an earlier backup: the earlier one moves to the previous slot", run((st) => {
  const future = futureRaw();
  st.l.setItem(SAVE_KEY, future);
  loadLive();
  assert.equal(readLiveBackup()?.raw, future);
  assert.equal(clearLive(), true);
  const bad = "{\"v\":2,\"trunc";
  st.l.setItem(SAVE_KEY, bad);
  loadLive();
  assert.equal(readLiveBackup()?.raw, bad);
  assert.equal((JSON.parse(st.l.getItem(BACKUP_PREV_KEY)!) as { raw: string }).raw, future);
  // No room to move the earlier copy: the earlier backup stays and nothing is overwritten.
  clearLive();
  st.l.quotaKeys.add(BACKUP_PREV_KEY);
  const other = "{\"v\":2,\"altro";
  st.l.setItem(SAVE_KEY, other);
  loadLive();
  assert.equal(lastLoadReport().backedUp, false);
  assert.equal(readLiveBackup()?.raw, bad);
  assert.equal(clearLive(), false, "and the new damaged save is kept under the live key");
  assert.equal(st.l.getItem(SAVE_KEY), other);
}));

/* 11 ---------------- interrupted write / resume ---------------- */
test("SR-C11 a write cut by a crash leaves either the old or the new save; the resume never repeats a season or a choice", run((st) => {
  const p = midCareer(7501, 3);
  assert.equal(saveLive(data(p, 2)), true);
  const before = loadLive()!;
  const seasons = before.player.seasonHistory.length;
  const choices = before.player.choiceLog.length;
  const awards = before.player.mvpCount + before.player.allStarCount + before.player.titleCount;
  // Partial write: a truncated string where the browser was killed. The previous good copy sits in sessionStorage.
  const half = st.l.getItem(SAVE_KEY)!.slice(0, 5000);
  st.l.values.set(SAVE_KEY, half);
  const resumed = loadLive()!;
  assert.ok(resumed, "the tab copy reopens");
  assert.equal(resumed.player.seasonHistory.length, seasons);
  assert.equal(resumed.player.choiceLog.length, choices);
  assert.equal(resumed.player.mvpCount + resumed.player.allStarCount + resumed.player.titleCount, awards);
  assert.equal(resumed.player.rngState, before.player.rngState);
  // Repeated save/load loops are idempotent.
  for (let i = 0; i < 5; i++) {
    saveLive(data(loadLive()!.player, 2));
    const again = loadLive()!;
    assert.equal(again.player.seasonHistory.length, seasons);
    assert.equal(again.player.choiceLog.length, choices);
  }
}));

/* 12 ---------------- many archived careers ---------------- */
test("SR-C12 eight careers, one damaged: the seven others survive load, a new write, and a restore of the raw copy", run((st) => {
  const all = Array.from({ length: 8 }, (_, i) => ({ ...toArchive(playCareerSim({ seed: 7600 + i, difficulty: "pro", name: `Multi ${i}` })), savedAt: 1_000 + i }));
  const damaged = [...all.slice(0, 3), { ...all[3], ppg: "x" }, ...all.slice(4)];
  const raw = JSON.stringify(damaged);
  st.l.setItem(ARCHIVE_KEY, raw);
  assert.equal(loadArchive().length, 7);
  saveArchive({ ...toArchive(playCareerSim({ seed: 7700, difficulty: "pro", name: "Multi nuova" })), savedAt: 9_999 });
  const after = loadArchive().map((e) => e.name);
  assert.equal(after.length, 8);
  for (const e of all) if (e.name !== "Multi 3") assert.ok(after.includes(e.name), e.name);
  const backup = JSON.parse(st.l.getItem(ARCHIVE_BACKUP_KEY)!) as { raws: string[] };
  const kept = (JSON.parse(backup.raws.at(-1)!) as { name: string }[]).find((x) => x.name === "Multi 3");
  assert.ok(kept, "the damaged entry is still recoverable from the raw copy");
}));
