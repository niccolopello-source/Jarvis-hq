import type { AttrKey, Fx, PlayerState } from "../../lib/pivot/types";

/** Readable time before a consequence chip may fade. UI timing only. */
export const DELTA_READABLE_MS = 1400;
export const DELTA_FADE_MS = 500;

/**
 * Season stamp for the HUD. Mirrors the published calendar already used
 * when a season row is written (2026 + season − 1). Display only.
 */
export function calendarLabel(season: number): string {
  const n = Math.max(1, Math.floor(season) || 1);
  const year = 2026 + n - 1;
  return `${year}–${String((year + 1) % 100).padStart(2, "0")}`;
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
