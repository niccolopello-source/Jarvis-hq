/**
 * Display labels by stable code. The engine and saved careers keep their Italian ids
 * (role codes, nationality ids, attribute keys, stored playoff strings); only the screen
 * changes with the language. No saved data is rewritten.
 */
import { ATTR_LABELS, HIDDEN_LABELS, ROLES, NBA_TEAMS, EURO_TEAMS } from "./data";
import { byLang, type Lang } from "./i18n";
import type { AttrKey, HiddenKey, Role } from "./types";

type UiLang = Lang;

const ROLE_EN: Record<Role, string> = {
  PG: "Point guard",
  SG: "Shooting guard",
  SF: "Small forward",
  PF: "Power forward",
  C: "Center",
};

/* Spanish and Chinese labels (2026-11-09, not reviewed by native speakers). */
const ROLE_ES: Record<Role, string> = {
  PG: "Base",
  SG: "Escolta",
  SF: "Alero",
  PF: "Ala-pívot",
  C: "Pívot",
};
const ROLE_ZH: Record<Role, string> = {
  PG: "控球后卫",
  SG: "得分后卫",
  SF: "小前锋",
  PF: "大前锋",
  C: "中锋",
};

export function roleLabel(role: Role | string, lang: UiLang): string {
  const oldLabels: Record<string,Role> = { playmaker:"PG",guardia:"SG","guardia tiratrice":"SG","ala piccola":"SF","ala grande":"PF",centro:"C" };
  const r = (oldLabels[role.toLowerCase()] ?? role) as Role;
  if (lang === "en") return ROLE_EN[r] ?? String(role);
  if (lang === "es") return ROLE_ES[r] ?? ROLE_EN[r] ?? String(role);
  if (lang === "zh") return ROLE_ZH[r] ?? ROLE_EN[r] ?? String(role);
  if (r === "SG") return "Guardia tiratrice";
  return ROLES[r]?.label ?? String(role);
}

const NATION_EN: Record<string, string> = {
  Italia: "Italy",
  Spagna: "Spain",
  Francia: "France",
  Serbia: "Serbia",
  Grecia: "Greece",
  Lituania: "Lithuania",
  Germania: "Germany",
  Slovenia: "Slovenia",
  Croazia: "Croatia",
  Turchia: "Turkey",
  Lettonia: "Latvia",
  Georgia: "Georgia",
  USA: "United States",
  Canada: "Canada",
  Brasile: "Brazil",
  Argentina: "Argentina",
  Australia: "Australia",
  Nigeria: "Nigeria",
};

const NATION_ES: Record<string, string> = {
  Italia: "Italia", Spagna: "España", Francia: "Francia", Serbia: "Serbia", Grecia: "Grecia", Lituania: "Lituania",
  Germania: "Alemania", Slovenia: "Eslovenia", Croazia: "Croacia", Turchia: "Turquía", Lettonia: "Letonia", Georgia: "Georgia",
  USA: "Estados Unidos", Canada: "Canadá", Brasile: "Brasil", Argentina: "Argentina", Australia: "Australia", Nigeria: "Nigeria",
};
const NATION_ZH: Record<string, string> = {
  Italia: "意大利", Spagna: "西班牙", Francia: "法国", Serbia: "塞尔维亚", Grecia: "希腊", Lituania: "立陶宛",
  Germania: "德国", Slovenia: "斯洛文尼亚", Croazia: "克罗地亚", Turchia: "土耳其", Lettonia: "拉脱维亚", Georgia: "格鲁吉亚",
  USA: "美国", Canada: "加拿大", Brasile: "巴西", Argentina: "阿根廷", Australia: "澳大利亚", Nigeria: "尼日利亚",
};

export function nationLabel(id: string, lang: UiLang): string {
  const codes: Record<string,string> = { ITA:"Italia", ESP:"Spagna", FRA:"Francia", SRB:"Serbia", GRE:"Grecia", LTU:"Lituania", GER:"Germania", SLO:"Slovenia", CRO:"Croazia", TUR:"Turchia", LAT:"Lettonia", GEO:"Georgia", CAN:"Canada", BRA:"Brasile", ARG:"Argentina", AUS:"Australia", NGR:"Nigeria" };
  const name = codes[id] ?? id;
  if (lang === "es") return NATION_ES[name] ?? NATION_EN[name] ?? name;
  if (lang === "zh") return NATION_ZH[name] ?? NATION_EN[name] ?? name;
  return lang === "en" ? NATION_EN[name] ?? name : name === "USA" ? "Stati Uniti" : name;
}

