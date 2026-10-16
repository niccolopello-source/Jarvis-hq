/* Copy & narrative audit 2026-10-16 (grokbot/copy-audit-2026-10). Guards on text the player reads:
 * missing/empty strings, placeholder sets, raw tokens after render, obsolete lines, official terms,
 * and length of choice buttons. Read-only on the engine: the harness has its own RNG streams. */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromeGaps, msgKeys, t, type Msg } from "../i18n.ts";
import { NARRATIVE_EN } from "./catalog-en.ts";
import { playCareerTexts, storyPoolTexts, type Seen } from "./harness.ts";
import { loadNarrativeEn, nx } from "./index.ts";

await loadNarrativeEn();

const here = dirname(fileURLToPath(import.meta.url));
const lib = join(here, "..");
const slots = (s: string) => [...new Set([...s.matchAll(/\{([\w$]+)[}:|]/g)].map((m) => m[1]!))].sort().join(",");

const rendered: Seen[] = [];
for (const d of ["esordio", "pro", "allstar", "leggenda"] as const) for (let i = 0; i < 8; i++) rendered.push(...playCareerTexts(91000 + 13 * i, d));
rendered.push(...storyPoolTexts());
const both = rendered.map((x) => ({ where: x.where, it: x.text, en: nx(x.text, "en") }));

test("chrome: no missing or empty key in Italian and English, same placeholders", () => {
  assert.deepEqual(chromeGaps(["it", "en"]), []);
  const bad = msgKeys().filter((k: Msg) => slots(t(k, "it")) !== slots(t(k, "en")));
  assert.deepEqual(bad, []);
});

test("narrative catalog: no empty English entry and no English slot that the Italian key lacks", () => {
  const empty = Object.entries(NARRATIVE_EN).filter(([, v]) => !v.trim()).map(([k]) => k);
  assert.deepEqual(empty, []);
  const mismatch = Object.entries(NARRATIVE_EN).filter(([k, v]) => slots(v).split(",").some((x) => x && !slots(k).split(",").includes(x))).map(([k, v]) => `${k} -> ${v}`);
  assert.deepEqual(mismatch, []);
});

test("every $VAR written in the sources is a variable some caller fills (fillVars would drop it silently)", () => {
  const files = readdirSync(lib).filter((f) => f.endsWith(".ts") && !f.includes(".test.") && !f.includes(".stats."));
  const src = files.map((f) => readFileSync(join(lib, f), "utf8")).join("\n");
  const used = new Set([...src.matchAll(/(?<![\w$])\$([A-Z][A-Z0-9_]*)\b/g)].map((m) => m[1]!));
  const filled = new Set([...src.matchAll(/\b([A-Z][A-Z0-9_]*)\s*:/g)].map((m) => m[1]!));
  assert.ok(used.size > 20, `only ${used.size} $VARs found`);
  assert.deepEqual([...used].filter((v) => !filled.has(v)), []);
});

test("rendered careers (seeds 91000+13i, 4 difficulties) leave no raw token in Italian or English", () => {
  assert.ok(both.length > 20000, `only ${both.length} rendered strings`);
  const RAW = /\$[A-Z]|__[A-Z]+__|\{[\w$]+\}|\bundefined\b|\bNaN\b|\bnull\b|\[object/;
  const bad = both.flatMap((x) => (["it", "en"] as const).filter((l) => RAW.test(x[l])).map((l) => `${l} ${x.where}: ${x[l].slice(0, 140)}`));
  assert.deepEqual([...new Set(bad)].slice(0, 10), []);
});

test("copy audit 2026-10-16: the doubled 'Out Out' is no longer reachable in English", () => {
  const bad = both.filter((x) => /\bOut Out\b|\bOut: Out\b/.test(x.en)).map((x) => `${x.where}: ${x.en.slice(0, 120)}`);
  assert.deepEqual([...new Set(bad)], []);
  // Stored Italian from any save ("Fuori " + "Elim. <round> <score>") reads as one clean English sentence.
  assert.equal(nx("Fuori Elim. Primo turno 2-4. Ottobre lo sa, anche se tu fai finta di no.", "en"), "Out in the First Round 2-4. October knows it, even if you pretend it doesn't.");
  // Italian stays exactly as stored (narrative.test.ts invariant); the Italian slip is listed in the review for approval.
  assert.equal(nx("Fuori Elim. Primo turno 2-4. Ottobre lo sa, anche se tu fai finta di no.", "it"), "Fuori Elim. Primo turno 2-4. Ottobre lo sa, anche se tu fai finta di no.");
});

test("official terminology stays consistent in English (chrome, catalog and rendered text)", () => {
  const BAD: [string, RegExp][] = [
    ["All-NBA", /\bAll NBA\b|\ball-nba\b|\bAll-Nba\b/],
    ["MVP", /\bMvp\b|\bmvp\b|\bMVP of the Finals\b|\bFinal MVP\b/],
    ["EuroLeague", /\bEuroleague\b|\bEurolega\b|\bEuro League\b/],
    ["Rookie of the Year", /\bRookie of the year\b|\bRookie of Year\b/],
    ["Defensive Player of the Year", /\bDefensive player of the year\b|\bDefensive Player of the year\b/],
    ["Sixth Man / Most Improved", /\bSixth man of\b|\bMost improved\b/],
    ["playoffs", /\bplay-offs?\b|\bplay offs?\b/i],
  ];
  const texts = [...msgKeys().map((k) => [`chrome.${k}`, t(k, "en")]), ...Object.entries(NARRATIVE_EN).map(([k, v]) => [`cat:${k.slice(0, 40)}`, v]), ...both.map((x) => [x.where, x.en])];
  const bad = texts.flatMap(([w, s]) => BAD.filter(([, re]) => re.test(s!)).map(([n]) => `${n} @ ${w}: ${s!.slice(0, 100)}`));
  assert.deepEqual([...new Set(bad)].slice(0, 10), []);
});

test("choice buttons and titles fit the card (non-regression on measured maxima, 2026-10-16)", () => {
  const LIMIT: [RegExp, number][] = [[/\.(label)$/, 64], [/\.(title)$/, 80]];
  const bad: string[] = [];
  for (const x of both) for (const [re, n] of LIMIT) if (re.test(x.where)) for (const l of ["it", "en"] as const) if (x[l].length > n) bad.push(`${l} ${x.where} (${x[l].length}>${n}): ${x[l]}`);
  assert.deepEqual([...new Set(bad)].slice(0, 10), []);
});
