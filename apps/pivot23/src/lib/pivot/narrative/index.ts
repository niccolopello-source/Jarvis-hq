/**
 * Narrative layer for the UI. The engine writes canonical Italian; saves keep it. `nx()` turns a
 * stored text into the reader's language at render time:
 *  - English: the Italian source is looked up in the English catalog (keys = Italian source).
 *  - Italian: text is shown as stored, except English left behind by old saves (procedural
 *    scenes, pitches, stored chrome), which goes through the reverse catalog.
 * Fallback is always the stored text, unchanged: an unknown string is never blanked or guessed
 * (also while the English chunk is not loaded yet).
 */
import { chromePairs, type Lang } from "../i18n";
import { LEGACY_EN_IT } from "./legacy-it";
import { EN_PROSE, IT_PROSE } from "./markers";
import { buildCatalog, translateWith, type Catalog } from "./translate";

// The English catalog is a lazy chunk: Italian readers never download it.
let narrativeEn: Readonly<Record<string, string>> = {};
let enLoad: Promise<void> | null = null;
let toEn: Catalog | null = null;

/** Loads the English narrative catalog once. Registered as the "en" loader of setLang(). */
export function loadNarrativeEn(): Promise<void> {
  enLoad ??= import("./catalog-en").then((m) => {
    narrativeEn = m.NARRATIVE_EN;
    toEn = null;
  });
  return enLoad;
}
let toIt: Catalog | null = null;

function enCatalog(): Catalog {
  if (!toEn) {
    const pairs: Record<string, string> = { ...narrativeEn };
    for (const [it, en] of chromePairs()) if (!(it in pairs)) pairs[it] = en;
    toEn = buildCatalog(pairs);
  }
  return toEn;
}

function itCatalog(): Catalog {
  if (!toIt) {
    const pairs: Record<string, string> = { ...LEGACY_EN_IT };
    for (const [it, en] of chromePairs()) if (!(en in pairs)) pairs[en] = it;
    toIt = buildCatalog(pairs);
  }
  return toIt;
}

/** Stored narrative text -> text in `lang`. Unknown text comes back exactly as stored. */
export function nx(text: string | null | undefined, lang: Lang): string {
  if (!text) return text ?? "";
  if (lang === "en") {
    const r = translateWith(enCatalog(), text, IT_PROSE);
    return r.ok ? r.text : text;
  }
  // Italian prose is never sent through the reverse catalog; short English lines with no
  // give-away word ("No meeting. Just games.") still are, and only an exact full match changes them.
  if (lang === "it" && (EN_PROSE.test(text) || !IT_PROSE.test(text))) {
    const r = translateWith(itCatalog(), text, EN_PROSE);
    return r.ok ? r.text : text;
  }
  return text;
}

/** Same as nx(), also telling whether every piece was resolved. Used by the coverage tests. */
export function nxCheck(text: string, lang: Lang): { text: string; ok: boolean } {
  if (lang === "en") return translateWith(enCatalog(), text, IT_PROSE);
  return translateWith(itCatalog(), text, EN_PROSE);
}
