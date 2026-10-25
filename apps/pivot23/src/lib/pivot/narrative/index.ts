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
import { agreeTeamsEn } from "./agreement";
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

/**
 * Italian display fixes for lines the engine still stores in their old wording. The stored text
 * stays byte-identical (saves, English catalog keys and golden hashes depend on it); only what an
 * Italian reader sees is corrected. Move the fix into the engine with a version gate (2.20).
 */
const IT_DISPLAY_FIXES: ReadonlyArray<readonly [RegExp, string]> = [
  // engine.ts nationStory: "Dai una mano a la tua Nazionale / a la Nazionale Italiana"
  [/\bDai una mano a la (tua Nazionale|Nazionale Italiana)\b/g, "Dai una mano alla $1"],
  // world.ts draft news: "$STAR è il volto, si gioca a crescita."
  [/ è il volto, si gioca a crescita\./g, " è il volto del nuovo corso."],
];

/**
 * "mestiere / nudo" rewrite (R3). Exact whole-line replacements of stored Italian lines that read
 * as unclear or awkward ("nudo"). Display-only, like IT_DISPLAY_FIXES: the engine keeps storing
 * the old wording, so saves, voice keys (anti-repetition), English catalog keys and golden hashes
 * stay byte-identical, and no version gate is needed. English renders are updated in the catalog.
 */
export const IT_LINE_REWRITES: ReadonlyArray<readonly [string, string]> = [
  ["Il mestiere cambia forma, non peso.", "Il ruolo cambia forma, non peso."],
  ["Tieni il mestiere, nudo", "Torni alle basi"],
  ["Ottobre, nudo, di nuovo", "Di nuovo ottobre, senza fronzoli"],
  ["Il palazzetto è vuoto. Restano le luci basse e i tuoi passi, nudi.", "Il palazzetto è vuoto. Restano le luci basse e l'eco dei tuoi passi."],
  ["Il mestiere, sentito da fuori, è un altro mestiere.", "Il basket, sentito da fuori, è un altro sport."],
  ["La palestra, nuda, di lunedì. Entri, e questo è già un mestiere.", "La palestra vuota, di lunedì. Entri, e questo è già lavoro."],
  ["Lasci correre la settimana. Il mestiere, nudo, basta.", "Lasci correre la settimana. Le basi bastano."],
  ["Niente copertine. Resta il lavoro, nudo, e tre modi di tenerlo.", "Niente copertine. Resta il lavoro quotidiano, e tre modi di tenerlo."],
  ["Niente fermo immagine. Il mestiere, nudo, vale più dell'anello in bacheca.", "Niente fermo immagine. Il lavoro di ogni giorno vale più dell'anello in bacheca."],
  ["La fame, nuda, sul possesso largo", "Pura fame, sul possesso largo"],
  ["Se arrivi fin qui da ragazzo, non restare educato. La fame, nuda, vale più del copione.", "Se arrivi fin qui da ragazzo, non restare educato. La fame pura vale più del copione."],
  ["L'ultimo possesso, nudo", "L'ultimo possesso, senza schemi"],
  ["L'isolamento è una responsabilità, nuda.", "L'isolamento è una responsabilità tutta tua."],
];
const IT_LINE_MAP: ReadonlyMap<string, string> = new Map(IT_LINE_REWRITES);

export function itDisplay(text: string): string {
  const whole = IT_LINE_MAP.get(text);
  if (whole !== undefined) return whole;
  let out = text;
  for (const [re, to] of IT_DISPLAY_FIXES) out = out.replace(re, to);
  return out;
}

/** Stored narrative text -> text in `lang`. Unknown text comes back exactly as stored. */
export function nx(text: string | null | undefined, lang: Lang): string {
  if (!text) return text ?? "";
  if (lang === "en") {
    const r = translateWith(enCatalog(), text, IT_PROSE);
    return r.ok ? agreeTeamsEn(r.text) : text;
  }
  // Italian prose is never sent through the reverse catalog; short English lines with no
  // give-away word ("No meeting. Just games.") still are, and only an exact full match changes them.
  if (lang === "it" && (EN_PROSE.test(text) || !IT_PROSE.test(text))) {
    const r = translateWith(itCatalog(), text, EN_PROSE);
    return r.ok ? r.text : itDisplay(text);
  }
  return lang === "it" ? itDisplay(text) : text;
}

/** Same as nx(), also telling whether every piece was resolved. Used by the coverage tests. */
export function nxCheck(text: string, lang: Lang): { text: string; ok: boolean } {
  if (lang === "en") {
    const r = translateWith(enCatalog(), text, IT_PROSE);
    return { ...r, text: agreeTeamsEn(r.text) };
  }
  return translateWith(itCatalog(), text, EN_PROSE);
}
