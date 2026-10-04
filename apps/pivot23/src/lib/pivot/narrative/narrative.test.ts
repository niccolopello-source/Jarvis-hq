import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { NARRATIVE_EN } from "./catalog-en.ts";
import { extractFile } from "./extract.ts";
import { playCareerTexts, storyPoolTexts } from "./harness.ts";
import { t } from "../i18n.ts";
import { playCareerSim, verdictOf } from "../engine.ts";
import { buildLiveSave } from "../save.ts";
import type { PlayerState } from "../types.ts";
import { loadNarrativeEn, nx, nxCheck } from "./index.ts";
import { LEGACY_EN_IT } from "./legacy-it.ts";
import { EN_PROSE, IT_PROSE } from "./markers.ts";
import { NOT_PROSE } from "./not-prose.ts";
import { LEGACY_PRIOR_EN, legacyPitchEn, legacyProcEn } from "./__fixtures__/legacy-en.ts";

/* Measured, not estimated: every number below is counted on the real sources and real careers. */

await loadNarrativeEn();

const here = dirname(fileURLToPath(import.meta.url));
const lib = join(here, "..");
const comp = join(here, "..", "..", "..", "components", "pivot");
const SOURCES = [
  ...readdirSync(lib).filter((f) => f.endsWith(".ts") && !f.includes(".test.") && !f.includes(".stats.") && f !== "i18n.ts" && f !== "labels.ts").map((f) => join(lib, f)),
  ...readdirSync(comp).filter((f) => /\.tsx?$/.test(f) && !f.includes(".test.")).map((f) => join(comp, f)),
];

function sourceKeys() {
  const keys = new Map<string, string>();
  for (const file of SOURCES) for (const f of extractFile(file)) if (!keys.has(f.key)) keys.set(f.key, `${file.split("/").slice(-2).join("/")}:${f.line}`);
  return keys;
}

test("every narrative string in the sources has an English entry (static coverage)", () => {
  const keys = sourceKeys();
  const skip = new Set(NOT_PROSE);
  const missing = [...keys].filter(([k]) => !skip.has(k) && !(typeof NARRATIVE_EN[k] === "string" && NARRATIVE_EN[k]!.trim()));
  const covered = keys.size - missing.length;
  console.log(`[i18n] static coverage: ${covered}/${keys.size} source strings (${((100 * covered) / keys.size).toFixed(2)}%), catalog entries ${Object.keys(NARRATIVE_EN).length}`);
  assert.deepEqual(missing.map(([k, at]) => `${at} ${k.slice(0, 90)}`), []);
});

test("English entries only use placeholders that exist in their Italian key", () => {
  const bad: string[] = [];
  for (const [k, v] of Object.entries(NARRATIVE_EN)) {
    const slots = new Set([...k.matchAll(/\{([\w$]+)\}/g)].map((m) => m[1]));
    for (const m of v.matchAll(/\{([\w$]+)(?::ord)?(?:\|[^}]*)?\}/g)) if (!slots.has(m[1])) bad.push(`${k.slice(0, 60)} -> {${m[1]}}`);
  }
  assert.deepEqual(bad, []);
});

test("English entries carry no Italian prose", () => {
  const bad = Object.entries(NARRATIVE_EN)
    .filter(([k, v]) => k !== v && IT_PROSE.test(v.replace(/\{[^}]+\}/g, " ")))
    .map(([k, v]) => `${k.slice(0, 50)} => ${v.slice(0, 60)}`);
  assert.deepEqual(bad, []);
});

test("played careers and the whole story pool read entirely in English (runtime coverage)", () => {
  const texts = [
    ...storyPoolTexts(),
    ...Array.from({ length: 16 }, (_, k) => playCareerTexts(9000 + k, (["esordio", "pro", "allstar", "leggenda"] as const)[k % 4])).flat(),
  ];
  const misses = new Map<string, string>();
  const leaks: string[] = [];
  let ok = 0;
  for (const t of texts) {
    const r = nxCheck(t.text, "en");
    if (r.ok) ok++;
    else misses.set(t.text, t.where);
    if (r.ok && IT_PROSE.test(r.text)) leaks.push(`${t.where}: ${r.text.slice(0, 100)}`);
  }
  // Baseline for the report (= before this change, when the story was shown as stored): texts with
  // no Italian give-away word. An upper bound: short Italian labels without such a word count too.
  const before = texts.filter((t) => !IT_PROSE.test(t.text)).length;
  console.log(`[i18n] runtime coverage EN: ${ok}/${texts.length} texts resolved (${((100 * ok) / texts.length).toFixed(2)}%), unique misses ${misses.size}; before: ${before}/${texts.length} (${((100 * before) / texts.length).toFixed(2)}%)`);
  assert.deepEqual([...misses].slice(0, 20).map(([t, w]) => `${w}: ${t.slice(0, 120)}`), []);
  assert.deepEqual(leaks.slice(0, 20), []);
});

