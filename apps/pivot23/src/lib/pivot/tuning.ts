/**
 * Balance experiments awaiting a product decision (DESIGN DECISIONS REQUIRED, see
 * docs/pivot23-balance-experiments.md). Every default reproduces the shipped behaviour
 * exactly: same seed, same career. Alternatives are only switched on by the offline
 * comparison script; the game never changes these values.
 *
 * None of these alternatives draws from the RNG stream on its own; seeded variations use
 * seedHash(), so a fixed seed stays deterministic under every setting.
 */
export const TUNING = {
  /** D-11: seasons of the scripted stories. fixed = 1/6/8/10. */
  scriptWindows: "fixed" as "fixed" | "seeded" | "seeded-wide",
  /** D-10: when low minutes or injuries end a career. */
  retirement: "current" as "current" | "graded" | "path",
  /** D-08: how much choices and injuries move the realised share of potential. */
  bust: "current" as "current" | "choices" | "events",
  /** D-09: title spread across simulated worlds. */
  world: "current" as "current" | "jitter" | "regress",
  /** D-23: DPOY voter fatigue. */
  dpoyFatigue: "current" as "current" | "steeper" | "streak",
  /** P1-ROLE: role-fit term on the realised peak. */
  rolePeak: "current" as "current" | "fit" | "fit-strong",
};

export type Tuning = typeof TUNING;

export const TUNING_DEFAULTS: Readonly<Tuning> = Object.freeze({ ...TUNING });

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
export function scriptSlotFor(seed: number, n: number): ScriptSlot | null {
  if (n === 1) return "rookie";
  if (TUNING.scriptWindows === "fixed") {
    if (n === 6) return "rival";
    if (n === 8) return "injury";
    if (n === 10) return "nation";
    return null;
  }
  const wide = TUNING.scriptWindows === "seeded-wide";
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
