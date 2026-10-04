/**
 * Headless career lab. Reuses playCareerSim; does not fork progression.
 * No React, DOM, timers, or network. Same seed and options must hash equal.
 */
import { createHash } from "node:crypto";
import { playCareerSim } from "./engine.ts";
import { careerEndAge } from "./peak.ts";
import type { PlayerState, Role } from "./types.ts";

export const LAB_ENGINE = "playCareerSim@shipped";

/** Operational definitions used by this lab. Not balance targets. */
export const DEFINITIONS = {
  bust: "potential >= 85 and peakOverall <= potential - 8",
  superstar: "peakOverall >= 90",
  peakOvr: "PlayerState.peakOverall",
  peakAge: "PlayerState.apexAge",
  tpr: "peakOverall / potential",
  netGrowth: "peakOverall - first season overall",
} as const;

const ROLES = ["PG", "SG", "SF", "PF", "C"] as const;
const PATHS = ["NCAA", "Europa", "G-League"] as const;

export interface LabOpts {
  seed: number;
  role: Role;
  path?: (typeof PATHS)[number];
  difficulty?: "esordio" | "pro" | "allstar" | "leggenda";
  potential?: number;
}

export function labOpts(partial: LabOpts) {
  return {
    name: "Lab",
    role: partial.role,
    nationality: "ITA",
    number: 23,
    difficulty: partial.difficulty ?? "pro",
    path: partial.path ?? "NCAA",
    seed: partial.seed,
    draft: "random" as const,
    ...(partial.potential != null ? { potential: partial.potential } : {}),
  };
}

export function careerFingerprint(s: PlayerState): string {
  const payload = JSON.stringify({
    seed: s.seed,
    role: s.role,
    path: s.originPath,
    potential: s.potential,
    peak: s.peakOverall,
    apex: s.apexAge,
    endAge: careerEndAge(s),
    mvp: s.mvpCount,
    titles: s.titleCount,
    events: s.usedEventIds,
    choices: s.choiceLog,
    seasons: s.seasonHistory.map((r) => [
      r.season, r.age, r.overall, r.gp, r.min, r.ppg, r.rpg, r.apg, r.teamAbbr, r.wins, r.losses, r.awards, r.playoff,
    ]),
  });
  return createHash("sha256").update(payload).digest("hex");
}

export function integrityIssues(s: PlayerState): string[] {
  const issues: string[] = [];
  const core = [s.potential, s.peakOverall, s.overall, s.age, s.apexAge];
  if (core.some((n) => !Number.isFinite(n))) issues.push("non-finite core");
  if (s.apexAge < 26 || s.apexAge > 28) issues.push(`apexAge ${s.apexAge}`);
  if (s.seasonHistory.length === 0) issues.push("no seasons");
  const ids = new Set<number>();
  for (const r of s.seasonHistory) {
    if (ids.has(r.season)) issues.push(`duplicate season ${r.season}`);
    ids.add(r.season);
    const stats = [r.overall, r.gp, r.min, r.ppg, r.rpg, r.apg, r.wins, r.losses];
    if (stats.some((n) => !Number.isFinite(n))) issues.push(`non-finite season ${r.season}`);
    if (r.gp < 0 || r.gp > 90) issues.push(`gp ${r.season}=${r.gp}`);
    if (r.ppg < 0 || r.rpg < 0 || r.apg < 0) issues.push(`negative box ${r.season}`);
  }
  return issues;
}

export function isBust(s: PlayerState): boolean {
  return s.potential >= 85 && s.peakOverall <= s.potential - 8;
}

export function isSuperstar(s: PlayerState): boolean {
  return s.peakOverall >= 90;
}

export function realization(s: PlayerState): number {
  return s.potential > 0 ? s.peakOverall / s.potential : 0;
}

export interface PairResult {
  seed: number;
  role: Role;
  match: boolean;
  hash: string;
  issues: string[];
  peak: number;
  potential: number;
  endAge: number;
  bust: boolean;
  superstar: boolean;
  tpr: number;
}

export function runPair(opts: LabOpts): PairResult {
  const input = labOpts(opts);
  const a = playCareerSim(input);
  const b = playCareerSim(input);
  const hash = careerFingerprint(a);
  return {
    seed: opts.seed,
    role: opts.role,
    match: hash === careerFingerprint(b),
    hash,
    issues: integrityIssues(a),
    peak: a.peakOverall,
    potential: a.potential,
    endAge: careerEndAge(a),
    bust: isBust(a),
    superstar: isSuperstar(a),
    tpr: realization(a),
  };
}

export interface RoleLine {
  role: Role;
  n: number;
  ppg: number;
  rpg: number;
  apg: number;
}

/** Same seeds, role is the only cycled input. Descriptive, not a tuning pass. */
export function roleBoxScore(seeds: number[]): RoleLine[] {
  const buckets = new Map<Role, { n: number; ppg: number; rpg: number; apg: number }>();
  for (const role of ROLES) buckets.set(role, { n: 0, ppg: 0, rpg: 0, apg: 0 });
  seeds.forEach((seed, i) => {
    const role = ROLES[i % ROLES.length];
    const s = playCareerSim(labOpts({ seed, role, path: PATHS[i % PATHS.length] }));
    const b = buckets.get(role)!;
    const rows = s.seasonHistory;
    if (rows.length === 0) return;
    b.n += 1;
    b.ppg += rows.reduce((a, r) => a + r.ppg, 0) / rows.length;
    b.rpg += rows.reduce((a, r) => a + r.rpg, 0) / rows.length;
    b.apg += rows.reduce((a, r) => a + r.apg, 0) / rows.length;
  });
  return ROLES.map((role) => {
    const b = buckets.get(role)!;
    const n = b.n || 1;
    return {
      role,
      n: b.n,
      ppg: Math.round((b.ppg / n) * 10) / 10,
      rpg: Math.round((b.rpg / n) * 10) / 10,
      apg: Math.round((b.apg / n) * 10) / 10,
    };
  });
}

export function sampleSeeds(count: number, base = 23000): number[] {
  return Array.from({ length: count }, (_, i) => base + i * 17);
}
