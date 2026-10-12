/**
 * D-08 option A: outcome-only "bust" label, derived from a finished (or running) career.
 * No engine change: reads consolidated career data only, never the RNG.
 *
 * A career is a bust when the NBA expected a lot and never got it back:
 *   - drafted in the first round (pick 1–30), AND
 *   - never an All-Star, AND
 *   - at most BUST_MAX_STARTER_SEASONS NBA seasons as a starter (>= 28 min and >= 50 GP).
 * Measured on 1,200 careers (300 per difficulty, seeds 100000/200000/300000/400000+): 14.3%
 * (Esordio 9.7, Pro 12.0, All-Star 18.7, Leggenda 16.7). See docs/pivot23/D-08-BUST-CRITERION.md.
 */
import { NBA_TEAMS } from "./teams";
import type { PlayerState } from "./types";

export const BUST_MAX_PICK = 30;
export const BUST_MAX_STARTER_SEASONS = 1;
export const STARTER_MIN = 28;
export const STARTER_GP = 50;

const NBA = new Set(NBA_TEAMS.map((t) => t.abbr));

export interface BustVerdict {
  bust: boolean;
  draftPick: number;
  allStarCount: number;
  starterSeasons: number;
}

type BustInput = Pick<PlayerState, "draftPick" | "allStarCount" | "seasonHistory">;

export function starterSeasons(s: Pick<PlayerState, "seasonHistory">): number {
  return s.seasonHistory.filter((r) => NBA.has(r.teamAbbr) && r.min >= STARTER_MIN && r.gp >= STARTER_GP).length;
}

export function careerBust(s: BustInput): BustVerdict {
  const draftPick = Number.isFinite(s.draftPick) ? s.draftPick : 0;
  const allStarCount = Number.isFinite(s.allStarCount) ? s.allStarCount : 0;
  const starters = starterSeasons(s);
  const bust = draftPick >= 1 && draftPick <= BUST_MAX_PICK && allStarCount === 0 && starters <= BUST_MAX_STARTER_SEASONS;
  return { bust, draftPick, allStarCount, starterSeasons: starters };
}
