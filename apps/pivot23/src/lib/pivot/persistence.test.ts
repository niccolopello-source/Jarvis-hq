import assert from "node:assert/strict";
import test from "node:test";
import {
  ARCHIVE_BACKUP_KEY,
  ARCHIVE_KEY,
  ARCHIVE_LIMIT,
  advanceCareerSim,
  archiveStateOf,
  loadArchive,
  openCareerSim,
  playCareerSim,
  resetArchiveMemory,
  saveArchive,
  toArchive,
} from "./engine.ts";
import {
  BACKUP_KEY,
  CRASH_BACKUP_KEY,
  SAVE_KEY,
  buildLiveSave,
  clearLive,
  lastLoadReport,
  loadLive,
  saveLive,
  setAsideLive,
} from "./save.ts";
import type { PlayerState } from "./types.ts";

/* Persistence under hostile storage, long careers and many archived careers. */

class MemoryStorage implements Storage {
  values = new Map<string, string>();
  quotaKeys = new Set<string>();
  /** Total characters this store accepts (keys + values), like a browser quota. 0 = unlimited. */
  limit = 0;
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) {
    if (this.quotaKeys.has(key)) throw new DOMException("Storage full", "QuotaExceededError");
    if (this.limit) {
      let used = 0;
      for (const [k, v] of this.values) if (k !== key) used += k.length + v.length;
      if (used + key.length + value.length > this.limit) throw new DOMException("Storage full", "QuotaExceededError");
    }
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
  return {
    local,
    session,
    restore() {
      clearLive();
      resetArchiveMemory();
      if (ld) Object.defineProperty(globalThis, "localStorage", ld);
      else Reflect.deleteProperty(globalThis, "localStorage");
      if (sd) Object.defineProperty(globalThis, "sessionStorage", sd);
      else Reflect.deleteProperty(globalThis, "sessionStorage");
    },
  };
}

const live = (p: PlayerState, logSeq = 1) => ({ player: p, pending: null, log: [], screen: "career" as const, tab: "log" as const, logSeq });

/* ---------------- error-screen escape hatch ---------------- */

test("setAsideLive copies the exact save aside before removing it, and leaves BACKUP_KEY alone", () => {
  const st = install();
  try {
    st.local.setItem(BACKUP_KEY, "older-backup");
    assert.equal(saveLive(live(playCareerSim({ seed: 11, difficulty: "pro" }))), true);
    const raw = st.local.getItem(SAVE_KEY)!;
    assert.equal(setAsideLive(), true);
    assert.equal(st.local.getItem(SAVE_KEY), null);
    assert.equal(st.session.getItem(SAVE_KEY), null);
    assert.equal(JSON.parse(st.local.getItem(CRASH_BACKUP_KEY)!).raw, raw);
    assert.equal(JSON.parse(st.local.getItem(CRASH_BACKUP_KEY)!).reason, "crashed");
    assert.equal(st.local.getItem(BACKUP_KEY), "older-backup");
    assert.equal(loadLive(), null);
  } finally {
    st.restore();
  }
});

test("setAsideLive never removes a save it could not copy (storage full)", () => {
  const st = install();
  try {
    assert.equal(saveLive(live(playCareerSim({ seed: 12, difficulty: "pro" }))), true);
    const raw = st.local.getItem(SAVE_KEY);
    st.local.quotaKeys.add(CRASH_BACKUP_KEY);
    assert.equal(setAsideLive(), false);
    assert.equal(st.local.getItem(SAVE_KEY), raw);
    assert.ok(loadLive());
  } finally {
    st.restore();
  }
});

test("setAsideLive with nothing saved is a no-op that reports a clean home", () => {
  const st = install();
  try {
    assert.equal(setAsideLive(), true);
    assert.equal(st.local.getItem(CRASH_BACKUP_KEY), null);
  } finally {
    st.restore();
  }
});

/* ---------------- long careers ---------------- */

test("every season of long careers saves, reloads as ok, and resumes on the same RNG state", () => {
  const st = install();
  let biggest = 0;
  try {
    for (const [i, difficulty] of (["esordio", "pro", "allstar", "leggenda"] as const).entries()) {
      const job = openCareerSim({ seed: 9100 + i, difficulty, draft: "best" });
      let done = false;
      while (!done) {
        done = advanceCareerSim(job);
        job.s.rngState = job.rng.getState();
        assert.equal(saveLive(live(job.s, job.n)), true, `${difficulty} season ${job.n}`);
        biggest = Math.max(biggest, st.local.getItem(SAVE_KEY)!.length);
        const back = loadLive();
        assert.equal(lastLoadReport().state, "ok");
        assert.ok(back);
        assert.equal(back.player.seasonHistory.length, job.s.seasonHistory.length);
        assert.equal(back.player.rngState, job.s.rngState);
        assert.equal(back.player.careerPoints, job.s.careerPoints);
      }
    }
  } finally {
    st.restore();
  }
  // A full career is a few dozen KB: far from the ~5 MB browser quota.
  assert.ok(biggest < 400_000, `largest save ${biggest} chars`);
});

