import type { DifficultyId } from "./types";
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
  /** D-08 option B (proposal, OFF: turn on with bust = "choices-b"): for careers from engine BUST_B81_SINCE (2.18.0), a career whose choices and training lag
   *  behind the typical path realises less of its potential. Downside only: choices above the
   *  reference never add. Reference points are the median imprint/development of pot >= 80 careers
   *  at their apex (G4 sample: choiceOvr 4.07, development 6.5). */
  bustB81: { choiceRef: 4.0, choiceK: 0.12, devRef: 6.0, devK: 0.04 },
  /** A2 (proposal): from engine RETIRE_SINCE, a serious injury can end a career before 33.
   *  Bars by summer age (the last season played is one year younger): heavier drag ends earlier.
   *  From 33 the shipped rule (2.5) applies unchanged. */
  injuryRetireBars: { 30: 5.0, 31: 3.6, 32: 3.2 } as Readonly<Record<number, number>>,
  /** P1-INJ recalibration (careers from RULES_INJURY_SINCE, 2.19.0), per difficulty: load-based injuries
   *  spread the drag differently, so the A2 bars above let only ~190/1000 careers close at 29-32 (2.18: 336).
   *  These bars replace them for 2.19+ careers only. Owner targets (Pello, 2026-10-13), last season at 29-32
   *  per 1000 careers: Esordio <= 20; Pro, All-Star, Leggenda 300-340. A key 33 overrides the shipped 2.5 bar. */
  injuryRetireBars219: {
    // Esordio keeps the A2 bars and lifts the summer-33 bar (shipped 2.5) so load injuries do not
    // close Esordio careers at 32 (owner target: <= 20/1000 at 29-32).
    esordio: { 30: 5.0, 31: 3.6, 32: 3.2, 33: 3.5 },
    pro: { 30: 3.6, 31: 2.8, 32: 1.9 },
    allstar: { 30: 3.6, 31: 2.0, 32: 1.7 },
    // Leggenda is at saturation: lower bars no longer add 29-32 exits.
    leggenda: { 30: 3.6, 31: 2.0, 32: 1.0 },
  } as Readonly<Record<DifficultyId, Readonly<Record<number, number>>>>,
  /** Leggenda early exits (careers from LEGEND_RETIRE_SINCE, 2.20.0), Leggenda only. On 2.19 the injury bars
   *  are saturated for Leggenda: every career still playing at 29-32 carries injuryDrag 0, so no injury bar
   *  can add exits (280/1000 on seeds 900000-900999, 319/1000 on the stats-test seeds 91000+13i; owner
   *  target 300-340). A fading role closes the career instead: it ends when the minutes per game of the last
   *  season are at or below the bar for the age checked. The check runs after the season (age = last season)
   *  and again after the summer ageing (age = last season + 1), like the injury bars; in practice keys 31 and
   *  32 close careers at 31 and 32. Calibrated on both seed sets pooled (2000 careers), aiming at the middle
   *  of the band. Only ages below 33: from 33 the shipped 11.5 minutes bar applies unchanged. */
  minutesRetireBars220: {
    leggenda: { 31: 13.1, 32: 11.9 },
  } as Readonly<Partial<Record<DifficultyId, Readonly<Record<number, number>>>>>,
  /** Option A1 (Pello, 21 Oct 2026): injury bars for careers created on 2.21.0+ (OVR_BALANCE_SINCE), with OVR
   *  balance and procedural depth on. Same as injuryRetireBars219 except the age-32 bar: Pro 1.9 -> 1.8,
   *  All-Star 1.7 -> 1.8. Keeps last season at 29-32 in the owner bands (report options-221.md). */
  injuryRetireBars221: {
    esordio: { 30: 5.0, 31: 3.6, 32: 3.2, 33: 3.5 },
    pro: { 30: 3.6, 31: 2.8, 32: 1.8 },
    allstar: { 30: 3.6, 31: 2.0, 32: 1.8 },
    leggenda: { 30: 3.6, 31: 2.0, 32: 1.0 },
  } as Readonly<Record<DifficultyId, Readonly<Record<number, number>>>>,
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

