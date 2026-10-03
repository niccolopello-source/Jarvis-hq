/**
 * Engine rule switches that change outcomes for a given seed. Every default reproduces the shipped
 * engine (ENGINE_VERSION 2.11.0-beta) exactly; nothing in the game flips these. Turning one on is a
 * new engine rules version: bump ENGINE_VERSION and record it in docs/project-state.md.
 */
export const RULES = {
  /**
   * Rookie-class order at career start (league.ts seedRookieClass).
   * current:  `[...names].sort(() => rand() - 0.5)`. A comparator that answers at random leaves the
   *           result, and the number of RNG draws it takes, to the browser's sort algorithm
   *           (ECMAScript: implementation-defined). The same seed can then open a different career
   *           on a different JavaScript engine, and every later draw shifts with it.
   * portable: seeded Fisher–Yates, a fixed number of draws on every engine.
   */
  rookieShuffle: "current" as "current" | "portable",
};

export type Rules = typeof RULES;
export const RULES_DEFAULTS: Readonly<Rules> = Object.freeze({ ...RULES });

export function resetRules() {
  Object.assign(RULES, RULES_DEFAULTS);
}
