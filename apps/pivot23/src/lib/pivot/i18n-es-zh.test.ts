import assert from "node:assert/strict";
import test from "node:test";
import { advanceCareerSim, openCareerSim } from "./engine.ts";
import { awardDisplay, awardLabel, chromeFallbacks, DEMO_LANGS, demoLang, difficultyFace, getLang, LANG_NAMES, LANG_TAG, msgKeys, setLang, t, type Lang } from "./i18n.ts";
import { ES_CHROME } from "./i18n-es.ts";
import { ZH_CHROME } from "./i18n-zh.ts";
import { confLabel, countWord, seedConfLabel, nationLabel, playoffResultLabel, roleLabel, roundLabel } from "./labels.ts";
import { legacyKeys, lt, pickLabel } from "./legacy-i18n.ts";
import { NARRATIVE_ES } from "./narrative/catalog-es.ts";
import { NARRATIVE_ZH } from "./narrative/catalog-zh.ts";
import { playCareerTexts } from "./narrative/harness.ts";
import { loadNarrativeEn, loadNarrativeEs, loadNarrativeZh, nx, nxOwn } from "./narrative/index.ts";
import { IT_PROSE } from "./narrative/markers.ts";
import { buildLiveSave } from "./save.ts";
import type { PlayerState } from "./types.ts";

/*
 * Spanish and Simplified Chinese (owner decision 2026-11-09). Translations are NOT reviewed by
 * native speakers: these tests pin structure (keys, placeholders, fallbacks, determinism), not style.
 */

await loadNarrativeEn();
await loadNarrativeEs();
await loadNarrativeZh();

const EXTRA = ["es", "zh"] as const;
const slots = (s: string) => [...s.matchAll(/\{([\w$]+)(?::ord)?(?:\|[^}]*)?\}/g)].map((m) => m[1]!).sort();
/** Italian words that do not exist in Spanish (IT_PROSE also matches la/con/un/del/ti...). */
const IT_ONLY = /(^|[^\p{L}'’])(il|gli|della|delle|dei|nel|nella|che|non|è|alla|più|tuo|tua|tuoi|anni|punti|stagione|squadra|partita|ancora|dopo|sempre|niente|anche|questa|questo|ogni|resta|chiude|chiudi|Il|Gli|Che|Non|Nel|Nella|È|Più|Tuo|Tua|Niente|Ogni|Dopo|Ancora|Questa|Questo)(?=$|[^\p{L}'’])/u;

test("selector: four languages, native names, BCP 47 tags, unknown -> Italian", () => {
  assert.deepEqual(DEMO_LANGS, ["it", "en", "es", "zh"]);
  assert.deepEqual(LANG_NAMES, { it: "Italiano", en: "English", es: "Español", zh: "中文" });
  assert.equal(LANG_TAG.zh, "zh-CN");
  assert.equal(LANG_TAG.es, "es");
  for (const v of ["fr", "zh-TW", "", null, undefined]) assert.equal(demoLang(v as string), "it", String(v));
});

test("chrome key parity: es and zh define every one of the IT/EN keys, no fallback", () => {
  const keys = msgKeys();
  assert.equal(keys.length, 285);
  assert.deepEqual(Object.keys(ES_CHROME).sort(), [...keys].sort());
  assert.deepEqual(Object.keys(ZH_CHROME).sort(), [...keys].sort());
  for (const l of EXTRA) {
    assert.deepEqual(chromeFallbacks(l), [], `${l} fallbacks`);
    for (const k of keys) assert.ok(t(k, l).trim(), `${l}.${k} empty`);
  }
});

test("chrome placeholders: es and zh use exactly the Italian slots", () => {
  const bad: string[] = [];
  for (const k of msgKeys()) {
    const want = JSON.stringify(slots(t(k, "it")));
    for (const l of EXTRA) if (JSON.stringify(slots(t(k, l))) !== want) bad.push(`${l}.${k}`);
  }
  assert.deepEqual(bad, []);
});

