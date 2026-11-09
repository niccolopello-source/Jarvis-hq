/**
 * Narrative layer for the UI. The engine writes canonical Italian; saves keep it. `nx()` turns a
 * stored text into the reader's language at render time:
 *  - English: the Italian source is looked up in the English catalog (keys = Italian source).
 *  - Italian: text is shown as stored, except English left behind by old saves (procedural
 *    scenes, pitches, stored chrome), which goes through the reverse catalog.
 * Fallback is always the stored text, unchanged: an unknown string is never blanked or guessed
 * (also while the English chunk is not loaded yet).
 */
import { italianTeamPreposition } from "../labels";
import { NBA_TEAMS, EURO_TEAMS } from "../teams";
import { chromePairs, chromePairsFor, type Lang } from "../i18n";
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

/*
 * Spanish and Chinese (2026-11-09). Same keys as English (the Italian source). Each catalog is a
 * lazy chunk layered over English: a fragment with no Spanish/Chinese entry renders in English,
 * never in Italian. Translations are NOT reviewed by native speakers yet.
 */
type Extra = "es" | "zh";
const narrativeExtra: Record<Extra, Readonly<Record<string, string>>> = { es: {}, zh: {} };
const extraLoad: Partial<Record<Extra, Promise<void>>> = {};
const toExtra: Partial<Record<Extra, Catalog>> = {};
const ownExtra: Partial<Record<Extra, Catalog>> = {};

/** Loads the Spanish narrative catalog (and the English one it falls back to). */
export function loadNarrativeEs(): Promise<void> {
  extraLoad.es ??= Promise.all([loadNarrativeEn(), import("./catalog-es")]).then(([, m]) => {
    narrativeExtra.es = m.NARRATIVE_ES;
    delete toExtra.es;
    delete ownExtra.es;
  });
  return extraLoad.es;
}

/** Loads the Chinese narrative catalog (and the English one it falls back to). */
export function loadNarrativeZh(): Promise<void> {
  extraLoad.zh ??= Promise.all([loadNarrativeEn(), import("./catalog-zh")]).then(([, m]) => {
    narrativeExtra.zh = m.NARRATIVE_ZH;
    delete toExtra.zh;
    delete ownExtra.zh;
  });
  return extraLoad.zh;
}

/** English pairs, then the language's chrome, then the language's narrative: last one wins. */
function extraCatalog(lang: Extra): Catalog {
  const hit = toExtra[lang];
  if (hit) return hit;
  const pairs: Record<string, string> = { ...narrativeEn };
  for (const [it, en] of chromePairs()) if (!(it in pairs)) pairs[it] = en;
  for (const [it, out] of chromePairsFor(lang)) pairs[it] = out;
  Object.assign(pairs, narrativeExtra[lang]);
  return (toExtra[lang] = buildCatalog(pairs));
}

/** Only the language's own text (plus proper names kept as-is): used to measure coverage. */
function ownCatalog(lang: Extra): Catalog {
  const hit = ownExtra[lang];
  if (hit) return hit;
  const pairs: Record<string, string> = {};
  for (const [it, en] of Object.entries(narrativeEn)) if (normKey(it) === en) pairs[it] = en;
  for (const [it, out] of chromePairsFor(lang)) pairs[it] = out;
  Object.assign(pairs, narrativeExtra[lang]);
  return (ownExtra[lang] = buildCatalog(pairs));
}

const normKey = (s: string) => s.replace(/\s+/g, " ").trim();

const CJK = "\u3400-\u9fff\uf900-\ufaff";
const CJK_PUNCT = "\u3000-\u303f\uff00-\uffef";
/**
 * Chinese typesetting for text assembled from fragments: no spaces around ideographs or
 * full-width punctuation, Western separators between Chinese clauses become full-width.
 */
export function zhTidy(text: string): string {
  return text
    .replace(new RegExp(`([${CJK}])[,，]\\s*(?=[${CJK}])`, "gu"), "$1，")
    .replace(new RegExp(`([${CJK}]):\\s+(?=[${CJK}])`, "gu"), "$1：")
    .replace(new RegExp(`([${CJK}]);\\s+(?=[${CJK}])`, "gu"), "$1；")
    .replace(new RegExp(`([${CJK}])\\.(?=\\s|$)`, "gu"), "$1。")
    .replace(new RegExp(`([${CJK_PUNCT}])\\s+`, "gu"), "$1")
    .replace(new RegExp(`\\s+([${CJK_PUNCT}])`, "gu"), "$1")
    .replace(new RegExp(`([${CJK}])\\s+(?=[${CJK}])`, "gu"), "$1");
}

