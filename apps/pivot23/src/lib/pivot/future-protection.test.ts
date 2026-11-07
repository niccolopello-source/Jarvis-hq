import assert from "node:assert/strict";
import test from "node:test";
import { openCareerSim } from "./engine.ts";
import {
  SAVE_KEY,
  BACKUP_KEY,
  BACKUP_PREV_KEY,
  CRASH_BACKUP_KEY,
  buildLiveSave,
  loadLive,
  saveLive,
  clearLive,
  setAsideLive,
  restoreLiveBackup,
} from "./save.ts";
class Mem implements Storage {
  values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  key(i: number) {
    return [...this.values.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.values.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.values.set(k, v);
  }
  removeItem(k: string) {
    this.values.delete(k);
  }
}
function setup() {
  const local = new Mem(),
    session = new Mem();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: local,
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: session,
  });
  clearLive();
  return { local, session };
}
function data() {
  return {
    player: openCareerSim({ seed: 89001, engineVersion: "2.24.0-beta" }).s,
    pending: null,
    log: [],
    screen: "career" as const,
    tab: "log" as const,
    logSeq: 1,
  };
}
for (const key of [SAVE_KEY, BACKUP_KEY, BACKUP_PREV_KEY, CRASH_BACKUP_KEY])
  for (const target of ["local", "session"] as const)
    test(`future engine in ${target}/${key} blocks load, MEM, autosave, clear, crash and restore without rotating any bytes`, () => {
      const st = setup();
      const d = data();
      assert.equal(saveLive(d), true);
      const p = structuredClone(d.player);
      p.engineVersion = "3.0.0";
      const raw = JSON.stringify(
        buildLiveSave(p, null, [], "career", "log", 1),
      );
      st[target].setItem(
        key,
        key === SAVE_KEY
          ? raw
          : JSON.stringify({ v: 1, at: 1, reason: "future", raw }),
      );
      const before = [...st.local.values, ...st.session.values];
      assert.equal(loadLive() === null, true);
      assert.equal(saveLive(d), false);
      assert.equal(clearLive(), false);
      assert.equal(setAsideLive(), false);
      assert.equal(restoreLiveBackup(), false);
      assert.deepEqual([...st.local.values, ...st.session.values], before);
    });
test("future header beats corrupt payload and valid legacy session", () => {
  const st = setup();
  st.local.setItem(SAVE_KEY, JSON.stringify({ v: 3, player: null }));
  const d = data();
  st.session.setItem(
    SAVE_KEY,
    JSON.stringify(buildLiveSave(d.player, null, [], "career", "log", 1)),
  );
  const before = [...st.local.values, ...st.session.values];
  assert.equal(loadLive() === null, true);
  assert.equal(saveLive(d), false);
  assert.deepEqual([...st.local.values, ...st.session.values], before);
});

import {
  classifyPersistedRaw,
  inspectLiveProtection,
  exportLiveRaw,
  rawSaveHash,
  persistedVersion,
} from "./live-protection.ts";
test("persistence parser numeric, beta core, malformed separate from historical engine gates", () => {
  assert.deepEqual(persistedVersion("2.9"), [2, 9, 0]);
  assert.deepEqual(persistedVersion("2.25.0-beta"), [2, 25, 0]);
  for (const v of [null, 225, "", "garbage", "999999999999999999999.0.0"])
    assert.equal(persistedVersion(v), null);
});
test("recognized future engine wins over invalid checksum, missing schema and incomplete player", () => {
  setup();
  for (const version of ["2.25.0-beta", "2.25.0", "3.0.0"])
    assert.equal(
      classifyPersistedRaw(
        JSON.stringify({ player: { engineVersion: version } }),
      ),
      "future-engine",
    );
});
test("unknown engine metadata blocks without changing raw or using stale MEM", () => {
  for (const v of [undefined, null, 225, "", "garbage"]) {
    const st = setup();
    const d = data();
    assert.equal(saveLive(d), true);
    const p = structuredClone(d.player) as unknown as Record<string, unknown>;
    if (v === undefined) delete p.engineVersion;
    else p.engineVersion = v;
    const raw = JSON.stringify({ v: 2, player: p });
    st.local.setItem(SAVE_KEY, raw);
    assert.equal(loadLive() === null, true);
    assert.equal(saveLive(d), false);
    assert.equal(st.local.getItem(SAVE_KEY), raw);
  }
});
test("read failure is not absent: no MEM fallback and no writes to any store", () => {
  const st = setup();
  const d = data();
  assert.equal(saveLive(d), true);
  const before = [...st.session.values];
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("denied");
    },
  });
  assert.equal(inspectLiveProtection().blocked, true);
  assert.equal(loadLive() === null, true);
  assert.equal(saveLive(d), false);
  assert.deepEqual([...st.session.values], before);
});
test("raw export is exact UTF16LE even for lone surrogates, rejects stale choice, never writes", () => {
  const st = setup();
  const raw = "{raw\ud800\n ";
  st.local.setItem(SAVE_KEY, raw);
  const id = `localStorage/${SAVE_KEY}`;
  const before = [...st.local.values];
  const bytes = exportLiveRaw(id, rawSaveHash(raw));
  let decoded = "";
  for (let i = 0; i < bytes.length; i += 2)
    decoded += String.fromCharCode(bytes[i]! | (bytes[i + 1]! << 8));
  assert.equal(decoded, raw);
  assert.deepEqual([...st.local.values], before);
  st.local.setItem(SAVE_KEY, "{raw\ud801\n ");
  assert.throws(() => exportLiveRaw(id, rawSaveHash(raw)));
});
test("incoming future payload never gains a first write to live keys, including DEV/lab", () => {
  const st = setup();
  const d = data();
  d.player.engineVersion = "2.25.0-beta";
  assert.equal(saveLive(d), false);
  assert.equal(st.local.getItem(SAVE_KEY), null);
  assert.equal(st.session.getItem(SAVE_KEY), null);
});

