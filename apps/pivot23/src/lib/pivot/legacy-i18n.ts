/** Strings and narrative for the Career Legacy Report and Card, Italian and English. */
import type { Lang } from "./i18n";
import type { LegacyReport, RecordLine, TimelineItem } from "./legacy-report";
import { nationLabel, playoffResultLabel, roleLabel } from "./labels";
import { NBA_TEAMS } from "./teams";

/** English article for a team: "the Utah Jazz", but "Real Madrid". Italian needs none here. */
export function theTeam(name: string, lang: Lang): string {
  if (lang !== "en" || !name) return name;
  return NBA_TEAMS.some((t) => t.name === name) ? `the ${name}` : name;
}

const IT = {
  cardRegion: "Career Card",
  reportTitle: "Report della carriera",
  identity: "Identità",
  jersey: "Maglia",
  role: "Ruolo",
  nation: "Nazionalità",
  origin: "Percorso",
  draft: "Draft",
  draftValue: "{pick}ª scelta · {team}",
  draftValueNoTeam: "{pick}ª scelta",
  career: "Carriera",
  years: "Anni",
  age: "Età",
  teams: "Squadre",
  seasonsOne: "1 stagione",
  seasonsMany: "{n} stagioni",
  averages: "Medie (stagioni)",
  totals: "Totali",
  games: "Partite",
  points: "Punti",
  rebounds: "Rimbalzi",
  assists: "Assist",
  steals: "Recuperi",
  blocks: "Stoppate",
  regular: "Regular season",
  record: "Bilancio di squadra",
  playoffs: "Playoff",
  playoffYears: "Stagioni ai playoff",
  deepest: "Miglior risultato",
  titles: "Titoli",
  finals: "Finali giocate",
  awards: "Premi e riconoscimenti",
  noAwards: "Nessun premio individuale.",
  records: "Record personali",
  recordsNote: "Massimi stagionali raggiunti in carriera.",
  timeline: "Le tappe",
  seasonsTable: "Stagione per stagione",
  colSeason: "Stagione",
  colTeam: "Squadra",
  colGp: "PG",
  colWl: "V-S",
  colPo: "Playoff",
  story: "La storia",
  peak: "Picco",
  theme: "Tema della carta",
  themeFree: "Gratis",
  themePrototype: "Prototipo · non in vendita",
  themeNote: "Il tema cambia solo l'aspetto della carta. Non tocca la carriera.",
  exportPng: "Scarica PNG",
  exporting: "Preparo l'immagine…",
  exportDone: "Immagine scaricata.",
  exportFail: "Non sono riuscito a creare l'immagine. Puoi fare uno screenshot della carta.",
  exportUnsupported: "Questo browser non crea immagini. Puoi fare uno screenshot della carta.",
  showAll: "Mostra tutte le stagioni ({n})",
  simulated: "Carriera simulata",
  noData: "—",
  recPpg: "Punti a partita",
  recRpg: "Rimbalzi a partita",
  recApg: "Assist a partita",
  recSpg: "Recuperi a partita",
  recBpg: "Stoppate a partita",
  recPer: "PER",
  recWins: "Vittorie di squadra",
  tlDraft: "Scelto con la {pick}ª chiamata{team}",
  tlDebut: "Esordio con {team}",
  tlMove: "Passa {team}",
  tlAward: "Primo {award}",
  tlAwardOnce: "{award}",
  tlTitle: "Campione con {team}",
  tlFinals: "Finali NBA con {team}",
  tlBest: "Stagione migliore: {ppg} punti a partita",
  tlRetire: "Ritiro a {age} anni",
  footer: "Generata sul dispositivo da PIVOT 23",
  bust: "Bust: scelta al primo giro che non è mai esplosa",
};
type Key = keyof typeof IT;