/** OVR balance (engine owner: grokbot, per Pello 2026-10-21; audit reports/ovr-audit-1019): careers
 *  created by 2.21.0 or later get the Leggenda potential shift -4 (was -6) and the twilight base wear 11.4
 *  (was 15.4, "decline option B"). Careers created on 2.20 or earlier keep -6 and 15.4 exactly.
 *  2.21.0 and not 2.20.0 because #112 (LEGEND_RETIRE_SINCE 2.20.0) shipped to production on 21 Oct 2026, so
 *  live 2.20.0-beta careers exist and must not change. PR #114 (depth) can share this gate. */
export const OVR_BALANCE_SINCE = "2.21.0";
export const LEGACY_LEGGENDA_POTENTIAL_SHIFT = -6;
export const OVR_BALANCE_LEGGENDA_POTENTIAL_SHIFT = -4;
export const LEGACY_TWILIGHT_BASE_WEAR = 15.4;
export const OVR_BALANCE_TWILIGHT_BASE_WEAR = 11.4;

/** True when this career was created by OVR_BALANCE_SINCE (2.21.0) or later. */
export function usesOvrBalance220(career: { engineVersion?: string }): boolean {
  return versionAtLeast(career.engineVersion, OVR_BALANCE_SINCE);
}

/** Base wear of twilightOf for this career. */
export function twilightBaseWearOf(career: { engineVersion?: string }): number {
  return usesOvrBalance220(career) ? OVR_BALANCE_TWILIGHT_BASE_WEAR : LEGACY_TWILIGHT_BASE_WEAR;
}

/** First engine version whose careers use D-08 option B (still OFF via TUNING.bust). */
export const BUST_SINCE = DECISIONS_SINCE;

/** #83 decisions: true when this career was created by DECISIONS_SINCE or later. */
export function usesDecisions(career: { engineVersion?: string }): boolean {
  return versionAtLeast(career.engineVersion, DECISIONS_SINCE);
}

/** PR #81 (D-08 option B, choice-driven variant): replaces the #83 drag for careers created by
 *  2.18.0 or later, only when TUNING.bust === "choices-b" (OFF by default).  */
export const BUST_B81_SINCE = "2.18.0";
/** P1-INJ (#87): first engine version whose careers get load-based serious injuries (injuries.ts).
 *  Moved from 2.17.0 to 2.19.0 after #81 shipped 2.18.0 without injuries, so 2.18 careers stay identical. */
export const RULES_INJURY_SINCE = "2.19.0";

/** First engine version whose Leggenda careers use TUNING.minutesRetireBars220 (fading-role exits at 31-32).
 *  Careers created on 2.19 or earlier, and every other difficulty, keep their rules exactly. */
export const LEGEND_RETIRE_SINCE = "2.20.0";

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

/** D-08 option B: true when this career was created by BUST_SINCE or later. */
export function usesBustB(career: { engineVersion?: string }): boolean {
  return versionAtLeast(career.engineVersion, BUST_SINCE);
}

/** A2: true when this career may retire from injury before 33 (created by RETIRE_SINCE or later). */
export function usesRetireSpread(career: { engineVersion?: string }): boolean {
  return versionAtLeast(career.engineVersion, RETIRE_SINCE);
}

/** P1-INJ: retirement bars before 33 for this career (2.19.0+ use the recalibrated bars). */
export function injuryRetireBarsOf(career: { engineVersion?: string; difficulty?: DifficultyId }): Readonly<Record<number, number>> {
  if (!versionAtLeast(career.engineVersion, RULES_INJURY_SINCE)) return TUNING.injuryRetireBars;
  if (versionAtLeast(career.engineVersion, OVR_BALANCE_SINCE)) {
    return TUNING.injuryRetireBars221[career.difficulty ?? "pro"] ?? TUNING.injuryRetireBars221.pro;
  }
  return TUNING.injuryRetireBars219[career.difficulty ?? "pro"] ?? TUNING.injuryRetireBars219.pro;
}

/** Leggenda 2.20+: minutes bar for this summer age, or undefined when the career keeps the older rule. */
export function minutesRetireBarOf(career: { engineVersion?: string; difficulty?: DifficultyId }, age: number): number | undefined {
  if (!versionAtLeast(career.engineVersion, LEGEND_RETIRE_SINCE)) return undefined;
  return TUNING.minutesRetireBars220[career.difficulty ?? "pro"]?.[age];
}

/** PR #81: true when this career was created by BUST_B81_SINCE (2.18.0) or later. */
export function usesBustB81(career: { engineVersion?: string }): boolean {
  return versionAtLeast(career.engineVersion, BUST_B81_SINCE);
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
