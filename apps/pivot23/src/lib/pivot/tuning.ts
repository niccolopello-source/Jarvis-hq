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
  /** A2 (proposal): from engine RETIRE_SINCE, a serious injury can end a career before 33.
   *  Bars by summer age (the last season played is one year younger): heavier drag ends earlier.
   *  From 33 the shipped rule (2.5) applies unchanged. */
  injuryRetireBars: { 30: 5.0, 31: 3.6, 32: 3.2 } as Readonly<Record<number, number>>,
  /** D-08 option B, on for careers from BUST_SINCE. High ceilings only. Downside only. */
  bustB: { potFloor: 86, choiceRef: 5.0, choiceSlope: 0.04, choiceK: 0.1, devRef: 7, devK: 0.012, cap: 0.1 },
  /** D-08 option B stays off. The high-ceiling drag is in the code; turning it on
   *  (`bust: "choices-b"`) did not create pot≥86 busts and cut award counts. */
  bust: "current" as "current" | "choices" | "events" | "choices-b",
  /** D-09: title spread across simulated worlds. */
  world: "regress" as "current" | "jitter" | "regress",
  /** D-23: DPOY voter fatigue. current = 5.5% per DPOY won, capped at 22% (rule before 2.12.0). */
  dpoyFatigue: "streak" as "current" | "steeper" | "streak",
  /** D-23 streak: fatigue per consecutive DPOY and its cap. Step 0.16 for careers from 2.13.0
   *  (keeps DPOY totals within ~1% of the pre-2.12 rule, max streak <= 5); 0.12 before. */
  dpoyStreakStep: 0.16,
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

/** First engine version whose careers use the D-09 world rule (title spread). */
export const WORLD_SINCE = "2.13.0";

/** Rules that careers created before BALANCE_SINCE (D-11/D-23) or WORLD_SINCE (D-09) keep. */
export const LEGACY_RULES = Object.freeze({ scriptWindows: "fixed", dpoyFatigue: "current", world: "current" } as const);

/** First engine version whose careers use the A2 early-injury retirement bars. */
export const RETIRE_SINCE = "2.14.0";

/** First engine version of the 2.15 rules. Awards v2 (#86) keys its rules on 2.15.0, released
 *  to production on 12 Oct 2026. The #83 engine decisions moved to DECISIONS_SINCE (2.16.0). */
export const RULES_215_SINCE = "2.15.0";

/** Awards v2 (MVP/ROY/DPOY/All-NBA/MIP/6MOY fixes) apply to careers created by 2.15.0 or later. */
export const AWARDS_SINCE = RULES_215_SINCE;

/** First engine version whose careers use the #83 owner decisions: the accepted age-36 season is
 *  played, ROY/MVP/All-Star/DPOY knobs depend on difficulty, D-08 option B wiring. 2.14.0 (#78) and
 *  2.15.0 (#86, awards v2) careers, both already in production, keep their rules exactly. */
export const DECISIONS_SINCE = "2.16.0";

/** First engine version whose careers use D-08 option B (still OFF via TUNING.bust). */
export const BUST_SINCE = DECISIONS_SINCE;

/** #83 decisions: true when this career was created by DECISIONS_SINCE or later. */
export function usesDecisions(career: { engineVersion?: string }): boolean {
  return versionAtLeast(career.engineVersion, DECISIONS_SINCE);
}

/** D-23 step that careers created before WORLD_SINCE (2.13.0) keep. */
export const LEGACY_DPOY_STREAK_STEP = 0.12;

/**
 * major.minor.patch of an engine version, or null when unreadable. Accepts an optional "v", a
 * missing patch ("2.13" = 2.13.0), surrounding spaces, and any pre-release/build suffix
 * ("2.13.0-beta", "2.13.0-rc.1+abc"). A pre-release counts as its release: the game ships
 * betas, and a "2.13.0-beta" career must play by the 2.13.0 rules.
 */
export function versionCore(v: unknown): [number, number, number] | null {
  if (typeof v !== "string") return null;
  const m = /^v?(\d+)\.(\d+)(?:\.(\d+))?(?:[-+][0-9A-Za-z.+-]*)?$/.exec(v.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)] : null;
}

/** True when `version` is `since` or later. A missing or unreadable version counts as older. */
export function versionAtLeast(version: unknown, since: string): boolean {
  const a = versionCore(version);
  const b = versionCore(since);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i]! > b[i]!;
  return true;
}

/** True when a career was created by BALANCE_SINCE or later. */
export function usesBalance(career: { engineVersion?: string }): boolean {
  return versionAtLeast(career.engineVersion, BALANCE_SINCE);
}

export function scriptWindowsOf(career: { engineVersion?: string }): Tuning["scriptWindows"] {
  return usesBalance(career) ? TUNING.scriptWindows : LEGACY_RULES.scriptWindows;
}

export function dpoyFatigueOf(career: { engineVersion?: string }): Tuning["dpoyFatigue"] {
  return usesBalance(career) ? TUNING.dpoyFatigue : LEGACY_RULES.dpoyFatigue;
}

/** D-09: the title-spread rule this career plays by. */
export function worldOf(career: { engineVersion?: string }): Tuning["world"] {
  return versionAtLeast(career.engineVersion, WORLD_SINCE) ? TUNING.world : LEGACY_RULES.world;
}

/** D-23: fatigue per consecutive DPOY for this career. */
export function dpoyStreakStepOf(career: { engineVersion?: string }): number {
  return versionAtLeast(career.engineVersion, WORLD_SINCE) ? TUNING.dpoyStreakStep : LEGACY_DPOY_STREAK_STEP;
}

/** A2: true when this career may retire from injury before 33 (created by RETIRE_SINCE or later). */
export function usesRetireSpread(career: { engineVersion?: string }): boolean {
  return versionAtLeast(career.engineVersion, RETIRE_SINCE);
}

/** D-08 option B: true when this career was created by BUST_SINCE or later. */
export function usesBustB(career: { engineVersion?: string }): boolean {
  return versionAtLeast(career.engineVersion, BUST_SINCE);
}

/** Awards v2: true when this career was created by AWARDS_SINCE (2.15.0) or later. */
export function usesAwardsV2(career: { engineVersion?: string }): boolean {
  return versionAtLeast(career.engineVersion, AWARDS_SINCE);
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
