/**
 * ENGINE 2.26 (behind TUNING.engine226, OFF): Career State model.
 * Source: Dallak's proposal v3 (25 Nov 2026), preset "medio", plus a moderate cap overshoot (Pello, 25 Nov:
 * "le scelte possono superare un po' il tetto"), tuned so 8-12% of random-choice careers peak at potential+3 or more.
 *
 * Pure helpers plus three hooks (applyFx, applyAging, refreshOverall). The model itself never calls rand(): a 2.26 career
 * stays deterministic per seed. (Its OVR differs from 2.25, so later season draws can branch differently: expected.)
 * Old careers (2.24, 2.25) never reach this file: every caller checks usesCareerState(s) first.
 */
import type { DifficultyId, PlayerState, SeasonRow } from "./types";

/** Optional save field `cs` (additive, like expOvr/expByAge in 2.25). Missing = fresh state. */
export interface CareerState226 {
  v: 1;
  /** Personal offset on the world's team chemistry (28..90): -15..+15, reset on a team change. The world is never written. */
  chemAdj: number;
  /** 0..100, base 50. */
  momentum: number;
  /** Persistent OVR share built by the state, capped per difficulty. */
  perm: number;
  /** Dynamic potential shift (OVR points), only moves up to potAge. */
  potShift: number;
  /** Team abbreviation of the last season seen (team-change detection). */
  team?: string;
  /** Transient OVR applied at each age, stripped the next season (like expByAge). */
  trByAge?: Record<number, number>;
  /** Total state share applied to the OVR at each age, so the next season can strip it before the year-on-year clamp. */
  addByAge?: Record<number, number>;
}

type Diff = { trMax: number; pos: number; neg: number; permCap: number; totalCap: number; cBias: number; moraleRho: number; overCap: number };

