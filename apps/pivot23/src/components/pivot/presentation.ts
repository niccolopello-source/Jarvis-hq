import { EURO_ROUNDS, NBA_ROUNDS } from "../../lib/pivot/data";
import type { Lang } from "../../lib/pivot/i18n";
import type { AttrKey, Fx, PlayerState } from "../../lib/pivot/types";

/** First simulated season is shown as this calendar year. Display only. */
export const UI_SEASON_ORIGIN = 2026;

/** Full-opacity time before a consequence chip starts to fade. */
export const DELTA_READABLE_MS = 1200;
export const DELTA_FADE_MS = 400;

const LOCALES: Record<Lang, string> = {
  it: "it-IT",
  en: "en-US",
  es: "es-ES",
};

/**
 * Calendar label for a simulated season index.
 * Index 1 is the opening season. Values below 1 stay on that opening season.
 */
export function getSeasonDisplayLabel(simulatedSeasonIndex: number): string {
  const raw = Number.isFinite(simulatedSeasonIndex) ? Math.floor(simulatedSeasonIndex) : 1;
  const season = Math.max(1, raw);
  const year = UI_SEASON_ORIGIN + season - 1;
  const end = String((year + 1) % 100).padStart(2, "0");
  return `${year}-${end}`;
}

export function calendarLabel(season: number): string {
  return getSeasonDisplayLabel(season);
}

export function consequenceSchedule(now = 0) {
  return {
    fadeStartsAt: now + DELTA_READABLE_MS,
    removeAt: now + DELTA_READABLE_MS + DELTA_FADE_MS,
  };
}

/** Championship rounds only. Matched by exact supported round value, not by substring. */
export const NBA_FINALS_LABEL = NBA_ROUNDS.find((label) => label === "Finali NBA") ?? "";
export const EUROLEAGUE_FINALS_LABEL = EURO_ROUNDS.find((label) => label === "Finale Eurolega") ?? "";

export function isGenuineFinalsRound(label: string): boolean {
  return label.length > 0 && (label === NBA_FINALS_LABEL || label === EUROLEAGUE_FINALS_LABEL);
}

/** Finals and MVP surfaces only. Not a rarity model. */
export function isHighStakesPresentation(input: { roundLabel?: string; title?: string; awards?: string[] }): boolean {
  if (input.roundLabel && isGenuineFinalsRound(input.roundLabel)) return true;
  if (mentionsMvp(input.title ?? "")) return true;
  return (input.awards ?? []).some((award) => mentionsMvp(award));
}

function mentionsMvp(value: string) {
  return value === "MVP" || value === "FMVP" || /\bMVP\b/i.test(value);
}

export function seasonCountLabel(count: number, lang: Lang = "it"): string {
  const n = Math.max(0, Math.round(count));
  const word = lang === "en"
    ? (n === 1 ? "season" : "seasons")
    : lang === "es"
      ? (n === 1 ? "temporada" : "temporadas")
      : (n === 1 ? "stagione" : "stagioni");
  return `${n} ${word}`;
}

export function formatCareerTotal(value: number, lang: Lang): string {
  const locale = LOCALES[lang] ?? LOCALES.it;
  const rounded = Math.round(value);
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  if (format.format(1000) !== "1000") return format.format(rounded);
  const separator = lang === "en" ? "," : ".";
  const sign = rounded < 0 ? "-" : "";
  const digits = String(Math.abs(rounded));
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

function pushChip(chips: string[], delta: number, label: string) {
  const shown = Math.round(delta);
  if (!shown) return;
  chips.push(`${shown > 0 ? "+" : ""}${shown} ${label}`);
}

/** Public consequence chips. Hidden ratings and formulas stay off the card. */
export function chipsFromFx(fx: Pick<Fx, "attrs" | "morale">, labels: Record<AttrKey, string>): string[] {
  const chips: string[] = [];
  if (fx.attrs) {
    for (const key of Object.keys(labels) as AttrKey[]) {
      const delta = fx.attrs[key];
      if (delta) pushChip(chips, delta, labels[key]);
    }
  }
  if (fx.morale) pushChip(chips, fx.morale, "Morale");
  return chips.slice(0, 3);
}

export function chipsFromSnapshot(
  before: Pick<PlayerState, "attrs" | "morale" | "overall">,
  after: Pick<PlayerState, "attrs" | "morale" | "overall">,
  labels: Record<AttrKey, string>,
): string[] {
  const chips: string[] = [];
  for (const key of Object.keys(labels) as AttrKey[]) {
    pushChip(chips, after.attrs[key] - before.attrs[key], labels[key]);
  }
  pushChip(chips, after.morale - before.morale, "Morale");
  if (!chips.length) pushChip(chips, after.overall - before.overall, "Overall");
  return chips.slice(0, 3);
}

/** Closes a fragment that may be a bare label ("Tre settimane di mestiere, già fatte") with a full stop. */
export function endSentence(text: string): string {
  const t = text.trim();
  return !t || /[.!?…:]$/.test(t) ? t : `${t}.`;
}

/**
 * Joins narrative fragments without doubled punctuation ("è tuo.. Overall"), stray spaces
 * before punctuation, or double spaces. Ellipses ("…" or "...") are kept.
 */
export function tidyText(text: string): string {
  return text
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/([!?…])\.(?!\.)/g, "$1")
    .replace(/(^|[^.])\.\.(?!\.)/g, "$1.")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
