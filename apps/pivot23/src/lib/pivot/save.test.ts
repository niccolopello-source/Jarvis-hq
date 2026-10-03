import assert from "node:assert/strict";
import test from "node:test";
import { ARCHIVE_KEY, archiveStateOf, freshPlayer, isArchivePersisted, loadArchive, saveArchive, toArchive } from "./engine.ts";
import { createOnce, mayDeleteLive, newLifeAsk } from "./new-life.ts";
import {
  BACKUP_KEY,
  LIVE_MIGRATIONS,
  LIVE_SAVE_VERSION,
  SAVE_KEY,
  buildLiveSave,
  clearLive,
  lastLoadReport,
  loadLive,
  persistentStorageAvailable,
  readLiveBackup,
  restoreLiveBackup,
  saveLive,
  watchLiveConflicts,
} from "./save.ts";
import type { PlayerState } from "./types.ts";

/* In-memory Storage with switchable failure modes. */
class MemoryStorage implements Storage {
  values = new Map<string, string>();
  quota = false;
  silentDrop = false;
  throwOnRemove = false;
  /** Keys whose writes fail with a quota error, even when `quota` is off. */
  quotaKeys = new Set<string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) {
    if (this.throwOnRemove) throw new DOMException("blocked", "SecurityError");
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    if (this.quota || this.quotaKeys.has(key)) throw new DOMException("Storage full", "QuotaExceededError");
    if (this.silentDrop) return;
    this.values.set(key, String(value));
  }
}

function install(opts: { local?: "ok" | "missing" | "throws" } = {}) {
  const ld = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const sd = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  const local = new MemoryStorage();
  const session = new MemoryStorage();
  const mode = opts.local ?? "ok";
  if (mode === "ok") Object.defineProperty(globalThis, "localStorage", { configurable: true, value: local });
  else if (mode === "missing") Object.defineProperty(globalThis, "localStorage", { configurable: true, value: undefined });
  else Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new DOMException("denied", "SecurityError"); } });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: session });
  return {
    local,
    session,
    restore() {
      local.throwOnRemove = false;
      session.throwOnRemove = false;
      clearLive();
      if (ld) Object.defineProperty(globalThis, "localStorage", ld);
      else Reflect.deleteProperty(globalThis, "localStorage");
      if (sd) Object.defineProperty(globalThis, "sessionStorage", sd);
      else Reflect.deleteProperty(globalThis, "sessionStorage");
    },
  };
}

function player(name = "Test Uno", seed?: number): PlayerState {
  const p = freshPlayer(name, "PG", "Italia", 7, "pro");
  if (seed !== undefined) p.seed = seed;
  p.originPath = "NCAA";
  return p;
}

function data(p: PlayerState, logSeq = 1) {
  return { player: p, pending: null, log: [], screen: "career" as const, tab: "log" as const, logSeq };
}

/* ---------------- D-04: saveLive reports what storage really holds ---------------- */

test("D-04 two module instances: A saves X, B saves Y, A saves X again -> storage holds X", async () => {
  const st = install();
  try {
    const spec = "./save.ts?instance=b"; // a second, independent module instance
    const B = (await import(spec)) as typeof import("./save.ts");
    const x = player("Alpha", 101);
    const y = player("Beta", 202);
    assert.equal(saveLive(data(x)), true);
    const xRaw = st.local.getItem(SAVE_KEY);
    assert.equal(B.saveLive(data(y)), true);
    assert.notEqual(st.local.getItem(SAVE_KEY), xRaw);
    // Same payload as A's cached write: the cache must not short-circuit.
    assert.equal(saveLive(data(x)), true);
    assert.equal(st.local.getItem(SAVE_KEY), xRaw);
    assert.equal(JSON.parse(st.local.getItem(SAVE_KEY)!).player.name, "Alpha");
  } finally {
    st.restore();
  }
});

test("D-04 a store that drops writes silently makes saveLive return false", () => {
  const st = install();
  try {
    st.local.silentDrop = true;
    st.session.silentDrop = true;
    assert.equal(saveLive(data(player())), false);
    assert.equal(st.local.getItem(SAVE_KEY), null);
  } finally {
    st.restore();
  }
});