for (const key of [SAVE_KEY, BACKUP_KEY, BACKUP_PREV_KEY, CRASH_BACKUP_KEY])
  for (const target of ["local", "session"] as const)
    test(`future schema in ${target}/${key}: repeated boots and all mutations preserve raw`, () => {
      const st = setup();
      const d = data();
      assert.equal(saveLive(d), true);
      const raw = JSON.stringify({
        ...buildLiveSave(d.player, null, [], "career", "log", 1),
        v: 3,
        player: null,
      });
      st[target].setItem(
        key,
        key === SAVE_KEY ? raw : JSON.stringify({ v: 1, at: 1, raw }),
      );
      const before = [...st.local.values, ...st.session.values];
      for (let boot = 0; boot < 3; boot++) {
        assert.equal(loadLive(), null);
        assert.equal(saveLive(d), false);
        assert.equal(clearLive(), false);
        assert.equal(setAsideLive(), false);
        assert.equal(restoreLiveBackup(), false);
        assert.deepEqual([...st.local.values, ...st.session.values], before);
      }
    });
test("numeric 2.9 is older than 2.24; recognized core is never restamped", () => {
  setup();
  for (const version of ["2.9", "2.12.0-beta", "2.24.0-beta", "2.24.0+build"]) {
    const d = data();
    d.player.engineVersion = version;
    const raw = JSON.stringify(
      buildLiveSave(d.player, null, [], "career", "log", 1),
    );
    assert.equal(classifyPersistedRaw(raw), "supported");
    const st = setup();
    st.local.setItem(SAVE_KEY, raw);
    assert.equal(loadLive()?.player.engineVersion, version);
    assert.equal(st.local.getItem(SAVE_KEY), raw);
  }
});
test("malformed wrapper metadata cannot enable writes; inner future still takes precedence", () => {
  setup();
  const legacy = JSON.stringify(
    buildLiveSave(data().player, null, [], "career", "log", 1),
  );
  for (const v of [undefined, null, "1", 0])
    assert.ok(
      ["missing", "malformed"].includes(
        classifyPersistedRaw(JSON.stringify({ v, raw: legacy }), true),
      ),
    );
  assert.equal(
    classifyPersistedRaw(
      JSON.stringify({
        raw: JSON.stringify({ player: { engineVersion: "3.0" } }),
      }),
      true,
    ),
    "future-engine",
  );
});
test("quota and export read failure do not unlock a future primary or write any fallback", () => {
  const st = setup();
  const raw = JSON.stringify({ v: 3, opaque: "synthetic" });
  st.local.setItem(SAVE_KEY, raw);
  const hash = rawSaveHash(raw),
    before = [...st.local.values, ...st.session.values];
  let writes = 0;
  for (const store of [st.local, st.session])
    store.setItem = () => {
      writes++;
      throw new DOMException("full", "QuotaExceededError");
    };
  assert.equal(saveLive(data()), false);
  assert.equal(setAsideLive(), false);
  assert.equal(restoreLiveBackup(), false);
  assert.equal(writes, 0);
  st.local.getItem = () => {
    throw new Error("read denied");
  };
  assert.throws(() => exportLiveRaw(`localStorage/${SAVE_KEY}`, hash));
  assert.equal(clearLive(), false);
  assert.deepEqual([...st.local.values, ...st.session.values], before);
  assert.equal(inspectLiveProtection().blocked, true);
});

