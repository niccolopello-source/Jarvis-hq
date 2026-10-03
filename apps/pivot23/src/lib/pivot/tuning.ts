/**
 * Balance experiments (see docs/pivot23-balance-experiments.md). D-11 (seeded story windows)
 * and D-23 (DPOY streak fatigue) are ON for careers created by engine BALANCE_SINCE or later,
 * pending Pello's final approval. Careers created earlier keep the rules they started with
 * (LEGACY_RULES), so a running save does not change its story calendar or DPOY odds.
 * The other experiments keep the shipped rule; only the offline comparison script changes them.
 *
 * None of these alternatives draws from the RNG stream on its own; seeded variations use
 * seedHash(), so a fixed seed stays deterministic under every setting.
 */
export const TUNING = {
  /** D-11: seasons of the scripted stories. fixed = 1/6/8/10 (rule before 2.12.0). */
  scriptWindows: "seeded" as "fixed" | "seeded" | "seeded-wide",
  /** D-10: when low minutes or injuries end a career. */
  retirement: "current" as "current" | "graded" | "path",
  /** D-08: how much choices and injuries move the realised share of potential. */
  bust: "current" as "current" | "choices" | "events",
  /** D-09: title spread across simulated worlds. */
  world: "current" as "current" | "jitter" | "regress",
  /** D-23: DPOY voter fatigue. current = 5.5% per DPOY won, capped at 22% (rule before 2.12.0). */
  dpoyFatigue: "streak" as "current" | "steeper" | "streak",
  /** D-23 streak: fatigue per consecutive DPOY and its cap (0.12 / 0.36 = values of the experiment). */
  dpoyStreakStep: 0.12,
  dpoyStreakCap: 0.36,
  /** Games needed to win the player DPOY, per competition. Only the NBA awards a player DPOY;
   *  58 is the existing rule (full availability weight at 65, see nbaDpoyScore). */
  dpoyMinGames: { NBA: 58 } as Readonly<Record<string, number>>,
  /** P1-ROLE: role-fit term on the realised peak. */
  rolePeak: "current" as "current" | "fit" | "fit-strong",
};

export type Tuning = typeof TUNING;

export const TUNING_DEFAULTS: Readonly<Tuning> = Object.freeze({ ...TUNING });

/** First engine version whose careers use the D-11/D-23 rules above. */
export const BALANCE_SINCE = "2.12.0";

/** Rules that careers created before BALANCE_SINCE keep. */
export const LEGACY_RULES = Object.freeze({ scriptWindows: "fixed", dpoyFatigue: "current" } as const);

function versionParts(v: string): number[] {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
}

/** True when a career was created by BALANCE_SINCE or later. A missing or unreadable version counts as older. */
export function usesBalance(career: { engineVersion?: string }): boolean {
  const a = versionParts(typeof career.engineVersion === "string" ? career.engineVersion : "");
  const b = versionParts(BALANCE_SINCE);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i]! > b[i]!;
  return true;
}

export function scriptWindowsOf(career: { engineVersion?: string }): Tuning["scriptWindows"] {
  return usesBalance(career) ? TUNING.scriptWindows : LEGACY_RULES.scriptWindows;
}

export function dpoyFatigueOf(career: { engineVersion?: string }): Tuning["dpoyFatigue"] {
  return usesBalance(career) ? TUNING.dpoyFatigue : LEGACY_RULES.dpoyFatigue;
}

/** Restores shipped behaviour (used by tests and the comparison script). */
export function resetTuning() {
  Object.assign(TUNING, TUNING_DEFAULTS);
}

/** Small deterministic hash of the career seed and a salt. Never touches the RNG. */
export function seedHash(seed: number, salt: number): number {
  let h = (Math.imul((seed | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(salt + 1, 0xc2b2ae35)) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d) >>> 0;
  h ^= h >>> 15;
  return h >>> 0;
}

export type ScriptSlot = "rookie" | "rival" | "injury" | "nation";

/** Which scripted story, if any, belongs to season n of this career. */
export function scriptSlotFor(seed: number, n: number, mode: Tuning["scriptWindows"] = TUNING.scriptWindows): ScriptSlot | null {
  if (n === 1) return "rookie";
  if (mode === "fixed") {
    if (n === 6) return "rival";
    if (n === 8) return "injury";
    if (n === 10) return "nation";
    return null;
  }
  const wide = mode === "seeded-wide";
  const rival = (wide ? 4 : 5) + (seedHash(seed, 1) % (wide ? 5 : 3));
  const injuryBase = (wide ? 6 : 7) + (seedHash(seed, 2) % (wide ? 5 : 3));
  const injury = Math.max(rival + 1, injuryBase);
  const nationBase = 9 + (seedHash(seed, 3) % (wide ? 4 : 3));
  const nation = Math.max(injury + 1, nationBase);
  if (n === rival) return "rival";
  if (n === injury) return "injury";
  if (n === nation) return "nation";
  return null;
}
