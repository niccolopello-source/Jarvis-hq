/**
 * Awards v2 (engine 2.15.0+, see AWARDS_SINCE in tuning.ts). Pure helpers: no RNG draws, so the
 * season stream is the same length under v1 and v2. Careers created before 2.15.0 never call these.
 *
 * What changes for 2.15 careers, and why (bug ids in docs/pivot23/ISSUE-REGISTER.md, AW-xx):
 * - AW-01 MVP voter fatigue was player-only, permanent and also charged titles (-7 per MVP ever won,
 *   -2.5 per title): a 33 ppg / 68-win season lost to a 26 ppg CPU star. v2: the same fatigue for
 *   everyone (player and CPU stars, read from past league awards), driven by the current streak.
 * - AW-02 ROY field rescored with the PLAYER's games and minutes, CPU rookies always the same five
 *   names, roles and teams, 5 ppg on average. v2: seeded class (names, roles, picks, teams, games),
 *   lottery picks play like lottery picks, each candidate keeps its own minutes and games.
 * - AW-03 ROY position skew (SG 62%, C 1%): v2 production score values rebounds and assists closer to
 *   points, so bigs and playmakers can win.
 * - AW-04 65-game rule for MVP, All-NBA, ROY, DPOY, MIP, 6MOY (NBA rule since 2023-24).
 * - AW-05 All-NBA First/Second Team without an All-Star selection (28% of All-NBA seasons).
 * - AW-06 DPOY shown to the best defensive team's star instead of the race leader when the player
 *   leads the race but fails a gate.
 */
import type { Role, SeasonRow } from "./types";
import { seedHash } from "./tuning";
import { advancedOf } from "./peak";

export const AWARD_MIN_GAMES = 65;

/** Extra rookie names for v2 classes; v1 keeps using ROOKIE_NAMES[0..4]. */
export const ROOKIE_POOL_V2 = [
  "Asher Quinn", "Malik Crowe", "Luka Petrovic", "Jalen Voss", "Enzo Moretti", "Caleb Okoye",
  "Theo Marais", "Isaiah Flint", "Mateo Silva", "Noah Berg", "Kobe Daramy", "Pavel Novak",
  "Darius Holt", "Omari Wells", "Felix Lindqvist", "Tariq Bello", "Jonah Reyes", "Andrei Popescu",
  "Cyrus Bannon", "Elijah Mbeki", "Marco Bellini", "Dante Shaw", "Kenji Arai", "Victor Lunde",
] as const;

const ROLES_V2: Role[] = ["PG", "SG", "SF", "PF", "C"];

export interface RookieSlot { name: string; role: Role; pick: number; teamIndex: number; gp: number }

/** Five distinct rookies for this seed. Deterministic and RNG-free (seedHash only). */
export function rookieClassPlanV2(seed: number, teamCount: number): RookieSlot[] {
  const names = [...ROOKIE_POOL_V2];
  const used = new Set<number>();
  const picks = new Set<number>();
  const out: RookieSlot[] = [];
  for (let i = 0; i < 5; i++) {
    const h = seedHash(seed, 400 + i);
    let n = h % names.length;
    while (used.has(n)) n = (n + 1) % names.length;
    used.add(n);
    let pick = 1 + (seedHash(seed, 420 + i) % 14);
    while (picks.has(pick)) pick = (pick % 14) + 1;
    picks.add(pick);
    let team = seedHash(seed, 440 + i) % Math.max(1, teamCount);
    while (out.some((o) => o.teamIndex === team)) team = (team + 1) % Math.max(1, teamCount);
    out.push({
      name: names[n]!,
      role: ROLES_V2[seedHash(seed, 460 + i) % 5]!,
      pick,
      teamIndex: team,
      gp: 58 + (seedHash(seed, 480 + i) % 25),
    });
  }
  return out;
}

/** OVR lift of a lottery pick over the generic generated rookie (pick 1: +2.8, pick 14: +0.2), calibrated so the player wins ROY in ~10% of NBA debuts (1000 careers) (SIM.awards.royTarget 0.07). */
export function lotteryLiftV2(pick: number): number {
  return Math.max(0, 15 - pick) * 0.2;
}

function finite(n: unknown, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : lo));
}

/** ROY production for player and CPU alike: counting stats with position balance, impact, games, minutes.
 *  Only the box line both sides have (CPU rookies carry no PER/TS/+-), so nobody is scored on defaults. */
export function royScoreV2(c: { ppg: number; rpg: number; apg: number; gp?: number; min?: number }): number {
  const gp = finite(c.gp, 70);
  const min = finite(c.min, 24);
  const adv = advancedOf({
    gp, min, ppg: finite(c.ppg), rpg: finite(c.rpg), apg: finite(c.apg), tov: 1.35,
    ts: 0.54, per: 15, plusMinus: 0,
  });
  const counting = finite(c.ppg) * 2.6 + finite(c.rpg) * 1.9 + finite(c.apg) * 2.2;
  const impact = finite(adv.ws) * 1.2 + finite(adv.vorp) * 1.8 + finite(adv.bpm) * 0.6;
  const gpW = clamp(gp / 70, 0.5, 1);
  const out = Math.round(((counting + impact) * gpW + Math.max(0, min - 16) * 0.16) * 10) / 10;
  return Number.isFinite(out) ? out : 0;
}

/** Past MVP record per winner name; the player has his own key, so a CPU namesake never shares it. */
export const PLAYER_KEY: unique symbol = Symbol();
export type MvpKey = string | typeof PLAYER_KEY;
export function mvpHistoryV2(history: readonly SeasonRow[]): Map<MvpKey, { count: number; streak: number }> {
  const out = new Map<MvpKey, { count: number; streak: number }>();
  let streakKey: MvpKey | null = null;
  let streakOpen = true;
  for (let i = history.length - 1; i >= 0; i--) {
    const a = history[i]!.league?.awards?.find((x) => x.title === "MVP");
    const key = a ? (a.isPlayer ? PLAYER_KEY : a.name) : "";
    if (streakKey === null) streakKey = key;
    const inStreak = streakOpen && key !== "" && key === streakKey;
    if (!inStreak) streakOpen = false;
    if (!key) continue;
    const rec = out.get(key) ?? { count: 0, streak: 0 };
    rec.count += 1;
    if (inStreak) rec.streak += 1;
    out.set(key, rec);
  }
  return out;
}

/** Voter fatigue, same for everyone: current streak weighs most, career total a little. */
export function mvpFatigueV2(rec: { count: number; streak: number } | undefined): number {
  if (!rec) return 0;
  return Math.min(9, rec.streak * 3) + Math.min(10, rec.count * 2);
}

/** Share of the #83 difficulty ROY shift (`awardProfile().royDelta`, tuned on the v1 score) applied
 *  to the v2 ROY score. 0 for careers before 2.16 (awardProfile gives royDelta 0 there). */
export const ROY_DELTA_V2_SCALE = 0.5;