const EN: Record<Key, string> = {
  cardRegion: "Career Card",
  reportTitle: "Career report",
  identity: "Identity",
  jersey: "Jersey",
  role: "Position",
  nation: "Nationality",
  origin: "Path",
  draft: "Draft",
  draftValue: "{pick} pick · {team}",
  draftValueNoTeam: "{pick} pick",
  career: "Career",
  years: "Years",
  age: "Age",
  teams: "Teams",
  seasonsOne: "1 season",
  seasonsMany: "{n} seasons",
  averages: "Averages (by season)",
  totals: "Totals",
  games: "Games",
  points: "Points",
  rebounds: "Rebounds",
  assists: "Assists",
  steals: "Steals",
  blocks: "Blocks",
  regular: "Regular season",
  record: "Team record",
  playoffs: "Playoffs",
  playoffYears: "Playoff seasons",
  deepest: "Deepest run",
  titles: "Titles",
  finals: "Finals played",
  awards: "Awards and honors",
  noAwards: "No individual awards.",
  records: "Personal records",
  recordsNote: "Best single-season marks of the career.",
  timeline: "Milestones",
  seasonsTable: "Season by season",
  colSeason: "Season",
  colTeam: "Team",
  colGp: "GP",
  colWl: "W-L",
  colPo: "Playoffs",
  story: "The story",
  peak: "Peak",
  theme: "Card theme",
  themeFree: "Free",
  themePrototype: "Prototype · not for sale",
  themeNote: "The theme only changes how the card looks. It does not touch the career.",
  exportPng: "Download PNG",
  exporting: "Preparing the image…",
  exportDone: "Image downloaded.",
  exportFail: "The image could not be created. You can take a screenshot of the card.",
  exportUnsupported: "This browser cannot create images. You can take a screenshot of the card.",
  showAll: "Show every season ({n})",
  simulated: "Simulated career",
  noData: "—",
  recPpg: "Points per game",
  recRpg: "Rebounds per game",
  recApg: "Assists per game",
  recSpg: "Steals per game",
  recBpg: "Blocks per game",
  recPer: "PER",
  recWins: "Team wins",
  tlDraft: "Drafted {pick}{team}",
  tlDebut: "Debut with {team}",
  tlMove: "Joins {team}",
  tlAward: "First {award}",
  tlAwardOnce: "{award}",
  tlTitle: "Champion with {team}",
  tlFinals: "NBA Finals with {team}",
  tlBest: "Best season: {ppg} points per game",
  tlRetire: "Retires at {age}",
  footer: "Generated on this device by PIVOT 23",
  bust: "Bust: first-round pick who never broke through",
};

export type LegacyKey = Key;