test("a long career save that only fits after compaction is still accepted and loads", () => {
  const st = install();
  try {
    const p = playCareerSim({ seed: 9200, difficulty: "pro" });
    const full = JSON.stringify(buildLiveSave(p, null, [], "career", "log", 1)).length;
    const lean = JSON.stringify(buildLiveSave(p, null, [], "career", "log", 1, 3)).length;
    assert.ok(lean < full, "compaction shrinks the save");
    st.local.limit = Math.floor((full + lean) / 2) + 400; // room for the hint and swipe keys
    st.session.limit = st.local.limit;
    assert.equal(saveLive(live(p)), true);
    assert.ok(st.local.getItem(SAVE_KEY)!.length < full);
    assert.ok(loadLive());
    assert.equal(lastLoadReport().state, "ok");
  } finally {
    st.restore();
  }
});

test("a long save cut at any length never loads and never throws", () => {
  const p = playCareerSim({ seed: 9300, difficulty: "allstar" });
  const good = JSON.stringify(buildLiveSave(p, null, [], "career", "log", 1));
  const st = install();
  try {
    const step = Math.max(1, Math.floor(good.length / 120));
    for (let cut = 0; cut < good.length; cut += step) {
      clearLive();
      st.local.setItem(SAVE_KEY, good.slice(0, cut));
      assert.equal(loadLive(), null, `cut ${cut}`);
      if (cut > 0) assert.equal(lastLoadReport().state, "corrupt", `cut ${cut}`);
      assert.equal(st.local.getItem(SAVE_KEY), good.slice(0, cut), "kept as it was");
    }
  } finally {
    st.restore();
  }
});

/* ---------------- many archived careers ---------------- */

test("the archive keeps the newest ARCHIVE_LIMIT finished careers in order, each one still finished", () => {
  const st = install();
  try {
    const careers = Array.from({ length: ARCHIVE_LIMIT + 3 }, (_, i) => playCareerSim({ seed: 9400 + i, difficulty: "pro", name: `Arch ${i}` }));
    let t = 1_700_000_000_000;
    for (const c of careers) {
      const entry = toArchive(c);
      entry.savedAt = t++;
      saveArchive(entry);
    }
    const back = loadArchive();
    assert.equal(back.length, ARCHIVE_LIMIT);
    assert.deepEqual(back.map((e) => e.name), careers.slice(-ARCHIVE_LIMIT).reverse().map((c) => c.name));
    for (const c of careers.slice(-ARCHIVE_LIMIT)) assert.deepEqual(archiveStateOf(c.careerId), { finished: true, archived: true });
    for (const c of careers.slice(0, 3)) assert.equal(archiveStateOf(c.careerId).finished, false, "evicted ones are reported by D-20");
  } finally {
    st.restore();
  }
});

test("an unreadable archive is backed up before the next finished career is written over it", () => {
  const st = install();
  try {
    st.local.setItem(ARCHIVE_KEY, '[{"id":"x","name":"Trunc');
    saveArchive(toArchive(playCareerSim({ seed: 9500, difficulty: "pro" })));
    assert.equal(loadArchive().length, 1);
    const backup = JSON.parse(st.local.getItem(ARCHIVE_BACKUP_KEY)!) as { raws: string[] };
    assert.deepEqual(backup.raws, ['[{"id":"x","name":"Trunc']);
  } finally {
    st.restore();
  }
});

test("archive entries this build cannot read (newer version) are backed up, not silently dropped", () => {
  const st = install();
  try {
    const known = toArchive(playCareerSim({ seed: 9600, difficulty: "pro", name: "Noto" }));
    const future = { ...toArchive(playCareerSim({ seed: 9601, difficulty: "pro", name: "Dal futuro" })), version: 999 };
    const raw = JSON.stringify([future, known]);
    st.local.setItem(ARCHIVE_KEY, raw);
    assert.deepEqual(loadArchive().map((e) => e.name), ["Noto"]);
    saveArchive(toArchive(playCareerSim({ seed: 9602, difficulty: "pro", name: "Nuova" })));
    assert.deepEqual(loadArchive().map((e) => e.name), ["Nuova", "Noto"]);
    const backup = JSON.parse(st.local.getItem(ARCHIVE_BACKUP_KEY)!) as { raws: string[] };
    assert.ok(backup.raws.includes(raw));
    // A healthy archive is never backed up again and the backup is not overwritten.
    saveArchive(toArchive(playCareerSim({ seed: 9603, difficulty: "pro", name: "Altra" })));
    assert.deepEqual((JSON.parse(st.local.getItem(ARCHIVE_BACKUP_KEY)!) as { raws: string[] }).raws, backup.raws);
  } finally {
    st.restore();
  }
});