test("D-04 quota on localStorage: session copy is kept but saveLive does not promise persistence", () => {
  const st = install();
  try {
    st.local.quota = true;
    assert.equal(saveLive(data(player())), false);
    assert.ok(st.session.getItem(SAVE_KEY), "session copy still written");
    assert.ok(loadLive(), "the career stays readable in this tab");
  } finally {
    st.restore();
  }
});

test("D-04 quota keeps the previous good save untouched", () => {
  const st = install();
  try {
    const p = player();
    assert.equal(saveLive(data(p, 1)), true);
    const good = st.local.getItem(SAVE_KEY);
    st.local.quota = true;
    st.session.quota = true;
    p.age += 1;
    assert.equal(saveLive(data(p, 2)), false);
    assert.equal(st.local.getItem(SAVE_KEY), good);
  } finally {
    st.restore();
  }
});

test("D-04 localStorage unavailable (missing or throwing): no false persistence", () => {
  for (const mode of ["missing", "throws"] as const) {
    const st = install({ local: mode });
    try {
      assert.equal(persistentStorageAvailable(), false, mode);
      assert.equal(saveLive(data(player())), false, mode);
      assert.ok(loadLive(), `${mode}: in-memory copy for this tab`);
    } finally {
      st.restore();
    }
  }
  const ok = install();
  try {
    assert.equal(persistentStorageAvailable(), true);
  } finally {
    ok.restore();
  }
});

test("D-04 two tabs with different careers: this tab's session copy wins on reload", () => {
  const st = install();
  try {
    const mine = player("Mia", 11);
    assert.equal(saveLive(data(mine, 1)), true);
    // Another tab overwrites localStorage only, with a different career and a higher logSeq.
    const other = player("Altra", 22);
    st.local.setItem(SAVE_KEY, JSON.stringify(buildLiveSave(other, null, [], "career", "log", 50)));
    assert.equal(loadLive()?.player.name, "Mia");
  } finally {
    st.restore();
  }
});

test("D-04 storage event from another tab with a different career raises a conflict", () => {
  const prevWindow = (globalThis as { window?: unknown }).window;
  const target = new EventTarget();
  (globalThis as { window?: unknown }).window = target;
  try {
    let hits = 0;
    const stop = watchLiveConflicts(() => "mine", () => { hits += 1; });
    const fire = (key: string, newValue: string | null) => {
      const ev = new Event("storage") as Event & { key: string; newValue: string | null };
      Object.assign(ev, { key, newValue });
      target.dispatchEvent(ev);
    };
    fire(SAVE_KEY, JSON.stringify({ player: { careerId: "mine" } }));
    fire("other-key", JSON.stringify({ player: { careerId: "theirs" } }));
    fire(SAVE_KEY, null);
    fire(SAVE_KEY, "{broken");
    assert.equal(hits, 0);
    fire(SAVE_KEY, JSON.stringify({ player: { careerId: "theirs" } }));
    assert.equal(hits, 1);
    stop();
    fire(SAVE_KEY, JSON.stringify({ player: { careerId: "theirs" } }));
    assert.equal(hits, 1);
  } finally {
    (globalThis as { window?: unknown }).window = prevWindow;
  }
});

/* ---------------- clearLive reports success ---------------- */

test("clearLive returns true only when the save is gone everywhere", () => {
  const st = install();
  try {
    assert.equal(saveLive(data(player())), true);
    assert.equal(clearLive(), true);
    assert.equal(st.local.getItem(SAVE_KEY), null);
    assert.equal(st.session.getItem(SAVE_KEY), null);
    assert.equal(loadLive(), null);

    assert.equal(saveLive(data(player())), true);
    st.local.throwOnRemove = true;
    assert.equal(clearLive(), false);
    assert.ok(st.local.getItem(SAVE_KEY), "nothing lost");
    assert.ok(loadLive(), "career still loadable after a failed delete");
  } finally {
    st.restore();
  }
});

/* ---------------- D-06: versions, migrations, backups ---------------- */

function seeded(st: ReturnType<typeof install>, raw: string) {
  clearLive();
  st.local.setItem(SAVE_KEY, raw);
}

test("D-06 current valid version loads with state ok", () => {
  const st = install();
  try {
    seeded(st, JSON.stringify(buildLiveSave(player(), null, [], "career", "log", 1)));
    assert.ok(loadLive());
    assert.equal(lastLoadReport().state, "ok");
    assert.equal(LIVE_SAVE_VERSION, 2);
    assert.equal(readLiveBackup(), null, "no backup for a healthy save");
  } finally {
    st.restore();
  }
});

