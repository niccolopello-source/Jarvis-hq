
/** Curva d'età, picco osservato 26–28, overall intero in display. */
import { SIM } from "./config";
import { ROLES } from "./data";
import { rand } from "./rng";
import type { AttrKey, PlayerState, Role } from "./types";

export const PEAK_AGE = 27;
export const START_OVERALL = 60;
export const MAX_AGE = 36;
export const PEAK_BAND = [26, 27, 28] as const;

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

export function isCareerOver(s: PlayerState) {
  return s.age >= MAX_AGE;
}

export function shouldOfferExtraYear(s: PlayerState) {
  return s.age === MAX_AGE - 1 && !s.extraSeason;
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

/** Circa il 4.5% ha un tetto da fenomeno. Il 90+ si realizza, non si eredita. */
export function rollPotential(): number {
  const r = rand();
  if (r < 0.045) return round1(94.6 + rand() * 4.2);
  if (r < 0.12) return round1(86.0 + rand() * 6.0);
  if (r < 0.54) return round1(74.4 + rand() * 8.6);
  return round1(67.0 + rand() * 7.2);
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
      finite(s.development, 0) * 0.01 -
      finite(s.injuryDrag, 0) * 0.018 +
      imprint * 0.01 +
      ready * 0.004,
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
  const peak = START_OVERALL + (pot - START_OVERALL) * real + draftLift(s);
  return round1(clamp(peak, SIM.overall.min, 99));
}

export function twilightOf(s: PlayerState): number {
  const pot = finite(s.potential, 76);
  const peak = finite(s.peakOverall) && s.peakOverall > START_OVERALL ? s.peakOverall : pot;
  const wear =
    15.4 +
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
  const floor = clamp(peak * 0.54, 48, 68);
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
) {
  const peakAt = clamp(Math.round(apex), 26, 28);
  if (age <= peakAt) {
    const span = Math.max(1.15, peakAt - startAge);
    const t = clamp((age - startAge) / span, 0, 1);
    const e = 0.5 * t + 0.5 * t * t * (3 - 2 * t);
    return START_OVERALL + (potential - START_OVERALL) * e;
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
  const startAge = finite(s.startAge, 20) || 20;
  const realized = realizedPeak(s);
  const tw = twilightOf(s);
  const apex = apexAgeOf(s);
  const age = finite(s.age, startAge);
  const spine = overallSpine(age, startAge, realized, tw, apex, plateauOf(s));
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
    const atApex = overallSpine(apex, startAge, realized, tw, apex, plateauOf(s));
    ovr = Math.min(ovr, atApex - 1.35);
  }
  if (age < 26) {
    const atBand = overallSpine(26, startAge, realized, tw, apex, plateauOf(s));
    ovr = Math.min(ovr, atBand - 1.35);
  }
  // Decline after personal apex so 26/27/28 holds the observed peak.
  if (past > 0) {
    const atApex = overallSpine(apex, startAge, realized, tw, apex, plateauOf(s));
    ovr = Math.min(ovr, atApex - 1.15 * past);
  }
  if (age > 28) {
    const held = finite(s.peakOverall) && s.peakOverall > START_OVERALL ? s.peakOverall : realized;
    // No 99 freeze: after 28 overall must fall, even from a 99 ceiling.
    ovr = Math.min(ovr, 98.45, held - (age - 28) * 1.35);
  }
  const pot = finite(s.potential, 76);
  ovr = Math.min(ovr, pot + 7.49, SIM.overall.max);
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
  if (age > apex && last && Number.isFinite(last.overall)) {
    o = Math.min(o, last.overall - 0.51);
  }
  if (age > 28) {
    o = Math.min(o, 98.45);
    if (last && Number.isFinite(last.overall) && last.overall >= 99) o = Math.min(o, 98);
    if (Number.isFinite(s.peakOverall) && s.peakOverall > START_OVERALL) {
      o = Math.min(o, s.peakOverall - (age - 28) * 1.05);
    }
  }
  const potCeil = finite(s.potential, 76) + 8;
  o = Math.min(o, potCeil);
  let shown = displayOverall(Number.isFinite(o) ? o : START_OVERALL);
  if (shown > potCeil) shown = Math.floor(potCeil);
  s.overall = clamp(shown, SIM.overall.min, SIM.overall.max);
  if (!Number.isFinite(s.peakOverall) || s.overall > s.peakOverall) s.peakOverall = s.overall;
  if (s.peakOverall > potCeil) s.peakOverall = Math.floor(potCeil);
  return s.overall;
}

export function weightedSkill(s: PlayerState) {
  const w = ROLES[s.role]?.weights ?? ROLES.SG.weights;
  let total = 0;
  (Object.keys(w) as AttrKey[]).forEach((k) => {
    total += clampAttr(finite(s.attrs?.[k], 0)) * finite(w[k], 0);
  });
  return clamp(total, SIM.attr.min, SIM.attr.max);
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