export function lt(key: Key, lang: Lang, vars: Record<string, string | number> = {}): string {
  const raw = (lang === "en" ? EN : IT)[key];
  return raw.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function legacyKeys(): { it: string[]; en: string[] } {
  return { it: Object.keys(IT), en: Object.keys(EN) };
}

export function ordinalEn(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

export function pickLabel(pick: number, lang: Lang): string {
  return lang === "en" ? ordinalEn(pick) : `${pick}ª`;
}

export function seasonsLabel(n: number, lang: Lang): string {
  return n === 1 ? lt("seasonsOne", lang) : lt("seasonsMany", lang, { n });
}

const fmt1 = (n: number, lang: Lang) => n.toLocaleString(lang === "en" ? "en-US" : "it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const fmtInt = (n: number, lang: Lang) => n.toLocaleString(lang === "en" ? "en-US" : "it-IT");
export const fmtDec = fmt1;

export function recordLabel(r: RecordLine, lang: Lang): string {
  const key = ({ ppg: "recPpg", rpg: "recRpg", apg: "recApg", spg: "recSpg", bpg: "recBpg", per: "recPer", wins: "recWins" } as const)[r.key];
  return lt(key, lang);
}

export function recordValue(r: RecordLine, lang: Lang): string {
  return r.key === "wins" ? fmtInt(r.value, lang) : fmt1(r.value, lang);
}

export function timelineLine(item: TimelineItem, lang: Lang): string {
  switch (item.kind) {
    case "draft":
      return lt("tlDraft", lang, {
        pick: lang === "en" ? `${ordinalEn(item.value ?? 0)} overall` : String(item.value ?? ""),
        team: item.subject ? (lang === "en" ? ` by ${theTeam(item.subject, lang)}` : ` da ${item.subject}`) : "",
      });
    case "debut":
      return lt("tlDebut", lang, { team: theTeam(item.subject, lang) });
    case "move":
      return lt("tlMove", lang, { team: lang === "en" ? theTeam(item.subject, lang) : `${/^[AEIOUaeiou]/.test(item.subject) ? "ad" : "a"} ${item.subject}` });
    case "award":
      return lt((item.value ?? 1) > 1 ? "tlAward" : "tlAwardOnce", lang, { award: item.subject });
    case "title":
      return lt("tlTitle", lang, { team: theTeam(item.subject, lang) });
    case "finals":
      return lt("tlFinals", lang, { team: theTeam(item.subject, lang) });
    case "best":
      return lt("tlBest", lang, { ppg: fmt1(item.value ?? 0, lang) });
    case "retire":
      return lt("tlRetire", lang, { age: item.value ?? "" });
  }
}

function listJoin(items: string[], lang: Lang): string {
  if (items.length <= 1) return items.join("");
  const and = lang === "en" ? " and " : " e ";
  return `${items.slice(0, -1).join(", ")}${and}${items[items.length - 1]}`;
}

function countedAward(id: string, n: number, lang: Lang): string {
  if (n === 1) return id;
  return lang === "en" ? `${n}× ${id}` : `${n} volte ${id}`;
}

/** Final narrative. Each sentence states only recorded facts; a missing fact drops its sentence. */
export function narrativeOf(r: LegacyReport, lang: Lang): string[] {
  const out: string[] = [];
  const role = r.roleCode ? roleLabel(r.roleCode, lang) : roleLabel(r.roleLabel, lang);
  const nation = r.nationality ? nationLabel(r.nationality, lang) : null;
  if (lang === "en") {
    const who = nation ? `${r.name}, ${/^[AEIOU]/i.test(role) ? "an" : "a"} ${role.toLowerCase()} from ${nation}` : `${r.name}, ${/^[AEIOU]/i.test(role) ? "an" : "a"} ${role.toLowerCase()}`;
    out.push(r.draftPick
      ? `${who}, went ${ordinalEn(r.draftPick)} overall${r.draftTeam ? ` to ${theTeam(r.draftTeam, lang)}` : ""}.`
      : `${who}.`);
  } else {
    const who = nation ? `${r.name}, ${role.toLowerCase()} (${nation})` : `${r.name}, ${role.toLowerCase()}`;
    out.push(r.draftPick
      ? `${who}, scelto con la ${r.draftPick}ª chiamata al draft${r.draftTeam ? ` da ${r.draftTeam}` : ""}.`
      : `${who}.`);
  }
  const teams = r.stints.filter((s, i, all) => all.findIndex((x) => x.abbr === s.abbr) === i).length;
  if (r.firstYear && r.lastYear) {
    out.push(lang === "en"
      ? `${seasonsLabel(r.seasons, lang)} from ${r.firstYear} to ${r.lastYear}, with ${teams === 1 ? "one team" : `${teams} teams`}.`
      : `${seasonsLabel(r.seasons, lang)} dal ${r.firstYear} al ${r.lastYear}, ${teams === 1 ? "con una sola squadra" : `con ${teams} squadre`}.`);
  }
  const best = r.records.find((x) => x.key === "ppg");
  const bestRow = best ? r.rows.find((x) => x.yearLabel === best.yearLabel) : null;
  if (bestRow && r.rows.length > 1) {
    out.push(lang === "en"
      ? `The best season was ${bestRow.yearLabel} with ${theTeam(bestRow.team, lang)}: ${fmt1(bestRow.ppg, lang)} points, ${fmt1(bestRow.rpg, lang)} rebounds and ${fmt1(bestRow.apg, lang)} assists per game.`
      : `La stagione migliore è il ${bestRow.yearLabel} con ${bestRow.team}: ${fmt1(bestRow.ppg, lang)} punti, ${fmt1(bestRow.rpg, lang)} rimbalzi e ${fmt1(bestRow.apg, lang)} assist a partita.`);
  }
  if (r.awards.length) {
    const list = listJoin(r.awards.slice(0, 4).map(([id, n]) => countedAward(id, n, lang)), lang);
    out.push(lang === "en" ? `Honors: ${list}.` : `In bacheca: ${list}.`);
  }
  if (r.titles > 0) {
    out.push(lang === "en"
      ? (r.titles === 1 ? "One championship." : `${r.titles} championships.`)
      : (r.titles === 1 ? "Un titolo." : `${r.titles} titoli.`));
  } else if (r.finals > 0) {
    out.push(lang === "en"
      ? (r.finals === 1 ? "Reached the NBA Finals once, without winning." : `Reached the NBA Finals ${r.finals} times, without winning.`)
      : (r.finals === 1 ? "Una Finale NBA, persa." : `${r.finals} Finali NBA, tutte perse.`));
  } else if (r.deepest) {
    out.push(lang === "en"
      ? `Deepest playoff run: ${playoffResultLabel(r.deepest, lang)}.`
      : `Miglior playoff: ${playoffResultLabel(r.deepest, lang)}.`);
  } else if (r.rows.length) {
    out.push(lang === "en" ? "Never reached the playoffs." : "Mai ai playoff.");
  }
  return out;
}