import { acquireLiveWriter } from "./live-protection.ts";
test("unavailable, inaccessible, throwing and rejecting lock API fail closed without crashing", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  try {
    for (const mode of ["absent", "getter", "throws", "rejects"]) {
      let notified = 0;
      const fake =
        mode === "getter"
          ? {
              get locks() {
                throw new Error("denied");
              },
            }
          : mode === "absent"
            ? {}
            : {
                locks: {
                  request() {
                    if (mode === "throws") throw new Error("denied");
                    return Promise.reject(new Error("denied"));
                  },
                },
              };
      Object.defineProperty(globalThis, "navigator", {
        configurable: true,
        value: fake,
      });
      let stop = () => {};
      assert.doesNotThrow(() => {
        stop = acquireLiveWriter(() => {
          notified++;
        });
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert.equal(notified, 1, mode);
      stop();
    }
  } finally {
    if (original) Object.defineProperty(globalThis, "navigator", original);
    else Reflect.deleteProperty(globalThis, "navigator");
  }
});
test("130 mixed future primary/session/backup cells preserve every raw copy across three restart attempts", () => {
  const d = data(),
    base = buildLiveSave(d.player, null, [], "career", "log", 1);
  const raw = (kind: string) =>
    kind === "corrupt"
      ? "{"
      : kind === "future-schema"
        ? JSON.stringify({ ...base, v: 3, player: null })
        : kind === "future-engine"
          ? JSON.stringify({ ...base, player: { engineVersion: "3.0" } })
          : kind === "checksum"
            ? JSON.stringify({ ...base, c: "bad" })
            : kind === "incomplete"
              ? JSON.stringify({ v: 2 })
              : JSON.stringify(base);
  let cells = 0;
  for (const primary of [
    "none",
    "legacy",
    "corrupt",
    "future-schema",
    "future-engine",
    "checksum",
    "incomplete",
  ])
    for (const session of [
      "none",
      "legacy",
      "corrupt",
      "future-schema",
      "future-engine",
    ])
      for (const backup of [
        "none",
        "legacy",
        "corrupt",
        "future-schema",
        "future-engine",
      ]) {
        if (![primary, session, backup].some((k) => k.startsWith("future-")))
          continue;
        cells++;
        const st = setup();
        assert.equal(saveLive(d), true);
        st.local.removeItem(SAVE_KEY);
        st.session.removeItem(SAVE_KEY);
        if (primary !== "none") st.local.setItem(SAVE_KEY, raw(primary));
        if (session !== "none") st.session.setItem(SAVE_KEY, raw(session));
        if (backup !== "none")
          st.local.setItem(
            BACKUP_KEY,
            JSON.stringify({ v: 1, at: 1, raw: raw(backup) }),
          );
        const before = [...st.local.values, ...st.session.values],
          label = `${primary}/${session}/${backup}`;
        for (let attempt = 0; attempt < 3; attempt++) {
          assert.equal(loadLive(), null, label);
          assert.equal(saveLive(d), false, label);
          assert.equal(clearLive(), false, label);
          assert.equal(setAsideLive(), false, label);
          assert.equal(restoreLiveBackup(), false, label);
          assert.deepEqual(
            [...st.local.values, ...st.session.values],
            before,
            label,
          );
        }
      }
  assert.equal(cells, 130);
});
test("future backup wrapper schema wins even when inner raw is invalid or missing", () => {
  for (const target of ["local", "session"] as const)
    for (const key of [BACKUP_KEY, BACKUP_PREV_KEY, CRASH_BACKUP_KEY]) {
      const st = setup(),
        raw = JSON.stringify({ v: 2, raw: 42 });
      st[target].setItem(key, raw);
      assert.equal(
        inspectLiveProtection().slots.find(
          (s) => s.id === `${target}Storage/${key}`,
        )?.status,
        "future-schema",
      );
      assert.equal(saveLive(data()), false);
      assert.equal(clearLive(), false);
      assert.equal(st[target].getItem(key), raw);
    }
});