function extraNx(text: string, lang: Extra): string {
  const r = translateWith(extraCatalog(lang), text, IT_PROSE);
  if (!r.ok) return nx(text, "en");
  return lang === "zh" ? zhTidy(r.text) : r.text;
}

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
const IT_DISPLAY_FIXES: ReadonlyArray<readonly [RegExp, string | ((...m: string[]) => string)]> = [
  // engine.ts nationStory: "Dai una mano a la tua Nazionale / a la Nazionale Italiana"
  [/\bDai una mano a la (tua Nazionale|Nazionale Italiana)\b/g, "Dai una mano alla $1"],
  // world.ts draft news: "$STAR è il volto, si gioca a crescita."
  [/ è il volto, si gioca a crescita\./g, " è il volto del nuovo corso."],
  // legacy.ts closing: "Quindici stagioni, o più: 16 anni di referto." -> "16 stagioni a referto."
  [/Quindici stagioni, o più: (\d+) anni di referto\./g, "$1 stagioni a referto."],
  // legacy.ts closing: "Quattro maglie, o più. 5 squadre." -> "5 maglie diverse."
  [/Quattro maglie, o più\. (\d+) (squadre|città)\./g, (_m: string, n: string, w: string) => w === "città" ? `${n} città diverse.` : `${n} maglie diverse.`],
  // feel.ts: "Dalla G-League al salto." -> official spelling
  [/\bG-League\b/g, "G League"],
];

/**
 * "mestiere / nudo" rewrite (R3). Exact whole-line replacements of stored Italian lines that read
 * as unclear or awkward ("nudo"). Display-only, like IT_DISPLAY_FIXES: the engine keeps storing
 * the old wording, so saves, voice keys (anti-repetition), English catalog keys and golden hashes
 * stay byte-identical, and no version gate is needed. English renders are updated in the catalog.
 */
const IT_ROUTE_REWRITES: ReadonlyArray<readonly [string,string]> = [
  ["Tutto è partito da un campus universitario.", "La tua preparazione pre-draft era il percorso NCAA."],
  ["Il ragazzo cresciuto in Europa è arrivato più lontano di quanto molti immaginassero.", "La tua preparazione pre-draft era l'accademia europea."],
  ["Chi ha bruciato le tappe non ha mai smesso di correre.", "La tua preparazione pre-draft era la G League."],
  ["Sei arrivato dall'Europa. Si sente ancora, nel modo in cui leggi il campo.", "Il tuo percorso pre-draft era europeo. Il resto lo raccontano le stagioni."],
  ["Hai bruciato le tappe. Il grezzo, all'inizio, era il punto di forza e il rischio.", "Il tuo percorso pre-draft era la G League. La carriera si è costruita stagione per stagione."],
];

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
  // Stored team names are stable ids; articles belong to the Italian display only.
  for (const team of [...NBA_TEAMS,...EURO_TEAMS]) {
    const escaped=team.name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    out=out.replace(new RegExp(`\\b(a|ad|da|con) ${escaped}\\b`,"gi"),(match, prep:string)=>{
      const key=prep.toLowerCase()==="ad"?"a":prep.toLowerCase() as "a"|"da"|"con";
      const phrase=italianTeamPreposition(team.name,key);
      return match[0]===match[0].toUpperCase()?phrase[0].toUpperCase()+phrase.slice(1):phrase;
    });
  }
  out = out.replace(/\bA Atlanta\b/g, "Ad Atlanta").replace(/\ba Atlanta\b/g, "ad Atlanta");
  out = out.replace(/(A|Ad) ([^,.]+), la piazza di \2 entra già caldo\./g, "$1 $2, il pubblico è già caldo.");
  out=out.replaceAll("Il gesto, a settembre, è un altro di un palmo.","Il gesto, a settembre, è cambiato di poco.")
    .replaceAll("Il ruolo, a settembre, è un altro di un palmo.","Il ruolo, a settembre, è leggermente cambiato.")
    .replaceAll("una uscita nuova","un'uscita nuova");
  for (const [from, to] of IT_ROUTE_REWRITES) out = out.replaceAll(from, to);
  for (const [re, to] of IT_DISPLAY_FIXES) out = typeof to === "string" ? out.replace(re, to) : out.replace(re, to);
  return out;
}

/** Stored narrative text -> text in `lang`. Unknown text comes back exactly as stored. */
export function nx(text: string | null | undefined, lang: Lang): string {
  if (!text) return text ?? "";
  if (lang === "es" || lang === "zh") return extraNx(text, lang);
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
  if (lang === "es" || lang === "zh") {
    const r = translateWith(extraCatalog(lang), text, IT_PROSE);
    return lang === "zh" ? { ...r, text: zhTidy(r.text) } : r;
  }
  if (lang === "en") {
    const r = translateWith(enCatalog(), text, IT_PROSE);
    return { ...r, text: agreeTeamsEn(r.text) };
  }
  return translateWith(itCatalog(), text, EN_PROSE);
}

/**
 * Coverage of the language's own catalog (no English fallback). `ok` is true only when every
 * fragment of the text has a Spanish/Chinese entry (or is a proper name). Used by the tests.
 */
export function nxOwn(text: string, lang: Extra): { text: string; ok: boolean } {
  const r = translateWith(ownCatalog(lang), text, IT_PROSE);
  return lang === "zh" ? { ...r, text: zhTidy(r.text) } : r;
}
