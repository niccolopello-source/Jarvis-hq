
import type { TeamTier } from "./types";

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
    awardP: 0.68,
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
    awardP: 0.42,
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
