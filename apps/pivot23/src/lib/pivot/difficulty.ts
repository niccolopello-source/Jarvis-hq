
import type { TeamTier } from "./types";
import { OVR_BALANCE_LEGGENDA_POTENTIAL_SHIFT, usesDecisions, usesOvrBalance220 } from "./tuning";
import { ROY_DELTA_V2_SCALE } from "./awards-v2";

export type DifficultyId = "esordio" | "pro" | "allstar" | "leggenda";

export interface DifficultySpec {
  id: DifficultyId;
  label: string;
  tag: string;
  desc: string;
  growth: number;
  injury: number;
  playoff: number;
  impact: number;
  minutes: number;
  potential: number;
  roy: number;
  salary: number;
  verdict: number;
  extension: number;
  awardStat: number;
  awardOvr: number;
  awardWins: number;
  awardP: number;
  /** Added to the player's MVP score only. The field is not moved. */
  mvpHelp: number;
  /** How many of the award-score ranks count as an All-Star. */
  starCut: number;
  /** Added only to the player's ROY score. */
  royDelta: number;
  /** Multiplier on the DPOY counting minimums. Below 1 keeps the award reachable when production is lower. */
  dpoyBar: number;
  /** Added to the player's DPOY score only, so a lower stat environment is not a shutout. */
  dpoyHelp: number;
  /** Pesi FA/mercato. NON usati per la lottery draft (pick 1–60 indipendente). */
  draft: Record<TeamTier, number>;
}

/** Stessi pesi per tutte le difficoltà: la lottery non dipende dal livello. */
const DRAFT_NEUTRAL: Record<TeamTier, number> = { rebuilding: 0.42, mid: 0.38, contender: 0.2 };

export const DIFFICULTIES: DifficultySpec[] = [
  {
    id: "esordio",
    label: "Esordio",
    tag: "Facile",
    desc: "Crescita generosa, infortuni rari, playoff più aperti. Per imparare il mestiere.",
    growth: 1.14,
    injury: 0.55,
    playoff: 0.02,
    impact: 1.05,
    minutes: 1.08,
    potential: 2,
    roy: 1,
    salary: 1.08,
    verdict: 0.86,
    extension: 1.15,
    awardStat: -2,
    awardOvr: -1,
    awardWins: -8,
    awardP: 1.25,
    mvpHelp: 2.5,
    starCut: 8,
    royDelta: 1.1,
    dpoyBar: 1,
    dpoyHelp: 0,
    draft: { ...DRAFT_NEUTRAL },
  },
  {
    id: "pro",
    label: "Pro",
    tag: "Normale",
    desc: "Il bilancio della lega. Niente sconti, niente ostacoli extra.",
    growth: 1,
    injury: 1,
    playoff: 0,
    impact: 1,
    minutes: 1,
    potential: 0,
    roy: 0,
    salary: 1,
    verdict: 1,
    extension: 1,
    awardStat: 0,
    awardOvr: 3,
    awardWins: 0,
    awardP: 1,
    mvpHelp: -0.8,
    starCut: 6,
    royDelta: -0.45,
    dpoyBar: 1,
    dpoyHelp: 0,
    draft: { ...DRAFT_NEUTRAL },
  },
  {
    id: "allstar",
    label: "All-Star",
    tag: "Difficile",
    desc: "Crescita lenta, roster ostili. I premi si guadagnano sul serio.",
    growth: 0.76,
    injury: 1.28,
    playoff: -0.08,
    impact: 0.82,
    minutes: 0.94,
    potential: -3,
    roy: -3,
    salary: 0.92,
    verdict: 1.1,
    extension: 0.72,
    awardStat: 1.4,
    awardOvr: 5,
    awardWins: 4,
    awardP: 0.8,
    mvpHelp: -1.2,
    starCut: 6,
    royDelta: -2.1,
    dpoyBar: 0.78,
    dpoyHelp: 1.8,
    draft: { ...DRAFT_NEUTRAL },
  },
  {
    id: "leggenda",
    label: "Leggenda",
    tag: "Estremo",
    desc: "Infortuni, playoff da guerra. Solo i fenomeni restano in piedi.",
    growth: 0.56,
    injury: 1.58,
    playoff: -0.15,
    impact: 0.68,
    minutes: 0.88,
    potential: -6,
    roy: -5,
    salary: 0.84,
    verdict: 1.2,
    extension: 0.5,
    awardStat: 2.8,
    awardOvr: 7,
    awardWins: 8,
    awardP: 0.62,
    mvpHelp: 4.5,
    starCut: 5,
    royDelta: -2.9,
    dpoyBar: 0.62,
    dpoyHelp: 2.4,
    draft: { ...DRAFT_NEUTRAL },
  },
];

export const DIFF_MAP: Record<DifficultyId, DifficultySpec> = Object.fromEntries(
  DIFFICULTIES.map((d) => [d.id, d]),
) as Record<DifficultyId, DifficultySpec>;

export function diffOf(s: { difficulty?: DifficultyId } | null | undefined): DifficultySpec {
  const id = s?.difficulty && DIFF_MAP[s.difficulty] ? s.difficulty : "pro";
  return DIFF_MAP[id]!;
}

/** Potential shift at career creation. Leggenda careers from OVR_BALANCE_SINCE (2.21.0) use -4;
 *  older careers keep the shipped spec value (-6). Every other difficulty is unchanged. */
export function potentialShiftOf(difficulty: DifficultyId | undefined, engineVersion: string | undefined): number {
  const spec = diffOf({ difficulty });
  if (spec.id === "leggenda" && usesOvrBalance220({ engineVersion })) return OVR_BALANCE_LEGGENDA_POTENTIAL_SHIFT;
  return spec.potential;
}

/** All-Star random-slot weight that careers before DECISIONS_SINCE (2.14 and older) shipped with. */
const LEGACY_AWARD_P: Record<DifficultyId, number> = { esordio: 1.25, pro: 1, allstar: 0.68, leggenda: 0.42 };

/** Award knobs for this career. Careers before 2.15.0 (2.14 and older) keep the curve they shipped with. */
export function awardProfile(s: { difficulty?: DifficultyId; engineVersion?: string } | null | undefined): DifficultySpec {
  const d = diffOf(s);
  if (usesDecisions(s ?? {})) return d;
  const starCut = d.awardOvr >= 6 ? 4 : d.awardOvr >= 4 ? 5 : d.awardOvr < 0 ? 8 : 6;
  return { ...d, awardP: LEGACY_AWARD_P[d.id], royDelta: 0, mvpHelp: -d.awardOvr * 0.8, starCut, dpoyBar: 1, dpoyHelp: 0.05 };
}

/** #83 ROY shift on the awards v2 ROY score (2.16+); 0 for older careers. */
export function royDeltaV2(s: { difficulty?: DifficultyId; engineVersion?: string } | null | undefined): number {
  return awardProfile(s).royDelta * ROY_DELTA_V2_SCALE;
}