export const CS226 = {
  center: { morale: 56, coachTrust: 57, teamChemistry: 58, momentum: 50, rivalry: 18 },
  spread: { morale: 30, coachTrust: 30, teamChemistry: 20, momentum: 50, rivalry: 18 },
  rho: { coachTrust: 0.75, chemAdj: 0.7, rivalry: 0.8, momentum: 0.5 },
  w: { morale: 0.3, coachTrust: 0.25, teamChemistry: 0.2, momentum: 0.15, rivalry: 0.1 },
  kappa: 0.5,
  eventCap: 12,
  /** Implied morale of a choice that does not declare one (only ~26 of ~430 Fx do). */
  implied: { form: 0.35, coachTrust: 0.15, publicImage: 0.1, rivalry: 0.05 },
  season: {
    moraleWin: 18, moraleMin: 0.6, moraleAward: 3, moraleAwardCap: 3, moralePlayoff: 2.5, moraleTraded: -8, moraleInjury: -6,
    trustPerf: 6, trustAvail: 10, trustTenure: 2,
    chemAdjTenure: 1.5, chemAdjWin: 4, chemAdjTrait: 0.05, chemAdjCap: 15,
    momentumK: 0.5, momentumSwing: 50,
  },
  /** Preset "medio". */
  permStep: 0.55,
  ageW: { young: 1.2, prime: 1, late: 0.6, vet: 0.25 },
  /** Expected PER / minutes for an OVR (fit on 800 random 2.25 careers per difficulty, seeds 9100000+). */
  perLine: { esordio: [-18.693, 0.482, 1.279], pro: [-17.336, 0.46, 1.236], allstar: [-15.169, 0.426, 1.172], leggenda: [-14.748, 0.418, 1.147] },
  minLine: { esordio: [-20.785, 0.674], pro: [-20.483, 0.643], allstar: [-18.113, 0.589], leggenda: [-16.746, 0.548] },
  /** Moderate overshoot (Pello "un po'"): dynamic potential while young + a soft share of the state above the ceiling. */
  potential: { untilAge: 25, gain: 0.4, cap: 3 },
  /** Soft overshoot of the talent ceiling: overCap(difficulty) * tanh(add * gain / overCap), positive state only. */
  overshoot: { gain: 0.6 },
  difficulty: {
    // cBias: Dallak v3 medio (0.079 / 0.009 / -0.050 / -0.095) + 0.07 / 0.07 / 0.06 / 0.07, re-centred on the real 2.26
    // engine (2.25 base + Career State) so random-choice careers keep the 2.24 mean OVR (see PR numbers).
    // overCap: tuned so 8-12% of random-choice careers peak at potential+3 or more on every difficulty.
    esordio: { trMax: 2.2, pos: 1.1, neg: 0.8, permCap: 3.0, totalCap: 4.5, cBias: 0.149, moraleRho: 0.5, overCap: 0.05 },
    pro: { trMax: 2.0, pos: 1.0, neg: 1.0, permCap: 3.0, totalCap: 4.0, cBias: 0.079, moraleRho: 0.6, overCap: 0.15 },
    allstar: { trMax: 1.8, pos: 0.95, neg: 1.1, permCap: 2.6, totalCap: 3.6, cBias: 0.01, moraleRho: 0.65, overCap: 0.35 },
    leggenda: { trMax: 1.6, pos: 0.9, neg: 1.2, permCap: 2.2, totalCap: 3.2, cBias: -0.025, moraleRho: 0.7, overCap: 0.8 },
  } as Record<DifficultyId, Diff>,
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const r2 = (n: number) => Math.round(n * 100) / 100;
const fin = (v: unknown, fb: number) => (typeof v === "number" && Number.isFinite(v) ? v : fb);
const diffId = (s: PlayerState): DifficultyId => (s.difficulty && CS226.difficulty[s.difficulty] ? s.difficulty : "pro");

/** Defensive read: malformed or missing field -> fresh state. */
export function careerStateOf(s: PlayerState): CareerState226 {
  const o = s.cs as Partial<CareerState226> | undefined;
  if (!o || o.v !== 1) return { v: 1, chemAdj: 0, momentum: 50, perm: 0, potShift: 0 };
  return {
    v: 1,
    chemAdj: clamp(fin(o.chemAdj, 0), -15, 15),
    momentum: clamp(fin(o.momentum, 50), 0, 100),
    perm: clamp(fin(o.perm, 0), -4, 4),
    potShift: clamp(fin(o.potShift, 0), -CS226.potential.cap, CS226.potential.cap),
    team: typeof o.team === "string" ? o.team : undefined,
    trByAge: o.trByAge && typeof o.trByAge === "object" ? o.trByAge : undefined,
    addByAge: o.addByAge && typeof o.addByAge === "object" ? o.addByAge : undefined,
  };
}

export function teamChemistryOf(s: PlayerState, cs: CareerState226): number {
  const base = fin(s.world?.teams?.[s.team?.abbr]?.chemistry, 55);
  return clamp(base + cs.chemAdj, 28, 90);
}

/** State index C in [-1, 1]. Rivalry is a hump: a little motivates, too much distracts. */
export function stateIndex(s: PlayerState, cs: CareerState226): number {
  const c = CS226.center, w = CS226.w, sp = CS226.spread;
  const zM = clamp((fin(s.morale, 55) - c.morale) / sp.morale, -1, 1);
  const zT = clamp((fin(s.coachTrust, 55) - c.coachTrust) / sp.coachTrust, -1, 1);
  const zC = clamp((teamChemistryOf(s, cs) - c.teamChemistry) / sp.teamChemistry, -1, 1);
  const zMo = clamp((cs.momentum - c.momentum) / sp.momentum, -1, 1);
  const xR = (fin(s.rivalry, 15) - c.rivalry) / sp.rivalry;
  const zR = xR <= 1 ? Math.max(-1, xR) : Math.max(-1, 1 - 2 * (xR - 1));
  return clamp(w.morale * zM + w.coachTrust * zT + w.teamChemistry * zC + w.momentum * zMo + w.rivalry * zR, -1, 1);
}

/** Saturated, difficulty-asymmetric shape in [-neg, +pos]. */
export function shaped(C: number, d: DifficultyId): number {
  const k = CS226.kappa, sp = CS226.difficulty[d];
  const x = Math.tanh(clamp(C - sp.cBias, -1, 1) / k) / Math.tanh(1 / k);
  return x >= 0 ? x * sp.pos : x * sp.neg;
}

export function ageWeight(age: number): number {
  const w = CS226.ageW;
  return age <= 22 ? w.young : age <= 26 ? w.prime : age <= 31 ? w.late : w.vet;
}

/** Morale delta of a choice under Career State: declared value, or the implied one; capped per event. */
export function choiceMorale(fx: { morale?: number; form?: number; coachTrust?: number; publicImage?: number; rivalry?: number }): number {
  const I = CS226.implied;
  const raw = typeof fx.morale === "number" && fx.morale !== 0
    ? fx.morale
    : fin(fx.form, 0) * I.form + fin(fx.coachTrust, 0) * I.coachTrust + fin(fx.publicImage, 0) * I.publicImage + fin(fx.rivalry, 0) * I.rivalry;
  return r2(clamp(raw, -CS226.eventCap, CS226.eventCap));
}

/** Room damping near the 0..100 edges. */
function roomDamp(cur: number, delta: number): number {
  const room = delta >= 0 ? 100 - cur : cur;
  return delta * (0.28 + 0.72 * clamp(room / 100, 0, 1));
}

/**
 * Summer hook (applyAging, before the age moves): close the season just played, decay toward the centre,
 * then compute this year's state, the persistent step, the potential shift and the transient for the new age.
 */
export function careerStateSummer(s: PlayerState, leagueGames: number): void {
  const d = diffId(s);
  const T = CS226.season;
  let cs = careerStateOf(s);
  const row: SeasonRow | undefined = Array.isArray(s.seasonHistory) ? s.seasonHistory[s.seasonHistory.length - 1] : undefined;
  if (row) {
    const games = Math.max(1, row.wins + row.losses);
    const winPct = row.wins / games;
    const ovr = fin(row.overall, s.overall);
    const pl = CS226.perLine[d], ml = CS226.minLine[d];
    const perfZ = (fin(row.per, 15) - (pl[0]! + pl[1]! * ovr)) / pl[2]!;
    const minDelta = fin(row.min, 0) - (ml[0]! + ml[1]! * ovr);
    const avail = clamp(fin(row.gp, 0) / Math.max(1, leagueGames), 0, 1);
    const traded = !!cs.team && cs.team !== row.teamAbbr;
    const serious = avail < 0.6;
    const series = (row.seriesLog ?? []).length;
    const tenure = s.seasonHistory.filter((r) => r.teamAbbr === row.teamAbbr).length;
    const m = T.moraleWin * (winPct - 0.5) + T.moraleMin * clamp(minDelta, -10, 10) + T.moraleAward * Math.min(T.moraleAwardCap, (row.awards ?? []).length) +
      T.moralePlayoff * Math.min(4, series) + (traded ? T.moraleTraded : 0) + (serious ? T.moraleInjury : 0);
    const t = T.trustPerf * clamp(perfZ, -2, 2) + T.trustAvail * (avail - 0.85) + (tenure >= 2 ? T.trustTenure : 0);
    s.morale = clamp(fin(s.morale, 55) + roomDamp(fin(s.morale, 55), m), 0, 100);
    s.coachTrust = clamp(fin(s.coachTrust, 55) + roomDamp(fin(s.coachTrust, 55), t), 0, 100);
    const chemAdj = traded ? 0 : clamp(cs.chemAdj + T.chemAdjTenure + T.chemAdjWin * (winPct - 0.5) * 2 + (fin(s.hidden?.chemistry, 50) - 50) * T.chemAdjTrait, -T.chemAdjCap, T.chemAdjCap);
    const momentum = clamp(50 + (1 - T.momentumK) * (cs.momentum - 50) + T.momentumK * T.momentumSwing * Math.tanh(perfZ), 0, 100);
    cs = { ...cs, chemAdj: r2(chemAdj), momentum: r2(momentum), team: row.teamAbbr };
  }
  // Summer decay toward the centre (morale/trust/rivalry never decayed before).
  const c = CS226.center, rho = CS226.rho;
  const toward = (x: number, ctr: number, p: number) => ctr + (x - ctr) * p;
  s.morale = r2(toward(fin(s.morale, 55), c.morale, CS226.difficulty[d].moraleRho));
  s.coachTrust = r2(toward(fin(s.coachTrust, 55), c.coachTrust, rho.coachTrust));
  s.rivalry = r2(toward(fin(s.rivalry, 15), c.rivalry, rho.rivalry));
  cs = { ...cs, chemAdj: r2(cs.chemAdj * rho.chemAdj), momentum: r2(toward(cs.momentum, c.momentum, rho.momentum)) };

  const age = fin(s.age, 20) + 1; // the age this state will play at
  const C = stateIndex(s, cs);
  const sh = shaped(C, d);
  const sp = CS226.difficulty[d];
  // Persistent channel, damped toward its cap.
  const raw = CS226.permStep * ageWeight(age) * sh;
  const room = raw >= 0 ? sp.permCap - cs.perm : cs.perm + sp.permCap;
  const perm = r2(clamp(cs.perm + raw * (0.28 + 0.72 * clamp(room / sp.permCap, 0, 1)), -sp.permCap, sp.permCap));
  // Dynamic potential: only while young.
  const P = CS226.potential;
  const potShift = age <= P.untilAge ? r2(clamp(cs.potShift + P.gain * ageWeight(age) * sh, -P.cap, P.cap)) : cs.potShift;
  const tr = r2(sp.trMax * sh);
  cs = { ...cs, perm, potShift, trByAge: { ...(cs.trByAge ?? {}), [age]: tr } };
  s.cs = cs;
}

/** State share applied to the OVR at an age (0 if none). */
export function stateAddAt(s: PlayerState, age: number): number {
  return fin(careerStateOf(s).addByAge?.[age], 0);
}

/** Transient applied at an age (0 if none). */
export function transientAt(s: PlayerState, age: number): number {
  return fin(careerStateOf(s).trByAge?.[age], 0);
}

/**
 * OVR share of the state at the current age, after the 2.24/2.25 clamps:
 * transient + persistent + the reached part of the potential shift, clamped by the difficulty's total cap.
 * `progress` is how much of the start->potential gap the player has closed (0..1).
 */
export function careerStateOvr(s: PlayerState, progress: number): { add: number; ceilLift: number } {
  const d = diffId(s);
  const cs = careerStateOf(s);
  const age = fin(s.age, 20);
  const cap = CS226.difficulty[d].totalCap;
  const add = r2(clamp(transientAt(s, age) + cs.perm + cs.potShift * clamp(progress, 0, 1), -cap, cap));
  const O = CS226.overshoot;
  // Ceiling: the potential shift moves the talent cap; a positive state may sit a little above it (soft, capped).
  const oc = CS226.difficulty[d].overCap;
  const over = add > 0 && oc > 0 ? oc * Math.tanh((add * O.gain) / oc) : 0;
  s.cs = { ...cs, addByAge: { ...(cs.addByAge ?? {}), [age]: add } };
  return { add, ceilLift: r2(cs.potShift + over) };
}
