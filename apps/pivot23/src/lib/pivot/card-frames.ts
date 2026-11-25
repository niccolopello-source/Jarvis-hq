/**
 * Cosmetic frame unlocks for the Career Card. Presentation only.
 * Thresholds follow the published reward table (concept D). They read archived
 * facts already shown on the report and the card, and never touch the engine,
 * RNG, sporting saves or balance.
 */
import type { LegacyReport } from "./legacy-report";

export const FRAME_IDS = ["standard", "bronze-frame", "obsidian", "holo-red", "prisma"] as const;
export type FrameId = (typeof FRAME_IDS)[number];

export type FrameGrade = "common" | "rare" | "epic" | "legendary" | "mythic";
export type FrameFoil = "none" | "holo" | "prism";

export interface FrameFacts {
  seasons: number;
  titles: number;
  mvps: number;
  allLeague: number;
  playoffSeries: boolean;
}

export const EMPTY_FRAME_FACTS: FrameFacts = {
  seasons: 0,
  titles: 0,
  mvps: 0,
  allLeague: 0,
  playoffSeries: false,
};

const ALL_LEAGUE_IDS = ["All-NBA First Team", "All-NBA Second Team", "All-NBA Third Team"] as const;

function awardCount(report: LegacyReport, id: string): number {
  const hit = report.awards.find((row) => row[0] === id);
  return hit ? hit[1] : 0;
}

function asCount(n: unknown): number {
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

/** Facts used to unlock frames. Missing numbers stay at zero; nothing is guessed. */
export function frameFactsOf(report: LegacyReport, cardMvps?: number): FrameFacts {
  return {
    seasons: report.seasons,
    titles: report.titles,
    mvps: Math.max(awardCount(report, "MVP"), asCount(cardMvps)),
    allLeague: ALL_LEAGUE_IDS.reduce((n, id) => n + awardCount(report, id), 0),
    playoffSeries: report.regular.playoffYears > 0,
  };
}

function reachedFrameId(facts: FrameFacts): FrameId {
  if (facts.titles >= 5 || facts.mvps >= 3) return "prisma";
  if (facts.titles >= 3 || facts.mvps >= 1) return "holo-red";
  if (facts.titles >= 1 || facts.allLeague >= 1) return "obsidian";
  if (facts.seasons >= 10 || facts.playoffSeries) return "bronze-frame";
  return "standard";
}

export function highestFrameId(facts: FrameFacts): FrameId {
  return reachedFrameId(facts);
}

/** A reached frame also unlocks every lower one, so the collection has no holes. */
export function isFrameUnlocked(id: FrameId, facts: FrameFacts): boolean {
  return FRAME_IDS.indexOf(id) <= FRAME_IDS.indexOf(reachedFrameId(facts));
}

export function unlockedFrameIds(facts: FrameFacts): FrameId[] {
  return FRAME_IDS.filter((id) => isFrameUnlocked(id, facts));
}

export function isFrameId(id: string | null | undefined): id is FrameId {
  return !!id && (FRAME_IDS as readonly string[]).includes(id);
}

/** Kept preference is used only if this career has already unlocked that frame. */
export function resolveFrameId(preferred: string | null | undefined, facts: FrameFacts): FrameId {
  if (isFrameId(preferred) && isFrameUnlocked(preferred, facts)) return preferred;
  return highestFrameId(facts);
}
