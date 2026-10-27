
/** Curva d'età, picco osservato 26–28, overall intero in display. */
import { SIM } from "./config";
import { TUNING, usesStatsOvr, injuryRetireBarsOf, minutesRetireBarOf, retireBarScaleOf, twilightBaseWearOf, usesBustB, usesBustB81, usesDecisions, usesRetireSpread, usesOvrCurve, seedUnit } from "./tuning";
import { ROLES } from "./data";
import { NAT_ORIGIN } from "./teams";
import { rand } from "./rng";
import type { AttrKey, PlayerState, Role } from "./types";

export const PEAK_AGE = 27;
export const START_OVERALL = 60;
export const MAX_AGE = 36;
export const PEAK_BAND = [26, 27, 28] as const;
/** Attribute value every rookie is created with (engine.ts freshPlayer), before nationality. */
export const BASE_ATTR = 25;

/** Starting OVR of this career: 50 from STATS_OVR_SINCE (2.23.0), 60 (START_OVERALL) before. */
export function startOverallOf(s: { engineVersion?: string }): number {
  return usesStatsOvr(s) ? TUNING.statsOvr.start : START_OVERALL;
}

export function clamp(v: number, min: number, max: number) {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}
export function clampAttr(v: number) {
  return clamp(v, SIM.attr.min, SIM.attr.max);
}
export function round1(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10) / 10;
}
export function round2(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function finite(n: unknown, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

export function displayOverall(n: number) {
  return clamp(Math.round(Number.isFinite(n) ? n : START_OVERALL), SIM.overall.min, SIM.overall.max);
}

export function careerEndingSignal(s: PlayerState): "minutes" | "injury" | null {
  if (TUNING.retirement !== "current") return gradedEndingSignal(s);
  if (s.age < MAX_AGE - 3) {
    // A2 (2.14.0+ careers only): a heavy injury load can close the career at 29–31.
    const bar = usesRetireSpread(s) ? injuryRetireBarsOf(s)[s.age] : undefined;
    if (bar !== undefined && s.injuryDrag >= bar * retireBarScaleOf(s, s.age)) return "injury";
    // Leggenda 2.20+ only: a fading role closes the career at 31-32 (undefined for every other career and version).
    const minBar = minutesRetireBarOf(s, s.age);
    if (minBar === undefined) return null;
    const lastPlayed = s.seasonHistory.at(-1);
    return lastPlayed && lastPlayed.min <= minBar ? "minutes" : null;
  }
  // 2.24: gradual exits at 33-35, tied to the decline from the peak (36 stays the hard maximum).
  if (usesOvrCurve(s) && s.age >= TUNING.ovrCurve.exitFrom && s.age < MAX_AGE) {
    const c = TUNING.ovrCurve;
    const drop = Math.max(0, finite(s.peakOverall, s.overall) - finite(s.overall, 0));
    const lean = drop * c.exitDeclineW + (s.age - 32) * c.exitAgeW;
    if (lean > seedUnit(s.seed, 24000 + s.age)) return "minutes";
  }
  // From 33 the shipped bar is 2.5. Only 2.19.0+ bars (per difficulty) may set their own value here.
  const lateBar = usesRetireSpread(s) ? injuryRetireBarsOf(s)[s.age] : undefined;
  // 2.23: the 33 bar is scaled too, or the exit only moves from the 32 summer to the 33 one (last season still 32).
  if (s.injuryDrag >= (lateBar ?? 2.5) * retireBarScaleOf(s, s.age)) return "injury";
  const lastSeason = s.seasonHistory.at(-1);
  if (lastSeason && lastSeason.min <= 11.5) return "minutes";
  return null;
}

/** D-10 experiment: the minutes bar rises with age instead of switching on at 33. */
function gradedEndingSignal(s: PlayerState): "minutes" | "injury" | null {
  const bar: Record<number, number> = { 31: 6, 32: 8, 33: 9.5, 34: 10.5, 35: 11.5 };
  if (s.age < 31) return null;
  if (s.injuryDrag >= (s.age >= MAX_AGE - 3 ? 2.5 : 4)) return "injury";
  let limit = bar[Math.min(35, s.age)] ?? 11.5;
  if (TUNING.retirement === "path") {
    // Career path: decorated players hang on longer, journeymen leave earlier.
    const decorated = finite(s.allStarCount, 0) >= 3 || finite(s.peakOverall, 0) >= 85 || finite(s.titleCount, 0) >= 2;
    const journeyman = finite(s.peakOverall, 0) < 72 && finite(s.allStarCount, 0) === 0;
    if (decorated) limit -= 2;
    else if (journeyman) limit += 2;
  }
  const lastSeason = s.seasonHistory.at(-1);
  if (lastSeason && lastSeason.min <= limit) return "minutes";
  return null;
}

export function isCareerOver(s: PlayerState) {
  // The player already accepted the age-36 season. An injury that lands in that
  // summer does not erase it: the season is played once, then the career closes.
  if (s.extraSeason && s.age === MAX_AGE && s.seasonHistory.at(-1)?.age !== MAX_AGE && usesDecisions(s)) return false;
  if (careerEndingSignal(s) !== null || s.age > MAX_AGE) return true;
  if (s.age < MAX_AGE) return false;

  // Age 36 is the final playable season. Close only after its row is recorded.
  return s.seasonHistory.at(-1)?.age === MAX_AGE;
}

/** Ultima età realmente giocata; `age` può già indicare l'anno successivo dopo l'offseason. */
export function careerEndAge(s: PlayerState) {
  return s.seasonHistory.at(-1)?.age ?? s.age;
}

export function shouldOfferExtraYear(s: PlayerState) {
  return s.age === MAX_AGE - 1 && !s.extraSeason && careerEndingSignal(s) === null;
}

/** Cosa può fare l'estate. Il 36 si gioca una volta, poi si chiude. */
export type OffseasonStep = "finish" | "offer" | "play-final" | "summer";

export function offseasonStep(s: PlayerState): OffseasonStep {
  if (s.age > MAX_AGE || isCareerOver(s)) return "finish";
  if (s.age === MAX_AGE && s.seasonHistory.at(-1)?.age !== MAX_AGE) return "play-final";
  if (shouldOfferExtraYear(s)) return "offer";
  return "summer";
}

/** Pesi su 26 / 27 / 28: guardie prima, lunghi dopo. */
const ROLE_PEAK_W: Record<Role, [number, number, number]> = {
  PG: [0.52, 0.36, 0.12],
  SG: [0.42, 0.4, 0.18],
  SF: [0.28, 0.44, 0.28],
  PF: [0.16, 0.4, 0.44],
  C: [0.1, 0.36, 0.54],
};

export function apexAgeOf(s: PlayerState): number {
  if (Number.isFinite(s.apexAge) && s.apexAge >= 26 && s.apexAge <= 28) return Math.round(s.apexAge);
  return PEAK_AGE;
}

/** Picco personale: sempre 26, 27 o 28. */
export function rollApexAge(s: PlayerState): number {
  const w: [number, number, number] = [...(ROLE_PEAK_W[s.role] ?? [0.3, 0.4, 0.3])];
  const ethic = (s.hidden.workEthic - 50) / 100;
  const motor = (s.hidden.motor - 50) / 100;
  const dur = (s.hidden.durability - 50) / 100;
  if (ethic > 0.12) {
    w[2] += 0.1;
    w[0] -= 0.06;
  } else if (ethic < -0.08) {
    w[0] += 0.1;
    w[2] -= 0.06;
  }
  if (motor > 0.15) {
    w[0] += 0.05;
    w[2] -= 0.03;
  }
  if (dur < -0.12) {
    w[0] += 0.06;
    w[2] -= 0.04;
  }
  if (s.originPath === "Europa") {
    w[2] += 0.07;
    w[0] -= 0.04;
  } else if (s.originPath === "G-League") {
    w[0] += 0.07;
    w[2] -= 0.04;
  } else if (s.originPath === "NCAA") {
    w[1] += 0.04;
  }
  w[0] = Math.max(0, w[0]);
  w[1] = Math.max(0, w[1]);
  w[2] = Math.max(0, w[2]);
  const sum = Math.max(0.01, w[0] + w[1] + w[2]);
  let r = rand() * sum;
  const ages = PEAK_BAND;
  for (let i = 0; i < ages.length; i++) {
    r -= w[i]!;
    if (r <= 0) return ages[i]!;
  }
  return PEAK_AGE;
}

export function plateauOf(s: PlayerState): number {
  const ethic = finite(s.hidden?.workEthic, 50) / 100;
  return clamp(0.18 + ethic * 0.22, 0.16, 0.42);
}

export function ageCurve(age: number, apex = PEAK_AGE) {
  const sigma = age <= apex ? 8.2 : 6.6;
  return Math.exp(-0.5 * ((age - apex) / sigma) ** 2);
}

/** Circa il 4.5% ha un tetto da fenomeno. Il profilo sposta il tiro, non lo sostituisce. */
export function rollPotential(skill = 62): number {
  const r = rand();
  let pot: number;
  if (r < 0.045) pot = 94.6 + rand() * 4.2;
  else if (r < 0.12) pot = 86.0 + rand() * 6.0;
  else if (r < 0.54) pot = 74.4 + rand() * 8.6;
  else pot = 67.0 + rand() * 7.2;
  const bias = clamp((skill - 62) * 0.12, -2.5, 3.5);
  return round1(clamp(pot + bias, 64, 99));
}

/**
 * D-08 option B, careers from 2.14.0. Only a high ceiling can pay a realisation drag,
 * and only when choices or training sit under the bar for that ceiling. A careful
 * player pays nothing. Locked three seasons before the apex so the peak age does not move.
 */
export function bustBDrag(s: PlayerState, imprint: number): number {
  if (TUNING.bust !== "choices-b" || !usesBustB(s)) return 0;
  if (typeof s.bustLock === "number" && Number.isFinite(s.bustLock)) return s.bustLock;
  if (finite(s.age, 0) < apexAgeOf(s) - 3) return 0;
  if (usesBustB81(s)) {
    // PR #81 variant (2.18.0+ careers): lagging choices/training cost realisation; never a bonus.
    const c = TUNING.bustB81;
    const drag81 = Math.max(0, c.choiceRef - imprint) * c.choiceK + Math.max(0, c.devRef - finite(s.development, 0)) * c.devK;
    s.bustLock = Math.round(drag81 * 1000) / 1000;
    return s.bustLock;
  }
  const b = TUNING.bustB;
  const pot = finite(s.potential, 0);
  if (pot < b.potFloor) {
    s.bustLock = 0;
    return 0;
  }
  const choiceRef = b.choiceRef + (pot - b.potFloor) * b.choiceSlope;
  const raw =
    Math.max(0, choiceRef - imprint) * b.choiceK +
    Math.max(0, b.devRef - finite(s.development, 0)) * b.devK;
  s.bustLock = Math.round(Math.min(b.cap, raw) * 1000) / 1000;
  return s.bustLock;
}

export function realizationOf(s: PlayerState): number {
  const ethic = finite(s.hidden?.workEthic, 50) / 100;
  const cons = finite(s.hidden?.consistency, 50) / 100;
  const motor = finite(s.hidden?.motor, 50) / 100;
  const dur = finite(s.hidden?.durability, 50) / 100;
  const imprint = clamp(finite(s.choiceOvr, 0), SIM.choice.min, SIM.choice.max);
  const ready = finite(s.rookReady, 0);
  return clamp(
    0.8 +
      (ethic - 0.5) * 0.24 +
      (cons - 0.5) * 0.12 +
      (motor - 0.5) * 0.06 +
      (dur - 0.5) * 0.06 +
      finite(s.development, 0) * (TUNING.bust === "choices" ? 0.02 : 0.01) -
      finite(s.injuryDrag, 0) * (TUNING.bust === "events" ? 0.04 : 0.018) +
      imprint * (TUNING.bust === "choices" ? 0.025 : 0.01) +
      ready * 0.004 -
      bustBDrag(s, imprint),
    0.58,
    1.08,
  );
}

/** Quanto le carte spostano il tetto. Il potenziale resta il peso maggiore. */
export function draftLift(s: PlayerState): number {
  const edge = finite(s.draftEdge, 0);
  return round1(clamp(edge * 0.42, -4.4, 4.4));
}

/** Picco raggiungibile: potenziale come tetto morbido, le carte spostano di qualche punto. */
export function realizedPeak(s: PlayerState): number {
  const pot = finite(s.potential, 76);
  const real = realizationOf(s);
  const start = startOverallOf(s);
  const peak = start + (pot - start) * real + draftLift(s) + roleFit(s);
  return round1(clamp(peak, SIM.overall.min, 99));
}

/** P1-ROLE experiment: attributes that suit the role lift the peak, a poor fit lowers it. */
function roleFit(s: PlayerState): number {
  if (TUNING.rolePeak === "current") return 0;
  const keys = Object.keys(s.attrs ?? {}) as AttrKey[];
  if (!keys.length) return 0;
  const mean = keys.reduce((a, k) => a + clampAttr(finite(s.attrs[k], 0)), 0) / keys.length;
  const k = TUNING.rolePeak === "fit-strong" ? 0.3 : 0.15;
  return clamp((weightedSkill(s) - mean) * k, -3, 3);
}

export function twilightOf(s: PlayerState): number {
  const pot = finite(s.potential, 76);
  const start = startOverallOf(s);
  const peak = finite(s.peakOverall) && s.peakOverall > start ? s.peakOverall : pot;
  const wear =
    twilightBaseWearOf(s) +
    Math.max(0, finite(s.age, PEAK_AGE) - 30) * 0.9 +
    ((100 - finite(s.hidden?.durability, 50)) / 100) * 6.6 +
    finite(s.injuryDrag, 0) * 0.4 -
    (finite(s.hidden?.motor, 50) / 100) * 2.6 -
    (finite(s.hidden?.workEthic, 50) / 100) * 1.4;
  const keep =
    finite(s.titleCount, 0) * 0.55 +
    finite(s.mvpCount, 0) * 0.85 +
    finite(s.allStarCount, 0) * 0.12 +
    finite(s.fmvpCount, 0) * 0.35 +
    Math.max(0, finite(s.development, 0)) * 0.08;
  const so = TUNING.statsOvr;
  const floor = usesStatsOvr(s)
    ? clamp(peak * so.twilightFloorK, so.twilightFloorMin, so.twilightFloorMax)
    : clamp(peak * 0.54, 48, 68);
  const ceil = clamp(peak - 8.2, 52, 86);
  return round1(clamp(peak - wear + keep, floor, ceil));
}

/**
 * Spine NBA-like: ascesa fino ad apex ∈ {26,27,28}, poi declino.
 * Niente plateau lungo: il picco osservato cade nell'anno d'apex.
 */
export function overallSpine(
  age: number,
  startAge: number,
  potential: number,
  twilight: number,
  apex = PEAK_AGE,
  _plateau = 0.25,
  start = START_OVERALL,
) {
  const peakAt = clamp(Math.round(apex), 26, 28);
  if (age <= peakAt) {
    const span = Math.max(1.15, peakAt - startAge);
    const t = clamp((age - startAge) / span, 0, 1);
    const e = 0.5 * t + 0.5 * t * t * (3 - 2 * t);
    return start + (potential - start) * e;
  }
  const yearsPast = age - peakAt;
  const spanDown = Math.max(1.6, MAX_AGE - peakAt);
  const t = clamp(yearsPast / spanDown, 0, 1);
  const e = t * t * (3 - 2 * t);
  // Immediate post-apex step so the integer peak sits on the apex year.
  const step = 0.9 + yearsPast * 0.4;
  return potential + (twilight - potential) * e - step;
}

export function computeOverall(s: PlayerState) {
  if (usesStatsOvr(s)) return computeOverallStats(s);
  return computeOverallCurve(s);
}

/** Weighted role skill of the attributes this career was created with (25 each plus nationality). No state field:
 *  role and nationality are fixed, so the reference is the same on every load. */
export function baseSkillOf(s: PlayerState): number {
  const w = ROLES[s.role]?.weights ?? ROLES.SG.weights;
  const origin = NAT_ORIGIN[s.nationality]?.attrs ?? {};
  const keys = Object.keys(w) as AttrKey[];
  const sum = keys.reduce((a, k) => a + finite(w[k], 0), 0) || 1;
  let total = 0;
  keys.forEach((k) => {
    total += clampAttr(BASE_ATTR + finite(origin[k], 0)) * finite(w[k], 0);
  });
  return clamp(total / sum, SIM.attr.min, SIM.attr.max);
}

/** OVR read from the attributes only (2.23.0+): start + k * (weighted skill - weighted skill at creation). */
export function statsOverall(s: PlayerState): number {
  return startOverallOf(s) + TUNING.statsOvr.k * (weightedSkill(s) - baseSkillOf(s));
}

/** Natural age curve of this career in OVR points (no choices): the yearly attribute budget follows its slope. */
export function naturalCurveAt(s: PlayerState, age: number): number {
  const startAge = finite(s.startAge, 20) || 20;
  return overallSpine(age, startAge, realizedPeak(s), twilightOf(s), apexAgeOf(s), plateauOf(s), startOverallOf(s));
}

/** 2.23.0+: the OVR is the attributes (lambda = 1) or a blend with the age curve (lambda < 1, option A).
 *  Form and injury drag stay as condition terms, as before. */
function computeOverallStats(s: PlayerState) {
  const lambda = clamp(finite(TUNING.statsOvr.lambda, 1), 0, 1);
  const cond = finite(s.form, 0) * 0.1 - finite(s.injuryDrag, 0) * 0.12;
  const fromStats = statsOverall(s) + cond;
  const ovr = lambda >= 1 ? fromStats : lambda * fromStats + (1 - lambda) * computeOverallCurve(s);
  const pot = finite(s.potential, 76);
  return clamp(Math.min(ovr, pot + 1.4, SIM.overall.max), SIM.overall.min, SIM.overall.max);
}

function computeOverallCurve(s: PlayerState) {
  const start = startOverallOf(s);
  const startAge = finite(s.startAge, 20) || 20;
  const realized = realizedPeak(s);
  const tw = twilightOf(s);
  const apex = apexAgeOf(s);
  const age = finite(s.age, startAge);
  const spine = overallSpine(age, startAge, realized, tw, apex, plateauOf(s), start);
  const past = age - apex;
  const devW = past < 0 ? (age <= 24 ? 0.18 : 0.12) : past === 0 ? 0.07 : 0.02;
  const imprint = clamp(finite(s.choiceOvr, 0), SIM.choice.min, SIM.choice.max);
  const imprintW =
    past < 0 ? SIM.choice.mix : past === 0 ? SIM.choice.mix * 0.32 : past <= 1 ? SIM.choice.mix * 0.14 : SIM.choice.mix * 0.08;
  // Muro: dopo l'apex l'impronta non può congelare il tetto (remnant).
  const cap = (past <= 0 ? 1 : SIM.choice.remnant) * SIM.choice.mix * SIM.choice.max;
  const imprintHit = clamp(imprint * imprintW, -cap, cap);
  let ovr =
    spine + finite(s.development, 0) * devW + finite(s.form, 0) * 0.1 - finite(s.injuryDrag, 0) * 0.12 + imprintHit;
  // Ascent: before personal apex the integer overall stays below the apex year.
  if (age < apex) {
    const atApex = overallSpine(apex, startAge, realized, tw, apex, plateauOf(s), start);
    ovr = Math.min(ovr, atApex - 1.35);
  }
  if (age < 26) {
    const atBand = overallSpine(26, startAge, realized, tw, apex, plateauOf(s), start);
    ovr = Math.min(ovr, atBand - 1.35);
  }
  // Decline after personal apex so 26/27/28 holds the observed peak.
  if (past > 0) {
    const atApex = overallSpine(apex, startAge, realized, tw, apex, plateauOf(s), start);
    ovr = Math.min(ovr, atApex - 1.15 * past);
  }
  if (age > 28) {
    const held = finite(s.peakOverall) && s.peakOverall > start ? s.peakOverall : realized;
    // No 99 freeze: after 28 overall must fall, even from a 99 ceiling.
    ovr = Math.min(ovr, 98.45, held - (age - 28) * 1.35);
  }
  const pot = finite(s.potential, 76);
  ovr = Math.min(ovr + profileDelta(s) * (age < apex ? 0.85 : 0.55), pot + 1.4, SIM.overall.max);
  return clamp(ovr, SIM.overall.min, SIM.overall.max);
}

function yoyCap(age: number) {
  if (age <= 25) return SIM.overall.yoyYoung;
  if (age <= 28) return SIM.overall.yoyPeak;
  return SIM.overall.yoyOld;
}

/** Una sola volta dopo il percorso: il 27 di default non è un roll. */
function ensureApexRolled(s: PlayerState) {
  if (!s.originPath) return;
  if (Array.isArray(s.seasonHistory) && s.seasonHistory.length > 0) return;
  const flag = s as PlayerState & { apexRolled?: number };
  if (flag.apexRolled) return;
  s.apexAge = rollApexAge(s);
  flag.apexRolled = 1;
}

export function refreshOverall(s: PlayerState) {
  ensureApexRolled(s);
  let o = computeOverall(s);
  const last = Array.isArray(s.seasonHistory) ? s.seasonHistory[s.seasonHistory.length - 1] : undefined;
  if (last && Number.isFinite(last.overall)) {
    const cap = yoyCap(s.age);
    o = clamp(o, last.overall - cap, last.overall + cap);
  }
  const apex = apexAgeOf(s);
  const age = finite(s.age, apex);
  // Intero: dopo l'apex il display scende, niente plateau che sposta il picco.
  const curve = usesOvrCurve(s);
  const c = TUNING.ovrCurve;
  if (age > apex && last && Number.isFinite(last.overall)) {
    if (curve) {
      // 2.24 (1): variable decline. Wear (injuries, low work ethic) speeds it up; the seed jitter can hold the year.
      const base = c.declineBase[Math.min(36, Math.max(27, age))] ?? 1;
      const wear = clamp(1 + finite(s.injuryDrag, 0) * 0.12 - (finite(s.hidden?.workEthic, 50) - 50) / 160, 0.6, 1.6);
      const jit = (seedUnit(s.seed, 23000 + age) - 0.5) * c.declineJitter;
      o = Math.min(o, last.overall - (base * wear + jit));
    } else {
      o = Math.min(o, last.overall - 0.51);
    }
  }
  if (age > 28) {
    o = Math.min(o, 98.45);
    if (last && Number.isFinite(last.overall) && last.overall >= 99) o = Math.min(o, 98);
    if (Number.isFinite(s.peakOverall) && s.peakOverall > startOverallOf(s)) {
      o = curve
        ? Math.min(o, s.peakOverall - Math.max(0, age - c.wallFrom) * c.wallSlope)
        : Math.min(o, s.peakOverall - (age - 28) * 1.05);
    }
  }
  const potCeil = finite(s.potential, 76) + 1.4;
  if (curve && age < c.softAge) {
    // 2.24 (2): soft cap. Under softAge the ceiling sits lower, and growth slows close to it.
    const ceil = potCeil - (c.softAge - age) * c.softGap;
    if (last && Number.isFinite(last.overall) && o > last.overall) {
      const room = ceil - last.overall;
      o = last.overall + (o - last.overall) * clamp(room / c.softRoom, 0.15, 1);
    }
    o = Math.min(o, Math.max(ceil, last && Number.isFinite(last.overall) ? last.overall : -Infinity));
  }
  o = Math.min(o, potCeil);
  let shown = displayOverall(Number.isFinite(o) ? o : startOverallOf(s));
  if (shown > potCeil) shown = Math.floor(potCeil);
  s.overall = clamp(shown, SIM.overall.min, SIM.overall.max);
  if (!Number.isFinite(s.peakOverall) || s.overall > s.peakOverall) s.peakOverall = s.overall;
  if (s.peakOverall > potCeil) s.peakOverall = Math.floor(potCeil);
  return s.overall;
}

export function weightedSkill(s: PlayerState) {
  const w = ROLES[s.role]?.weights ?? ROLES.SG.weights;
  const keys = Object.keys(w) as AttrKey[];
  const sum = keys.reduce((a, k) => a + finite(w[k], 0), 0) || 1;
  let total = 0;
  keys.forEach((k) => {
    total += clampAttr(finite(s.attrs?.[k], 0)) * finite(w[k], 0);
  });
  return clamp(total / sum, SIM.attr.min, SIM.attr.max);
}

/** Visible profile versus a neutral 62. Hidden traits stay out of this term. */
export function profileDelta(s: PlayerState): number {
  return clamp((weightedSkill(s) - 62) * 0.38, -5.5, 7.5);
}

/** Box avanzato, derivato dal referto. Niente campi extra nel salvataggio. */
export type AdvancedBox = {
  usg: number;
  astPct: number;
  rebPct: number;
  bpm: number;
  ws: number;
  vorp: number;
  efg: number;
  tovPct: number;
  stlPct: number;
  blkPct: number;
};

export function advancedOf(row: {
  gp: number;
  min: number;
  ppg: number;
  rpg: number;
  apg: number;
  tov: number;
  ts: number;
  per: number;
  plusMinus: number;
  fg?: number;
  tp?: number;
  spg?: number;
  bpg?: number;
}): AdvancedBox {
  const min = Math.max(8, finite(row.min, 8));
  const gp = Math.max(1, finite(row.gp, 1));
  const ts = clamp(finite(row.ts, 0.52), 0.4, 0.75);
  const per = clamp(finite(row.per, 15), 8, 32);
  const pm = finite(row.plusMinus, 0);
  const ppg = finite(row.ppg, 0);
  const tov = finite(row.tov, 0);
  const poss = (min / 48) * 100;
  const shots = ppg / Math.max(0.9, ts * 2);
  const usg = clamp((100 * (shots + tov * 0.44)) / Math.max(12, poss), 8, 38);
  const teamFgm = (min / 48) * 33;
  const astPct = clamp((100 * finite(row.apg, 0)) / Math.max(8, teamFgm), 3, 45);
  const teamReb = (min / 48) * 86;
  const rebPct = clamp((100 * finite(row.rpg, 0)) / Math.max(10, teamReb), 2, 28);
  const fg = clamp(finite(row.fg, ts * 0.92), 0.35, 0.68);
  const tp = clamp(finite(row.tp, 0.35), 0.2, 0.5);
  const efg = clamp(fg + 0.5 * tp * 0.38, 0.4, 0.7);
  const tovPct = clamp((100 * tov) / Math.max(6, shots + tov), 4, 28);
  const stlPct = clamp((100 * finite(row.spg, 0.7)) / Math.max(10, poss * 0.48), 0.4, 4.5);
  const blkPct = clamp((100 * finite(row.bpg, 0.4)) / Math.max(10, poss * 0.48), 0.2, 8);
  const bpm = clamp((per - 15) * 0.34 + pm * 0.4 + (ts - 0.55) * 3.2 + (usg - 20) * 0.04, -12, 14);
  const ws = clamp((((per - 11) * gp) / 82) * 0.82 + Math.max(0, bpm) * 0.08, 0, 20);
  const vorp = clamp(bpm * (gp / 82) * 0.72, -3, 10);
  const box: AdvancedBox = {
    usg: round1(usg),
    astPct: round1(astPct),
    rebPct: round1(rebPct),
    bpm: round1(bpm),
    ws: round1(ws),
    vorp: round1(vorp),
    efg: round1(efg),
    tovPct: round1(tovPct),
    stlPct: round1(stlPct),
    blkPct: round1(blkPct),
  };
  box.usg = clamp(finite(box.usg, 20), 8, 38);
  box.bpm = clamp(finite(box.bpm, 0), -12, 14);
  box.ws = clamp(finite(box.ws, 0), 0, 20);
  box.vorp = clamp(finite(box.vorp, 0), -3, 10);
  box.astPct = clamp(finite(box.astPct, 10), 3, 45);
  box.rebPct = clamp(finite(box.rebPct, 8), 2, 28);
  box.efg = clamp(finite(box.efg, 0.5), 0.4, 0.7);
  box.tovPct = clamp(finite(box.tovPct, 12), 4, 28);
  box.stlPct = clamp(finite(box.stlPct, 1), 0.4, 4.5);
  box.blkPct = clamp(finite(box.blkPct, 1), 0.2, 8);
  return box;
}
