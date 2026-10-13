import { ARCHIVE_BACKUP_KEY, ARCHIVE_KEY, archiveIssues, lastArchiveLoad, loadArchive, playCareerSim, resetArchiveMemory, saveArchive, toArchive } from "/workspace/g1-cross/apps/pivot23/src/lib/pivot/engine.ts";
import { fingerprintOf } from "/workspace/g1-cross/apps/pivot23/src/lib/pivot/card.ts";
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, String(v)), removeItem: (k: string) => void m.delete(k), clear: () => m.clear(), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size; } } as Storage; };
const g = globalThis as any; const res: [string, string, string][] = [];
const ck = (id: string, ok: boolean, detail: unknown) => res.push([id, ok ? "PASS" : "FAIL", JSON.stringify(detail)]);
const fresh = () => { g.localStorage = mem(); g.sessionStorage = mem(); resetArchiveMemory(); return g.localStorage as Storage; };
const E = (seed: number) => toArchive(playCareerSim({ seed, difficulty: "pro", name: "XAudit" }));
let valid = 0, n = 0; for (let s = 5000; s < 5030; s++) { const L = fresh(); const a = E(s); L.setItem(ARCHIVE_KEY, JSON.stringify([a])); const [e] = loadArchive(); n++; if (e && e.card && archiveIssues(e).length === 0 && a.fingerprint === fingerprintOf(a.card!)) valid++; }
ck("DEF-02 valid fingerprint (30 seeds)", valid === n, { valid, n });
{ const L = fresh(); const a = E(5101); const bad = { ...a, fingerprint: "0".repeat(64) }; L.setItem(ARCHIVE_KEY, JSON.stringify([bad])); const [e] = loadArchive(); ck("DEF-02 wrong fingerprint, card intact", !!e?.card && archiveIssues(e!).includes("card-mismatch"), archiveIssues(e!)); }
{ const L = fresh(); const a = E(5102); const bad = { ...a, card: { ...a.card!, mvps: 7 } }; L.setItem(ARCHIVE_KEY, JSON.stringify([bad])); const [e] = loadArchive(); ck("DEF-02 altered card, stale fingerprint", e?.card?.mvps === 7 && archiveIssues(e!).includes("card-mismatch"), archiveIssues(e!)); }
{ const L = fresh(); const a = E(5103); const { fingerprint, ...nofp } = a as any; void fingerprint; L.setItem(ARCHIVE_KEY, JSON.stringify([{ ...nofp, card: { ...a.card!, mvps: 8 } }])); const [e] = loadArchive(); const iss = archiveIssues(e!);
  saveArchive(E(5104)); const stored = JSON.parse(L.getItem(ARCHIVE_KEY)!); const same = stored.find((x: any) => x.id === a.id);
  ck("DEF-02 missing fingerprint: flagged card-unverified, not re-fingerprinted after a write", iss.includes("card-unverified") && !!e?.card && same && same.fingerprint === undefined, { iss, storedFp: same?.fingerprint ?? null }); }
for (const [label, raw] of [["unparsable", '[{"id":"x"'], ["non-array object", '{"a":1}'], ["non-array number", "42"]] as const) {
  const L = fresh(); L.setItem(ARCHIVE_KEY, raw); const list = loadArchive(); const r = lastArchiveLoad(); const untouched = L.getItem(ARCHIVE_KEY) === raw;
  saveArchive(E(5200)); const backup = (JSON.parse(L.getItem(ARCHIVE_BACKUP_KEY) ?? "null")?.raws ?? []).includes(raw) ? raw : null;
  ck(`DEF-03 ${label}`, r.unreadable && untouched && list.length === 0 && backup === raw, { r, untouched, backupEqRaw: backup === raw });
}
{ const L = fresh(); const a = E(5301), b = E(5302); const raw = JSON.stringify([a, { id: 7, junk: true }, b]); L.setItem(ARCHIVE_KEY, raw); const list = loadArchive(); const r = lastArchiveLoad();
  saveArchive(E(5303)); const backup = (JSON.parse(L.getItem(ARCHIVE_BACKUP_KEY) ?? "null")?.raws ?? []).includes(raw) ? raw : null;
  ck("DEF-03 single corrupt entry", list.length === 2 && r.dropped === 1 && !r.unreadable && backup === raw, { kept: list.length, r, backupEqRaw: backup === raw }); }
console.table(res); process.exit(res.every((x) => x[1] === "PASS") ? 0 : 1);
