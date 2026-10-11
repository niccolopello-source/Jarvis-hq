import { ROLES } from "./data";
import { diffOf } from "./difficulty";
import { round1 } from "./peak";
import { gaussTrim } from "./rng";
import type { PlayerState, Role } from "./types";
import { identityFit } from "./world";

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

/** Same season-1 counting rules as simulateRegularSeasonInner, without standings or awards. */
export function isolatedRookieBox(s: PlayerState): { gp: number; min: number; ppg: number; rpg: number; apg: number } {
  const d = diffOf(s);
  const role = ROLES[s.role];
  const a = s.attrs;
  const ovr = s.overall;
  const rookCut = s.age <= 20 ? 0.86 : s.age === 21 ? 0.92 : 1;
  const trust = 1 + (s.coachTrust - 50) * 0.003;
  let min = round1(clamp((17.2 + (ovr - 60) * 0.58 + (s.hidden.motor / 100) * 3.2) * d.minutes * rookCut * trust, 11.5, 37.6));
  min = round1(clamp(min * identityFit(s).min, 11.5, 37.6));
  const usage = clamp(0.14 + (ovr - 60) * 0.0048 + (role.scoreF - 1) * 0.03 + (a.handle - 50) * 0.0004, 0.1, 0.34);
  const formAdj = 1 + s.form * 0.018;
  const cons = 1 + ((s.hidden.consistency - 50) / 100) * 0.08;
  const noise = (amp: number) => gaussTrim(0, amp * (1.15 - s.hidden.consistency / 140) / Math.sqrt(12), 2.5);
  const fit = identityFit(s);
  const minFactor = 0.9 + (min - 22) * 0.0075;
  const shotMod = 1 + (a.shooting - 50) * 0.0024 + (a.handle - 50) * 0.0009;
  const rebMod = 1 + (a.rebounding - 50) * 0.0042 + (a.strength - 50) * 0.0016;
  const passMod = 1 + (a.passing - 50) * 0.004 + (a.iq - 50) * 0.002;
  const lot = s.draftPick <= 10 ? 1.14 : s.draftPick <= 20 ? 1.08 : s.draftPick > 0 ? 1.04 : 1;
  const minuteShare = min >= 22 ? 1 : clamp((min - 11) / 11, 0.45, 1);
  const opportunity = 1 + (lot - 1) * minuteShare;
  const ppg = round1(clamp(((7.6 + (ovr - 60) * 0.56) * role.scoreF * minFactor * formAdj * cons * shotMod * fit.ppg * (0.88 + (usage / 0.22) * 0.14) + noise(1.15)) * opportunity, 1.5, 35.4));
  const rpg = round1(clamp((3.55 + (ovr - 60) * 0.128) * role.reboundF * minFactor * rebMod * fit.rpg + noise(0.38), 0.8, 16.2));
  const apg = round1(clamp((2.15 + (ovr - 60) * 0.118) * role.passF * minFactor * passMod * fit.apg + noise(0.36), 0.4, 12.6));
  return { gp: 82, min, ppg, rpg, apg };
}

export function roySubSeed(seed: number, index: number) {
  return (Math.imul((seed || 1) ^ 0x9e3779b9, index + 17) >>> 0) || 1;
}

export const ROY_ROLES: Role[] = ["PG", "SG", "SF", "PF", "C"];