test("D-06 the only shipped version is 2: no migrations registered, v1 is incompatible and kept", () => {
  assert.deepEqual(Object.keys(LIVE_MIGRATIONS), []);
  const st = install();
  try {
    const old = { ...buildLiveSave(player(), null, [], "career", "log", 1), v: 1 };
    const raw = JSON.stringify(old);
    seeded(st, raw);
    assert.equal(loadLive(), null);
    const r = lastLoadReport();
    assert.equal(r.state, "incompatible");
    assert.equal(r.version, 1);
    assert.equal(r.backedUp, true);
    assert.equal(st.local.getItem(SAVE_KEY), raw, "never silently deleted");
    assert.equal(readLiveBackup()?.raw, raw);
  } finally {
    st.restore();
  }
});

test("D-06 future version is not opened, not deleted, and backed up", () => {
  const st = install();
  try {
    const raw = JSON.stringify({ ...buildLiveSave(player(), null, [], "career", "log", 1), v: 99 });
    seeded(st, raw);
    assert.equal(loadLive(), null);
    assert.equal(lastLoadReport().state, "future");
    assert.equal(st.local.getItem(SAVE_KEY), raw);
    assert.equal(readLiveBackup()?.reason, "future");
  } finally {
    st.restore();
  }
});

test("D-06 corrupted JSON, truncated data and bad checksum are reported as corrupt and kept", () => {
  const good = JSON.stringify(buildLiveSave(player(), null, [], "career", "log", 1));
  const badSum = JSON.parse(good) as { c: string };
  badSum.c = "0000000000000000";
  const cases: Record<string, string> = {
    json: "{not json",
    truncated: good.slice(0, Math.floor(good.length / 2)),
    checksum: JSON.stringify(badSum),
    array: "[]",
    noVersion: JSON.stringify({ screen: "career" }),
  };
  for (const [label, raw] of Object.entries(cases)) {
    const st = install();
    try {
      seeded(st, raw);
      assert.equal(loadLive(), null, label);
      assert.equal(lastLoadReport().state, "corrupt", label);
      assert.equal(lastLoadReport().backedUp, true, label);
      assert.equal(st.local.getItem(SAVE_KEY), raw, `${label}: kept`);
    } finally {
      st.restore();
    }
  }
});

test("D-06 quota exceeded while backing up: report says no backup, original still in place", () => {
  const st = install();
  try {
    st.local.quotaKeys.add(BACKUP_KEY);
    st.session.quotaKeys.add(BACKUP_KEY);
    seeded(st, "{broken");
    assert.equal(loadLive(), null);
    assert.equal(lastLoadReport().state, "corrupt");
    assert.equal(lastLoadReport().backedUp, false);
    assert.equal(st.local.getItem(SAVE_KEY), "{broken");
  } finally {
    st.restore();
  }
});

test("D-06 restore from backup puts the exact original back after a new career overwrote it", () => {
  const st = install();
  try {
    const raw = JSON.stringify({ ...buildLiveSave(player("Futuro"), null, [], "career", "log", 1), v: 3 });
    seeded(st, raw);
    assert.equal(loadLive(), null);
    assert.equal(saveLive(data(player("Nuovo"))), true);
    assert.notEqual(st.local.getItem(SAVE_KEY), raw);
    assert.equal(restoreLiveBackup(), true);
    assert.equal(st.local.getItem(SAVE_KEY), raw);
    loadLive();
    assert.equal(lastLoadReport().state, "future");
  } finally {
    st.restore();
  }
});

