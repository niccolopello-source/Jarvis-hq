import assert from "node:assert/strict";
import test from "node:test";
import { chromePairs, chromePairsFor } from "../i18n.ts";
import { agreeTeamsEn } from "./agreement.ts";
import { NARRATIVE_EN } from "./catalog-en.ts";
import { NARRATIVE_ES } from "./catalog-es.ts";
import { NARRATIVE_IDENTITY } from "./catalog-identity.ts";
import { NARRATIVE_ZH } from "./catalog-zh.ts";
import { playCareerTexts, storyPoolTexts } from "./harness.ts";
import { identityEntries } from "./identity.ts";
import { loadNarrativeEn, loadNarrativeEs, loadNarrativeZh, nx, zhTidy } from "./index.ts";
import { IT_PROSE } from "./markers.ts";
import { buildCatalog, translateWith } from "./translate.ts";

/*
 * Spanish and Chinese no longer wait for the English catalog (2026-11-10, language switch time).
 * They are layered on its identity entries only (catalog-identity.ts, generated); English follows
 * off the critical path as the fallback. These tests pin that this is safe: the generated file is
 * in sync, every other English key has its own Spanish and Chinese entry, and what the reader sees
 * is the same as with the English catalog loaded.
 */
const EXTRA = { es: NARRATIVE_ES, zh: NARRATIVE_ZH } as const;
const LINE = "Il Draft si avvicina. Alex Rivers, un playmaker greco, deve scegliere i primi passi da professionista.";

test("catalog-identity.ts is in sync with the English catalog (node --import=tsx scripts/narrative-identity.ts)", () => {
  assert.deepEqual(Object.entries(NARRATIVE_IDENTITY), identityEntries(NARRATIVE_EN));
});

test("every non-identity English key has its own Spanish and Chinese entry", () => {
  for (const [lang, cat] of Object.entries(EXTRA)) {
    const missing = Object.keys(NARRATIVE_EN).filter((k) => !(k in cat) && NARRATIVE_IDENTITY[k] !== NARRATIVE_EN[k]);
    assert.deepEqual(missing.slice(0, 20), [], `${lang}: ${missing.length} English keys with no ${lang} entry`);
    assert.deepEqual(Object.keys(cat).filter((k) => !(k in NARRATIVE_EN)), [], `${lang}: keys unknown to English`);
  }
});

test("Spanish and Chinese are ready before the English catalog, which follows as their fallback", async () => {
  await loadNarrativeZh();
  // Same tick as the resolved switch: the English chunk has only just been requested.
  assert.equal(nx(LINE, "en"), LINE, "English catalog not loaded yet: English mode still shows the stored text");
  const zh = nx(LINE, "zh");
  assert.notEqual(zh, LINE);
  await loadNarrativeEs();
  assert.notEqual(nx(LINE, "es"), LINE);
  await loadNarrativeEn();
  assert.notEqual(nx(LINE, "en"), LINE, "the English fallback arrives right after");
  assert.equal(nx(LINE, "zh"), zh, "Chinese text does not depend on the English chunk");
});

test("Spanish and Chinese render exactly as with the whole English catalog underneath", () => {
  // The previous construction (English catalog as the base, English fallback loaded).
  const enPairs: Record<string, string> = { ...NARRATIVE_EN };
  for (const [it, en] of chromePairs()) if (!(it in enPairs)) enPairs[it] = en;
  const enCat = buildCatalog(enPairs);
  const before = (lang: "es" | "zh") => {
    const pairs: Record<string, string> = { ...enPairs };
    for (const [it, out] of chromePairsFor(lang)) pairs[it] = out;
    Object.assign(pairs, EXTRA[lang]);
    return buildCatalog(pairs);
  };
  const texts = new Set<string>();
  for (const s of storyPoolTexts()) texts.add(s.text);
  for (let i = 0; i < 16; i += 1) {
    for (const s of playCareerTexts(7001 + i * 7919, (["esordio", "pro", "allstar", "leggenda"] as const)[i % 4])) texts.add(s.text);
  }
  assert.ok(texts.size > 3000, `corpus ${texts.size}`);
  for (const lang of ["es", "zh"] as const) {
    const cat = before(lang);
    const diff: string[] = [];
    let unresolved = 0;
    for (const text of texts) {
      const r = translateWith(cat, text, IT_PROSE);
      let want: string;
      if (r.ok) want = lang === "zh" ? zhTidy(r.text) : r.text;
      else {
        unresolved += 1;
        const e = translateWith(enCat, text, IT_PROSE);
        want = e.ok ? agreeTeamsEn(e.text) : text;
      }
      if (nx(text, lang) !== want) diff.push(text.slice(0, 120));
    }
    assert.equal(unresolved, 0, `${lang}: texts that needed the English fallback`);
    assert.deepEqual(diff.slice(0, 10), [], `${lang}: ${diff.length} texts render differently`);
  }
});