test("legacy card key parity across the four languages", () => {
  const k = legacyKeys();
  assert.equal(k.it.length, 75);
  for (const l of ["en", "es", "zh"] as const) assert.deepEqual([...k[l]].sort(), [...k.it].sort(), l);
  for (const l of EXTRA) for (const key of k.it) assert.ok(lt(key as never, l).trim(), `${l}.${key}`);
});

test("narrative catalogs: placeholders are a subset of the Italian key, values non-empty", () => {
  for (const [l, cat] of [["es", NARRATIVE_ES], ["zh", NARRATIVE_ZH]] as const) {
    const bad: string[] = [];
    for (const [k, v] of Object.entries(cat)) {
      if (!v.trim()) bad.push(`${l} empty: ${k.slice(0, 60)}`);
      const have = new Set(slots(k));
      for (const s of slots(v)) if (!have.has(s)) bad.push(`${l}: ${k.slice(0, 60)} -> {${s}}`);
    }
    assert.deepEqual(bad, []);
    assert.ok(Object.keys(cat).length >= 740, `${l} entries ${Object.keys(cat).length}`);
  }
});

test("labels never fall back to Italian in es/zh", () => {
  for (const l of EXTRA) {
    for (const r of ["PG", "SG", "SF", "PF", "C"] as const) assert.doesNotMatch(roleLabel(r, l), IT_ONLY, `${l} ${r}`);
    assert.notEqual(nationLabel("Italia", l), "");
    assert.notEqual(confLabel("East", l), "East");
    for (const id of ["esordio", "pro", "allstar", "leggenda"]) assert.ok(difficultyFace(id, l).desc.trim());
    for (const r of ["Primo turno", "Semifinali Est/Ovest", "Finali Est/Ovest", "Finali NBA"]) assert.notEqual(roundLabel(r, l), r, `${l} ${r}`);
    for (const v of ["Fuori", "Campione", "Elim. Finali Est/Ovest 2-4"]) assert.doesNotMatch(playoffResultLabel(v, l), /Elim\.|Fuori|Campione|Finali/, `${l} ${v}`);
    assert.doesNotMatch(pickLabel(3, l), /ª/);
  }
  assert.equal(pickLabel(3, "zh"), "第3顺位");
  assert.equal(awardDisplay("Finals MVP", "zh"), "总决赛MVP");
  // The engine stores awardLabel(): it must not depend on the reader's language.
  for (const l of DEMO_LANGS) assert.equal(awardLabel("MVP", l), awardLabel("MVP", "it"));
});

const SEEDS = Array.from({ length: 8 }, (_, k) => 41000 + k * 17);

test("runtime: harness careers in es/zh never show Italian prose (own text or English fallback)", () => {
  const leaks: string[] = [];
  const own = { es: [0, 0], zh: [0, 0] };
  for (const [i, seed] of SEEDS.entries()) {
    for (const seen of playCareerTexts(seed, (["esordio", "pro", "allstar", "leggenda"] as const)[i % 4])) {
      for (const l of EXTRA) {
        const out = nx(seen.text, l);
        const marker = l === "es" ? IT_ONLY : IT_PROSE;
        if (marker.test(out)) leaks.push(`${l} ${seen.where}: ${out.slice(0, 90)}`);
        own[l][1]++;
        if (nxOwn(seen.text, l).ok) own[l][0]++;
      }
    }
  }
  for (const l of EXTRA) console.log(`[i18n] ${l} own-catalog line coverage: ${own[l][0]}/${own[l][1]} (${((100 * own[l][0]) / own[l][1]).toFixed(1)}%)`);
  assert.deepEqual([...new Set(leaks)].slice(0, 40), []);
  // Floor raised on 2026-11-09 after the full ES/ZH narrative pass (100% on these seeds); raise it as the catalogs grow, never lower it.
  for (const l of EXTRA) assert.ok(own[l][0] / own[l][1] >= 0.99, `${l} own coverage ${own[l][0]}/${own[l][1]}`);
});