test("D-06 migration pipeline: sequential steps, validation after, backup before transform", () => {
  const st = install();
  try {
    // Test-only migration for a hypothetical v1 that stored the name under `nome`.
    LIVE_MIGRATIONS[1] = (raw) => {
      const p = raw.player as Record<string, unknown>;
      p.name = p.nome;
      delete p.nome;
      return { ...raw, v: 2 };
    };
    const base = buildLiveSave(player("Storico"), null, [], "career", "log", 1) as unknown as Record<string, unknown>;
    const p1 = { ...(base.player as Record<string, unknown>) };
    p1.nome = p1.name;
    delete p1.name;
    const raw = JSON.stringify({ ...base, v: 1, player: p1, c: "old" });
    seeded(st, raw);
    const live = loadLive();
    assert.equal(live?.player.name, "Storico");
    assert.equal(lastLoadReport().state, "migrated");
    assert.equal(readLiveBackup()?.raw, raw, "original backed up before transform");

    // A migration that produces an invalid save is rejected and the original kept.
    LIVE_MIGRATIONS[1] = (r) => ({ ...r, v: 2, player: null });
    st.local.removeItem(BACKUP_KEY);
    seeded(st, raw);
    assert.equal(loadLive(), null);
    assert.equal(lastLoadReport().state, "incompatible");
    assert.equal(st.local.getItem(SAVE_KEY), raw);

    // No room for the backup: do not migrate at all.
    LIVE_MIGRATIONS[1] = (r) => {
      const p = r.player as Record<string, unknown>;
      p.name = p.nome;
      delete p.nome;
      return { ...r, v: 2 };
    };
    st.local.removeItem(BACKUP_KEY);
    st.local.quotaKeys.add(BACKUP_KEY);
    st.session.quotaKeys.add(BACKUP_KEY);
    seeded(st, raw);
    assert.equal(loadLive(), null);
    assert.equal(st.local.getItem(SAVE_KEY), raw);
  } finally {
    delete LIVE_MIGRATIONS[1];
    st.restore();
  }
});

/* ---------------- D-02/D-05: new-life rules and archive state ---------------- */

test("newLifeAsk: ask for running careers and unarchived finished careers only", () => {
  assert.equal(newLifeAsk({ hasLive: false, finished: false, archived: false }), "none");
  assert.equal(newLifeAsk({ hasLive: true, finished: false, archived: false }), "running");
  assert.equal(newLifeAsk({ hasLive: true, finished: true, archived: true }), "none");
  assert.equal(newLifeAsk({ hasLive: true, finished: true, archived: false }), "unarchived");
  assert.equal(mayDeleteLive({ hasLive: true, finished: false, archived: false }, false), false);
  assert.equal(mayDeleteLive({ hasLive: true, finished: false, archived: false }, true), true);
  assert.equal(mayDeleteLive({ hasLive: true, finished: true, archived: true }, false), true);
});

test("createOnce: a double tap runs the action once", () => {
  const once = createOnce();
  let runs = 0;
  assert.equal(once.hold(), true);
  assert.equal(once.run(() => { runs += 1; }), false, "second tap while busy is ignored");
  once.release();
  assert.equal(once.run(() => { runs += 1; }), true);
  assert.equal(runs, 1);
});

test("archiveStateOf: finished vs archived; session-only archive is not persisted", () => {
  const st = install();
  try {
    st.local.setItem(ARCHIVE_KEY, "[]");
    st.session.setItem(ARCHIVE_KEY, "[]");
    loadArchive();
    const p = player("Archivio");
    assert.deepEqual(archiveStateOf(p.careerId), { finished: false, archived: false });
    st.local.quota = true;
    const entry = toArchive(p);
    saveArchive(entry);
    assert.deepEqual(archiveStateOf(p.careerId), { finished: true, archived: false });
    assert.equal(isArchivePersisted(entry.id), false);
    st.local.quota = false;
    saveArchive(entry);
    assert.deepEqual(archiveStateOf(p.careerId), { finished: true, archived: true });
    assert.deepEqual(archiveStateOf(undefined), { finished: false, archived: false });
  } finally {
    st.restore();
  }
});

test("D-20 archive limit: the evicted career is reported, never removed silently", async () => {
  // Fresh engine instance: the archive keeps an in-memory copy across tests.
  const spec = "./engine.ts?instance=d20";
  const { lastArchiveEvicted, loadArchive, saveArchive, toArchive } = (await import(spec)) as typeof import("./engine.ts");
  const st = install();
  try {
    st.local.setItem(ARCHIVE_KEY, "[]");
    st.session.setItem(ARCHIVE_KEY, "[]");
    loadArchive();
    const names: string[] = [];
    for (let i = 0; i < 9; i++) {
      const e = toArchive(player(`Vita ${i}`));
      e.savedAt = 1000 + i;
      names.push(e.name);
      saveArchive(e);
      if (i < 8) assert.deepEqual(lastArchiveEvicted(), [], `entry ${i}`);
    }
    assert.deepEqual(lastArchiveEvicted().map((e) => e.name), ["Vita 0"]);
    assert.equal(loadArchive().length, 8);
  } finally {
    st.restore();
  }
});
