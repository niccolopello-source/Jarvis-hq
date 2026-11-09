/** Strings and narrative for the Career Legacy Report and Card: Italian, English, Spanish, Chinese. */
import { NUMBER_LOCALE, awardDisplay, type Lang } from "./i18n";
import type { LegacyReport, RecordLine, TimelineItem } from "./legacy-report";
import { nationLabel, playoffResultLabel, roleLabel, italianTeamPreposition } from "./labels";
import { NBA_TEAMS } from "./teams";

/** English article for a team: "the Utah Jazz", but "Real Madrid". Italian needs none here. */
export function theTeam(name: string, lang: Lang): string {
  if (!name) return name;
  if (lang === "es" || lang === "zh") return name;
  if (lang !== "en") return italianTeamPreposition(name,"con").slice(4);
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
  draftValue: "{pick} scelta · {team}",
  draftValueNoTeam: "{pick} scelta",
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
  tableScrollHint: "Scorri in orizzontale per tutte le statistiche. Stagione e squadra restano visibili.",
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
  tableScrollHint: "Scroll horizontally for all statistics. Season and team stay visible.",
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


/* Spanish and Chinese (2026-11-09): NOT reviewed by native speakers yet (docs/pivot23/i18n-es-zh/). */
const ES: Record<Key, string> = {
  cardRegion: "Career Card",
  reportTitle: "Informe de la carrera",
  identity: "Identidad",
  jersey: "Camiseta",
  role: "Posición",
  nation: "Nacionalidad",
  origin: "Camino",
  draft: "Draft",
  draftValue: "Elección {pick} · {team}",
  draftValueNoTeam: "Elección {pick}",
  career: "Carrera",
  years: "Años",
  age: "Edad",
  teams: "Equipos",
  seasonsOne: "1 temporada",
  seasonsMany: "{n} temporadas",
  averages: "Promedios (temporadas)",
  totals: "Totales",
  games: "Partidos",
  points: "Puntos",
  rebounds: "Rebotes",
  assists: "Asistencias",
  steals: "Robos",
  blocks: "Tapones",
  regular: "Temporada regular",
  record: "Balance del equipo",
  playoffs: "Playoffs",
  playoffYears: "Temporadas en playoffs",
  deepest: "Mejor resultado",
  titles: "Títulos",
  finals: "Finales jugadas",
  awards: "Premios y reconocimientos",
  noAwards: "Ningún premio individual.",
  records: "Récords personales",
  recordsNote: "Mejores marcas de una temporada en la carrera.",
  timeline: "Las etapas",
  seasonsTable: "Temporada a temporada",
  tableScrollHint: "Desliza en horizontal para ver todas las estadísticas. Temporada y equipo siguen visibles.",
  colSeason: "Temporada",
  colTeam: "Equipo",
  colGp: "PJ",
  colWl: "V-D",
  colPo: "Playoffs",
  story: "La historia",
  peak: "Pico",
  theme: "Tema de la carta",
  themeFree: "Gratis",
  themePrototype: "Prototipo · no está a la venta",
  themeNote: "El tema solo cambia el aspecto de la carta. No toca la carrera.",
  exportPng: "Descargar PNG",
  exporting: "Preparando la imagen…",
  exportDone: "Imagen descargada.",
  exportFail: "No se ha podido crear la imagen. Puedes hacer una captura de pantalla de la carta.",
  exportUnsupported: "Este navegador no puede crear imágenes. Puedes hacer una captura de pantalla de la carta.",
  showAll: "Mostrar todas las temporadas ({n})",
  simulated: "Carrera simulada",
  noData: "—",
  recPpg: "Puntos por partido",
  recRpg: "Rebotes por partido",
  recApg: "Asistencias por partido",
  recSpg: "Robos por partido",
  recBpg: "Tapones por partido",
  recPer: "PER",
  recWins: "Victorias del equipo",
  tlDraft: "Elegido con el número {pick}{team}",
  tlDebut: "Debut con {team}",
  tlMove: "Pasa a {team}",
  tlAward: "Primer {award}",
  tlAwardOnce: "{award}",
  tlTitle: "Campeón con {team}",
  tlFinals: "Finales de la NBA con {team}",
  tlBest: "Mejor temporada: {ppg} puntos por partido",
  tlRetire: "Retirada con {age} años",
  footer: "Generada en el dispositivo por PIVOT 23",
  bust: "Bust: elección de primera ronda que nunca despegó",
};

const ZH: Record<Key, string> = {
  cardRegion: "Career Card",
  reportTitle: "生涯报告",
  identity: "身份",
  jersey: "球衣",
  role: "位置",
  nation: "国籍",
  origin: "路线",
  draft: "选秀",
  draftValue: "{pick} · {team}",
  draftValueNoTeam: "{pick}",
  career: "生涯",
  years: "年份",
  age: "年龄",
  teams: "球队",
  seasonsOne: "1个赛季",
  seasonsMany: "{n}个赛季",
  averages: "场均（按赛季）",
  totals: "总计",
  games: "出场",
  points: "得分",
  rebounds: "篮板",
  assists: "助攻",
  steals: "抢断",
  blocks: "盖帽",
  regular: "常规赛",
  record: "球队战绩",
  playoffs: "季后赛",
  playoffYears: "进入季后赛的赛季",
  deepest: "最佳成绩",
  titles: "总冠军",
  finals: "总决赛场次",
  awards: "奖项与荣誉",
  noAwards: "没有个人奖项。",
  records: "个人纪录",
  recordsNote: "生涯中单赛季的最佳数据。",
  timeline: "生涯节点",
  seasonsTable: "逐赛季数据",
  tableScrollHint: "横向滑动查看全部数据。赛季和球队列保持可见。",
  colSeason: "赛季",
  colTeam: "球队",
  colGp: "出场",
  colWl: "胜-负",
  colPo: "季后赛",
  story: "生涯故事",
  peak: "巅峰",
  theme: "卡片主题",
  themeFree: "免费",
  themePrototype: "原型 · 非卖品",
  themeNote: "主题只改变卡片的外观，不影响生涯。",
  exportPng: "下载PNG",
  exporting: "正在生成图片…",
  exportDone: "图片已下载。",
  exportFail: "无法生成图片。你可以给卡片截图。",
  exportUnsupported: "这个浏览器无法生成图片。你可以给卡片截图。",
  showAll: "显示全部赛季（{n}）",
  simulated: "模拟生涯",
  noData: "—",
  recPpg: "场均得分",
  recRpg: "场均篮板",
  recApg: "场均助攻",
  recSpg: "场均抢断",
  recBpg: "场均盖帽",
  recPer: "PER",
  recWins: "球队胜场",
  tlDraft: "以{pick}被选中{team}",
  tlDebut: "在{team}首秀",
  tlMove: "加盟{team}",
  tlAward: "首个{award}",
  tlAwardOnce: "{award}",
  tlTitle: "随{team}夺冠",
  tlFinals: "随{team}打进NBA总决赛",
  tlBest: "最佳赛季：场均{ppg}分",
  tlRetire: "{age}岁退役",
  footer: "由PIVOT 23在本设备上生成",
  bust: "水货：从未爆发的首轮秀",
};

export type LegacyKey = Key;

export function lt(key: Key, lang: Lang, vars: Record<string, string | number> = {}): string {
  const raw = (lang === "en" ? EN : lang === "es" ? ES : lang === "zh" ? ZH : IT)[key] ?? EN[key];
  return raw.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function legacyKeys(): { it: string[]; en: string[]; es: string[]; zh: string[] } {
  return { it: Object.keys(IT), en: Object.keys(EN), es: Object.keys(ES), zh: Object.keys(ZH) };
}

export function ordinalEn(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

export function pickLabel(pick: number, lang: Lang): string {
  if (lang === "es") return `n.º ${pick}`;
  if (lang === "zh") return `第${pick}顺位`;
  return lang === "en" ? ordinalEn(pick) : `${pick}ª`;
}

export function seasonsLabel(n: number, lang: Lang): string {
  return n === 1 ? lt("seasonsOne", lang) : lt("seasonsMany", lang, { n });
}

// it-IT leaves 4-digit numbers ungrouped ("2649" next to "15.473"): always group, in both languages.
const GROUP = { useGrouping: "always" } as unknown as Intl.NumberFormatOptions;
const fmt1 = (n: number, lang: Lang) => n.toLocaleString(NUMBER_LOCALE[lang] ?? "it-IT", { ...GROUP, minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const fmtInt = (n: number, lang: Lang) => n.toLocaleString(NUMBER_LOCALE[lang] ?? "it-IT", GROUP);

/** Award names on the Legacy screen: one name per award, Italian names in Italian. Display only. */
const AWARD_IT: Readonly<Record<string, string>> = {
  "NBA Champion": "Campione NBA",
  "EuroLeague Champion": "Campione di Eurolega",
  "Finals MVP": "MVP delle Finali",
  FMVP: "MVP delle Finali",
  "Most Improved Player": "Giocatore più migliorato",
  MIP: "Giocatore più migliorato",
  "Sixth Man": "Sesto uomo dell'anno",
  "Sixth Man of the Year": "Sesto uomo dell'anno",
  "6MOY": "Sesto uomo dell'anno",
  "Rookie of the Year": "Rookie dell'anno",
  ROY: "Rookie dell'anno",
  "Defensive Player of the Year": "Difensore dell'anno",
  DPOY: "Difensore dell'anno",
};
const AWARD_EN: Readonly<Record<string, string>> = {
  FMVP: "Finals MVP",
  "Sixth Man": "Sixth Man of the Year",
  "6MOY": "Sixth Man of the Year",
  MIP: "Most Improved Player",
  ROY: "Rookie of the Year",
  DPOY: "Defensive Player of the Year",
};
const AWARD_ES: Readonly<Record<string, string>> = {
  "NBA Champion": "Campeón de la NBA",
  "EuroLeague Champion": "Campeón de la EuroLeague",
  FMVP: "Finals MVP",
  "Sixth Man": "Sixth Man of the Year",
  "6MOY": "Sixth Man of the Year",
  MIP: "Most Improved Player",
  ROY: "Rookie of the Year",
  DPOY: "Defensive Player of the Year",
};
export function legacyAwardLabel(id: string, lang: Lang): string {
  if (lang === "es") return AWARD_ES[id] ?? id;
  if (lang === "zh") return awardDisplay(AWARD_EN[id] ?? id, "zh");
  return (lang === "en" ? AWARD_EN[id] : AWARD_IT[id]) ?? id;
}
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
      if (lang === "es" || lang === "zh") {
        return lt("tlDraft", lang, {
          pick: lang === "zh" ? pickLabel(item.value ?? 0, lang) : String(item.value ?? ""),
          team: item.subject ? (lang === "zh" ? `（${item.subject}）` : ` por ${item.subject}`) : "",
        });
      }
      return lt("tlDraft", lang, {
        pick: lang === "en" ? `${ordinalEn(item.value ?? 0)} overall` : String(item.value ?? ""),
        team: item.subject ? (lang === "en" ? ` by ${theTeam(item.subject, lang)}` : ` ${italianTeamPreposition(item.subject,"da")}`) : "",
      });
    case "debut":
      return lt("tlDebut", lang, { team: theTeam(item.subject, lang) });
    case "move":
      return lt("tlMove", lang, { team: lang === "en" || lang === "es" || lang === "zh" ? theTeam(item.subject, lang) : italianTeamPreposition(item.subject,"a") });
    case "award":
      return lt((item.value ?? 1) > 1 ? "tlAward" : "tlAwardOnce", lang, { award: legacyAwardLabel(item.subject, lang) });
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
  if (lang === "zh") return `${items.slice(0, -1).join("、")}和${items[items.length - 1]}`;
  const and = lang === "en" ? " and " : lang === "es" ? " y " : " e ";
  return `${items.slice(0, -1).join(", ")}${and}${items[items.length - 1]}`;
}

function countedAward(id: string, n: number, lang: Lang): string {
  const name = legacyAwardLabel(id, lang);
  if (n === 1) return name;
  if (lang === "es") return `${n} veces ${name}`;
  if (lang === "zh") return `${n}次${name}`;
  return lang === "en" ? `${n}× ${name}` : `${n} volte ${name}`;
}

/** Spanish and Chinese final narrative: same facts and same rules as the Italian/English one. */
function narrativeEsZh(r: LegacyReport, lang: "es" | "zh"): string[] {
  const out: string[] = [];
  const zh = lang === "zh";
  const role = r.roleCode ? roleLabel(r.roleCode, lang) : roleLabel(r.roleLabel, lang);
  const nation = r.nationality ? nationLabel(r.nationality, lang) : null;
  if (zh) {
    const who = nation ? `${r.name}，来自${nation}的${role}` : `${r.name}，${role}`;
    out.push(r.draftPick ? `${who}，在选秀中以${pickLabel(r.draftPick, lang)}被${r.draftTeam ? `${r.draftTeam}` : ""}选中。` : `${who}。`);
  } else {
    const who = nation ? `${r.name}, ${role.toLowerCase()} (${nation})` : `${r.name}, ${role.toLowerCase()}`;
    out.push(r.draftPick ? `${who}, elegido con el número ${r.draftPick} del Draft${r.draftTeam ? ` por ${r.draftTeam}` : ""}.` : `${who}.`);
  }
  const teams = r.stints.filter((s, i, all) => all.findIndex((x) => x.abbr === s.abbr) === i).length;
  if (r.firstYear && r.lastYear) {
    out.push(zh
      ? `${seasonsLabel(r.seasons, lang)}，从${r.firstYear}到${r.lastYear}，${teams === 1 ? "只效力过一支球队" : `效力过${teams}支球队`}。`
      : `${seasonsLabel(r.seasons, lang)} de ${r.firstYear} a ${r.lastYear}, ${teams === 1 ? "con un solo equipo" : `con ${teams} equipos`}.`);
  }
  const best = r.records.find((x) => x.key === "ppg");
  const bestRow = best ? r.rows.find((x) => x.yearLabel === best.yearLabel) : null;
  if (bestRow && r.rows.length > 1) {
    out.push(zh
      ? `最佳赛季是${bestRow.yearLabel}赛季，效力于${bestRow.team}：场均${fmt1(bestRow.ppg, lang)}分、${fmt1(bestRow.rpg, lang)}个篮板和${fmt1(bestRow.apg, lang)}次助攻。`
      : `La mejor temporada fue la ${bestRow.yearLabel} con ${bestRow.team}: ${fmt1(bestRow.ppg, lang)} puntos, ${fmt1(bestRow.rpg, lang)} rebotes y ${fmt1(bestRow.apg, lang)} asistencias por partido.`);
  }
  if (r.awards.length) {
    const list = listJoin(r.awards.slice(0, 4).map(([id, n]) => countedAward(id, n, lang)), lang);
    out.push(zh ? `荣誉：${list}。` : `Palmarés: ${list}.`);
  }
  if (r.titles > 0) {
    out.push(zh ? (r.titles === 1 ? "一座总冠军。" : `${r.titles}座总冠军。`) : (r.titles === 1 ? "Un título." : `${r.titles} títulos.`));
  } else if (r.finals > 0) {
    out.push(zh
      ? (r.finals === 1 ? "打进过一次NBA总决赛，但输掉了。" : `打进过${r.finals}次NBA总决赛，全部失利。`)
      : (r.finals === 1 ? "Una Final de la NBA, perdida." : `${r.finals} Finales de la NBA, todas perdidas.`));
  } else if (r.deepest) {
    out.push(zh ? `季后赛最佳成绩：${playoffResultLabel(r.deepest, lang)}。` : `Mejor resultado en playoffs: ${playoffResultLabel(r.deepest, lang)}.`);
  } else if (r.rows.length) {
    out.push(zh ? "从未进入季后赛。" : "Nunca llegó a los playoffs.");
  }
  return out;
}

/** Final narrative. Each sentence states only recorded facts; a missing fact drops its sentence. */
export function narrativeOf(r: LegacyReport, lang: Lang): string[] {
  if (lang === "es" || lang === "zh") return narrativeEsZh(r, lang);
  const out: string[] = [];
  const role = r.roleCode ? roleLabel(r.roleCode, lang) : roleLabel(r.roleLabel, lang);
  const nation = r.nationality ? nationLabel(r.nationality, lang) : null;
  if (lang === "en") {
    const who = nation ? `${r.name}, ${/^[AEIOU]/i.test(role) ? "an" : "a"} ${role.toLowerCase()} from ${nation === "United States" ? "the United States" : nation}` : `${r.name}, ${/^[AEIOU]/i.test(role) ? "an" : "a"} ${role.toLowerCase()}`;
    out.push(r.draftPick
      ? `${who}, went ${ordinalEn(r.draftPick)} overall${r.draftTeam ? ` to ${theTeam(r.draftTeam, lang)}` : ""}.`
      : `${who}.`);
  } else {
    const who = nation ? `${r.name}, ${role.toLowerCase()} (${nation})` : `${r.name}, ${role.toLowerCase()}`;
    out.push(r.draftPick
      ? `${who}, scelto con la ${r.draftPick}ª chiamata al draft${r.draftTeam ? ` ${italianTeamPreposition(r.draftTeam,"da")}` : ""}.`
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
      : `La stagione migliore è il ${bestRow.yearLabel} ${italianTeamPreposition(bestRow.team,"con")}: ${fmt1(bestRow.ppg, lang)} punti, ${fmt1(bestRow.rpg, lang)} rimbalzi e ${fmt1(bestRow.apg, lang)} assist a partita.`);
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
