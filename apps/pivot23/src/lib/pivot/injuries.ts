/**
 * P1-INJ (2.17.0 proposal): serious injuries tied to game load, not to a career-year window.
 *
 * Before 2.17.0 the scripted "Un infortunio serio" card sat in a seed window (season 8, or 7–9
 * from 2.12.0): every career got exactly one, always at the same point, always with the same text.
 * From RULES_INJURY_SINCE the card fires when last seasons' load (minutes × games, playoff runs),
 * age (a modifier, not an anchor) and a recent injury make it likely, and it names a body part
 * picked from the same context, never twice the same in one career.
 *
 * Pure functions of seed + finished seasons + earlier injury ids: no RNG draw, so a reload or a
 * later recount gives the same answer, and older careers never reach this code.
 */
import { RULES_INJURY_SINCE, seedHash, versionAtLeast } from "./tuning";
import { diffOf } from "./difficulty";
import { NBA_TEAMS } from "./teams";
import type { PlayerState } from "./types";

const NBA = new Set(NBA_TEAMS.map((t) => t.abbr));

/** First engine version whose careers use load-based injuries (see RULES_INJURY_SINCE). */
export const INJURY_EVENTS_SINCE = RULES_INJURY_SINCE;

export const INJURY_KINDS = ["caviglia", "coscia", "spalla", "ginocchio", "schiena", "piede", "achille"] as const;
export type InjuryKind = (typeof INJURY_KINDS)[number];

/** Games / injury drag multiplier per kind: an ankle sprain is not an Achilles. */
export const INJURY_SEVERITY: Readonly<Record<InjuryKind, number>> = {
  caviglia: 0.7,
  coscia: 0.75,
  spalla: 0.85,
  ginocchio: 1,
  schiena: 1,
  piede: 1.05,
  achille: 1.15,
};

export const INJURY_MAX_PER_CAREER = 2;

export function usesInjuryEvents(career: { engineVersion?: string }): boolean {
  return versionAtLeast(career.engineVersion, INJURY_EVENTS_SINCE);
}

const U32 = 4294967296;

/** Earlier serious injuries of this career (seasons before n), from story ids `injury-<season>[-<kind>]`. */
export function priorInjuries(s: Pick<PlayerState, "usedEventIds">, n: number): { season: number; kind?: InjuryKind }[] {
  const out: { season: number; kind?: InjuryKind }[] = [];
  for (const id of s.usedEventIds) {
    const m = /^injury-(\d+)(?:-([a-z]+))?$/.exec(id);
    if (!m) continue;
    const season = Number(m[1]);
    if (season >= n) continue;
    out.push({ season, kind: (INJURY_KINDS as readonly string[]).includes(m[2] ?? "") ? (m[2] as InjuryKind) : undefined });
  }
  return out;
}

/** Workload of a finished season, 0..~1.15: minutes share × games share (+ playoff games). */
function seasonLoad(row: PlayerState["seasonHistory"][number] | undefined): number {
  if (!row) return 0;
  const games = row.gp > 34 || NBA.has(row.teamAbbr) ? 82 : 34;
  const share = Math.min(1, row.gp / Math.max(games, row.gp));
  const playoffGames = (row.seriesLog ?? []).length * 5.5;
  return (row.min / 36) * share + (playoffGames / 82) * (row.min / 36);
}

/** Probability that season n opens with a serious injury, from finished seasons only. */
export function injuryHazard(s: Pick<PlayerState, "seasonHistory" | "usedEventIds" | "difficulty">, n: number): number {
  if (n < 2) return 0;
  const prev = s.seasonHistory[n - 2];
  if (!prev) return 0;
  const l1 = seasonLoad(prev);
  const l2 = seasonLoad(s.seasonHistory[n - 3]);
  const age = prev.age + 1;
  const prior = priorInjuries(s, n);
  const last = prior.length ? Math.max(...prior.map((p) => p.season)) : -99;
  let h = 0.01 + 0.17 * Math.max(0, l1 - 0.3) + 0.06 * Math.max(0, l2 - 0.3);
  if (age >= 30) h += (age - 29) * 0.007; // age modifies the risk, it does not schedule it
  if (n - last <= 4) h += 0.03; // re-injury after a recent one
  // Harder difficulties hurt more often (sqrt: games lost already scale with d.injury).
  return Math.min(0.32, h * 1.15 * Math.sqrt(diffOf(s).injury));
}

/** The injury that opens season n of a 2.17+ career, or null. Rookie/rival/nation slots win. */
export function loadInjuryAt(s: Pick<PlayerState, "seed" | "seasonHistory" | "usedEventIds" | "role" | "difficulty">, n: number): InjuryKind | null {
  const prior = priorInjuries(s, n);
  if (prior.length >= INJURY_MAX_PER_CAREER) return null;
  const last = prior.length ? Math.max(...prior.map((p) => p.season)) : -99;
  if (n - last < 3) return null;
  const roll = seedHash(seedHash(s.seed, 0x1a00), n) / U32;
  if (roll >= injuryHazard(s, n)) return null;
  return injuryKindFor(s, n, prior.map((p) => p.kind).filter(Boolean) as InjuryKind[]);
}

function injuryKindFor(s: Pick<PlayerState, "seed" | "seasonHistory" | "role">, n: number, used: InjuryKind[]): InjuryKind {
  const prev = s.seasonHistory[n - 2];
  const age = (prev?.age ?? 22) + 1;
  const heavy = seasonLoad(prev) >= 0.8;
  const big = s.role === "C" || s.role === "PF";
  const w: Record<InjuryKind, number> = {
    caviglia: big ? 2 : 3,
    coscia: heavy ? 3 : 2,
    spalla: 1.5,
    ginocchio: 2.5,
    schiena: (big ? 2 : 1) + (age >= 30 ? 1.5 : 0),
    piede: (big ? 2 : 1) + (heavy ? 1 : 0),
    achille: age >= 29 ? 2 : 0.4,
  };
  const pool = INJURY_KINDS.filter((k) => !used.includes(k));
  const total = pool.reduce((t, k) => t + w[k], 0);
  let x = (seedHash(seedHash(s.seed, 0x2b00), n) / U32) * total;
  for (const k of pool) {
    x -= w[k];
    if (x < 0) return k;
  }
  return pool[pool.length - 1]!;
}