const ATTR_EN: Record<AttrKey, string> = {
  shooting: "Shooting",
  handle: "Ball handling",
  passing: "Passing",
  defense: "Defense",
  rebounding: "Rebounding",
  athleticism: "Athleticism",
  strength: "Strength",
  iq: "Basketball IQ",
};

const ATTR_ES: Record<AttrKey, string> = {
  shooting: "Tiro",
  handle: "Manejo de balón",
  passing: "Pase",
  defense: "Defensa",
  rebounding: "Rebote",
  athleticism: "Atletismo",
  strength: "Fuerza",
  iq: "Inteligencia de juego",
};
const ATTR_ZH: Record<AttrKey, string> = {
  shooting: "投篮",
  handle: "控球",
  passing: "传球",
  defense: "防守",
  rebounding: "篮板",
  athleticism: "运动能力",
  strength: "力量",
  iq: "篮球智商",
};

export function attrLabel(key: AttrKey, lang: UiLang): string {
  return attrLabels(lang)[key];
}

/**
 * Consequence chip ("+2 Tiro", "-1 Morale") in the reader's language. Chips are built once with
 * the Italian attribute names; the number stays, the label follows the language.
 */
export function chipLabel(chip: string, lang: UiLang): string {
  const m = /^([+-]?\d+) (.+)$/.exec(chip);
  if (!m) return chip;
  const key = (Object.keys(ATTR_LABELS) as AttrKey[]).find((k) => ATTR_LABELS[k] === m[2] || ATTR_EN[k] === m[2] || ATTR_ES[k] === m[2] || ATTR_ZH[k] === m[2]);
  return key ? `${m[1]} ${attrLabel(key, lang)}` : chip;
}

export function attrLabels(lang: UiLang): Record<AttrKey, string> {
  return byLang(lang, { it: ATTR_LABELS, en: ATTR_EN, es: ATTR_ES, zh: ATTR_ZH });
}

const HIDDEN_EN: Record<HiddenKey, string> = {
  clutch: "Clutch",
  durability: "Durability",
  workEthic: "Work ethic",
  ego: "Ego",
  chemistry: "Chemistry",
  consistency: "Consistency",
  motor: "Motor",
  mediaSavvy: "Media savvy",
};

const HIDDEN_ES: Record<HiddenKey, string> = {
  clutch: "Clutch",
  durability: "Resistencia",
  workEthic: "Ética de trabajo",
  ego: "Ego",
  chemistry: "Química",
  consistency: "Regularidad",
  motor: "Motor",
  mediaSavvy: "Trato con los medios",
};
const HIDDEN_ZH: Record<HiddenKey, string> = {
  clutch: "关键时刻",
  durability: "耐久度",
  workEthic: "职业态度",
  ego: "自我",
  chemistry: "化学反应",
  consistency: "稳定性",
  motor: "活力",
  mediaSavvy: "媒体应对",
};

export function hiddenLabel(key: HiddenKey, lang: UiLang): string {
  return byLang<Record<HiddenKey, string>>(lang, { it: HIDDEN_LABELS, en: HIDDEN_EN, es: HIDDEN_ES, zh: HIDDEN_ZH })[key];
}

/** Playoff seed: "7°" in Italian, "#7" in English, "7.º" in Spanish, "第7" in Chinese. */
export function seedLabel(n: number | string, lang: UiLang): string {
  return byLang(lang, { it: `${n}°`, en: `#${n}`, es: `${n}.º`, zh: `第${n}` });
}

export function confLabel(c: string | undefined, lang: UiLang): string {
  if (c === "East") return byLang(lang, { it: "Est", en: "East", es: "Este", zh: "东部" });
  if (c === "West") return byLang(lang, { it: "Ovest", en: "West", es: "Oeste", zh: "西部" });
  if (c === "Euro") return byLang(lang, { it: "Eurolega", en: "EuroLeague", es: "EuroLeague", zh: "欧洲篮球联赛" });
  return "";
}