test("zh output is tidy: no ASCII space between two ideographs, no Italian ordinal marker", () => {
  const bad: string[] = [];
  for (const seen of playCareerTexts(SEEDS[1]!, "pro")) {
    const out = nx(seen.text, "zh");
    if (/[\u4e00-\u9fff] [\u4e00-\u9fff]/u.test(out)) bad.push(out.slice(0, 80));
    if (/\dª/.test(out)) bad.push(out.slice(0, 80));
  }
  assert.deepEqual([...new Set(bad)].slice(0, 20), []);
});

function fingerprint(s: PlayerState) {
  return JSON.stringify({
    created: [s.name, s.role, s.potential, s.hidden, s.draftPick, s.startAge, s.apexAge],
    progression: s.seasonHistory.map((r) => [r.age, r.overall, r.ppg, r.rpg, r.apg, r.teamAbbr, r.awards, r.playoff]),
    events: s.usedEventIds,
    choices: s.choiceLog,
    champions: s.championLog,
    retirement: [s.age, s.seasonHistory.length],
  });
}

test("determinism: it/en/es/zh and a mid-career language switch give the same career, RNG and save", () => {
  const before = getLang();
  try {
    for (const [i, difficulty] of (["esordio", "pro", "allstar", "leggenda"] as const).entries()) {
      const opts = { seed: 7400 + i, difficulty, name: "Lang", nationality: "Italia", number: 7, role: "SF" as const, path: "NCAA" as const };
      const run = (langs: readonly Lang[]) => {
        setLang(langs[0]!);
        const job = openCareerSim(opts);
        let step = 0;
        while (!advanceCareerSim(job)) setLang(langs[++step % langs.length]!);
        job.s.rngState = job.rng.getState();
        const save = JSON.parse(JSON.stringify(buildLiveSave(job.s, null, [], "career", "log", 1))) as { player: PlayerState & { lang?: string; careerId?: string }; c?: string };
        delete save.player.lang;
        delete (save.player as { careerId?: string }).careerId;
        delete save.c;
        return { fp: fingerprint(job.s), rng: job.s.rngState, save: JSON.stringify(save) };
      };
      const ref = run(["it"]);
      for (const langs of [["en"], ["es"], ["zh"], ["zh", "es", "en", "it"], ["es", "zh"]] as Lang[][]) {
        const got = run(langs);
        assert.equal(got.fp, ref.fp, `${difficulty} ${langs}`);
        assert.equal(got.rng, ref.rng, `${difficulty} ${langs} rng`);
        assert.equal(got.save, ref.save, `${difficulty} ${langs} save`);
      }
    }
  } finally {
    setLang(before);
  }
});

test("word order: seed + conference and counted words follow each language", () => {
  assert.equal(seedConfLabel(5, "West", "it"), "5° Ovest");
  assert.equal(seedConfLabel(5, "West", "en"), "#5 West");
  assert.equal(seedConfLabel(5, "West", "es"), "5.º del Oeste");
  assert.equal(seedConfLabel(2, "Euro", "es"), "2.º de la EuroLeague");
  assert.equal(seedConfLabel(5, "West", "zh"), "西部第5");
  assert.equal(seedConfLabel(3, "East", "zh"), "东部第3");
  assert.equal(seedConfLabel(3, undefined, "zh"), "第3");
  assert.equal(countWord(3, t("titleMany", "zh"), "zh"), "3个冠军");
  assert.equal(countWord(3, t("titleMany", "es"), "es"), "3 títulos");
});

test("zh multi-sentence entries also resolve sentence by sentence (full-width stops)", () => {
  // The engine recombines sentences of one entry with others; zh values have no space after 。.
  const r = nxOwn("Ti hanno guardato. Tu hai tirato. Sudore, ripetizioni, la stessa voce nello specchio.", "zh");
  assert.ok(r.ok, r.text);
  assert.match(r.text, /汗水、重复训练/);
  const q = nxOwn("Qualcuno ha scritto Houston (HOU) sul foglio. Tu hai fatto la valigia, poi l'hai disfatta. Cleveland (CLE) è nel foglio.", "zh");
  assert.ok(q.ok, q.text);
  assert.doesNotMatch(q.text, /Qualcuno|valigia/);
});