test("Italian mode shows stored Italian exactly as written", () => {
  for (const t of storyPoolTexts().slice(0, 400)) assert.equal(nx(t.text, "it"), t.text);
});

test("unknown text falls back to the stored text, never to a guess", () => {
  assert.equal(nx("Testo sconosciuto che nessuno ha mai scritto nel motore.", "en"), "Testo sconosciuto che nessuno ha mai scritto nel motore.");
  assert.equal(nx("Real Madrid", "en"), "Real Madrid");
  assert.equal(nx("", "en"), "");
  assert.equal(nx(undefined, "en"), "");
});

test("interpolated slots are translated recursively, ordinals and plurals follow English", () => {
  assert.equal(nx("Il Draft si avvicina. Alex Rivers, un playmaker greco, deve scegliere i primi passi da professionista.", "en"), "The Draft is coming. Alex Rivers, a Greek point guard, has to choose the first steps as a pro.");
  assert.match(nx("Dalla G-League al salto. Portland Trail Blazers firma corto. Niente alibi di campus, solo minuti da coprire. Sei la 1ª scelta. Contratto: 1 anno a 4.1 milioni.", "en"), /You are the 1st pick\. Contract: 1 year at 4\.1 million\.$/);
  assert.match(nx("Dalla G-League al salto. Portland Trail Blazers firma corto. Niente alibi di campus, solo minuti da coprire. Sei la 22ª scelta. Contratto: 3 anni a 4.1 milioni.", "en"), /22nd pick\. Contract: 3 years/);
  assert.equal(nx("Elim. Primo turno 1-4", "en"), "Out in the First Round 1-4");
});

test("old saves: English procedural text from earlier releases reads in Italian", () => {
  const ctx = { age: 31, team: "Boston Celtics", rival: "Devon Marsh" };
  const texts: string[] = [];
  for (const row of Object.values(legacyProcEn(ctx))) {
    texts.push(row.title, row.subtitle, `${row.subtitle} ${LEGACY_PRIOR_EN[1]}`);
    for (const c of row.choices) texts.push(c.label, c.detail, c.flavor);
  }
  texts.push(...legacyPitchEn("Boston Celtics"), ...LEGACY_PRIOR_EN);
  const bad = texts.filter((t) => {
    const r = nxCheck(t, "it");
    return !r.ok || EN_PROSE.test(r.text) || nx(t, "it") === t;
  });
  console.log(`[i18n] legacy EN->IT: ${texts.length - bad.length}/${texts.length} old English texts read in Italian (${Object.keys(LEGACY_EN_IT).length} entries)`);
  assert.deepEqual(bad, []);
  assert.equal(nx("At 31, the body sends the bill", "it"), "A 31 anni il corpo presenta il conto");
});

test("stored chrome strings follow the language both ways", () => {
  // Pending scenes saved with t() keep the language of the moment; they still follow the reader.
  assert.equal(nx(t("resumeGo", "it"), "en"), t("resumeGo", "en"));
  assert.equal(nx(t("resumeGo", "en"), "it"), t("resumeGo", "it"));
});

test("a realistic Italian save round-trips and its stored prose reads in English", () => {
  const played = playCareerSim({ seed: 8801, difficulty: "pro", name: "Marco Ferrara", nationality: "Italia", number: 23, role: "SF", path: "NCAA" });
  const raw = JSON.parse(JSON.stringify(buildLiveSave(played, null, [], "career", "log", 1))) as { player: PlayerState };
  const p = raw.player;
  const end = verdictOf(p);
  const texts = [
    ...p.choiceLog.flatMap((c) => [c.title, c.pick]),
    ...p.seasonHistory.flatMap((r) => [r.mood, r.playoff]),
    end.verdict,
    end.closing,
  ].filter((x): x is string => typeof x === "string" && x.length > 0);
  const misses: string[] = [];
  const leaks: string[] = [];
  for (const text of texts) {
    assert.equal(nx(text, "it"), text);
    const r = nxCheck(text, "en");
    if (!r.ok) misses.push(text.slice(0, 120));
    else if (IT_PROSE.test(r.text)) leaks.push(r.text.slice(0, 120));
  }
  console.log(`[i18n] realistic save seed 8801: ${texts.length - misses.length}/${texts.length} stored fields in English, leaks ${leaks.length}`);
  assert.deepEqual(leaks, []);
  assert.deepEqual(misses.slice(0, 12), []);
});
