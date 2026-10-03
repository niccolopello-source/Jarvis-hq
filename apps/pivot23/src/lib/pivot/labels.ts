/**
 * Display labels by stable code. The engine and saved careers keep their Italian ids
 * (role codes, nationality ids, attribute keys, stored playoff strings); only the screen
 * changes with the language. No saved data is rewritten.
 */
import { ATTR_LABELS, HIDDEN_LABELS, ROLES } from "./data";
import type { Lang } from "./i18n";
import type { AttrKey, HiddenKey, Role } from "./types";

type UiLang = Lang;

const ROLE_EN: Record<Role, string> = {
  PG: "Point guard",
  SG: "Shooting guard",
  SF: "Small forward",
  PF: "Power forward",
  C: "Center",
};

export function roleLabel(role: Role | string, lang: UiLang): string {
  const r = role as Role;
  if (lang === "en") return ROLE_EN[r] ?? String(role);
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
  USA: "USA",
  Canada: "Canada",
  Brasile: "Brazil",
  Argentina: "Argentina",
  Australia: "Australia",
  Nigeria: "Nigeria",
};

export function nationLabel(id: string, lang: UiLang): string {
  return lang === "en" ? NATION_EN[id] ?? id : id;
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

export function attrLabel(key: AttrKey, lang: UiLang): string {
  return lang === "en" ? ATTR_EN[key] : ATTR_LABELS[key];
}

export function attrLabels(lang: UiLang): Record<AttrKey, string> {
  return lang === "en" ? ATTR_EN : ATTR_LABELS;
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

export function hiddenLabel(key: HiddenKey, lang: UiLang): string {
  return lang === "en" ? HIDDEN_EN[key] : HIDDEN_LABELS[key];
}

export function confLabel(c: string | undefined, lang: UiLang): string {
  if (c === "East") return lang === "en" ? "East" : "Est";
  if (c === "West") return lang === "en" ? "West" : "Ovest";
  if (c === "Euro") return lang === "en" ? "EuroLeague" : "Eurolega";
  return "";
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

/** Playoff round label (engine strings are Italian ids). */
export function roundLabel(label: string, lang: UiLang): string {
  return lang === "en" ? ROUND_EN[label] ?? label : label;
}

/**
 * Season playoff outcome as stored in SeasonRow.playoff ("Fuori", "Campione",
 * "Elim. Primo turno 1-4", or a round label). Unknown strings are shown as stored.
 */
export function playoffResultLabel(raw: string | undefined | null, lang: UiLang): string {
  const value = String(raw ?? "");
  if (lang !== "en" || !value) return value;
  if (value === "Fuori") return "Missed playoffs";
  if (value === "Campione") return "Champion";
  const m = /^Elim\. (.+?) (\d+-\d+)$/.exec(value);
  if (m) return `Out: ${roundLabel(m[1]!, lang)} ${m[2]}`;
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

/** League award notes are stored as Italian sentences; English swaps the known phrases at render. */
export function awardNoteLabel(note: string, lang: UiLang): string {
  const value = String(note || "");
  if (lang !== "en") return value;
  return NOTE_EN.reduce((acc, [re, to]) => acc.replace(re, to), value);
}
