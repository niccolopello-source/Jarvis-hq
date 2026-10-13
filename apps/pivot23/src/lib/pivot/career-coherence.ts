/**
 * Read-only checks on a finished career. Nothing here changes the simulation,
 * the official bust label (`careerBust`) or a retirement threshold.
 */
import { careerBust } from "./bust";
import type { PlayerState } from "./types";

/** The choice log stores Italian. English is a render-time translation, not a second pick. */
export const EXTRA_YEAR_PICKS = ["Gioca a 36 anni"] as const;

export interface CareerSlice {
  extraSeason?: boolean;
  potential?: number;
  peakOverall?: number;
  seasonHistory?: { age: number }[];
  history?: { age: number }[];
  choiceLog?: { pick: string }[];
  choices?: { pick: string }[];
  draftPick?: number;
  allStarCount?: number;
}

function rowsOf(c: CareerSlice): { age: number }[] {
  return c.seasonHistory ?? c.history ?? [];
}

function choicesOf(c: CareerSlice): { pick: string }[] {
  return c.choiceLog ?? c.choices ?? [];
}

export function acceptedExtraYear(c: CareerSlice): boolean {
  if (c.extraSeason === true) return true;
  return choicesOf(c).some((choice) => (EXTRA_YEAR_PICKS as readonly string[]).includes(choice.pick));
}

export function playedAge(c: CareerSlice, age: number): boolean {
  return rowsOf(c).some((row) => row.age === age);
}

/**
 * The player accepted «Gioca a 36 anni» and no season row at 36 was recorded.
 * Cause, measured on engine 2.13: aging into that summer can push `injuryDrag`
 * over 2.5, and `isCareerOver` then closes the career before the season is simulated.
 */
export function extraYearVoided(c: CareerSlice): boolean {
  return acceptedExtraYear(c) && !playedAge(c, 36);
}

/** True only on the choice row that promised the season which was never played. */
export function choiceShowsVoidedExtraYear(choice: { pick: string }, career: CareerSlice): boolean {
  return (EXTRA_YEAR_PICKS as readonly string[]).includes(choice.pick) && extraYearVoided(career);
}

export type BustKind = "none" | "opportunity" | "progression";

export interface BustDiagnosis {
  /** Official D-08 option A label. Unchanged. */
  official: boolean;
  /**
   * Among official busts: opportunity if the peak is within 2 points of potential
   * (the player developed, the role did not come); progression if the gap is larger.
   * Careers that are not official busts stay "none" even when the lab rule misses.
   */
  kind: BustKind;
  /** potential − peakOverall. Positive means the peak landed under the potential. */
  gap: number;
  /** Laboratory P1-BUST rule: potential ≥ 85 and peak ≤ potential − 8. Not the card label. */
  labMiss: boolean;
}

/** Diagnostic split. Does not replace `careerBust()`. */
export function bustDiagnosis(s: Pick<PlayerState, "potential" | "peakOverall" | "draftPick" | "allStarCount" | "seasonHistory">): BustDiagnosis {
  const gap = s.potential - s.peakOverall;
  const official = careerBust(s).bust;
  const labMiss = s.potential >= 85 && s.peakOverall <= s.potential - 8;
  const kind: BustKind = !official ? "none" : gap > 2 ? "progression" : "opportunity";
  return { official, kind, gap, labMiss };
}
