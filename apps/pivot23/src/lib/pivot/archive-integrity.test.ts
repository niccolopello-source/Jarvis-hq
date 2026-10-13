import assert from "node:assert/strict";
import test from "node:test";
import {
  ARCHIVE_BACKUP_KEY, ARCHIVE_KEY, archiveIssues, loadArchive, playCareerSim, resetArchiveMemory, saveArchive, toArchive,
} from "./engine.ts";

/** G1-D1/D2: an archive record that disagrees with its card, or a card whose fingerprint fails, is kept and flagged. */
function mem(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  } as Storage;
}
function withStores(fn: (local: Storage) => void) {
  const g = globalThis as unknown as { localStorage?: Storage; sessionStorage?: Storage };
  const prev = [g.localStorage, g.sessionStorage];
  g.localStorage = mem();
  g.sessionStorage = mem();
  resetArchiveMemory();
  try {
    fn(g.localStorage);
  } finally {
    [g.localStorage, g.sessionStorage] = prev;
    resetArchiveMemory();
  }
}
const entryOf = (seed: number) => toArchive(playCareerSim({ seed, difficulty: "pro", name: "Integrity" }));

test("G1 an untouched archive entry has no integrity issue (40 seeds)", () => withStores((local) => {
  for (let seed = 900; seed < 940; seed += 1) {
    local.setItem(ARCHIVE_KEY, JSON.stringify([entryOf(seed)]));
    resetArchiveMemory();
    const [e] = loadArchive();
    assert.deepEqual(archiveIssues(e!), [], `seed ${seed}`);
  }
}));

test("G1-D1 record fields that disagree with the signed card are flagged, data kept", () => withStores((local) => {
  const a = entryOf(12345);
  local.setItem(ARCHIVE_KEY, JSON.stringify([{ ...a, titles: 99, ppg: 99 }]));
  const [e] = loadArchive();
  assert.equal(e!.titles, 99);
  assert.ok(e!.card, "the card is kept");
  assert.deepEqual(archiveIssues(e!), ["record-mismatch"]);
}));

test("G1-D2 a card whose fingerprint fails is kept and flagged, not silently removed", () => withStores((local) => {
  const a = entryOf(12345);
  local.setItem(ARCHIVE_KEY, JSON.stringify([{ ...a, card: { ...a.card!, mvps: 9 } }]));
  const [e] = loadArchive();
  assert.equal(e!.card?.mvps, 9, "the card is still there");
  assert.deepEqual(archiveIssues(e!), ["card-mismatch"]);
  // A later archive write keeps the card as it was.
  saveArchive(entryOf(777));
  const stored = JSON.parse(local.getItem(ARCHIVE_KEY)!) as { id: string; card?: { mvps: number } }[];
  assert.equal(stored.find((x) => x.id === a.id)?.card?.mvps, 9);
}));

test("G1-D2 an unreadable card is dropped from view, flagged, and the original raw is backed up before a write", () => withStores((local) => {
  const a = entryOf(12345);
  const raw = JSON.stringify([{ ...a, card: { playerName: "broken" } }]);
  local.setItem(ARCHIVE_KEY, raw);
  const [e] = loadArchive();
  assert.equal(e!.card, undefined);
  assert.deepEqual(archiveIssues(e!), ["card-dropped"]);
  saveArchive(entryOf(777));
  const backup = JSON.parse(local.getItem(ARCHIVE_BACKUP_KEY) ?? "null") as { raws: string[] } | null;
  assert.ok(backup?.raws.includes(raw), "raw archive with the broken card was backed up");
}));