/** City, division, conference. Drops an empty division and does not print the league twice. */
export function dossierPlace(city: string, div: string, conf: string | undefined, lang: UiLang): string {
  const conference = confLabel(conf, lang);
  const division = div.trim();
  const leagueNamedTwice = conf === "Euro" && /eurolega|euroleague/i.test(division);
  const parts = [city.trim()];
  if (division && !leagueNamedTwice) parts.push(division);
  if (conference && !parts.some((p) => p.localeCompare(conference, "it", { sensitivity: "accent" }) === 0)) {
    parts.push(conference);
  }
  return parts.filter(Boolean).join(" · ");
}

const ROUND_EN: Record<string, string> = {
  "Primo turno": "First round",
  "Semifinali Est/Ovest": "Conference semifinals",
  "Finali Est/Ovest": "Conference finals",
  "Finali NBA": "NBA Finals",
  "Quarti di finale": "Quarterfinals",
  "Semifinale Final Four": "Final Four semifinal",
  "Finale Eurolega": "EuroLeague Final",
  Playoff: "Playoffs",
};

const IT_OUT_ROUND: Readonly<Record<string, string>> = {
  "Primo turno": "al primo turno",
  "Semifinali Est/Ovest": "in semifinale di conference",
  "Finali Est/Ovest": "in finale di conference",
  "Finali NBA": "nelle Finali NBA",
  "Quarti di finale": "ai quarti di finale",
  "Semifinale Final Four": "in semifinale di Final Four",
  "Finale Eurolega": "in finale di Eurolega",
  Playoff: "ai playoff",
};

const ROUND_ES: Record<string, string> = {
  "Primo turno": "Primera ronda",
  "Semifinali Est/Ovest": "Semifinales de conferencia",
  "Finali Est/Ovest": "Finales de conferencia",
  "Finali NBA": "Finales de la NBA",
  "Quarti di finale": "Cuartos de final",
  "Semifinale Final Four": "Semifinal de la Final Four",
  "Finale Eurolega": "Final de la EuroLeague",
  Playoff: "Playoffs",
};
const ROUND_ZH: Record<string, string> = {
  "Primo turno": "首轮",
  "Semifinali Est/Ovest": "分区半决赛",
  "Finali Est/Ovest": "分区决赛",
  "Finali NBA": "NBA总决赛",
  "Quarti di finale": "四分之一决赛",
  "Semifinale Final Four": "四强赛半决赛",
  "Finale Eurolega": "欧洲篮球联赛决赛",
  Playoff: "季后赛",
};

/** Playoff round label (engine strings are Italian ids). */
export function roundLabel(label: string, lang: UiLang): string {
  if (lang === "it") return label;
  const table = byLang(lang, { it: ROUND_EN, en: ROUND_EN, es: ROUND_ES, zh: ROUND_ZH });
  return table[label] ?? ROUND_EN[label] ?? label;
}

/**
 * Season playoff outcome as stored in SeasonRow.playoff ("Fuori", "Campione",
 * "Elim. Primo turno 1-4", or a round label). Unknown strings are shown as stored.
 */
export function playoffResultLabel(raw: string | undefined | null, lang: UiLang): string {
  const value = String(raw ?? "");
  if (!value) return value;
  if (lang === "it") {
    // "Elim. Finali Est/Ovest 2-4" -> "Eliminato in finale di conference (2-4)". Stored text unchanged.
    const it = /^Elim\. (.+?) (\d+-\d+)$/.exec(value);
    if (!it) return value;
    const round = IT_OUT_ROUND[it[1]!];
    return round ? `Eliminato ${round} (${it[2]})` : value;
  }
  if (value === "Fuori") return byLang(lang, { it: value, en: "Missed playoffs", es: "Fuera de los playoffs", zh: "未进季后赛" });
  if (value === "Campione") return byLang(lang, { it: value, en: "Champion", es: "Campeón", zh: "总冠军" });
  const m = /^Elim\. (.+?) (\d+-\d+)$/.exec(value);
  if (m) return byLang(lang, { it: value, en: `Out: ${roundLabel(m[1]!, lang)} ${m[2]}`, es: `Eliminado: ${roundLabel(m[1]!, lang)} ${m[2]}`, zh: `${roundLabel(m[1]!, lang)}出局 ${m[2]}` });
  return roundLabel(value, lang);
}

const NOTE_EN: [RegExp, string][] = [
  [/^Il salto di qualità della stagione$/, "The breakout of the season"],
  [/^Da ([\d.]+) a ([\d.]+) punti$/, "From $1 to $2 points"],
  [/Miglior difesa/g, "Best defense"],
  [/Dalla panchina/g, "Off the bench"],
  [/punti subiti/g, "points allowed"],
  [/vittorie difensive/g, "defensive win shares"],
  [/palle rubate/g, "steals"],
  [/stoppate/g, "blocks"],
  [/vittorie/g, "wins"],
  [/minuti/g, "minutes"],
  [/punti/g, "points"],
];

