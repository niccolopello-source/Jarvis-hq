import assert from "node:assert/strict";
import test from "node:test";
import {
  ARCHIVE_BACKUP_KEY, ARCHIVE_KEY, archiveIssues, lastArchiveLoad, loadArchive, playCareerSim, resetArchiveMemory, saveArchive, toArchive,
} from "./engine.ts";
import { fingerprintOf } from "./card.ts";

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

/* G1 re-audit (DEF-02): the five card fixtures. */
test("G1-R DEF-02 valid card with its valid fingerprint: no issue, card shown", () => withStores((local) => {
  const a = entryOf(4242);
  assert.equal(a.fingerprint, fingerprintOf(a.card!));
  local.setItem(ARCHIVE_KEY, JSON.stringify([a]));
  const [e] = loadArchive();
  assert.deepEqual(archiveIssues(e!), []);
  assert.deepEqual(e!.card, a.card);
}));

test("G1-R DEF-02 altered card with a fingerprint that no longer matches: flagged, kept as stored", () => withStores((local) => {
  const a = entryOf(4242);
  local.setItem(ARCHIVE_KEY, JSON.stringify([{ ...a, card: { ...a.card!, ppg: 31.4 } }]));
  const [e] = loadArchive();
  assert.equal(e!.card?.ppg, 31.4);
  assert.equal(e!.fingerprint, a.fingerprint, "the stored fingerprint is not replaced");
  assert.ok(archiveIssues(e!).includes("card-mismatch"));
}));

test("G1-R DEF-02 altered card with the fingerprint removed: flagged unverified, never re-fingerprinted", () => withStores((local) => {
  const a = entryOf(4242);
  const altered = { ...a, card: { ...a.card!, ppg: 31.4, ageEnd: a.card!.ageEnd + 1 } } as Record<string, unknown>;
  delete altered.fingerprint;
  local.setItem(ARCHIVE_KEY, JSON.stringify([altered]));
  const [e] = loadArchive();
  assert.equal(e!.card?.ppg, 31.4, "recoverable data is not hidden");
  assert.equal(e!.card?.ageEnd, a.card!.ageEnd, "the final age still follows the last season (M07)");
  assert.equal(e!.fingerprint, undefined, "no fresh fingerprint makes it look verified");
  assert.deepEqual(archiveIssues(e!), ["card-unverified", "record-mismatch"]);
  saveArchive(entryOf(777));
  const stored = (JSON.parse(local.getItem(ARCHIVE_KEY)!) as { id: string; fingerprint?: string }[]).find((x) => x.id === a.id);
  assert.ok(stored, "the entry survives the next write");
  assert.equal(stored!.fingerprint, undefined, "a write does not launder the card");
  resetArchiveMemory();
  assert.ok(archiveIssues(loadArchive().find((x) => x.id === a.id)!).includes("card-unverified"), "still flagged after reload");
}));

test("G1-R DEF-02 unreadable card and record/card disagreement are flagged", () => withStores((local) => {
  const a = entryOf(4242);
  const b = entryOf(4243);
  local.setItem(ARCHIVE_KEY, JSON.stringify([{ ...a, card: "%%%" }, { ...b, name: "Altro Nome" }]));
  const all = loadArchive();
  assert.deepEqual(archiveIssues(all.find((x) => x.id === a.id)!), ["card-dropped"]);
  assert.deepEqual(archiveIssues(all.find((x) => x.id === b.id)!), ["record-mismatch"]);
}));

/* G1 re-audit (DEF-03): unreadable pivot-v2-archive. */
for (const [label, raw] of [["unparseable JSON", "[{\"id\":"], ["not an array", "{\"id\":\"x\"}"]] as const) {
  test(`G1-R DEF-03 ${label}: reported, raw untouched by the load, backed up before the next write`, () => withStores((local) => {
    local.setItem(ARCHIVE_KEY, raw);
    assert.deepEqual(loadArchive(), []);
    assert.deepEqual(lastArchiveLoad(), { unreadable: true, dropped: 0 });
    assert.equal(local.getItem(ARCHIVE_KEY), raw, "loading never rewrites");
    resetArchiveMemory();
    loadArchive();
    assert.equal(lastArchiveLoad().unreadable, true, "consistent on the next load");
    saveArchive(entryOf(777));
    const backup = JSON.parse(local.getItem(ARCHIVE_BACKUP_KEY) ?? "null") as { raws: string[] } | null;
    assert.ok(backup?.raws.includes(raw), "original kept before the destructive write");
  }));
}

test("G1-R DEF-03 one corrupt entry: the others load, the drop is counted, the raw is backed up", () => withStores((local) => {
  const a = entryOf(4242);
  const b = entryOf(4243);
  const raw = JSON.stringify([a, { id: 5, history: "x" }, b]);
  local.setItem(ARCHIVE_KEY, raw);
  assert.equal(loadArchive().length, 2);
  assert.deepEqual(lastArchiveLoad(), { unreadable: false, dropped: 1 });
  saveArchive(entryOf(777));
  const backup = JSON.parse(local.getItem(ARCHIVE_BACKUP_KEY) ?? "null") as { raws: string[] } | null;
  assert.ok(backup?.raws.includes(raw));
  resetArchiveMemory();
  assert.equal(loadArchive().length, 3);
  assert.deepEqual(lastArchiveLoad(), { unreadable: false, dropped: 0 });
}));