const NOTE_ES: [RegExp, string][] = [
  [/^Il salto di qualità della stagione$/, "El gran salto de la temporada"],
  [/^Da ([\d.]+) a ([\d.]+) punti$/, "De $1 a $2 puntos"],
  [/Miglior difesa/g, "Mejor defensa"],
  [/Dalla panchina/g, "Desde el banquillo"],
  [/punti subiti/g, "puntos encajados"],
  [/vittorie difensive/g, "defensive win shares"],
  [/palle rubate/g, "robos"],
  [/stoppate/g, "tapones"],
  [/vittorie/g, "victorias"],
  [/minuti/g, "minutos"],
  [/punti/g, "puntos"],
];
const NOTE_ZH: [RegExp, string][] = [
  [/^Il salto di qualità della stagione$/, "本赛季最大的进步"],
  [/^Da ([\d.]+) a ([\d.]+) punti$/, "从$1分到$2分"],
  [/^([\d.]+) punti, (\d+) vittorie$/, "$1分，$2胜"],
  [/^([\d.]+) punti, (\d+)-(\d+)$/, "$1分，$2-$3"],
  [/^([\d.]+) minuti, ([\d.]+) punti$/, "$1分钟，$2分"],
  [/^Miglior difesa, ([\d.]+) punti subiti$/, "最佳防守，场均失$1分"],
  [/Miglior difesa/g, "最佳防守"],
  [/Dalla panchina/g, "替补出场"],
  [/([\d.]+) palle rubate/g, "$1次抢断"],
  [/([\d.]+) stoppate/g, "$1次盖帽"],
  [/([\d.]+) vittorie difensive/g, "$1防守胜利贡献值"],
  [/punti subiti/g, "失分"],
  [/vittorie difensive/g, "防守胜利贡献值"],
  [/palle rubate/g, "抢断"],
  [/stoppate/g, "盖帽"],
  [/vittorie/g, "胜"],
  [/minuti/g, "分钟"],
  [/punti/g, "分"],
];

/** League award notes are stored as Italian sentences; other languages swap the known phrases at render. */
export function awardNoteLabel(note: string, lang: UiLang): string {
  const value = String(note || "");
  if (lang === "it") return value;
  const table = byLang(lang, { it: NOTE_EN, en: NOTE_EN, es: NOTE_ES, zh: NOTE_ZH });
  return table.reduce((acc, [re, to]) => acc.replace(re, to), value);
}

/** Articles for known team ids only; unknown historical names are not guessed. */
export function italianTeamPreposition(name: string, prep: "a"|"da"|"con"): string {
  let article: "i"|"gli"|"il"|"lo"|"la"|"l'";
  if (NBA_TEAMS.some(t=>t.name===name)) article=/^[AEIOU]/.test(name)||name==="Houston Rockets"?"gli":"i";
  else if (EURO_TEAMS.some(t=>t.name===name)) {
    article=["Virtus Bologna","Crvena Zvezda"].includes(name)?"la":["EA7 Olimpia Milano","ALBA Berlino","AS Monaco","Anadolu Efes","Olympiacos"].includes(name)?"l'":name==="Zalgiris Kaunas"?"lo":"il";
  } else return `${prep} ${name}`;
  const forms={a:{i:"ai ",gli:"agli ",il:"al ",lo:"allo ",la:"alla ","l'":"all'"},da:{i:"dai ",gli:"dagli ",il:"dal ",lo:"dallo ",la:"dalla ","l'":"dall'"},con:{i:"con i ",gli:"con gli ",il:"con il ",lo:"con lo ",la:"con la ","l'":"con l'"}};
  return forms[prep][article]+name;
}

/** "N seasons played" in Spanish / Chinese (display only). Italian and English stay in PivotApp. */
export function seasonsPlayedLabel(n: number, lang: "es" | "zh"): string {
  if (lang === "zh") return `已打${n}个赛季`;
  return n === 1 ? "1 temporada jugada" : `${n} temporadas jugadas`;
}

/** "N seasons" in Chinese (no space, measure word 个). */
export function seasonCountZh(n: number): string {
  return `${n}个赛季`;
}
