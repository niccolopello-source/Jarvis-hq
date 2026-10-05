
import { scriptSlotFor, scriptWindowsOf, seedHash, TUNING } from "./tuning";
import {
  ATTR_LABELS,
  COACH_NAMES,
  DRAFT_ROUNDS,
  EURO_ROUNDS,
  EURO_TEAMS,
  NATIONALITIES,
  NBA_ROUNDS,
  NBA_TEAMS,
  OFFSEASON_FOCUSES,
  PLAYOFF_SEEDS,
  RIVAL_NAMES,
  ROLES,
  STORY_POOL,
} from "./data";
import {
  SERIES_LOSS_LINES,
  SERIES_WIN_LINES,
  SINGLE_GAME_LOSS_LINES,
  SINGLE_GAME_WIN_LINES,
  EURO_TITLE_LINES,
  TITLE_LINES,
  advanceBracket,
  buildSeriesResult,
  currentOpponent,
  initPlayoffs,
  initTeamPower,
  opponentAsTeam,
  seedRookieClass,
  playoffSeriesFormat,
  playoffLineScore,
  matchupChance,
  boundedChoiceBonus,
  simulateSeries,
  simulateLeagueSeason,
  standingOf,
  settleYearTitle,
  TITLE_SEED,
} from "./league";
import { cloneTeam, NAT_ORIGIN, UNSIGNED_TEAM } from "./teams";
import { createWorld, identityFit, occupyTeamSlot, offerFit, tickWorld } from "./world";
import { fingerprintOf, type CareerCard } from "./card";
import { ENGINE_VERSION, SAVE_VERSION, SIM } from "./config";
import { DIFF_MAP, diffOf, type DifficultyId } from "./difficulty";
import { seasonAtmosphere, quietYearChance, quietYearEventBits } from "./feel";
import { lateCareerEvent } from "./story-late";
import { createRng, gaussTrim, pick, rand, randInt, rngDepth, runWithRng, type Rng } from "./rng";
import { newCareerId, compactArchiveHistory, isStorageQuota, ARCHIVE_SCHEMA } from "./save";
import { say, sayOr, sceneVars, fillVars, voiceKey, tooClose } from "./voice";
import { getLang } from "./i18n";
import { hofTier } from "./legacy";
import { settlePlayerAwards } from "./awards-helpers";
import { playoffChoicesFor as doorChoices } from "./playoff-doors";
import { pickSummerDestination, pickSummerEvent } from "./summer";
import { CHARACTER_ROUNDS } from "./draft-character";
import {
  MAX_AGE,
  START_OVERALL,
  advancedOf,
  careerEndAge,
  clamp,
  clampAttr,
  isCareerOver,
  overallSpine,
  refreshOverall,
  rollApexAge,
  rollPotential,
  round1,
  round2,
  twilightOf,
  weightedSkill,
} from "./peak";
import type {
  ArchiveCareer,
  AttrKey,
  Contract,
  DraftCard,
  DevRow,
  Fx,
  HiddenKey,
  MarketOffer,
  PlayoffChoice,
  PlayerState,
  Role,
  SavedStoryScript,
  SeasonRow,
  StandingRow,
  StoryEvent,
  Team,
} from "./types";

export { pick, rand, randInt } from "./rng";
export { ENGINE_VERSION } from "./config";
export {
  MAX_AGE,
  PEAK_AGE,
  START_OVERALL,
  apexAgeOf,
  careerEndAge,
  clamp,
  clampAttr,
  computeOverall,
  displayOverall,
  isCareerOver,
  offseasonStep,
  overallSpine,
  realizationOf,
  realizedPeak,
  refreshOverall,
  rollApexAge,
  rollPotential,
  round1,
  round2,
  shouldOfferExtraYear,
  twilightOf,
  weightedSkill,
} from "./peak";

function newSeed() {
  return ((Date.now() ^ ((Math.random() * 0xffffffff) | 0)) >>> 0) || 1;
}

export function withPlayer<T>(s: PlayerState, fn: () => T): T {
  if (!s.seed) {
    s.seed = newSeed();
    s.rngState = s.seed;
  }
  if (rngDepth() > 0) return fn();
  const rng = createRng(s.seed);
  rng.setState(s.rngState || s.seed);
  return runWithRng(rng, () => {
    const out = fn();
    s.rngState = rng.getState();
    return out;
  });
}

/** Quanto un evento sposta l'overall: età, ruolo, contenuto della scelta. */
export function contextualPulse(s: PlayerState, fx: Fx): number {
  const ageW = s.age <= 22 ? 1.18 : s.age <= 26 ? 1 : s.age <= 31 ? 0.64 : 0.4;
  const w = ROLES[s.role].weights;
  let attrHit = 0;
  if (fx.attrs) {
    (Object.keys(fx.attrs) as AttrKey[]).forEach((k) => {
      attrHit += (fx.attrs![k] || 0) * (w[k] ?? 0.1);
    });
  }
  const h = fx.hidden || {};
  const hiddenHit =
    (h.workEthic || 0) * 0.038 +
    (h.motor || 0) * 0.022 +
    (h.durability || 0) * 0.02 +
    (h.consistency || 0) * 0.016 +
    (h.clutch || 0) * 0.014 +
    (h.chemistry || 0) * 0.01 -
    Math.abs(h.ego || 0) * 0.005 +
    (h.mediaSavvy || 0) * 0.004;
  const formHit = (fx.form || 0) * 0.16;
  const devHit = (fx.development || 0) * 0.26;
  const injuryHit = -((fx.injuryDrag || 0) * 0.2 + (fx.injuryRisk || 0) * 0.012);
  const soft =
    (fx.publicImage || 0) * 0.007 +
    (fx.coachTrust || 0) * 0.009 +
    (fx.morale || 0) * 0.008 +
    (fx.rivalry || 0) * 0.004 -
    (fx.gamesPenalty || 0) * 0.004;
  const raw = (attrHit * 0.2 + hiddenHit + formHit + devHit + injuryHit + soft) * ageW;
  const signed = Math.abs(raw) < 0.035 ? (raw >= 0 ? 0.045 : -0.04) * ageW : raw;
  return round2(clamp(signed, SIM.choice.eventMin, SIM.choice.eventMax));
}

export function imprint(s: PlayerState, delta: number) {
  const cur = Number.isFinite(s.choiceOvr) ? s.choiceOvr : 0;
  const cap = delta >= 0 ? SIM.choice.max : -SIM.choice.min;
  const room = delta >= 0 ? SIM.choice.max - cur : cur - SIM.choice.min;
  const damp = 0.28 + 0.72 * clamp(room / Math.max(0.5, cap), 0, 1);
  s.choiceOvr = round2(clamp(cur + delta * damp, SIM.choice.min, SIM.choice.max));
  return refreshOverall(s);
}

export function cardRoleScale(role: Role, key: AttrKey) {
  const w = ROLES[role].weights[key] ?? 0.1;
  return clamp(0.74 + w * 2.05, 0.72, 1.26);
}

export function scaledDraftCard(role: Role, card: DraftCard): DraftCard {
  return {
    ...card,
    primary: {
      key: card.primary.key,
      delta: round1(card.primary.delta * cardRoleScale(role, card.primary.key)),
    },
    secondary: card.secondary.map((sec) => ({
      key: sec.key,
      delta: round1(sec.delta * (sec.delta < 0 ? 1 : cardRoleScale(role, sec.key))),
    })),
  };
}

/** Dieci round: otto mestiere + due carattere. */
export function allDraftRounds() {
  return [...DRAFT_ROUNDS, ...CHARACTER_ROUNDS];
}

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    const t = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = t;
  }
  return arr;
}

/** Tre schede su quattro, pesate sul ruolo. La mano cambia ogni vita. */
export function dealDraftRound(s: PlayerState) {
  const round = allDraftRounds()[s.round];
  if (!round) {
    s.draftHand = [];
    return s.draftHand;
  }
  const w = ROLES[s.role].weights;
  const pool = [...round.cards];
  const weights = pool.map((c) => {
    let fit = 0.16 + (w[c.primary.key] ?? 0.08) * 2.5;
    for (const sec of c.secondary) {
      const sign = sec.delta >= 0 ? 1 : 0.35;
      fit += (w[sec.key] ?? 0.05) * 0.65 * sign;
    }
    return Math.max(0.1, fit);
  });
  const hand: DraftCard[] = [];
  const used = new Set<number>();
  while (hand.length < 3 && used.size < pool.length) {
    let sum = 0;
    const live: number[] = [];
    for (let i = 0; i < pool.length; i++) {
      if (used.has(i)) continue;
      live.push(i);
      sum += weights[i]!;
    }
    let r = rand() * sum;
    let pickI = live[live.length - 1]!;
    for (const i of live) {
      r -= weights[i]!;
      if (r <= 0) {
        pickI = i;
        break;
      }
    }
    used.add(pickI);
    hand.push(pool[pickI]!);
  }
  s.draftHand = shuffleInPlace(hand);
  return s.draftHand;
}

export function fillTemplate(text: string, s: PlayerState) {
  const out = text
    .replace(/__RIVAL__/g, s.rivalName || "il rivale")
    .replace(/__COACH__/g, s.coachName || "Coach")
    .replace(/__TEAM__/g, s.team?.name || "la squadra")
    .replace(/__CITY__/g, s.team?.city || "questa città");
  return fillVars(out, sceneVars(s));
}

export function applyFx(s: PlayerState, fx: Fx) {
  const d = diffOf(s);
  if (fx.attrs) {
    const ageS = s.age <= 23 ? 1.22 : s.age <= 27 ? 1 : s.age <= 31 ? 0.7 : 0.45;
    (Object.keys(fx.attrs) as AttrKey[]).forEach((k) => {
      const raw = fx.attrs![k] || 0;
      const cur = s.attrs[k];
      const dim = cur >= 88 ? 0.32 : cur >= 80 ? 0.5 : cur >= 70 ? 0.72 : 1;
      s.attrs[k] = clampAttr(cur + raw * ageS * dim * d.growth);
    });
  }
  if (fx.hidden) {
    (Object.keys(fx.hidden) as HiddenKey[]).forEach((k) => {
      s.hidden[k] = clamp(s.hidden[k] + (fx.hidden![k] || 0), 0, 100);
    });
  }
  if (fx.development) s.development = round1(clamp(s.development + fx.development * d.growth, -8, 16));
  if (fx.form) s.form = clamp(s.form + fx.form, -12, 12);
  if (fx.injuryRisk) s.injuryRisk = clamp(s.injuryRisk + fx.injuryRisk * d.injury, 0, 100);
  if (fx.injuryDrag) s.injuryDrag = clamp(s.injuryDrag + fx.injuryDrag * d.injury, 0, 18);
  if (fx.publicImage) s.publicImage = clamp(s.publicImage + fx.publicImage, 0, 100);
  if (fx.coachTrust) s.coachTrust = clamp(s.coachTrust + fx.coachTrust, 0, 100);
  if (fx.rivalry) s.rivalry = clamp(s.rivalry + fx.rivalry, 0, 100);
  if (fx.morale) s.morale = clamp(s.morale + fx.morale, 0, 100);
  if (fx.gamesPenalty) s.gamesPenalty += Math.round(fx.gamesPenalty * d.injury);
  imprint(s, contextualPulse(s, fx));
}

export function applyAging(s: PlayerState) {
  lockExperimentEthic(s);
  s.age += 1;
  // Le scelte recenti pesano di più: l'impronta non resta inchiodata al tetto.
  s.choiceOvr = round2(clamp((s.choiceOvr || 0) * 0.86, SIM.choice.min, SIM.choice.max));
  const dur = s.hidden.durability / 100;
  const ethic = s.hidden.workEthic / 100;
  const motor = s.hidden.motor / 100;
  const guard = s.role === "PG" || s.role === "SG";
  if (s.age >= 24 && s.age <= SIM.aging.iqGainUntil) {
    s.attrs.iq = clampAttr(s.attrs.iq + 0.45 + ethic * 0.2);
  }
  if (s.age > SIM.aging.athDropAfter) {
    const slasher = s.attrs.athleticism >= s.attrs.shooting && s.attrs.athleticism >= s.attrs.iq;
    const athDrop = (0.5 + (1 - dur) * 0.55 + (1 - motor) * 0.3) * (s.age > 32 ? 1.35 : 1) * (slasher ? 1.18 : 1);
    s.attrs.athleticism = clampAttr(s.attrs.athleticism - athDrop);
  }
  if (s.age > SIM.aging.strengthDropAfter) {
    s.attrs.strength = clampAttr(s.attrs.strength - (guard ? 0.45 : 0.7) * (1.15 - dur * 0.4));
    s.injuryRisk = clamp(s.injuryRisk + 1.15 * (1.35 - dur), 0, 100);
  }
  if (s.age > SIM.aging.shootingDropAfter) {
    const shooter = s.attrs.shooting >= 62;
    s.attrs.shooting = clampAttr(s.attrs.shooting - (guard ? 0.18 : 0.32) * (shooter ? 0.72 : 1));
    s.hidden.motor = clamp(s.hidden.motor - 1.4 * (1.2 - ethic * 0.3), 0, 100);
    s.development = round1(clamp(s.development - 0.28, -8, 16));
  }
  if (s.age > 33) {
    s.hidden.motor = clamp(s.hidden.motor - 1.6, 0, 100);
    s.injuryDrag = clamp(s.injuryDrag + 0.4 * (1.3 - dur), 0, 18);
    s.attrs.athleticism = clampAttr(s.attrs.athleticism - 0.45);
  }
  if (s.age <= 24) s.development = round1(clamp(s.development + 0.12 * ethic, -8, 16));
  const bloom =
    s.age >= 24 &&
    s.age <= 28 &&
    s.potential >= 86 &&
    s.hidden.workEthic >= 70 &&
    s.overall < s.potential - 10;
  if (bloom) s.development = round1(clamp(s.development + 0.22, -8, 16));
  if (s.potential >= 90 && s.hidden.workEthic <= 40 && s.age <= 25) {
    s.development = round1(clamp(s.development - 0.22, -8, 16));
  }
  s.form *= 0.68;
  s.gamesPenalty = 0;
  refreshOverall(s);
}

function weightedPick(weights: Record<string, number>) {
  const entries = Object.entries(weights);
  const r = rand();
  let acc = 0;
  for (const [k, w] of entries) {
    acc += w;
    if (r <= acc) return k;
  }
  return entries[entries.length - 1]![0];
}

function pickCoherentTeam(s: PlayerState, pool: Team[], tierWeights: Record<string, number>, exclude?: string | readonly string[]) {
  const skip = new Set(typeof exclude === "string" ? [exclude] : exclude ?? []);
  const scored = pool
    .filter((t) => !skip.has(t.name))
    .map((t) => {
      const fit = offerFit(s, t.abbr);
      const tw = tierWeights[t.tier] ?? 0.08;
      return { t, sc: Math.max(0.2, fit * (0.35 + tw)) };
    });
  scored.sort((a, b) => b.sc - a.sc);
  const top = scored.slice(0, 10);
  return cloneTeam(weightedFrom(top.map((x) => x.t), top.map((x) => x.sc)));
}

function pickFitTeam(s: PlayerState, tierWeights: Record<string, number>, exclude?: string | readonly string[]) {
  return pickCoherentTeam(s, NBA_TEAMS, tierWeights, exclude);
}

export function pickWeightedTeam(pool: Team[], tierWeights: Record<string, number>, exclude?: string | readonly string[]) {
  const skip = new Set(typeof exclude === "string" ? [exclude] : exclude ?? []);
  const tier = weightedPick(tierWeights);
  let candidates = pool.filter((t) => t.tier === tier && !skip.has(t.name));
  if (!candidates.length) candidates = pool.filter((t) => !skip.has(t.name));
  return cloneTeam(pick(candidates));
}

export function freshPlayer(
  name: string,
  role: Role,
  nationality: string,
  number: number,
  difficulty: DifficultyId = "pro",
  seed?: number,
): PlayerState {
  const spec = DIFF_MAP[difficulty] ?? DIFF_MAP.pro;
  const s: PlayerState = {
    name: name || "Il Rookie",
    role,
    nationality,
    number,
    attrs: {
      shooting: 25,
      handle: 25,
      passing: 25,
      defense: 25,
      rebounding: 25,
      athleticism: 25,
      strength: 25,
      iq: 25,
    },
    hidden: {
      clutch: 47,
      durability: 54,
      workEthic: 55,
      ego: 39,
      chemistry: 54,
      consistency: 49,
      motor: 53,
      mediaSavvy: 46,
    },
    age: 20,
    talent: 40,
    development: 0,
    form: 0,
    injuryRisk: 10,
    injuryDrag: 0,
    gamesPenalty: 0,
    publicImage: 50,
    coachTrust: 55,
    rivalry: 15,
    morale: 55,
    overall: START_OVERALL,
    peakOverall: START_OVERALL,
    potential: 72,
    startAge: 20,
    apexAge: 27,
    draftPick: 0,
    rookReady: 0,
    draftEdge: 0,
    team: { ...UNSIGNED_TEAM },
    league: "NBA",
    contract: {
      teamName: "",
      years: 3,
      yearsRemaining: 3,
      annualM: 4.2,
      kind: "rookie",
    },
    originPath: "",
    rivalName: "",
    coachName: "",
    round: 0,
    season: 0,
    extraSeason: false,
    international: false,
    medal: false,
    allStarCount: 0,
    mvpCount: 0,
    allNbaCount: 0,
    dpoyCount: 0,
    roy: false,
    titleCount: 0,
    fmvpCount: 0,
    careerPoints: 0,
    careerRebounds: 0,
    careerAssists: 0,
    careerSteals: 0,
    careerBlocks: 0,
    seasonHistory: [],
    milestones: [],
    devLog: [],
    usedEventIds: [],
    heardLines: [],
    lastOffseasonId: "",
    choiceLog: [],
    yearsOnTeam: 0,
    teamPower: initTeamPower(),
    currentLeague: null,
    playoff: null,
    royClass: [],
    championLog: TITLE_SEED.map((t) => ({ ...t })),
    difficulty,
    simulated: false,
    careerId: newCareerId(),
    seed: seed ?? newSeed(),
    rngState: 0,
    engineVersion: ENGINE_VERSION,
    draftHand: [],
    choiceOvr: 0,
  };
  s.rngState = s.seed;
  if (TUNING.world === "jitter") {
    // Seeded spread of starting power: different worlds start from different pecking orders.
    for (const abbr of Object.keys(s.teamPower)) {
      const h = seedHash(s.seed, abbr.charCodeAt(0) * 131 + abbr.charCodeAt(1) * 17 + abbr.charCodeAt(2));
      s.teamPower[abbr] = clamp((s.teamPower[abbr] ?? 70) + ((h % 1301) / 100 - 6.5), 42, 96);
    }
  }
  withPlayer(s, () => {
    s.hidden.clutch = 42 + randInt(0, 10);
    s.hidden.durability = 48 + randInt(0, 12);
    s.hidden.workEthic = 50 + randInt(0, 10);
    s.hidden.ego = 32 + randInt(0, 14);
    s.hidden.chemistry = 50 + randInt(0, 8);
    s.hidden.consistency = 44 + randInt(0, 10);
    s.hidden.motor = 48 + randInt(0, 10);
    s.hidden.mediaSavvy = 40 + randInt(0, 12);
    s.potential = round1(clamp(rollPotential() + spec.potential, 64, 99));
    s.world = createWorld(s.teamPower);
    dealDraftRound(s);
  });
  const origin = NAT_ORIGIN[nationality];
  if (origin) {
    (Object.keys(origin.attrs) as AttrKey[]).forEach((k) => {
      const d = origin.attrs[k];
      if (d) s.attrs[k] = clampAttr(s.attrs[k] + d);
    });
    if (origin.hidden) {
      (Object.keys(origin.hidden) as HiddenKey[]).forEach((k) => {
        const d = origin.hidden![k];
        if (d) s.hidden[k] = clamp(s.hidden[k] + d, 0, 100);
      });
    }
  }
  s.lang = getLang();
  return s;
}

export function cardValue(role: Role, card: DraftCard): number {
  const scaled = scaledDraftCard(role, card);
  const w = ROLES[role].weights;
  let score = scaled.primary.delta * (w[scaled.primary.key] ?? 0.1);
  for (const sec of scaled.secondary) score += sec.delta * (w[sec.key] ?? 0.05) * 0.65;
  const h = card.hidden || {};
  score +=
    (h.workEthic || 0) * 0.16 +
    (h.motor || 0) * 0.08 +
    (h.consistency || 0) * 0.08 +
    (h.durability || 0) * 0.05 +
    (h.clutch || 0) * 0.06 -
    Math.abs(h.ego || 0) * 0.02;
  return score;
}

function handPick(s: PlayerState, which: "best" | "worst"): number {
  const hand = s.draftHand;
  if (!hand.length) return 0;
  let idx = 0;
  let mark = cardValue(s.role, hand[0]!);
  for (let i = 1; i < hand.length; i++) {
    const v = cardValue(s.role, hand[i]!);
    if (which === "best" ? v > mark : v < mark) {
      mark = v;
      idx = i;
    }
  }
  return idx;
}

export function applyDraftCard(s: PlayerState, roundIndex: number, cardIndex: number) {
  withPlayer(s, () => applyDraftCardInner(s, roundIndex, cardIndex));
}

function applyDraftCardInner(s: PlayerState, roundIndex: number, cardIndex: number) {
  const raw =
    s.draftHand[cardIndex] ??
    allDraftRounds()[roundIndex]?.cards[cardIndex] ??
    allDraftRounds()[roundIndex]?.cards[0];
  if (!raw) return;
  const card = scaledDraftCard(s.role, raw);
  if (s.draftHand.length) {
    const scores = s.draftHand.map((c) => cardValue(s.role, c));
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const picked = scores[Math.min(cardIndex, scores.length - 1)] ?? mean;
    s.draftEdge = round2((s.draftEdge || 0) + (picked - mean));
  }
  s.attrs[card.primary.key] = clampAttr(s.attrs[card.primary.key] + card.primary.delta);
  const attrFx: Partial<Record<AttrKey, number>> = { [card.primary.key]: card.primary.delta };
  card.secondary.forEach((sec) => {
    s.attrs[sec.key] = clampAttr(s.attrs[sec.key] + sec.delta);
    attrFx[sec.key] = (attrFx[sec.key] || 0) + sec.delta;
  });
  if (card.hidden) {
    (Object.keys(card.hidden) as HiddenKey[]).forEach((k) => {
      s.hidden[k] = clamp(s.hidden[k] + (card.hidden![k] || 0), 0, 100);
    });
  }
  const pulse = contextualPulse(s, { attrs: attrFx, hidden: card.hidden, flavor: card.name }) * 0.55;
  imprint(s, pulse);
  s.rookReady = round2(clamp((s.rookReady || 0) + pulse * 1.4 + rookReadyFromCard(card), 0, 18));
  s.round += 1;
  dealDraftRound(s);
  s.overall = START_OVERALL;
  s.peakOverall = START_OVERALL;
}

function rookReadyFromCard(card: DraftCard) {
  const h = card.hidden || {};
  return (
    (h.workEthic || 0) * 0.12 +
    (h.motor || 0) * 0.08 +
    (h.clutch || 0) * 0.1 +
    (h.consistency || 0) * 0.06 +
    card.primary.delta * 0.04
  );
}

export function finishDraft(s: PlayerState) {
  s.talent = weightedSkill(s);
  const fit = clamp((s.talent - 62) * 0.18, -2.4, 3.2);
  s.potential = round1(clamp(s.potential + fit, 64, 99));
  refreshOverall(s);
  s.rngState = seasonRngSeed(s.seed);
}

export function calibrateStart(s: PlayerState) {
  s.startAge = s.age;
  s.form = 0;
  s.injuryDrag = 0;
  if (!s.apexAge || s.apexAge < 26 || s.apexAge > 28) s.apexAge = rollApexAge(s);
}

export function startProPath(
  s: PlayerState,
  path: "NCAA" | "Europa" | "G-League",
) {
  return withPlayer(s, () => applyOriginPathInner(s, path));
}

function applyOriginPathInner(s: PlayerState, path: "NCAA" | "Europa" | "G-League") {
  s.originPath = path;
  const pathOvr = SIM.path?.[path]?.ovr ?? (path === "Europa" ? 1.45 : path === "NCAA" ? 1.2 : 0.9);
  if (path === "NCAA") {
    s.age = 21;
    s.hidden.consistency = clamp(s.hidden.consistency + 5, 0, 100);
    s.hidden.workEthic = clamp(s.hidden.workEthic + 4, 0, 100);
    s.attrs.iq = clampAttr(s.attrs.iq + 1.6);
    s.attrs.passing = clampAttr(s.attrs.passing + 0.5);
    s.coachTrust = clamp(s.coachTrust + 8, 0, 100);
    s.publicImage = clamp(s.publicImage + 4, 0, 100);
    s.development = round1(s.development + 0.35);
  } else if (path === "Europa") {
    s.age = 19;
    s.attrs.iq = clampAttr(s.attrs.iq + 2.6);
    s.attrs.passing = clampAttr(s.attrs.passing + 1.4);
    s.attrs.shooting = clampAttr(s.attrs.shooting + 0.6);
    s.hidden.chemistry = clamp(s.hidden.chemistry + 5, 0, 100);
    s.hidden.consistency = clamp(s.hidden.consistency + 3, 0, 100);
    s.hidden.motor = clamp(s.hidden.motor - 1, 0, 100);
    s.coachTrust = clamp(s.coachTrust + 4, 0, 100);
    s.development = round1(s.development + 0.2);
  } else {
    s.age = 19;
    s.attrs.athleticism = clampAttr(s.attrs.athleticism + 1.8);
    s.attrs.strength = clampAttr(s.attrs.strength + 0.6);
    s.attrs.handle = clampAttr(s.attrs.handle + 0.5);
    s.hidden.motor = clamp(s.hidden.motor + 6, 0, 100);
    s.hidden.workEthic = clamp(s.hidden.workEthic + 2, 0, 100);
    s.hidden.consistency = clamp(s.hidden.consistency - 3, 0, 100);
    s.injuryRisk = clamp(s.injuryRisk + 4, 0, 100);
    s.coachTrust = clamp(s.coachTrust + 2, 0, 100);
    s.development = round1(s.development + 0.7);
  }
  const ready = Number.isFinite(s.rookReady) ? s.rookReady : 0;
  const drafted = Number.isFinite(s.choiceOvr) ? s.choiceOvr : 0;
  s.choiceOvr = round2(clamp(drafted * 0.55 + ready * 0.22 + pathOvr, SIM.choice.min, SIM.choice.max));
  calibrateStart(s);
  refreshOverall(s);
  s.team = { ...UNSIGNED_TEAM };
  return s.overall;
}

export function revealDraftLanding(s: PlayerState): { pick: number; team: Team } {
  return withPlayer(s, () => revealDraftLandingInner(s));
}

/** Dopo il draft le stagioni ripartono da un seme proprio. Le carte non spostano i dadi dell'anno. */
export function seasonRngSeed(seed: number): number {
  const n = (Math.imul(seed >>> 0, 0x9e3779b1) ^ 0x85ebca6b) >>> 0;
  return n || 1;
}

function playerDraftStock(s: PlayerState): number {
  const ready = Number.isFinite(s.rookReady) ? s.rookReady : 0;
  const skill = weightedSkill(s);
  let stock = ready * 1.2 + (s.potential - 72) * 0.42 + (skill - 62) * 0.9 + (s.overall - 60) * 0.28;
  if (s.originPath === "NCAA") stock += 3.4;
  else if (s.originPath === "Europa") stock += 1.2;
  else if (s.originPath === "G-League") stock -= 2.2;
  stock += (s.hidden.workEthic - 50) * 0.04;
  stock += (rand() - 0.5) * 7;
  return stock;
}

export function draftStockOf(s: PlayerState): number {
  return playerDraftStock(s);
}

function revealDraftLandingInner(s: PlayerState): { pick: number; team: Team } {
  const stock = playerDraftStock(s);
  const t = clamp((stock + 6) / 36, 0, 1);
  const mean = 48 - t * 42;
  const pickN = clamp(Math.round(mean + (rand() - 0.5) * 16), 1, 60);
  s.draftPick = pickN;
  const tierW =
    pickN <= 14
      ? { rebuilding: 0.62, mid: 0.28, contender: 0.1 }
      : pickN <= 30
        ? { rebuilding: 0.28, mid: 0.5, contender: 0.22 }
        : { rebuilding: 0.18, mid: 0.4, contender: 0.42 };
  const team = pickWeightedTeam(NBA_TEAMS, tierW);
  s.team = team;
  const years = pickN <= 14 ? 4 : pickN <= 30 ? 3 : 2;
  const annual = pickN <= 5 ? 9.2 : pickN <= 14 ? 6.4 : pickN <= 30 ? 4.1 : 2.4;
  s.contract = { teamName: team.name, years, yearsRemaining: years, annualM: round1(annual), kind: "rookie" };
  s.league = "NBA";
  s.yearsOnTeam = 0;
  s.teamPower = s.teamPower && Object.keys(s.teamPower).length ? s.teamPower : initTeamPower();
  const pwr = s.teamPower[s.team.abbr] ?? s.team.power;
  s.team = cloneTeam(s.team, pwr);
  occupyTeamSlot(s);
  seedRookieClass(s);
  return { pick: pickN, team: s.team };
}

export function phaseFor(n: number, age = 20): "rookie" | "prime" | "veteran" {
  if (age >= 32 || n >= 12) return "veteran";
  if (n <= 2) return "rookie";
  return "prime";
}

type ProcKind = "corpo" | "sfida" | "contratto" | "freddo" | "caldo" | "panchina" | "anni" | "numeri" | "ruolo";

/**
 * Offer and trade pitches stay in the engine's canonical Italian; the screen translates them
 * (src/lib/pivot/narrative). Saves and RNG are the same in every language.
 */
function localizePitch(_s: PlayerState, _kind: string, _team: string, pitch: string): string {
  return pitch;
}

function priorLine(s: PlayerState): string {
  const row = s.seasonHistory[s.seasonHistory.length - 1];
  if (!row || !Number.isFinite(row.ppg)) return "";
  const bits = [`${row.ppg.toFixed(1)} punti`];
  if (row.rpg >= 3.5) bits.push(`${row.rpg.toFixed(1)} rimbalzi`);
  if (row.apg >= 2.5) bits.push(`${row.apg.toFixed(1)} assist`);
  if (row.spg + row.bpg >= 1.5) bits.push(`${row.spg.toFixed(1)} palle rubate e ${row.bpg.toFixed(1)} stoppate`);
  return `L'anno prima hai chiuso a ${bits.slice(0, 3).join(", ")}.`;
}

function procSignal(s: PlayerState): ProcKind | null {
  if (s.injuryRisk >= 58) return "corpo";
  if (s.rivalry >= 64) return "sfida";
  if ((s.contract?.yearsRemaining ?? 9) <= 1 && s.season > 2) return "contratto";
  if (s.form <= -1.5) return "freddo";
  if (s.form >= 3 && s.overall >= 78) return "caldo";
  if (s.coachTrust <= 36) return "panchina";
  if (s.age >= 33) return "anni";
  const prev = s.seasonHistory[s.seasonHistory.length - 1];
  if (prev && (prev.ppg >= 16 || prev.spg + prev.bpg >= 2)) return "numeri";
  return null;
}

function maybeProcedural(s: PlayerState): StoryEvent | null {
  const strong = procSignal(s);
  if (strong) return rand() < 0.7 ? buildProcedural(s, strong) : null;
  return rand() < 0.36 ? buildProcedural(s, "ruolo") : null;
}

function proceduralFromId(s: PlayerState, id: string): StoryEvent | null {
  const m = /^proc-(corpo|sfida|contratto|freddo|caldo|panchina|anni|numeri|ruolo)-(\d+)$/.exec(id);
  if (!m) return null;
  return buildProcedural(s, m[1] as ProcKind, Number(m[2]));
}

function buildProcedural(s: PlayerState, kind: ProcKind, season = s.season): StoryEvent {
  return buildProceduralIt(s, kind, season);
}

function buildProceduralIt(s: PlayerState, kind: ProcKind, season = s.season): StoryEvent {
  const team = s.team?.name || "la squadra";
  const rival = s.rivalName || "il rivale";
  const phase = phaseFor(season, s.age);
  const id = `proc-${kind}-${season}`;
  const prior = priorLine(s);
  const told = (line: string) => (prior ? `${line} ${prior}` : line);
  if (kind === "corpo") {
    return {
      id,
      phase,
      title: `A ${s.age} anni il corpo manda il conto`,
      subtitle: told(`${s.age} anni, ${team}. Il ginocchio avvisa prima del referto. Come rispondi?`),
      choices: [
        {
          label: "Tagli i minuti",
          detail: "Meno partite, più giorni interi.",
          fx: () => ({
            gamesPenalty: 8,
            injuryRisk: -6,
            development: 0.25,
            flavor: say(s, [
              "Esci prima. Il referto, il giorno dopo, è più corto.",
              "Salti due chiusure. Il passo, al rientro, è il tuo.",
            ]),
          }),
        },
        {
          label: "Giochi comunque",
          detail: "Il gruppo ha bisogno di te stasera.",
          fx: () => ({
            form: 0.4,
            injuryRisk: 6,
            publicImage: 2,
            flavor: say(s, [
              "Resti in campo. Il pubblico lo vede. Il corpo anche.",
              "Chiudi la partita zoppicando. La vittoria non cura il ginocchio.",
            ]),
          }),
        },
        {
          label: "Lavoro in palestra, lontano",
          detail: "Niente applausi. Solo il gesto corretto.",
          fx: () => ({
            injuryRisk: -3,
            hidden: { workEthic: 3, durability: 2 },
            attrs: { iq: 0.3 },
            flavor: "La porta della palestra si chiude. Fuori non succede niente. Dentro sì.",
          }),
        },
      ],
    };
  }
  if (kind === "sfida") {
    return {
      id,
      phase,
      title: `A ${s.age} anni ${rival} ti cerca`,
      subtitle: told(`${rival} tiene il conto, e ${team} lo sa. Non è un discorso. È una partita.`),
      choices: [
        {
          label: "Gli rispondi a canestro",
          detail: "Il primo possesso è tuo.",
          fx: () => ({
            rivalry: 8,
            form: 0.8,
            attrs: { shooting: 0.35 },
            flavor: `${rival} parla. Tu segni. La discussione finisce sul tabellone.`,
          }),
        },
        {
          label: "Lo ignori",
          detail: "Il sistema vale più del duello.",
          fx: () => ({
            coachTrust: 4,
            rivalry: 2,
            hidden: { ego: -2, chemistry: 2 },
            flavor: "Non lo guardi. L'allenatore, dagli spalti, se ne accorge.",
          }),
        },
        {
          label: "Alzi il tono in sala stampa",
          detail: "Una frase, e la città si accende.",
          fx: () => ({
            rivalry: 12,
            publicImage: s.hidden.mediaSavvy >= 55 ? 4 : -3,
            hidden: { ego: 3 },
            flavor: s.hidden.mediaSavvy >= 55
              ? "La frase resta. La città sta dalla tua parte."
              : "La frase resta. Il giorno dopo sembra più grande di te.",
          }),
        },
      ],
    };
  }
  if (kind === "contratto") {
    return {
      id,
      phase,
      title: `A ${s.age} anni scade il contratto`,
      subtitle: told(`${s.age} anni, ${team}. A giugno il foglio scade. Ogni possesso, da qui, ha un prezzo.`),
      choices: [
        {
          label: "Gioca per il rinnovo",
          detail: "Numeri puliti, zero teatro.",
          fx: () => ({
            development: 0.45,
            form: 0.5,
            hidden: { consistency: 3 },
            flavor: "Non chiedi niente a microfono acceso. Chiedi con le medie.",
          }),
        },
        {
          label: "Chiedi di cambiare aria",
          detail: "Meglio una panchina onesta che un anno finto.",
          fx: () => ({
            coachTrust: -4,
            publicImage: 1,
            hidden: { ego: 2 },
            flavor: "Lo dici all'agente, poi allo staff. La voce arriva prima del comunicato.",
          }),
        },
        {
          label: "Sta' zitto e produci",
          detail: "Il mercato parla a giugno.",
          fx: () => ({
            development: 0.3,
            hidden: { workEthic: 2, ego: -1 },
            flavor: "Nessuna dichiarazione. A giugno i numeri sono già sul tavolo.",
          }),
        },
      ],
    };
  }
  if (kind === "freddo") {
    return {
      id,
      phase,
      title: `A ${s.age} anni il ferro è freddo`,
      subtitle: told(`${team} vince e perde. Il tuo tiro, in queste settimane, non collabora.`),
      choices: [
        {
          label: "Tiri ancora",
          detail: "La fiducia si allena, non si aspetta.",
          fx: () => ({
            form: 0.7,
            hidden: { clutch: 2, ego: 1 },
            attrs: { shooting: 0.25 },
            flavor: "Il primo non entra. Il quarto sì. Lo spogliatoio respira.",
          }),
        },
        {
          label: "Servi gli altri",
          detail: "Il canestro può aspettare. Il compagno no.",
          fx: () => ({
            coachTrust: 4,
            hidden: { chemistry: 3, ego: -2 },
            attrs: { passing: 0.4 },
            flavor: "Smetti di cercare il tuo tiro. La squadra trova il suo.",
          }),
        },
        {
          label: "Una settimana di lavoro muto",
          detail: "Niente interviste finché il gesto non torna.",
          fx: () => ({
            form: 0.35,
            development: 0.3,
            hidden: { workEthic: 3 },
            flavor: "Chiudi la porta. Quando la riapri, il rilascio è di nuovo il tuo.",
          }),
        },
      ],
    };
  }
  if (kind === "caldo") {
    return {
      id,
      phase,
      title: `A ${s.age} anni la città ti cerca`,
      subtitle: told(`${s.age} anni, e il gioco si vede dal primo quarto. ${team} ti mette al centro di tutto.`),
      choices: [
        {
          label: "Ti prendi i possessi",
          detail: "Quando entra, non lo restituisci.",
          fx: () => ({
            form: 0.9,
            publicImage: 3,
            hidden: { ego: 3, clutch: 2 },
            flavor: "Il pallone resta nelle tue mani. Qualcuno deve fare spazio.",
          }),
        },
        {
          label: "Lo dividi",
          detail: "Il momento è della squadra, non solo tuo.",
          fx: () => ({
            coachTrust: 5,
            hidden: { chemistry: 4, ego: -2 },
            attrs: { passing: 0.35 },
            flavor: "Un assist al momento giusto vale più di un altro canestro tuo.",
          }),
        },
        {
          label: "Abbassi il volume",
          detail: "Niente copertine. Domani c'è un'altra partita.",
          fx: () => ({
            hidden: { consistency: 3, workEthic: 2 },
            development: 0.25,
            flavor: "Esci dall'ingresso secondario. Il lavoro di domani è già scritto.",
          }),
        },
      ],
    };
  }
  if (kind === "panchina") {
    return {
      id,
      phase,
      title: `A ${s.age} anni i minuti non arrivano`,
      subtitle: told(`L'allenatore di ${team} non ti cerca. Il quinto posto in panchina, invece, ti conosce per nome.`),
      choices: [
        {
          label: "Chiedi un chiarimento",
          detail: "Una frase chiara, a porte chiuse.",
          fx: () => ({
            coachTrust: 3,
            hidden: { ego: 1 },
            flavor: "Non alzi la voce. Chiedi il perché. La risposta, almeno, è vera.",
          }),
        },
        {
          label: "Resti pronto",
          detail: "Quando ti chiama, tu sei già in piedi.",
          fx: () => ({
            coachTrust: 5,
            form: 0.3,
            hidden: { consistency: 2, workEthic: 2 },
            flavor: "Entri a metà quarto. Il primo possesso è pulito. L'allenatore annuisce.",
          }),
        },
        {
          label: "Cerchi un'altra porta",
          detail: "Meglio un ruolo vero, anche altrove.",
          fx: () => ({
            coachTrust: -3,
            publicImage: 1,
            flavor: "L'agente fa due telefonate. Tu, intanto, continui a scaldarti.",
          }),
        },
      ],
    };
  }
  if (kind === "anni") {
    return {
      id,
      phase,
      title: `A ${s.age} anni il primo passo è più corto`,
      subtitle: told(`${s.age} anni. Il salto non è più quello dei venti. Il gioco, se vuoi, può esserlo.`),
      choices: [
        {
          label: "Cambi il modo",
          detail: "Meno esplosione, più lettura.",
          fx: () => ({
            attrs: { iq: 0.45, athleticism: -0.15 },
            hidden: { consistency: 2 },
            development: 0.2,
            flavor: "Arrivi un passo prima, non un palmo più in alto. Basta, e avanza.",
          }),
        },
        {
          label: "Insisti sul fisico",
          detail: "Un'altra estate di pesi e corsa.",
          fx: () => ({
            injuryRisk: 4,
            attrs: { athleticism: 0.25 },
            hidden: { motor: 2, durability: -1 },
            flavor: "Il corpo risponde ancora. Non per tutta la stagione, ma risponde.",
          }),
        },
        {
          label: "Fai giocare i giovani",
          detail: "Il tuo valore, adesso, è anche il loro.",
          fx: () => ({
            coachTrust: 4,
            publicImage: 2,
            hidden: { chemistry: 3, ego: -2 },
            flavor: "Un consiglio a bordo campo vale un canestro che non segni più.",
          }),
        },
      ],
    };
  }
  if (kind === "numeri") {
    const row = s.seasonHistory[s.seasonHistory.length - 1];
    const ppg = row?.ppg ?? s.overall / 4;
    const heavy = ppg >= 22;
    return {
      id,
      phase,
      title: `A ${s.age} anni i numeri chiedono un ruolo`,
      subtitle: told(
        heavy
          ? `${ppg.toFixed(1)} punti non stanno in un ruolo da quinto violino. ${team} deve decidere chi comanda.`
          : `Le cifre dell'anno prima sono già un argomento. ${team} può alzare il tuo uso, o tenerti dov'eri.`,
      ),
      choices: [
        {
          label: heavy ? "Chiedi i possessi" : "Chiedi più minuti",
          detail: "Il ruolo deve somigliare alle cifre.",
          fx: () => ({
            form: 0.45,
            development: 0.35,
            hidden: { ego: 2, clutch: 1 },
            flavor: heavy
              ? "Il palleggio arriva più spesso. Con lui, anche la responsabilità."
              : "Lo staff allunga il tuo turno. Il resto lo fai in campo.",
          }),
        },
        {
          label: "Resti nello schema",
          detail: "I numeri vanno bene anche senza un discorso.",
          fx: () => ({
            coachTrust: 4,
            hidden: { chemistry: 2, consistency: 2 },
            flavor: "Non sposti nessuno. Segni lo stesso, e lo spogliatoio resta intero.",
          }),
        },
        {
          label: "Difesa prima del tiro",
          detail: "Un altro modo di pesare, oltre il tabellino.",
          fx: () => ({
            attrs: { defense: 0.4 },
            hidden: { motor: 2, ego: -1 },
            flavor: "Il primo possesso lo passi a togliere il tiro. Poi arriva il tuo.",
          }),
        },
      ],
    };
  }
  const big = s.role === "C" || s.role === "PF";
  const point = s.role === "PG";
  return {
    id,
    phase,
    title: big
      ? `A ${s.age} anni l'area non perdona`
      : point
        ? `A ${s.age} anni la regia è tua`
        : `A ${s.age} anni il lato debole è libero`,
    subtitle: told(
      big
        ? `${team} ti vuole sotto canestro. Ogni rimbalzo, stasera, ha un nome.`
        : point
          ? `${team} ti consegna il pallone. Il ritmo della sera dipende da te.`
          : `${s.age} anni da ${s.role === "SG" ? "guardia" : "ala"}. ${team} ti chiede di scegliere un lato e restarci.`,
    ),
    choices: [
      {
        label: big ? "Chiudi l'area" : point ? "Alzi il ritmo" : "Attacchi per primo",
        detail: "Il tuo gioco, senza chiedere il permesso.",
        fx: () => ({
          form: 0.55,
          attrs: big ? { defense: 0.4 } : point ? { passing: 0.35 } : { shooting: 0.35 },
          flavor: big
            ? "Una stoppata cambia il quarto. L'area, per un po', è tua."
            : point
              ? "Il primo passaggio arriva prima della difesa. Il canestro è una conseguenza."
              : "Prendi la linea e tiri. Il ferro, stavolta, collabora.",
        }),
      },
      {
        label: "Stai nello schema",
        detail: "Il disegno vale più dell'iniziativa.",
        fx: () => ({
          coachTrust: 4,
          hidden: { chemistry: 2, consistency: 2 },
          flavor: "Esegui. Non è spettacolo. È una vittoria che non fa rumore.",
        }),
      },
      {
        label: "Una sera da gregario",
        detail: "Qualcun altro segna. Tu gli togli il difensore.",
        fx: () => ({
          hidden: { chemistry: 4, ego: -2 },
          attrs: { defense: 0.25 },
          flavor: "Nessuno dice il tuo nome al microfono. Nello spogliatoio, sì.",
        }),
      },
    ],
  };
}

export function pickStoryEvent(s: PlayerState, n: number) {
  return withPlayer(s, () => {
    const remember = (id: string) => {
      if (!s.usedEventIds.includes(id)) s.usedEventIds.push(id);
      if (s.usedEventIds.length > 64) s.usedEventIds = s.usedEventIds.slice(-48);
    };
    if (s.age >= 31 && rand() < 0.55) {
      const late = lateCareerEvent(s);
      if (!s.usedEventIds.includes(late.id)) {
        remember(late.id);
        return late;
      }
    }
    if (n > 1 && rand() < quietYearChance(s) * 0.55) {
      const quiet = quietYearEvent(s);
      remember(quiet.id);
      return quiet;
    }
    if (n > 1) {
      const beat = maybeProcedural(s);
      if (beat && !s.usedEventIds.includes(beat.id)) {
        remember(beat.id);
        return beat;
      }
    }
    const phase = phaseFor(n, s.age);
    const lastTitle = s.choiceLog[s.choiceLog.length - 1]?.title || "";
    const lastId = s.usedEventIds[s.usedEventIds.length - 1] || "";
    const fresh = (e: { id: string; title: string }) => {
      if (lastId.startsWith("qy") && e.id.startsWith("qy")) return false;
      if (lastTitle && tooClose(voiceKey(e.title), voiceKey(lastTitle))) return false;
      return true;
    };
    let pool = STORY_POOL.filter(
      (e) => !s.usedEventIds.includes(e.id) && (e.phase === phase || e.phase === "any") && fresh(e),
    );
    if (!pool.length) {
      pool = STORY_POOL.filter(
        (e) => !s.usedEventIds.includes(e.id) && (e.phase === phase || e.phase === "any"),
      );
    }
    if (!pool.length) pool = STORY_POOL.filter((e) => !s.usedEventIds.includes(e.id));
    if (!pool.length) {
      const quiet = quietYearEvent(s);
      remember(quiet.id);
      return quiet;
    }
    const weights = pool.map((e) => eventWeight(e, s));
    const ev = weightedFrom(pool, weights);
    remember(ev.id);
    return ev;
  });
}

export function storyEventById(s: PlayerState, id?: string, script?: SavedStoryScript): StoryEvent {
  const run = (): StoryEvent => {
    if (script === "rookie" || id === "roy-race") return rookieStory();
    if (script === "quiet" || (id && id.startsWith("quiet-"))) return quietYearEvent(s);
    if (id) {
      const fromPool = STORY_POOL.find((e) => e.id === id);
      if (fromPool) return fromPool;
      if (id.startsWith("proc-")) {
        const built = proceduralFromId(s, id);
        if (built) return built;
      }
    }
    if (script === "late" || (id && id.startsWith("late-"))) return lateCareerEvent(s);
    if (script === "rival") return rivalStory(s);
    if (script === "injury") return injuryStory(s);
    if (script === "nation") return nationStory(s);
    return quietYearEvent(s);
  };
  if (rngDepth() > 0) return run();
  return withPlayer(s, run);
}

function rivalStory(s: PlayerState): StoryEvent {
  return {
    id: `rival-${s.season}`,
    phase: "prime",
    title: `Lo scontro con ${s.rivalName}`,
    subtitle: `${s.rivalName} ti sfida a viso aperto davanti a tutta la lega.`,
    choices: [
      {
        label: "Rispondi a canestro",
        detail: "Lasci parlare il gioco.",
        fx: () => ({
          rivalry: 15,
          publicImage: 5,
          form: 1.5,
          development: 0.6,
          hidden: { clutch: 4, ego: 3 },
          attrs: { shooting: 0.8 },
          flavor: "Rispondi sul parquet. La rivalità diventa personale.",
        }),
      },
      {
        label: "Gioco di squadra",
        detail: "Resti professionale.",
        fx: () => ({
          rivalry: 5,
          coachTrust: 6,
          hidden: { chemistry: 5, ego: -2 },
          attrs: { passing: 0.7, iq: 0.5 },
          flavor: "La maturità impressiona più di qualsiasi schiacciata.",
        }),
      },
      {
        label: "Botta e risposta mediatico",
        detail: "Alzi il tono in conferenza.",
        fx: () => {
          const good = rand() < 0.5;
          return {
            rivalry: 20,
            publicImage: good ? 8 : -6,
            hidden: { mediaSavvy: good ? 4 : -2, ego: 6 },
            flavor: good
              ? "Il pubblico ama il duello."
              : "Qualcuno inizia a considerarti arrogante.",
          };
        },
      },
    ],
  };
}

function injuryStory(s: PlayerState): StoryEvent {
  return {
    id: `injury-${s.season}`,
    phase: "prime",
    title: "Un infortunio serio",
    subtitle:
      (s.injuryRisk > 50 ? "Il fisico aveva già dato segnali. " : "") +
      "A metà carriera un problema fisico ti ferma sul serio.",
    choices: [
      {
        label: "Riabilitazione aggressiva",
        detail: "Torni prima, il fisico ne risente.",
        fx: () => ({
          development: -0.8,
          attrs: { athleticism: -2.2 },
          injuryRisk: 10,
          injuryDrag: 2.5,
          gamesPenalty: 18,
          hidden: { durability: -6, motor: -3 },
          flavor: "Torni veloce. Il primo passo non è più lo stesso.",
        }),
      },
      {
        label: "Percorso prudente",
        detail: "Salti partite, torni intero.",
        fx: () => ({
          development: 0.4,
          injuryRisk: -8,
          gamesPenalty: 28,
          hidden: { durability: 5 },
          flavor: "La strada lunga: perdi tempo, torni davvero.",
        }),
      },
      {
        label: "Chirurgia sperimentale",
        detail: "Rischio alto, possibile ripresa piena.",
        fx: () => {
          if (rand() < 0.5) {
            return {
              development: 2.2,
              attrs: { athleticism: 2 },
              injuryRisk: -5,
              gamesPenalty: 12,
              hidden: { durability: 3 },
              flavor: "L'intervento va oltre le aspettative.",
            };
          }
          return {
            development: -2.4,
            attrs: { athleticism: -3 },
            injuryRisk: 15,
            injuryDrag: 3.5,
            gamesPenalty: 36,
            hidden: { durability: -8 },
            flavor: "La scommessa non paga: ripresa lunga e dolorosa.",
          };
        },
      },
    ],
  };
}

function nationStory(s: PlayerState): StoryEvent {
  const teamLabel =
    s.nationality === "Italia" ? "la Nazionale Italiana" : s.nationality === "USA" ? "Team USA" : "la tua Nazionale";
  return {
    id: `nation-${s.season}`,
    phase: "prime",
    title: "Convocazione internazionale",
    subtitle: `${teamLabel} ti chiama per il grande torneo dell'estate.`,
    choices: [
      {
        label: "Accetti e guidi la squadra",
        detail: "Rischi di più, per un sogno più grande.",
        fx: (p) => {
          const medal = rand() < 0.4;
          if (medal) {
            p.medal = true;
            p.milestones.push({ season: p.season, label: "Medaglia internazionale" });
          }
          return {
            publicImage: 8,
            injuryRisk: 10,
            hidden: { clutch: 3, chemistry: 3 },
            flavor: medal
              ? `Porti a casa una medaglia con ${teamLabel}.`
              : `Avventura con ${teamLabel} senza medaglia, a testa alta.`,
          };
        },
      },
      {
        label: "Rifiuti per riposare",
        detail: "Pensi alla stagione di club.",
        fx: () => ({
          injuryRisk: -5,
          publicImage: -4,
          development: 0.35,
          form: 0.8,
          flavor: "Le critiche arrivano. Tu arrivi fresco.",
        }),
      },
      {
        label: "Ruolo ridotto",
        detail: "Un compromesso.",
        fx: () => ({
          publicImage: 3,
          injuryRisk: 3,
          hidden: { chemistry: 2 },
          flavor: `Dai una mano a ${teamLabel} senza esporti troppo.`,
        }),
      },
    ],
  };
}

export function eventAfterMarket(s: PlayerState): { event: StoryEvent; script: SavedStoryScript } {
  const scripted = scriptedSeasonEvent(s, s.season);
  if (scripted) {
    if (!s.usedEventIds.includes(scripted.id)) s.usedEventIds.push(scripted.id);
    const script: SavedStoryScript = scriptSlotFor(s.seed, s.season, scriptWindowsOf(s)) ?? "pool";
    return { event: scripted, script };
  }
  const event = pickStoryEvent(s, s.season);
  const script: SavedStoryScript = event.id.startsWith("late-")
    ? "late"
    : event.id.startsWith("quiet-")
      ? "quiet"
      : "pool";
  return { event, script };
}

/** Scripted story slot for season n ("rookie" | "rival" | "injury" | "nation") or null. */
export function scriptedSeasonSlot(s: PlayerState, n: number): SavedStoryScript | null {
  return scriptSlotFor(s.seed, n, scriptWindowsOf(s));
}

export function scriptedSeasonEvent(s: PlayerState, n: number): StoryEvent | null {
  const slot = scriptSlotFor(s.seed, n, scriptWindowsOf(s));
  if (slot === "rookie") return rookieStory();
  if (slot === "rival") return rivalStory(s);
  if (slot === "injury") return injuryStory(s);
  if (slot === "nation") return nationStory(s);
  return null;
}

function quietYearEvent(s: PlayerState): StoryEvent {
  const { title, subtitle } = quietYearEventBits(s);
  return {
    id: `quiet-${s.season}-${s.age}`,
    phase: phaseFor(s.season, s.age),
    title,
    subtitle,
    choices: [
      {
        label: "Lavoro silenzioso",
        detail: "Niente dichiarazioni. Solo ripetizioni.",
        fx: () => ({
          development: 0.4,
          hidden: { workEthic: 3, consistency: 2 },
          attrs: { iq: 0.3 },
          flavor: say(s, [
            "Chiudi la porta della palestra. Fuori non succede niente. Dentro sì.",
            "Nessuna intervista. Il gesto, ripetuto, diventa un altro gesto.",
            "Lo staff nota l'orario, non la voce. È quello che volevi.",
          ]),
        }),
      },
      {
        label: "Stai col gruppo",
        detail: "Cene, filmati, il resto.",
        fx: () => ({
          hidden: { chemistry: 4, ego: -1 },
          coachTrust: 3,
          attrs: { passing: 0.25 },
          flavor: say(s, [
            "Una settimana da spogliatoio. Serve, anche quando non fa notizia.",
            "Ridi alle battute giuste. Il gruppo si accorcia di un palmo.",
            "Non sei il centro. Sei il collante, e per una volta ti sta bene.",
          ]),
        }),
      },
      {
        label: "Una sera per te",
        detail: "Spegni il telefono. Domani c'è.",
        fx: () => ({
          morale: 5,
          form: 0.35,
          hidden: { consistency: 1 },
          flavor: say(s, [
            "Una notte senza schema. Il giorno dopo il tiro esce più pulito.",
            "Chiudi gli occhi prima delle undici. Sembra poco. Non lo è.",
            "Il silenzio, scelto, vale più di un'altra sessione stanca.",
          ]),
        }),
      },
    ],
  };
}

function eventWeight(e: StoryEvent, s: PlayerState) {
  let w = 1;
  const t = `${e.title} ${e.subtitle}`.toLowerCase();
  if (s.hidden.ego >= 65 && /ego|giornale|contratto|minuto|media|riflettor/.test(t)) w += 2.2;
  if (s.coachTrust <= 40 && /allenator|coach|sistema|panchina/.test(t)) w += 2;
  if (s.injuryRisk >= 45 && /infortun|ginocchio|fisico|gamba|corpo/.test(t)) w += 2;
  if (s.age >= 32 && /anni|corpo|veteran|ritir|ultimo/.test(t)) w += 1.6;
  if (s.hidden.workEthic >= 70 && /palestra|lavoro|estate|ripetiz/.test(t)) w += 1.2;
  if (s.hidden.chemistry <= 40 && /spogliatoio|gruppo|compagn/.test(t)) w += 1.4;
  return w;
}

function weightedFrom<T>(items: T[], weights: number[]): T {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  let r = rand() * sum;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i] ?? 0;
    if (r <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

export function rookieStory(): StoryEvent {
  return {
    id: "roy-race",
    phase: "rookie",
    title: "Rookie of the Year",
    subtitle:
      "Prima stagione da professionista. I minuti non si regalano, e il Rookie of the Year nemmeno. Come vuoi presentarti?",
    choices: [
      {
        label: "Uso aggressivo",
        detail: "Palloni, tiri, responsabilità. La corsa al Rookie of the Year parte da te.",
        fx: () => ({
          form: 1.3,
          development: 0.85,
          attrs: { shooting: 1.2, handle: 0.8, athleticism: 0.45 },
          hidden: { ego: 5, clutch: 3, chemistry: -2 },
          flavor: "Ti prendi i possessi. Qualcuno in spogliatoio deve fare spazio.",
        }),
      },
      {
        label: "Impara il sistema",
        detail: "Meno numeri subito, più fiducia dello staff.",
        fx: () => ({
          coachTrust: 9,
          development: 0.7,
          attrs: { iq: 1.3, passing: 0.9, defense: 0.45 },
          hidden: { chemistry: 6, workEthic: 4, consistency: 4 },
          flavor: "I minuti arrivano perché sei utile, non perché sei rumoroso.",
        }),
      },
      {
        label: "Impatto a due vie",
        detail: "Difesa, rimbalzi, i dettagli che chiudono le gare.",
        fx: () => ({
          development: 0.75,
          attrs: { defense: 1.2, rebounding: 0.8, strength: 0.45, shooting: 0.35 },
          hidden: { motor: 5, workEthic: 4 },
          flavor: "Lo staff si fida delle tue chiusure sul perimetro prima dei tuoi tiri.",
        }),
      },
    ],
  };
}

/** Salto da sophomore: viene da fiducia, lavoro e sviluppo, non dal numero dell'anno. */
export function sophomoreLeap(s: PlayerState): number {
  const dev = s.development > 0 ? Math.min(s.development, 4) * 0.012 : 0;
  const trust = (s.coachTrust - 48) * 0.0008;
  const work = (s.hidden.workEthic - 50) * 0.0004;
  return clamp(dev + trust + work, -0.03, 0.055);
}

/** Il vantaggio da chiamata vale solo se i minuti ci sono. */
export function draftOpportunity(pick: number, min: number): number {
  const lot = pick <= 10 ? 1.14 : pick <= 20 ? 1.08 : pick > 0 ? 1.04 : 1;
  if (min >= 22) return lot;
  const minuteShare = clamp((min - 11) / 11, 0.45, 1);
  return 1 + (lot - 1) * minuteShare;
}

function leagueGames(s: PlayerState) {
  return s.league === "EuroLega" ? 34 : 82;
}

export function simulateRegularSeason(s: PlayerState, n: number): SeasonRow {
  return withPlayer(s, () => simulateRegularSeasonInner(s, n));
}

function simulateRegularSeasonInner(s: PlayerState, n: number): SeasonRow {
  const role = ROLES[s.role];
  const a = s.attrs;
  const ovr = s.overall;
  const d = diffOf(s);
  const games = leagueGames(s);
  const prev = s.seasonHistory[s.seasonHistory.length - 1];
  const exp = experimentOf(s);
  const missRoll = randInt(-2, 3);
  const miss =
    exp?.injury === "off"
      ? 0
      : exp?.injury === "forced"
        ? 18
        : ((s.injuryRisk / 100) * SIM.injury.baseMiss +
            ((100 - s.hidden.durability) / 100) * SIM.injury.durabilityWeight +
            (s.age > SIM.injury.ageAfter ? (s.age - SIM.injury.ageAfter) * 2.6 : 0) +
            (ovr >= 88 && s.age >= 31 ? 1.8 : 0) +
            ((100 - s.hidden.motor) / 100) * 3.2 +
            s.gamesPenalty +
            missRoll) *
          d.injury *
          (games === 34 ? 0.55 : 1);
  const gp = Math.round(clamp(games - miss, games === 34 ? 16 : 24, games));
  const rookCut = s.age <= 20 ? 0.86 : s.age === 21 ? 0.92 : 1;
  const vetCut = s.age >= 33 ? Math.max(0.74, 1 - (s.age - 32) * 0.052) : 1;
  const trust = 1 + (s.coachTrust - 50) * 0.003;
  let min = round1(
    clamp(
      (17.2 + (ovr - 60) * 0.58 + (s.hidden.motor / 100) * 3.2) * d.minutes * rookCut * vetCut * trust,
      11.5,
      s.age >= 34 ? 31.8 : 37.6,
    ),
  );
  if (prev) min = round1(clamp(min * 0.72 + prev.min * 0.28, 11.5, 37.6));
  const fit = identityFit(s);
  min = round1(clamp(min * fit.min, 11.5, 37.6));
  min = forcedMinutes(s, min);
  const usageAge = s.age >= 34 ? (ovr >= 82 ? 0.92 : 0.84) : s.age >= 32 ? 0.93 : s.age >= 30 ? 0.97 : 1;
  const usage = clamp(
    (0.14 + (ovr - 60) * 0.0048 + (role.scoreF - 1) * 0.03 + (a.handle - 50) * 0.0004) * usageAge,
    0.1,
    0.34,
  );
  const formAdj = 1 + s.form * 0.018;
  const cons = 1 + ((s.hidden.consistency - 50) / 100) * 0.08;
  const noise = (amp: number) => {
    const spread = amp * (1.15 - s.hidden.consistency / 140);
    return gaussTrim(0, spread / Math.sqrt(12), 2.5);
  };

  const minFactor = 0.9 + (min - 22) * 0.0075;
  const shotMod = 1 + (a.shooting - 50) * 0.0024 + (a.handle - 50) * 0.0009;
  const rebMod = 1 + (a.rebounding - 50) * 0.0042 + (a.strength - 50) * 0.0016;
  const passMod = 1 + (a.passing - 50) * 0.004 + (a.iq - 50) * 0.002;
  let ppg = (7.6 + (ovr - 60) * 0.56) * role.scoreF * minFactor * formAdj * cons * shotMod * fit.ppg * (0.88 + (usage / 0.22) * 0.14) + noise(1.15);
  let rpg = (3.55 + (ovr - 60) * 0.128) * role.reboundF * minFactor * rebMod * fit.rpg + noise(0.38);
  let apg = (2.15 + (ovr - 60) * 0.118) * role.passF * minFactor * passMod * fit.apg + noise(0.36);
  if (n === 2) {
    const leap = sophomoreLeap(s);
    ppg *= 1 + leap;
    rpg *= 1 + leap * 0.45;
    apg *= 1 + leap * 0.55;
    min = forcedMinutes(s, round1(clamp(min * (1 + leap * 0.45), 11.5, 37.6)));
  }
  if (n === 1) {
    ppg *= draftOpportunity(s.draftPick, min);
    min = forcedMinutes(s, round1(clamp(min * (s.draftPick <= 14 ? 1.05 : 1.02), 11.5, 34)));
  }
  if (prev && n > 1) {
    ppg = ppg * 0.66 + prev.ppg * 0.34;
    rpg = rpg * 0.66 + prev.rpg * 0.34;
    apg = apg * 0.66 + prev.apg * 0.34;
  }
  const floorP = round1(clamp(1.5 + min * 0.045, 1.5, 3.1));
  ppg = round1(clamp(ppg, floorP, 35.4));
  rpg = round1(clamp(rpg, 0.8, 16.2));
  apg = round1(clamp(apg, 0.4, 12.6));

  const athAge = s.age >= 33 ? 0.92 : 1;
  const spg = round1(
    clamp(
      ((a.defense * 0.48 + a.athleticism * 0.22 + a.iq * 0.12) / 90 + (ovr - 60) * 0.008) *
        1.72 *
        role.stlF *
        (min / 32) *
        athAge +
        noise(0.12),
      0.35,
      2.7,
    ),
  );
  const bpg = round1(
    clamp(
      ((a.defense * 0.42 + a.strength * 0.28) / 90 + (ovr - 60) * 0.009) * 1.85 * role.blkF * (min / 32) + noise(0.1),
      0.2,
      3.3,
    ),
  );
  const fg = round2(
    clamp(
      0.438 +
        (ovr - 60) * 0.0016 +
        (a.shooting / 99) * 0.07 +
        (a.athleticism / 99) * 0.018 -
        usage * 0.08 +
        (roleGroupBig(s.role) ? 0.035 : 0),
      0.38,
      0.64,
    ),
  );
  const tp = round2(
    clamp(
      0.348 + (ovr - 60) * 0.0012 + (a.shooting / 99) * 0.1 - (roleGroupBig(s.role) ? 0.055 : 0) - (s.age > 33 ? 0.014 : 0),
      0.24,
      0.45,
    ),
  );
  const ft = round2(clamp(0.74 + (ovr - 60) * 0.0015 + (a.shooting / 99) * 0.12 - (a.strength / 99) * 0.028, 0.62, 0.94));
  const tov = round1(clamp(0.95 + apg * 0.16 + usage * 2.05 - (a.iq / 99) * 0.75 - (ovr - 60) * 0.008, 0.6, 4.2));
  const ts = round2(
    clamp(
      0.548 + (fg - 0.46) * 0.5 + (tp - 0.36) * 0.22 + (ft - 0.78) * 0.08 + (ovr - 70) * 0.0007 - (usage - 0.22) * 0.1,
      0.48,
      0.695,
    ),
  );
  const per = round1(
    clamp(
      10.4 +
        (ovr - 60) * 0.26 +
        (ppg - 10) * 0.2 +
        (rpg - 4) * 0.16 +
        (apg - 3) * 0.24 +
        (spg + bpg) * 1.15 -
        (tov - 1.6) * 0.65,
      8,
      32,
    ),
  );

  const awards: string[] = [];

  const pts = Math.round(ppg * gp);
  const reb = Math.round(rpg * gp);
  const ast = Math.round(apg * gp);
  s.careerPoints += pts;
  s.careerRebounds += reb;
  s.careerAssists += ast;
  s.careerSteals += Math.round(spg * gp);
  s.careerBlocks += Math.round(bpg * gp);
  s.yearsOnTeam += 1;

  const year = 2026 + n - 1;
  const yearLabel = `${year}-${String((year + 1) % 100).padStart(2, "0")}`;
  const row: SeasonRow = {
    season: n,
    yearLabel,
    age: s.age,
    team: s.team.name,
    teamAbbr: s.team.abbr,
    teamColor: s.team.color,
    teamSecondary: s.team.secondary,
    overall: s.overall,
    gp,
    min,
    ppg,
    rpg,
    apg,
    spg,
    bpg,
    fg,
    tp,
    ft,
    tov,
    ts,
    per,
    plusMinus: 0,
    wins: 0,
    losses: 0,
    seed: null,
    conf: s.team.conf,
    awards,
    playoff: "",
    salaryM: s.contract.annualM,
    seriesLog: [],
    mood: "",
  };
  const snap = simulateLeagueSeason(s, n, yearLabel, row);
  row.league = snap;
  s.currentLeague = snap;
  row.plusMinus = round1(
    clamp(
      ((row.wins / Math.max(1, row.wins + row.losses) - 0.5) * 8.4) +
        (row.per - 15) * 0.28 * (row.min / 32) +
        (s.overall - 70) * 0.1 * (row.min / 32) +
        s.form * 0.12 -
        s.injuryDrag * 0.15,
      -10.5,
      12.5,
    ),
  );
  row.mood = seasonAtmosphere(s, row);
  applySeasonPulse(s, row);
  settlePlayerAwards(s, row, n);
  awards.forEach((lab) => {
    if (!s.milestones.some((m) => m.season === n && m.label === lab)) {
      s.milestones.push({ season: n, label: lab });
    }
  });
  s.seasonHistory.push(row);
  releaseOldTables(s);
  return row;
}

/** Le classifiche vecchie non si rileggono. Restano premi e giornale. */
function releaseOldTables(s: PlayerState) {
  const hist = s.seasonHistory;
  if (hist.length < 2) return;
  const prev = hist[hist.length - 2];
  const lg = prev?.league;
  if (!lg || (!lg.east.length && !lg.west.length && !lg.euro.length)) return;
  prev.league = {
    yearLabel: lg.yearLabel,
    east: [],
    west: [],
    euro: [],
    awards: lg.awards ?? [],
    leaders: lg.leaders ?? [],
    royRace: lg.royRace ?? [],
    dpoyRace: lg.dpoyRace ?? [],
    champion: lg.champion,
  };
}

function applySeasonPulse(s: PlayerState, row: SeasonRow) {
  const games = Math.max(1, row.wins + row.losses);
  const winPct = row.wins / games;
  const avail = row.gp / leagueGames(s) - 0.85;
  const prod = (row.ppg - 8) * 0.012 + (row.per - 12) * 0.008;
  const awardHit = row.awards.length * 0.11;
  const ageW = s.age <= 24 ? 1.06 : s.age >= 33 ? 0.68 : 1;
  const pulse = clamp((winPct - 0.5) * 0.28 + prod * 0.55 + avail * 0.22 + awardHit * 0.6, -0.22, 0.28) * ageW;
  imprint(s, pulse);
  row.overall = s.overall;
}

function roleGroupBig(role: Role) {
  return role === "PF" || role === "C";
}

export function qualifiesPlayoffs(s: PlayerState, row: SeasonRow) {
  let seed = row.seed;
  if (seed == null && row.league) {
    const mine = [...row.league.east, ...row.league.west, ...row.league.euro].find((x) => x.abbr === row.teamAbbr);
    if (mine?.seed != null) {
      seed = mine.seed;
      row.seed = mine.seed;
    }
  }
  return isPlayoffSeed(seed);
}

/** Un record positivo da solo non assegna un posto: deve esistere un seed nel tabellone. */
export function isPlayoffSeed(seed: number | null | undefined) {
  return Number.isInteger(seed) && seed! >= 1 && seed! <= PLAYOFF_SEEDS;
}

export function playoffRounds(s: PlayerState) {
  return s.league === "EuroLega" ? EURO_ROUNDS : NBA_ROUNDS;
}

export function pickPlayoffOpponent(s: PlayerState, _round: number): Team {
  const live = currentOpponent(s);
  if (live) return opponentAsTeam(live);
  if (s.currentLeague) {
    const snap = s.currentLeague;
    const other = s.team.conf === "East" ? snap.west : snap.east;
    const champ = [...other].sort((a, b) => (a.seed ?? 9) - (b.seed ?? 9))[0];
    if (champ) return opponentAsTeam(champ);
  }
  return withPlayer(s, () => {
    const pool = (s.league === "EuroLega" ? EURO_TEAMS : NBA_TEAMS).filter((t) => t.name !== s.team.name);
    return pickWeightedTeam(pool, { rebuilding: 0.1, mid: 0.4, contender: 0.5 }, s.team.name);
  });
}

export function beginPlayoffs(s: PlayerState) {
  if (!s.currentLeague) return null;
  // The bracket draws from the RNG: keep it on the career seed even outside a caller's withPlayer.
  return withPlayer(s, () => initPlayoffs(s, s.currentLeague!));
}

export function playoffWinChance(s: PlayerState, _round: number, choiceBonus: number, oppPower = s.team.power) {
  const mine = s.team.power * 0.72 + (s.overall - 70) * 0.42 + s.form * 0.3 + (s.hidden.clutch - 50) * 0.03;
  return matchupChance(mine, oppPower, boundedChoiceBonus(choiceBonus) + diffOf(s).playoff);
}

const EARLY_PLAYOFF: PlayoffChoice[] = [
  {
    label: "Iso sul possesso decisivo",
    detail: "Te la giochi tu, in prima persona.",
    bonus: (s) => (s.attrs.shooting - 50) * 0.004 + (s.hidden.clutch - 50) * 0.003,
    fx: { form: 0.35, hidden: { clutch: 2, ego: 1 }, attrs: { shooting: 0.35, handle: 0.2 }, flavor: "Il possesso è tuo. Il palazzetto lo sa." },
  },
  {
    label: "Il passaggio extra",
    detail: "Ti fidi del sistema e del compagno libero.",
    bonus: (s) => (s.attrs.passing + s.attrs.iq - 100) * 0.0025 + (s.hidden.chemistry - 50) * 0.002,
    fx: { coachTrust: 2, hidden: { chemistry: 2, ego: -1 }, attrs: { passing: 0.4, iq: 0.25 }, flavor: "Il passaggio arriva pulito. Il palazzetto capisce dopo." },
  },
  {
    label: "Alza l'intensità difensiva",
    detail: "Partita da spogliatoio, non da highlight.",
    bonus: (s) => (s.attrs.defense - 50) * 0.004 + (s.hidden.motor - 50) * 0.002,
    fx: { injuryRisk: 2, hidden: { motor: 2 }, attrs: { defense: 0.45 }, flavor: "Il fiato brucia. Loro sentono il contatto." },
  },
  {
    label: "Gioco fisico, ogni possesso",
    detail: "Contatto, box-out, niente regali.",
    bonus: (s) => (s.attrs.strength + s.attrs.rebounding - 100) * 0.0022,
    fx: { injuryRisk: 3, hidden: { durability: -1 }, attrs: { strength: 0.4, rebounding: 0.3 }, flavor: "Ogni rimbalzo è una piccola guerra." },
  },
];

const EURO_FINAL_FOUR_CHOICES: PlayoffChoice[] = [
  {
    label: "Attacca il mismatch subito",
    detail: "Una partita sola: scegli il vantaggio e costringili ad aiutare.",
    bonus: (s) => (s.attrs.handle + s.attrs.shooting - 100) * 0.0028 + (s.hidden.clutch - 50) * 0.002,
    fx: { form: 0.45, hidden: { clutch: 2, ego: 1 }, attrs: { handle: 0.35, shooting: 0.35 }, flavor: "Il primo vantaggio è tuo. Adesso devono scegliere cosa concedere." },
  },
  {
    label: "Fai la lettura giusta",
    detail: "Rallenta il possesso, chiama il compagno libero e non forzare il tiro.",
    bonus: (s) => (s.attrs.passing + s.attrs.iq - 100) * 0.0027 + (s.hidden.chemistry - 50) * 0.0018,
    fx: { coachTrust: 2, hidden: { chemistry: 2, ego: -1 }, attrs: { passing: 0.4, iq: 0.3 }, flavor: "Il vantaggio arriva dalla lettura. Il passaggio giusto sposta tutta la difesa." },
  },
  {
    label: "Alza il livello in difesa",
    detail: "Proteggi l'area e obbliga l'avversario a guadagnarsi ogni canestro.",
    bonus: (s) => (s.attrs.defense + s.hidden.motor - 100) * 0.0028,
    fx: { injuryRisk: 1, hidden: { motor: 2 }, attrs: { defense: 0.45, rebounding: 0.25 }, flavor: "Ogni rimbalzo è un possesso in più. Ogni arresto, una porta chiusa." },
  },
];

const CONF_PLAYOFF: PlayoffChoice[] = [
  {
    label: "Prendi il controllo della serie",
    detail: "Più uso, più responsabilità. Se sbagli, è tua.",
    bonus: (s) => (s.attrs.shooting - 48) * 0.004 + (s.hidden.clutch - 48) * 0.0035 + (s.hidden.ego - 40) * 0.001,
    fx: { form: 0.5, hidden: { clutch: 3, ego: 2 }, attrs: { shooting: 0.5, handle: 0.25 }, flavor: "La serie cambia spalla. Ora è sulla tua." },
  },
  {
    label: "Fidati dello staff",
    detail: "Esegui il piano. Niente eroismi.",
    bonus: (s) => (s.coachTrust - 50) * 0.003 + (s.attrs.iq - 50) * 0.003,
    fx: { coachTrust: 3, hidden: { chemistry: 3, consistency: 2 }, attrs: { iq: 0.45, passing: 0.25 }, flavor: "Il piano tiene. Tu tieni il piano." },
  },
  {
    label: "Cambia i matchup in difesa",
    detail: "Chiedi i compiti sporchi sul loro migliore.",
    bonus: (s) => (s.attrs.defense - 50) * 0.0045 + (s.hidden.motor - 50) * 0.002,
    fx: { injuryRisk: 3, hidden: { motor: 2, workEthic: 1 }, attrs: { defense: 0.5, iq: 0.2 }, flavor: "Il loro migliore suda di più. È già qualcosa." },
  },
];

const FINALS_PLAYOFF: PlayoffChoice[] = [
  {
    label: "Il tiro che ti definirà",
    detail: "Quando la palla arriva, non la passi.",
    bonus: (s) => (s.hidden.clutch - 45) * 0.0045 + (s.attrs.shooting - 50) * 0.004,
    fx: { form: 0.6, hidden: { clutch: 4, ego: 2 }, attrs: { shooting: 0.6 }, flavor: "Il palazzetto trattiene il fiato con te." },
  },
  {
    label: "Fai grandi i compagni",
    detail: "L'anello è di tutti, o non è di nessuno.",
    bonus: (s) => (s.hidden.chemistry - 45) * 0.004 + (s.attrs.passing - 48) * 0.003,
    fx: { coachTrust: 4, hidden: { chemistry: 4, ego: -2 }, attrs: { passing: 0.5, iq: 0.35 }, flavor: "L'assist che chiude una serie pesa come un canestro." },
  },
  {
    label: "Partita da guerra",
    detail: "Ogni rimbalzo, ogni chiusura sul perimetro, ogni secondo.",
    bonus: (s) => (s.hidden.motor - 48) * 0.0035 + (s.attrs.defense - 50) * 0.0035,
    fx: { injuryRisk: 4, hidden: { motor: 3, durability: -1 }, attrs: { defense: 0.4, rebounding: 0.35, strength: 0.2 }, flavor: "Finiamo con le ginocchia sporche. È il modo giusto." },
  },
];

export function playoffChoicesFor(s: PlayerState, round: number): PlayoffChoice[] {
  if (s.league === "EuroLega" && round > 0) return EURO_FINAL_FOUR_CHOICES;
  try {
    const d = doorChoices(s, round);
    if (d && d.length >= 3) return d.slice(0, 3);
  } catch {
    /* fallback sotto */
  }
  const labels = playoffRounds(s);
  const last = labels.length - 1;
  if (round >= last) return FINALS_PLAYOFF;
  if (round >= last - 1) return CONF_PLAYOFF;
  return EARLY_PLAYOFF;
}

export const PLAYOFF_CHOICES = EARLY_PLAYOFF;

export function resolvePlayoffRound(
  s: PlayerState,
  n: number,
  round: number,
  choiceIndex: number,
  opponent: Team,
) {
  return withPlayer(s, () => resolvePlayoffRoundInner(s, n, round, choiceIndex, opponent));
}

function resolvePlayoffRoundInner(
  s: PlayerState,
  n: number,
  round: number,
  choiceIndex: number,
  opponent: Team,
) {
  const choice = playoffChoicesFor(s, round)[choiceIndex] ?? EARLY_PLAYOFF[0]!;
  const bonus = choice.bonus(s);
  applyFx(s, { ...choice.fx, flavor: choice.fx.flavor });
  const oppRow: StandingRow | undefined =
    s.currentLeague ? standingOf(s.currentLeague, opponent.abbr) : undefined;
  const oppPower = oppRow?.power ?? opponent.power;
  const chance = playoffWinChance(s, round, bonus, oppPower);
  const format = playoffSeriesFormat(s.league, round);
  const series = simulateSeries(
    chance,
    format,
    s.league === "EuroLega",
    s.playoff?.seed ?? 4,
    oppRow?.seed ?? 5,
  );
  const win = series.wins >= format.winsNeeded;
  const labels = playoffRounds(s);
  const label = labels[round]!;
  const last = s.seasonHistory[s.seasonHistory.length - 1];
  const standing: StandingRow = oppRow ?? {
    abbr: opponent.abbr,
    name: opponent.name,
    city: opponent.city,
    color: opponent.color,
    secondary: opponent.secondary,
    conf: opponent.conf,
    div: opponent.div,
    w: 0,
    l: 0,
    seed: s.playoff ? 9 - (s.playoff.seed || 1) : null,
    power: oppPower,
    star: opponent.star,
    ppg: 110,
    oppPpg: 108,
    rpg: 44,
    apg: 25,
    netRtg: 2,
    pace: 99,
    note: opponent.note,
    starPpg: 22,
    starRpg: 6,
    starApg: 5,
  };
  const packed = buildSeriesResult(s, round, label, standing, series, win);
  const oneGame = format.maxGames === 1;
  const finalGame = series.games[0];
  const userScore = oneGame && finalGame ? `${finalGame.us}-${finalGame.them}` : `${series.wins}-${series.losses}`;
  const lineScore = playoffLineScore({
    oneGame,
    playerPoints: oneGame && finalGame ? finalGame.us : series.wins,
    opponentPoints: oneGame && finalGame ? finalGame.them : series.losses,
    opponent: opponent.name,
  });
  if (last) {
    last.seriesLog = [...(last.seriesLog || []), packed];
  }
  if (win) {
    advanceBracket(s, true);
    if (round === labels.length - 1) {
      s.titleCount += 1;
      s.milestones.push({ season: n, label: s.league === "EuroLega" ? "EuroLeague Champion" : "NBA Champion" });
      if (rand() < 0.45 + (s.hidden.clutch - 50) * 0.004) {
        s.fmvpCount += 1;
        s.milestones.push({ season: n, label: "Finals MVP" });
      }
      if (last) last.playoff = "Campione";
      if (s.playoff && s.currentLeague) {
        s.playoff.settledChampion = standingOf(s.currentLeague, s.team.abbr) ?? undefined;
      }
      s.publicImage = clamp(s.publicImage + 8, 0, 100);
      s.hidden.clutch = clamp(s.hidden.clutch + 3, 0, 100);
      imprint(s, s.age <= 26 ? 0.42 : 0.28);
      const titleLines = s.league === "EuroLega" ? EURO_TITLE_LINES : TITLE_LINES;
      const line = sayOr(s, titleLines, { OPP: opponent.name, SCORE: lineScore }, `Titolo, $SCORE su $OPP.`);
      settleYearTitle(s, true);
      return { win: true, champion: true, flavor: line, series: packed };
    }
    if (last) last.playoff = label;
    const line = sayOr(
      s,
      oneGame ? SINGLE_GAME_WIN_LINES : SERIES_WIN_LINES,
      { OPP: opponent.name, SCORE: lineScore },
      oneGame ? `Partita vinta $SCORE contro $OPP.` : `Serie vinta $SCORE su $OPP.`,
    );
    imprint(s, 0.14);
    return { win: true, champion: false, flavor: line, series: packed };
  }
  advanceBracket(s, false);
  if (last) last.playoff = `Elim. ${label} ${userScore}`;
  s.form = clamp(s.form - 0.8, -12, 12);
  imprint(s, -0.1);
  const line = sayOr(
    s,
    oneGame ? SINGLE_GAME_LOSS_LINES : SERIES_LOSS_LINES,
    { OPP: opponent.name, SCORE: lineScore },
    oneGame ? `Sconfitta $SCORE contro $OPP. Stagione finita.` : `Eliminati $SCORE da $OPP.`,
  );
  settleYearTitle(s, false);
  return { win: false, champion: false, flavor: line, series: packed };
}

export function marketSalary(s: PlayerState) {
  const last = s.seasonHistory[s.seasonHistory.length - 1];
  const prod = last ? last.ppg * 0.32 + last.per * 0.1 : 0;
  const adv = last ? advancedOf(last) : null;
  let mil = 2.0 + Math.max(0, s.overall - 55) * 0.62 + prod;
  mil += s.mvpCount * 4.8;
  mil += s.titleCount * 1.8;
  mil += s.allStarCount * 0.38;
  mil += s.allNbaCount * 0.55;
  if (adv) mil += Math.max(0, adv.vorp) * 0.55 + Math.max(0, adv.ws) * 0.08;
  if (s.age > SIM.market.agePenaltyAfter) mil *= 0.72 - Math.max(0, s.age - 32) * 0.035;
  if (s.age < 24) mil *= 0.82;
  mil += s.hidden.ego * SIM.market.egoSalary;
  return round1(clamp(mil * diffOf(s).salary, 1.4, 54));
}

export function buildFaOffers(s: PlayerState): MarketOffer[] {
  return withPlayer(s, () => buildFaOffersInner(s));
}

function buildFaOffersInner(s: PlayerState): MarketOffer[] {
  const market = marketSalary(s);
  const used = new Set<string>([s.team.name]);
  const offers: MarketOffer[] = [];
  const takeNba = (w: Record<string, number>) => {
    const t = pickFitTeam(s, w, [...used]);
    used.add(t.name);
    return t;
  };
  const wantExt =
    s.league === "NBA" &&
    s.coachTrust >= 50 &&
    s.overall >= 44 &&
    s.age <= 34 &&
    rand() < 0.84 * diffOf(s).extension;
  if (wantExt) {
    const years = s.age >= 31 ? randInt(2, 3) : randInt(3, 4);
    offers.push({
      id: "ext",
      team: s.team,
      years,
      annualM: round1(market * (0.88 + s.coachTrust / 500)),
      pitch: sayOr(s, [
        "Rinnovo. Resta la casa che ti ha formato.",
        "Restare. I corridoi li conosci, e questo, a volte, vale più della cifra.",
        "La dirigenza vuole continuità. Tu sei la continuità.",
        "Stessa maglia, altri anni. Il pubblico lo ha già deciso.",
        "Casa. I numeri sul contratto contano, i corridoi di più.",
        "Restare qui. Lo staff non lo dice come una preghiera: lo dice come un piano.",
      ], undefined, `Rinnovo a ${s.team.name}.`),
      kind: "extension",
    });
  }
  const ring = takeNba({ contender: 0.9, mid: 0.1, rebuilding: 0 });
  offers.push({
    id: "ring",
    team: ring,
    years: randInt(2, 3),
    annualM: round1(market * 0.68),
    pitch: sayOr(s, [
      "Meno soldi, un vero contendente. L'anello è il contratto.",
      "Vieni a vincere. Lo stipendio è il prezzo, giugno è la merce.",
      "Un roster da titolo. Ti chiedono di essere il pezzo che manca, non il volto.",
      "Meno milioni, più aprile. La proposta è chiara.",
      "Giugno, non la cifra più alta. La cifra è il pedaggio.",
      "Un contendente vero. I soldi arrivano dopo, se arrivano.",
    ], undefined, `Offerta da contendente: ${ring.name}.`),
    kind: "ring",
  });
  const fair = takeNba({ contender: 0.2, mid: 0.7, rebuilding: 0.1 });
  offers.push({
    id: "fair",
    team: fair,
    years: randInt(3, 4),
    annualM: round1(market * 0.95),
    pitch: sayOr(s, [
      "Ruolo da riferimento, soldi di mercato, progetto solido.",
      "Un equilibrio: minuti, cifra, una piazza che non ti chiede di essere Dio.",
      "Mercato vero, ruolo vero. Niente promesse da copertina.",
      "Ti vogliono al centro, senza spaccare il salario.",
      "Una piazza di mezzo. I minuti ci sono, le scuse no.",
      "Né massimo né miseria. Un mestiere, detto chiaro.",
    ], undefined, `Offerta di mercato: ${fair.name}.`),
    kind: "fair",
  });
  const max = takeNba({ contender: 0, mid: 0.25, rebuilding: 0.75 });
  offers.push({
    id: "max",
    team: max,
    years: randInt(4, 5),
    annualM: round1(market * 1.12),
    pitch: sayOr(s, [
      "Il contratto più ricco. I soldi arrivano prima del progetto.",
      "La cifra più alta. Il resto, dicono, si costruisce intorno.",
      "La cifra più alta. La piazza ricostruisce, e tu sei il cartellone.",
      "Più soldi di tutti. Lo sanno, e lo usano come argomento.",
      "La cifra parla prima dello schema. Lo schema, dicono, arriverà.",
      "Soldi veri, progetto da scrivere. Il foglio è già firmato sulla riga della cifra.",
    ], undefined, `Il contratto massimo: ${max.name}.`),
    kind: "max",
  });
  if (s.age >= 30) {
    const euro = pickCoherentTeam(s, EURO_TEAMS, { contender: 0.55, mid: 0.35, rebuilding: 0.1 }, [...used]);
    used.add(euro.name);
    offers.push({
      id: "euro",
      team: euro,
      years: randInt(2, 3),
      annualM: round1(clamp(market * 0.42, 2.2, 18)),
      pitch: sayOr(s, [
        "Eurolega: un altro palcoscenico, un'altra gloria.",
        "Europa. Palazzetti pieni, tattica stretta, un ultimo atto diverso.",
        "Un campionato che parla un'altra lingua. L'anello, lì, ha un altro peso.",
        "Un'altra geografia. I palazzetti più piccoli, le coppe più lunghe.",
        "Eurolega. Un ultimo atto in un'altra lingua, con la stessa palla.",
      ], undefined, `Eurolega: ${euro.name}.`),
      kind: "euro",
    });
  } else {
    const prove = takeNba({ contender: 0.15, mid: 0.5, rebuilding: 0.35 });
    offers.push({
      id: "prove",
      team: prove,
      years: 2,
      annualM: round1(market * 0.8),
      pitch: sayOr(s, [
        "Due anni per dimostrare che il picco non è alle spalle.",
        "Un contratto corto, una chance lunga. Tocca a te riempirla.",
        "Prove. Minuti, fiducia, niente alibi di lungo periodo.",
        "Due inverni. Basta per dirsi ancora, o per chiudere.",
        "Un biennio per farsi rivedere. Niente scuse di lungo contratto.",
      ], undefined, `Due anni a ${prove.name}.`),
      kind: "prove",
    });
  }
  const ranked = offers.filter((o) => o.kind !== "extension").sort((a, b) => b.annualM - a.annualM);
  const ext = offers.filter((o) => o.kind === "extension");
  return [...ext, ...ranked].slice(0, 5).map((o) => ({
    ...o,
    pitch: localizePitch(s, o.kind, o.team.name, o.pitch),
  }));
}

export function acceptOffer(s: PlayerState, offer: MarketOffer) {
  return withPlayer(s, () => {
  const old = s.team.name;
  const same = old === offer.team.name;
  s.team = offer.team;
  s.contract = {
    teamName: offer.team.name,
    years: offer.years,
    yearsRemaining: offer.years,
    annualM: offer.annualM,
    kind: offer.kind === "extension" ? "extension" : offer.kind === "euro" ? "fa" : "fa",
  };
  if (offer.kind === "euro") {
    s.league = "EuroLega";
    s.international = true;
  } else {
    s.league = "NBA";
  }
  if (offer.kind === "extension" || same) {
    s.coachTrust = clamp(s.coachTrust + 6, 0, 100);
    s.hidden.chemistry = clamp(s.hidden.chemistry + 4, 0, 100);
    s.attrs.iq = clampAttr(s.attrs.iq + 0.4);
  } else {
    s.yearsOnTeam = 0;
    s.coachTrust = offer.kind === "ring" ? 58 : 50;
    s.hidden.chemistry = clamp(s.hidden.chemistry - 6, 0, 100);
    s.form += offer.kind === "max" ? 0.4 : offer.kind === "ring" ? 0.8 : 0.2;
    if (offer.kind === "ring") s.attrs.defense = clampAttr(s.attrs.defense + 0.5);
    if (offer.kind === "max") s.hidden.ego = clamp(s.hidden.ego + 4, 0, 100);
  }
  const fit = offerFit(s, offer.team.abbr);
  const moneyGap = (offer.annualM - marketSalary(s)) / 12;
  const ageW = s.age <= 27 ? 1 : s.age <= 32 ? 0.7 : 0.45;
  imprint(s, clamp((moneyGap * 0.28 + (fit - 1) * 0.22 + (same ? 0.08 : 0.04)) * ageW, -0.4, 0.5));
  occupyTeamSlot(s);
  return old;
  });
}

export function buildTradeOffer(s: PlayerState): { team: Team; pitch: string; bump: number } {
  return withPlayer(s, () => buildTradeOfferInner(s));
}

function buildTradeOfferInner(s: PlayerState): { team: Team; pitch: string; bump: number } {
  const weights =
    s.overall >= 76
      ? { contender: 0.55, mid: 0.35, rebuilding: 0.1 }
      : s.coachTrust < 42
        ? { contender: 0.15, mid: 0.35, rebuilding: 0.5 }
        : s.overall >= 62
          ? { contender: 0.45, mid: 0.4, rebuilding: 0.15 }
          : { contender: 0.2, mid: 0.4, rebuilding: 0.4 };
  const suitor = pickCoherentTeam(s, s.league === "EuroLega" ? EURO_TEAMS : NBA_TEAMS, weights, s.team.name);
  const pitch =
    suitor.tier === "contender"
      ? sayOr(s, [
          `$CLUB vuole un pezzo da titolo. Minuti veri, pressione vera.`,
          `$CLUB caccia giugno. Ti chiedono di arrivare già pronto.`,
          `Da contendente, $CLUB offre il ruolo che i playoff non perdonano.`,
          `$CLUB è in corsa. Ti vogliono per chiudere, non per ricostruire.`,
        ], { CLUB: suitor.name }, `$CLUB vuole un pezzo da titolo.`)
      : suitor.tier === "mid"
        ? sayOr(s, [
            `$CLUB offre un ruolo da riferimento in un progetto a metà strada.`,
            `$CLUB non è in cima, non è in fondo. Ti vuole come volto, non come salvezza.`,
            `Un passo di lato, verso $CLUB: minuti, responsabilità, niente scuse.`,
            `$CLUB mette sul tavolo un ruolo da riferimento, senza promettere giugno.`,
          ], { CLUB: suitor.name }, `$CLUB offre un ruolo da riferimento.`)
        : sayOr(s, [
            `$CLUB ricostruisce. Minuti subito, vittorie dopo — se arrivano.`,
            `A $CLUB sei il progetto, non il complemento. I minuti non mancano.`,
            `$CLUB è in basso. Ti danno le chiavi, e il peso che ne viene.`,
            `Ricostruzione a $CLUB: possessi tuoi, classifica da scrivere.`,
          ], { CLUB: suitor.name }, `$CLUB ricostruisce intorno a te.`);
  const bump = suitor.tier === "contender" ? 0.4 : suitor.tier === "rebuilding" ? 0.2 : 0.3;
  const kind = suitor.tier === "contender" ? "contender" : suitor.tier === "mid" ? "mid" : "rebuilding";
  return { team: suitor, pitch: localizePitch(s, kind, suitor.name, pitch), bump };
}

export function acceptTrade(s: PlayerState, team: Team) {
  return withPlayer(s, () => {
  const old = s.team.name;
  s.team = team;
  s.contract = { ...s.contract, teamName: team.name };
  s.coachTrust = 48;
  s.hidden.chemistry = clamp(s.hidden.chemistry - 5, 0, 100);
  s.form += 0.5;
  s.development += 0.25;
  s.attrs.handle = clampAttr(s.attrs.handle + 0.3);
  s.yearsOnTeam = 0;
  imprint(s, 0.12);
  occupyTeamSlot(s);
  return old;
  });
}

export function acceptForcedPreseasonTrade(s: PlayerState, team: Team, season = s.season) {
  const from = acceptTrade(s, team);
  s.choiceLog.push({ season, title: "Scambio", pick: `${from} → ${team.name}` });
  return from;
}

export function acceptForcedSummerTrade(s: PlayerState, team: Team, season = s.season) {
  const from = acceptTrade(s, team);
  s.choiceLog.push({ season, title: "Scambio estivo", pick: `${from} → ${team.name}` });
  return from;
}

export function recordRetirementChoice(s: PlayerState, continueTo36: boolean) {
  s.choiceLog.push({
    season: s.season,
    title: "Ritiro",
    pick: continueTo36 ? "Gioca a 36 anni" : "Chiudi ora",
  });
}

export function refuseTrade(s: PlayerState) {
  s.coachTrust = clamp(s.coachTrust + 5, 0, 100);
  s.hidden.chemistry = clamp(s.hidden.chemistry + 3, 0, 100);
  s.attrs.iq = clampAttr(s.attrs.iq + 0.25);
  imprint(s, 0.06);
}

export function shouldOfferTrade(s: PlayerState, n: number) {
  return withPlayer(s, () => {
    if (s.team?.abbr === "UND" || !s.draftPick) return false;
    if (n <= 2) return false;
    if (s.contract.yearsRemaining <= 0) return false;
    let p = 0.16;
    if (s.yearsOnTeam >= 3) p += 0.12;
    if (s.yearsOnTeam >= 5) p += 0.1;
    if (s.coachTrust < 42) p += 0.16;
    if (s.hidden.ego >= 68) p += 0.08;
    if (s.team.tier === "rebuilding" && s.overall >= 74) p += 0.14;
    if (s.team.tier === "contender" && s.overall < 68) p += 0.1;
    if ((s.contract.yearsRemaining ?? 2) <= 1) p += 0.08;
    return rand() < Math.min(0.7, p);
  });
}

/** Scambio chiuso dalla dirigenza: notifica, niente scelta. */
export function shouldForceTrade(s: PlayerState) {
  return withPlayer(s, () => {
    let p = 0.22;
    if (s.yearsOnTeam >= 4) p += 0.16;
    if (s.coachTrust < 38) p += 0.18;
    if (s.hidden.ego >= 70) p += 0.08;
    if (s.team.tier === "rebuilding" && s.overall >= 76) p += 0.12;
    return rand() < p;
  });
}

export function isContractYear(s: PlayerState, n: number) {
  if (s.contract.yearsRemaining <= 0) return true;
  if (n === 12 && s.age >= 30) return true;
  return false;
}

export function tickContract(s: PlayerState) {
  s.contract.yearsRemaining = Math.max(0, s.contract.yearsRemaining - 1);
}

export function ageTrainMult(s: PlayerState, key: AttrKey) {
  const physical = key === "athleticism" || key === "strength";
  const age = s.age;
  if (age <= 23) return physical ? 1.28 : 1.18;
  if (age <= 27) return physical ? 1.06 : 1.0;
  if (age <= 31) return physical ? 0.52 : 0.9;
  return physical ? 0.18 : 0.72;
}

function dimReturn(current: number) {
  if (current >= 88) return 0.32;
  if (current >= 80) return 0.5;
  if (current >= 70) return 0.72;
  if (current >= 62) return 0.88;
  return 1;
}

function previewFocus(s: PlayerState, id: string) {
  const focus = OFFSEASON_FOCUSES.find((f) => f.id === id)!;
  const ethic = 0.78 + s.hidden.workEthic / 220;
  const gains = focus.gains.map((g) => {
    const cur = s.attrs[g.key];
    let delta = round1(g.base * ageTrainMult(s, g.key) * dimReturn(cur) * ethic * diffOf(s).growth);
    if (delta === 0 && g.base > 0 && ageTrainMult(s, g.key) > 0.2) delta = rand() < 0.4 ? 0.4 : 0;
    if (cur + delta > 99) delta = round1(99 - cur);
    return { key: g.key, delta };
  });
  return { focus, gains };
}

function pickOffseasonFocuses(s: PlayerState) {
  let pool = OFFSEASON_FOCUSES.filter((f) => f.id !== s.lastOffseasonId);
  const preferred = pool.filter((f) => f.roles.includes(s.role) && f.id !== "recovery");
  const picked: typeof OFFSEASON_FOCUSES = [];
  const take = (list: typeof pool) => {
    if (!list.length) return;
    const item = pick(list);
    picked.push(item);
    pool = pool.filter((f) => f.id !== item.id);
  };
  take(preferred.length ? preferred : pool);
  const wantRec = s.injuryRisk >= 38 || s.age >= 31;
  const rec = pool.find((f) => f.id === "recovery");
  if (wantRec && rec && rand() < 0.85) {
    picked.push(rec);
    pool = pool.filter((f) => f.id !== "recovery");
  } else {
    const rest = pool.filter((f) => f.roles.includes(s.role));
    take(rest.length ? rest : pool);
  }
  while (picked.length < 3 && pool.length) take(pool);
  return picked.slice(0, 3);
}

export function applyOffseason(s: PlayerState, n: number, id: string): DevRow {
  const { focus, gains } = previewFocus(s, id);
  const before = s.overall;
  gains.forEach((g) => {
    s.attrs[g.key] = clampAttr(s.attrs[g.key] + g.delta);
  });
  if (focus.hidden) {
    (Object.keys(focus.hidden) as HiddenKey[]).forEach((k) => {
      s.hidden[k] = clamp(s.hidden[k] + (focus.hidden![k] || 0), 0, 100);
    });
  }
  s.injuryRisk = clamp(s.injuryRisk + focus.injury, 0, 100);
  s.development = round1(clamp(s.development + focus.development, -8, 16));
  s.lastOffseasonId = id;
  const attrFx: Partial<Record<AttrKey, number>> = {};
  gains.forEach((g) => {
    attrFx[g.key] = g.delta;
  });
  imprint(
    s,
    contextualPulse(s, {
      attrs: attrFx,
      hidden: focus.hidden,
      development: focus.development,
      injuryRisk: focus.injury,
      flavor: focus.label,
    }),
  );
  applyAging(s);
  const after = refreshOverall(s);
  const line = gains
    .filter((g) => g.delta)
    .map((g) => `${g.delta > 0 ? "+" : ""}${g.delta.toFixed(1)} ${ATTR_LABELS[g.key]}`)
    .join(", ");
  const row: DevRow = { season: n, label: focus.label, line, before, after };
  s.devLog.push(row);
  return row;
}

/** Estate automatica: niente scelta. Tutto può succedere, pesato. */
export function applyAutoOffseason(s: PlayerState, n: number): DevRow {
  return withPlayer(s, () => {
    let row: DevRow;
    try {
      const ev = pickSummerEvent(s);
      row = applyOffseason(s, n, ev.focusId);
      if (ev.extra) applyFx(s, { ...ev.extra, flavor: ev.beat });
      if (ev.move === "europe-feeler" && s.age >= 30) {
        applyFx(s, { publicImage: 1, flavor: ev.beat });
      }
      s.lastOffseasonId = ev.id;
      row.label = ev.label || row.label || "Estate chiusa";
      row.line = ev.beat || row.line || "Luglio è passato. Settembre legge il passo.";
      if (ev.move === "trade") {
        const dest = pickSummerDestination(s);
        row.tradeDest = dest;
        const pForce =
          0.34 +
          (s.coachTrust < 40 ? 0.18 : 0) +
          (s.yearsOnTeam >= 5 ? 0.1 : 0) +
          (s.hidden.ego >= 72 ? 0.08 : 0);
        row.tradeForced = rand() < pForce;
        row.line = (ev.beat || row.line).replace(/per ora\.?$/i, "").trim();
        if (!row.line.includes(dest.city) && !row.line.includes(dest.abbr)) {
          row.line = `${row.line} ${dest.city} (${dest.abbr}) è nel foglio.`;
        }
      }
      const lastDev = s.devLog[s.devLog.length - 1];
      if (lastDev) {
        lastDev.label = row.label;
        lastDev.line = row.line;
      }
    } catch {
      const focuses = pickOffseasonFocuses(s);
      const rec = focuses.find((f) => f.id === "recovery");
      const id = rec && (s.injuryRisk >= 45 || s.age >= 33) ? rec.id : focuses[0]!.id;
      row = applyOffseason(s, n, id);
      row.label = row.label || "Estate di tregua";
      row.line = row.line || "Il corpo ha chiesto tregua. Gliel'hai data.";
    }
    if (s.seasonHistory.length) {
      const last = s.seasonHistory[s.seasonHistory.length - 1]!;
      if (!s.championLog.some((c) => c.yearLabel === last.yearLabel && c.league === s.league)) {
        settleYearTitle(s, last.playoff === "Campione");
      }
    }
    tickWorld(s);
    s.playoff = null;
    return row;
  });
}

export function ovrDeltaLine(before: number, after: number) {
  const d = round1(after - before);
  if (Math.abs(d) < 0.05) return "";
  const sign = d > 0 ? "+" : "";
  return `Overall ${before.toFixed(1)} → ${after.toFixed(1)} (${sign}${d.toFixed(1)})`;
}

export function idealCurveSeries(s: PlayerState) {
  const startAge = s.startAge || 20;
  const pot = Number.isFinite(s.potential) ? s.potential : 76;
  const tw = twilightOf(s);
  return Array.from({ length: MAX_AGE - 18 }, (_, i) => {
    const age = 19 + i;
    const curva = round1(clamp(overallSpine(age, startAge, pot, tw), 50, 99));
    return { age, curva };
  });
}

function hintPick(seed: number, slot: number, pool: string[]): string {
  if (!pool.length) return "";
  const x = Math.abs((Math.imul(seed ^ (slot * 2654435761), 1597334677) | 0));
  return pool[x % pool.length]!;
}

export function hiddenHints(s: PlayerState): string[] {
  const h = s.hidden;
  const seed = (Number.isFinite(s.seed) ? s.seed : 1) + (s.season || 0) * 19 + (s.age || 20) * 3;
  const team = s.team?.name || "la squadra";
  const out: string[] = [];
  const add = (pool: string[]) => {
    const line = hintPick(seed, out.length + 1, pool);
    if (line && !out.includes(line)) out.push(line);
  };

  if (h.clutch >= 62) {
    add([
      "Nelle partite chiuse il polso non trema: il possesso diventa un compito, non un giudizio.",
      "Quando il cronometro stringe, gli altri cercano te. Tu cerchi lo spazio, non l'applauso.",
      "Gli ultimi possessi ti trovano già pronto. Il silenzio del palazzetto, a te, non pesa.",
    ]);
  } else if (h.clutch <= 38) {
    add([
      "Gli ultimi possessi ti pesano più del dovuto: il corpo arriva, la testa arriva un secondo dopo.",
      "Nelle chiusure il parquet si allunga. Non è paura: è un conto che non torna ancora.",
      "Quando la partita chiede una firma, tu senti troppe voci. Il gesto ne risente.",
    ]);
  } else {
    add([
      "Nelle chiusure sei credibile, non ancora inevitabile. Il mestiere c'è: manca l'abitudine a firmarle.",
      "I possessi caldi non ti spaventano, ma non ti appartengono ancora. Un altro ottobre, forse.",
      "Quando il palazzetto trattiene il fiato, tu resti nel mezzo: né eroe, né assente.",
    ]);
  }

  if (h.durability <= 40) {
    add([
      "Il fisico manda segnali. Ogni estate conta, e non tutte le estati restituiscono lo stesso corpo.",
      "Le ginocchia parlano prima dello staff. Tu fai finta di non sentire, ma il calendario no.",
      "Il corpo tiene a giorni alterni. La carriera, da qui, si misura nei recuperi, non nei colpi da copertina.",
    ]);
  } else if (h.durability >= 68) {
    add([
      "Il corpo tiene, anche quando gli altri si fermano. Lo staff lo nota più dei giornali.",
      "Le notti si accumulano e tu resti in campo. Non è rumore: è un vantaggio silenzioso.",
      "La disponibilità è già un talento. Tu ci sei, partita dopo partita, e la panchina lo sa.",
    ]);
  } else {
    add([
      "Il corpo risponde, con qualche conto da pagare a marzo. Niente allarmi, niente certezze.",
      "Una stagione intera è un mestiere di gestione. Tu non sei di vetro, e non sei di ferro.",
    ]);
  }

  if (h.workEthic >= 68) {
    add([
      "Lo staff parla del tuo orario, non dei tuoi highlight. La palestra si accende prima di te, e tu ci sei già.",
      "Il lavoro extra non è una dichiarazione. È una stanza, un orario, un gesto ripetuto finché diventa tuo.",
      "Arrivi prima. Restiamo. È l'unica biografia che lo staff racconta senza giri di parole.",
    ]);
  } else if (h.workEthic <= 38) {
    add([
      "In palestra arrivi. Non sempre resti. Il talento copre, per ora: non coprirà per sempre.",
      "Il gesto naturale ti salva le settimane pigre. Lo staff lo vede, e non è un complimento.",
      "C'è un margine che non stai usando. Si vede da come esci, non da come entri.",
    ]);
  } else {
    add([
      "Lavori quanto basta per restare nel giro. Qualcuno, in palestra, fa di più: lo senti.",
      "La disciplina c'è, senza diventare una religione. Un gradino sopra, o uno sotto: lo scegli tu.",
    ]);
  }

  if (h.ego >= 68) {
    add([
      `In spogliatoio qualcuno gira intorno al tuo nome. A ${team} il volume si alza quando entri.`,
      "Il tuo nome pesa più della maglia, qualche sera. Non tutti in cerchio lo digeriscono.",
      "Vuoi la palla, e lo dici col corpo. La squadra può seguirti, o può stancarsi.",
    ]);
  } else if (h.ego <= 32) {
    add([
      "Passi la palla anche quando il tiro c'è. Generoso, a tratti troppo: i compagni lo sanno.",
      "Ti sottrai al centro. Funziona, finché la partita non chiede che tu ci resti.",
      "Il vanto non fa parte del tuo vocabolario. A volte, però, il parquet lo chiede.",
    ]);
  }

  if (h.chemistry >= 68) {
    add([
      "Il gruppo si muove meglio quando sei in campo. Non è statistica: è un modo di respirare insieme.",
      "Le letture arrivano un tempo prima. I compagni alzano la mano senza chiamare.",
      `A ${team} il gioco diventa più semplice con te: meno voci, più geometrie.`,
    ]);
  } else if (h.chemistry <= 38) {
    add([
      "C'è distanza, in spogliatoio. Non è una lite: è un silenzio che pesa più di una lite.",
      "Le geometrie non tornano. Tu vedi una cosa, gli altri un'altra, e il pallone paga.",
      "Il gruppo ti tiene nel conto, non ancora nel cerchio. Si sente tra un tempo morto e l'altro.",
    ]);
  } else {
    add([
      "Il rapporto col gruppo è professionale, non ancora intimo. Si costruisce a dicembre, si verifica ad aprile.",
      "Né estraneo né perno. Occupi il posto che ti hanno dato, e aspetti che diventi tuo.",
    ]);
  }

  if (h.consistency >= 66) {
    add([
      "Le tue medie non mentono: sei lo stesso, notte dopo notte. I coach comprano questo, non l'esplosione.",
      "La ripetibilità è il tuo lusso. Poche sere vuote, poche sere inventate.",
    ]);
  } else if (h.consistency <= 36) {
    add([
      "Una sera sei un altro. La successiva, un altro ancora. Lo staff non sa quale versione convocare.",
      "Il talento arriva a ondate. Le partite in cui manca, pesano più di quelle in cui avanza.",
    ]);
  }

  if (h.motor >= 66) {
    add([
      "Il quinto fallo arriva tardi. Tu no. Il secondo salto è ancora il primo, a tre minuti dalla sirena.",
      "Il fiato dura più del copione. Sulle transizioni resti, quando gli altri chiedono il cambio.",
    ]);
  } else if (h.motor <= 38) {
    add([
      "Il primo salto è tuo. Il terzo, no. Le transizioni lunghe ti scoprono.",
      "A fine gara le gambe negoziano. Il mestiere, lì, diventa gestione, non dominio.",
    ]);
  }

  if (h.mediaSavvy >= 64) {
    add([
      "La stampa ti cerca, e tu sai cosa dire. Una frase al posto giusto vale una settimana di pace.",
      "Davanti ai microfoni non improvvisi. Costruisci la versione, e la città la compra.",
    ]);
  } else if (h.mediaSavvy <= 32) {
    add([
      "Davanti ai microfoni preferisci il silenzio. Non sempre aiuta: il vuoto lo riempie qualcun altro.",
      "Le interviste ti stanno strette. Una risposta di troppo, o di meno, e la storia ti sfugge.",
    ]);
  }

  if (s.form >= 1.6) {
    add([
      "In queste settimane il gesto entra da solo. Non è magia: è un periodo, e va abitato senza spiegarlo.",
      "La palla esce pulita. Lo senti prima del tabellone, e lo staff ha smesso di correggere.",
    ]);
  } else if (s.form <= -1.4) {
    add([
      "Il periodo è opaco. I tiri che di solito cadono, adesso negoziano. Non è finita: è una traversata.",
      "Il corpo è in ritardo di un tempo. Si aspetta, si lavora, non si inventa una svolta in conferenza.",
    ]);
  }

  if (s.coachTrust >= 68) {
    add([
      "L'allenatore ti lascia i minuti anche quando sbagli. È un credito: si restituisce in campo, non a parole.",
      "Dalla panchina arriva fiducia, non un'istruzione ogni possesso. Raro, e si sente.",
    ]);
  } else if (s.coachTrust <= 38) {
    add([
      "La panchina ti guarda con il cronometro in mano. I minuti non sono un diritto, stavolta.",
      "Il coach chiede prove, non promesse. Ogni rotazione è un esame, e lo sai.",
    ]);
  }

  if (s.age <= 22) {
    add([
      `A ${s.age} anni, a ${team}, il palazzetto è ancora una stanza nuova. Ogni sera impari un nome.`,
      "Sei ancora in costruzione. Le sere belle non fanno una carriera: fanno un inizio, se le tieni.",
      "Il corpo impara più in fretta della fama. Meglio così: la fama, da sola, non insegna i copioni.",
    ]);
  } else if (s.age >= 32) {
    add([
      `A ${s.age} anni il mestiere è scegliere cosa non fare. A ${team} lo sanno prima i tifosi.`,
      "Il mestiere adesso è scegliere cosa non fare. Le gambe lo sanno prima della testa.",
      "Non corri più tutte le cause. Corri quelle che chiudono le partite, e basta.",
    ]);
  } else if (s.age >= 26 && s.age <= 28) {
    add([
      `Questi sono gli anni in cui il mestiere si vede intero. A ${team}, a ${s.age} anni, la finestra è aperta.`,
      "Il picco non si dichiara. Si gioca, si tiene, si lascia che i numeri lo raccontino dopo.",
    ]);
  }

  if (s.publicImage >= 70) {
    add([
      "La città ha già una versione di te. Tu puoi confermarla, o puoi stancarla: non puoi ignorarla.",
    ]);
  } else if (s.publicImage <= 35) {
    add([
      "Fuori dal palazzetto il tuo nome è ancora un sussurro. In un certo senso è un lusso.",
    ]);
  }

  if (s.league === "EuroLega") {
    add([
      "Il palazzetto europeo chiede un altro passo: più fisico, meno possessi, nessuna notte facile.",
    ]);
  }

  if (out.length < 4) {
    add([
      "I tratti coperti restano coperti. Resta questo: come ti senti, oggi, dentro la vita in corso.",
      "Niente verdetto, ancora. Solo il diario di come il mestiere ti sta attraversando.",
      "Le sensazioni non sono statistiche. Sono il modo in cui la stagione ti parla, quando i numeri tacciono.",
    ]);
  }

  return out.slice(0, 7);
}

export function verdictOf(s: PlayerState) {
  const seasons = s.seasonHistory.length || 1;
  const avgP = s.seasonHistory.reduce((a, r) => a + r.ppg, 0) / seasons;
  const d = diffOf(s);
  const score = clamp(
    Math.round(
      (Math.max(0, s.peakOverall - 58) * 1.05 +
        s.mvpCount * 11 +
        s.titleCount * 8 +
        s.fmvpCount * 4.2 +
        s.allNbaCount * 2.4 +
        s.allStarCount * 0.65 +
        s.dpoyCount * 2.1 +
        (s.roy ? 2 : 0) +
        (s.international ? 1.5 : 0) +
        (s.medal ? 2 : 0) +
        Math.min(avgP, 24) * 0.42 +
        Math.min(seasons, 16) * 0.35) *
        d.verdict,
    ),
    0,
    100,
  );
  let verdict = "Carriera in ombra";
  let closing = "Non tutte le storie finiscono con un trofeo alzato, e va bene così.";
  let card = "bronze";
  if (score >= 90 && s.peakOverall >= 90 && (s.mvpCount >= 2 || (s.mvpCount >= 1 && s.titleCount >= 1))) {
    verdict = "Il fenomeno";
    closing = "Una carriera che entra nei libri. Non tutti ci arrivano; tu ci sei arrivato.";
    card = "legend";
  } else if (score >= 78 && (s.peakOverall >= 86 || s.titleCount >= 2 || s.mvpCount >= 1)) {
    verdict = "Leggenda di franchigia";
    closing = "Il tipo di giocatore attorno a cui una città costruisce un decennio.";
    card = "gold";
  } else if (score >= 64) {
    verdict = "Stella affidabile";
    closing = "Non sempre sui titoli, ma decisivo quando la serie si stringe.";
    card = "gold";
  } else if (score >= 48) {
    verdict = "Comprimario solido";
    closing = "Il compagno che ogni squadra da titolo vorrebbe avere accanto.";
    card = "silver";
  } else if (score >= 32) {
    verdict = "Giocatore di rotazione";
    closing = "Una carriera onesta, fatta di minuti guadagnati, non regalati.";
    card = "bronze";
  }
  const origin: Record<string, string> = {
    NCAA: " Tutto è partito da un campus universitario.",
    Europa: " Il ragazzo cresciuto in Europa è arrivato più lontano di quanto molti immaginassero.",
    "G-League": " Chi ha bruciato le tappe non ha mai smesso di correre.",
  };
  closing += origin[s.originPath] || "";
  return { score, verdict, closing, card };
}

export function careerCardOf(s: PlayerState): CareerCard {
  const v = verdictOf(s);
  const seasons = s.seasonHistory.length || 1;
  const avg = (pick: (r: SeasonRow) => number) =>
    round1(s.seasonHistory.reduce((a, r) => a + pick(r), 0) / seasons);
  return {
    id: `${s.seed}:${SAVE_VERSION}`,
    playerName: s.name,
    role: ROLES[s.role].label,
    nationality: s.nationality,
    ageStart: s.startAge || s.seasonHistory[0]?.age || s.age,
    ageEnd: careerEndAge(s),
    seasons,
    peakOverall: s.peakOverall,
    ppg: avg((r) => r.ppg),
    rpg: avg((r) => r.rpg),
    apg: avg((r) => r.apg),
    championships: s.titleCount,
    allStars: s.allStarCount,
    mvps: s.mvpCount,
    verdict: v.verdict,
    legacyTier: v.card,
    milestones: s.milestones.map((m) => m.label),
    engineVersion: s.engineVersion,
  };
}

export function toArchive(s: PlayerState): ArchiveCareer {
  const v = verdictOf(s);
  const card = careerCardOf(s);
  const seasons = card.seasons;
  const savedAt = Date.now();
  return {
    id: archiveId(savedAt),
    savedAt,
    version: SAVE_VERSION,
    name: s.name,
    role: card.role,
    verdict: v.verdict,
    seasons,
    peak: s.peakOverall,
    apexAge: s.apexAge,
    titles: s.titleCount,
    ppg: card.ppg,
    closing: v.closing,
    history: compactArchiveHistory(s.seasonHistory),
    milestones: s.milestones,
    choices: s.choiceLog,
    finalAttrs: { ...s.attrs },
    finalHidden: { ...s.hidden },
    difficulty: s.difficulty,
    simulated: s.simulated,
    seed: s.seed,
    careerId: s.careerId,
    engineVersion: s.engineVersion,
    card,
    fingerprint: fingerprintOf(card),
    archiveSchema: ARCHIVE_SCHEMA,
  };
}

let archiveIdSequence = 0;

function archiveId(timestamp: number) {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  archiveIdSequence += 1;
  return `${timestamp}-${archiveIdSequence}`;
}

export const ARCHIVE_KEY = "pivot-v2-archive";
/**
 * Raw copies of archive contents this build could not fully read (unparseable JSON, or entries it
 * drops such as a newer version), taken before saveArchive() writes over them. Newest last, capped.
 */
export const ARCHIVE_BACKUP_KEY = "pivot-v2-archive-backup";
const ARCHIVE_BACKUP_KEEP = 3;
export const SAVE_KEY = "pivot-v2-save";
let archiveMemory: ArchiveCareer[] = [];

/** Test hook: forget the in-memory archive copy kept for storage-less sessions. */
export function resetArchiveMemory() {
  archiveMemory = [];
}

/** True when `raw` holds something loadArchive() would not carry forward on the next write. */
function archiveLosesData(raw: string): boolean {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return true;
    return parsed.some((entry) => normalizeArchiveEntry(entry) === null);
  } catch {
    return true;
  }
}

/** Keeps `raw` under ARCHIVE_BACKUP_KEY in `store` before it is overwritten. Best effort. */
function backupArchiveRaw(store: Storage, raw: string) {
  try {
    let raws: string[] = [];
    try {
      const prev = JSON.parse(store.getItem(ARCHIVE_BACKUP_KEY) ?? "null") as { raws?: unknown } | null;
      if (prev && Array.isArray(prev.raws)) raws = prev.raws.filter((r): r is string => typeof r === "string");
    } catch {
      /* unreadable backup: start a new one */
    }
    if (raws.includes(raw)) return;
    raws = [...raws, raw].slice(-ARCHIVE_BACKUP_KEEP);
    store.setItem(ARCHIVE_BACKUP_KEY, JSON.stringify({ v: 1, at: Date.now(), raws }));
  } catch {
    /* full or blocked storage: the write below is attempted anyway, as before */
  }
}

function archiveStores(): Storage[] {
  const found: Storage[] = [];
  for (const key of ["localStorage", "sessionStorage"] as const) {
    try {
      const store = globalThis[key];
      if (store && !found.includes(store)) found.push(store);
    } catch {
      // Some browser privacy modes throw while resolving the Storage property.
    }
  }
  return found;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidCareerCard(value: unknown): value is CareerCard {
  if (!isRecord(value)) return false;
  const stringFields = ["id", "playerName", "role", "nationality", "verdict", "legacyTier", "engineVersion"];
  const numberFields = ["ageStart", "ageEnd", "seasons", "peakOverall", "ppg", "rpg", "apg", "championships", "allStars", "mvps"];
  return stringFields.every((key) => typeof value[key] === "string")
    && numberFields.every((key) => isFiniteNumber(value[key]))
    && Array.isArray(value.milestones)
    && value.milestones.every((label) => typeof label === "string");
}

function normalizeArchiveEntry(value: unknown): ArchiveCareer | null {
  if (!isRecord(value)) return null;
  const requiredStrings = ["id", "name", "role", "verdict", "closing"];
  const requiredNumbers = ["savedAt", "version", "seasons", "peak", "titles", "ppg"];
  if (!requiredStrings.every((key) => typeof value[key] === "string")
    || !requiredNumbers.every((key) => isFiniteNumber(value[key]))) return null;
  if (!Number.isInteger(value.version) || (value.version as number) < 1 || (value.version as number) > SAVE_VERSION) {
    return null;
  }

  const history = Array.isArray(value.history)
    ? value.history.filter((row) => isRecord(row)
      && isFiniteNumber(row.season)
      && isFiniteNumber(row.age)
      && typeof row.yearLabel === "string"
      && typeof row.teamAbbr === "string"
      && [row.ppg, row.rpg, row.apg].every(isFiniteNumber))
      .map((row) => ({
        ...row,
        awards: Array.isArray(row.awards)
          ? row.awards.filter((award: unknown): award is string => typeof award === "string")
          : [],
      }))
    : [];
  const milestones = Array.isArray(value.milestones)
    ? value.milestones.filter((item) => isRecord(item) && isFiniteNumber(item.season) && typeof item.label === "string")
    : [];
  const choices = Array.isArray(value.choices)
    ? value.choices.filter((item) => isRecord(item)
      && isFiniteNumber(item.season)
      && typeof item.title === "string"
      && typeof item.pick === "string")
    : [];
  const normalized = { ...value, history: compactArchiveHistory(history as SeasonRow[]), milestones, choices, archiveSchema: ARCHIVE_SCHEMA } as unknown as ArchiveCareer;
  if (typeof value.careerId !== "string" || value.careerId.length === 0) {
    delete normalized.careerId;
  }

  // A broken optional card must not hide an otherwise readable legacy career.
  if (!isValidCareerCard(value.card)) {
    delete normalized.card;
  } else if (typeof value.fingerprint === "string" && value.fingerprint !== fingerprintOf(value.card)) {
    delete normalized.card;
  } else {
    const lastAge = history.at(-1)?.age;
    if (isFiniteNumber(lastAge) && value.card.ageEnd !== lastAge) {
      normalized.card = { ...value.card, ageEnd: lastAge };
      normalized.fingerprint = fingerprintOf(normalized.card);
    }
  }
  return normalized;
}

export function loadArchive(): ArchiveCareer[] {
  const stored: ArchiveCareer[][] = [];
  let readable = false;
  for (const store of archiveStores()) {
    try {
      const raw = store.getItem(ARCHIVE_KEY);
      if (raw === null) continue;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;
      readable = true;
      stored.push(parsed.map(normalizeArchiveEntry).filter((entry): entry is ArchiveCareer => entry !== null));
    } catch {
      // Keep trying the other browser store before falling back to memory.
    }
  }
  if (!readable) return [...archiveMemory];
  const unique = new Map<string, ArchiveCareer>();
  for (const entry of [...archiveMemory, ...stored.flat()]) if (!unique.has(entry.id)) unique.set(entry.id, entry);
  archiveMemory = [...unique.values()].sort((a, b) => b.savedAt - a.savedAt).slice(0, ARCHIVE_LIMIT);
  return [...archiveMemory];
}

/** Number of finished careers the archive keeps on this device. */
export const ARCHIVE_LIMIT = 8;

let archiveEvicted: ArchiveCareer[] = [];
let archiveWrite: { ok: boolean; persisted: boolean; reason?: "quota" | "unavailable" } = { ok: true, persisted: true };

/** Result of the last saveArchive() call. A quota miss keeps the in-memory career. */
export function lastArchiveWrite() {
  return { ...archiveWrite };
}

function coldArchive(entry: ArchiveCareer): ArchiveCareer {
  return {
    ...entry,
    archiveSchema: ARCHIVE_SCHEMA,
    history: entry.history.map((row) => {
      const next = { ...row };
      delete next.league;
      delete next.mood;
      return next;
    }),
  };
}

function writeArchiveStore(store: Storage, serialized: string): "ok" | "quota" | "fail" {
  try {
    const prior = store.getItem(ARCHIVE_KEY);
    if (prior !== null && prior !== serialized && archiveLosesData(prior)) backupArchiveRaw(store, prior);
  } catch {
    /* unreadable store: nothing to keep */
  }
  try {
    store.setItem(ARCHIVE_KEY, serialized);
    return store.getItem(ARCHIVE_KEY) === serialized ? "ok" : "fail";
  } catch (error) {
    return isStorageQuota(error) ? "quota" : "fail";
  }
}

/** Careers pushed out of the archive by the last saveArchive() call, newest limit first. */
export function lastArchiveEvicted(): ArchiveCareer[] {
  return [...archiveEvicted];
}

export function saveArchive(entry: ArchiveCareer) {
  const compact = { ...entry, archiveSchema: ARCHIVE_SCHEMA, history: compactArchiveHistory(entry.history) };
  const previous = loadArchive().filter((c) => c.id !== compact.id);
  const all = [compact, ...previous].slice(0, ARCHIVE_LIMIT);
  archiveEvicted = previous.slice(ARCHIVE_LIMIT - 1);
  archiveMemory = all;
  let serialized = JSON.stringify(all);
  let persisted = false;
  let quota = false;
  const stores = archiveStores();
  for (const store of stores) {
    const wrote = writeArchiveStore(store, serialized);
    if (wrote === "ok") persisted = true;
    else if (wrote === "quota") quota = true;
  }
  if (!persisted && quota) {
    const thinner = all.map(coldArchive);
    serialized = JSON.stringify(thinner);
    for (const store of stores) {
      const wrote = writeArchiveStore(store, serialized);
      if (wrote === "ok") {
        persisted = true;
        archiveMemory = thinner;
      }
    }
  }
  archiveWrite = persisted
    ? { ok: true, persisted: true }
    : { ok: false, persisted: false, reason: quota ? "quota" : "unavailable" };
  return [...archiveMemory];
}

function persistentArchiveStores(): Storage[] {
  try {
    const local = globalThis.localStorage;
    // With localStorage available, only localStorage outlives the tab.
    if (local) return [local];
  } catch {
    // Privacy modes can throw here: fall back to whatever store exists.
  }
  return archiveStores();
}

/**
 * True only when a completed career reached browser storage that outlives the tab
 * (localStorage when it exists), not just session memory.
 */
export function isArchivePersisted(id: string) {
  return persistentArchiveStores().some((store) => {
    try {
      const raw = store.getItem(ARCHIVE_KEY);
      if (!raw) return false;
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.some((entry) =>
        !!entry && typeof entry === "object" && !Array.isArray(entry) && (entry as { id?: unknown }).id === id,
      );
    } catch {
      return false;
    }
  });
}

/**
 * Is this career finished (an archive entry exists, even only in memory) and is that entry in
 * persistent storage? Used before any live save is deleted.
 */
export function archiveStateOf(careerId: string | undefined | null): { finished: boolean; archived: boolean } {
  if (!careerId) return { finished: false, archived: false };
  const entry = loadArchive().find((c) => c.careerId === careerId);
  if (!entry) return { finished: false, archived: false };
  return { finished: true, archived: isArchivePersisted(entry.id) };
}

export interface SimOpts {
  name?: string;
  role?: Role;
  nationality?: string;
  number?: number;
  difficulty?: DifficultyId;
  path?: "NCAA" | "Europa" | "G-League";
  potential?: number;
  seed?: number;
  /** Solo il laboratorio. La carriera giocata sceglie a mano. */
  draft?: "best" | "worst" | "random" | "mixed";
  /**
   * Laboratorio soltanto. Spento se assente: il percorso giocato non lo imposta.
   * Non entra nel save. I minuti forzati possono stare sotto il pavimento 11.5.
   */
  experiment?: CareerExperiment;
}

/** Confronto controllato. Non è una regola di gioco. */
export interface CareerExperiment {
  minutes?: number;
  workEthic?: number;
  injury?: "off" | "forced";
}

const experiments = new WeakMap<PlayerState, CareerExperiment>();

export function experimentOf(s: PlayerState): CareerExperiment | undefined {
  return experiments.get(s);
}

function lockExperimentEthic(s: PlayerState) {
  const ethic = experimentOf(s)?.workEthic;
  if (Number.isFinite(ethic)) s.hidden.workEthic = clamp(ethic as number, 0, 100);
}

function forcedMinutes(s: PlayerState, min: number): number {
  const forced = experimentOf(s)?.minutes;
  return Number.isFinite(forced) ? round1(clamp(forced as number, 0, 40)) : min;
}

export interface CareerSimJob {
  rng: Rng;
  s: PlayerState;
  n: number;
  opts: SimOpts;
}

export function openCareerSim(opts: SimOpts = {}): CareerSimJob {
  const roles: Role[] = ["PG", "SG", "SF", "PF", "C"];
  const paths = ["NCAA", "Europa", "G-League"] as const;
  const seed = (opts.seed ?? newSeed()) >>> 0 || 1;
  const rng = createRng(seed);
  const s = runWithRng(rng, () => {
    const player = freshPlayer(
      opts.name?.trim() || "Il Rookie",
      opts.role ?? pick(roles),
      opts.nationality ?? pick(NATIONALITIES).id,
      opts.number ?? randInt(0, 99),
      opts.difficulty ?? "pro",
      seed,
    );
    player.simulated = true;
    if (Number.isFinite(opts.potential)) {
      player.potential = round1(clamp((opts.potential as number) + diffOf(player).potential, 64, 99));
    }
    player.rivalName = pick(RIVAL_NAMES);
    player.coachName = pick(COACH_NAMES);
    const rounds = allDraftRounds();
    const policy = opts.draft ?? "random";
    for (let r = 0; r < rounds.length; r++) {
      const hand = player.draftHand;
      const last = Math.max(0, hand.length - 1);
      const idx =
        policy === "best"
          ? handPick(player, "best")
          : policy === "worst"
            ? handPick(player, "worst")
            : policy === "mixed"
              ? handPick(player, r % 2 === 0 ? "best" : "worst")
              : randInt(0, last);
      applyDraftCard(player, r, idx);
    }
    finishDraft(player);
    startProPath(player, opts.path ?? pick([...paths]));
    player.choiceLog.push({ season: 0, title: "Percorso", pick: player.originPath });
    const landed = revealDraftLanding(player);
    player.choiceLog.push({
      season: 0,
      title: "Chiamata",
      pick: `${landed.pick}ª · ${landed.team.name}`,
    });
    return player;
  });
  if (opts.experiment) experiments.set(s, opts.experiment);
  lockExperimentEthic(s);
  return { rng, s, n: 1, opts };
}

/** Una stagione. true quando la carriera è chiusa. Cede il filo tra una chiamata e l'altra. */
export function advanceCareerSim(job: CareerSimJob): boolean {
  if (job.n > 20 || isCareerOver(job.s)) {
    job.s.rngState = job.rng.getState();
    return true;
  }
  runWithRng(job.rng, () => {
    const n = job.n;
    const s = job.s;
    s.season = n;
    const scripted = scriptedSeasonEvent(s, n);
    const ev = scripted ?? pickStoryEvent(s, n);
    if (scripted && !s.usedEventIds.includes(scripted.id)) s.usedEventIds.push(scripted.id);
    const ch = pick(ev.choices);
    applyFx(s, ch.fx(s));
    lockExperimentEthic(s);
    s.choiceLog.push({ season: n, title: ev.title, pick: ch.label });
    if (!scripted && n !== 12 && shouldOfferTrade(s, n) && rand() < 0.22) {
      const t = buildTradeOffer(s);
      acceptTrade(s, t.team);
      s.choiceLog.push({ season: n, title: "Scambio", pick: t.team.name });
    }
    const row = simulateRegularSeason(s, n);
    if (qualifiesPlayoffs(s, row)) {
      beginPlayoffs(s);
      const max = playoffRounds(s).length;
      for (let round = 0; round < max; round++) {
        const opp = pickPlayoffOpponent(s, round);
        const choices = playoffChoicesFor(s, round);
        const idx = randInt(0, Math.max(0, choices.length - 1));
        const res = resolvePlayoffRound(s, n, round, idx, opp);
        s.choiceLog.push({
          season: n,
          title: playoffRounds(s)[round] || "Playoff",
          pick: choices[idx]?.label || "Scelta",
        });
        if (res.champion || !res.win) break;
      }
    } else {
      row.playoff = "Fuori";
      settleYearTitle(s, false);
    }
    if (!isCareerOver(s)) {
      const summer = applyAutoOffseason(s, n);
      lockExperimentEthic(s);
      tickContract(s);
      const freeAgent = isContractYear(s, n + 1) || s.contract.yearsRemaining <= 0;
      if (freeAgent) {
        const offers = buildFaOffers(s);
        if (offers.length) {
          const ranked = [...offers].sort((a, b) => b.annualM - a.annualM);
          const offer = rand() < 0.64 ? ranked[0]! : pick(offers);
          acceptOffer(s, offer);
          s.choiceLog.push({
            season: n,
            title: "Agenzia libera",
            pick: `${offer.team.name} · ${offer.years}×$${offer.annualM}M`,
          });
        }
      } else if (summer.tradeDest && (summer.tradeForced || rand() < 0.42)) {
        acceptForcedSummerTrade(s, summer.tradeDest, n);
      }
    }
    job.n = n + 1;
  });
  if (job.n > 20 || isCareerOver(job.s)) {
    job.s.rngState = job.rng.getState();
    return true;
  }
  return false;
}

/** Simula una carriera completa fino ai 36 anni e restituisce lo stato giocatore. */
export function playCareerSim(opts: SimOpts = {}): PlayerState {
  const job = openCareerSim(opts);
  let done = false;
  while (!done) done = advanceCareerSim(job);
  lockExperimentEthic(job.s);
  return job.s;
}

export function simulateFullCareer(opts: SimOpts = {}) {
  const s = playCareerSim(opts);
  return {
    start: START_OVERALL,
    peak: s.peakOverall,
    end: s.overall,
    hit90: s.peakOverall >= 90,
    titles: s.titleCount,
    potential: s.potential,
    ageEnd: careerEndAge(s),
    seasons: s.seasonHistory.length,
    difficulty: s.difficulty,
    hof: hofTier(s),
    mvp: s.mvpCount,
    ppg: s.seasonHistory.length
      ? round1(s.seasonHistory.reduce((a, r) => a + r.ppg, 0) / s.seasonHistory.length)
      : 0,
  };
}

function pctile(arr: number[], p: number) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.max(0, Math.round((s.length - 1) * p)));
  return s[i]!;
}

type CareerSimRow = ReturnType<typeof simulateFullCareer>;

export function summarizeCareers(rows: CareerSimRow[], difficulty: DifficultyId) {
  const n = rows.length || 1;
  const hit = rows.filter((r) => r.hit90).length;
  const ends = rows.map((r) => r.end);
  const inBand = ends.filter((e) => e >= 55 && e <= 65).length;
  const peaks = rows.map((r) => r.peak);
  const hall = rows.filter((r) => r.hof === "hall").length;
  return {
    n,
    difficulty,
    pct90: Math.round((hit / n) * 1000) / 10,
    meanPeak: round1(rows.reduce((a, r) => a + r.peak, 0) / n),
    medianPeak: round1(pctile(peaks, 0.5)),
    p10Peak: round1(pctile(peaks, 0.1)),
    p90Peak: round1(pctile(peaks, 0.9)),
    meanStart: round1(rows.reduce((a, r) => a + r.start, 0) / n),
    meanEnd: round1(ends.reduce((a, b) => a + b, 0) / n),
    pctEndBand: Math.round((inBand / n) * 1000) / 10,
    minEnd: Math.min(...ends),
    maxEnd: Math.max(...ends),
    minPeak: Math.min(...peaks),
    maxPeak: Math.max(...peaks),
    meanTitles: round1(rows.reduce((a, r) => a + r.titles, 0) / n),
    pctHof: Math.round((hall / n) * 1000) / 10,
    meanPpg: round1(rows.reduce((a, r) => a + r.ppg, 0) / n),
    meanAge: round1(rows.reduce((a, r) => a + r.ageEnd, 0) / n),
  };
}

export function simulateManyCareers(n = 100, difficulty: DifficultyId = "pro") {
  const rows = Array.from({ length: n }, () => simulateFullCareer({ difficulty }));
  return summarizeCareers(rows, difficulty);
}

/** Stessa simulazione, a lotti, perché 120 vite sincrone bloccano il browser. */
export function simulateManyCareersAsync(
  n: number,
  difficulty: DifficultyId,
  onProgress?: (done: number, total: number) => void,
) {
  return new Promise<ReturnType<typeof summarizeCareers>>((resolve, reject) => {
    const rows: CareerSimRow[] = [];
    const batch = 3;
    const step = () => {
      try {
        const end = Math.min(n, rows.length + batch);
        while (rows.length < end) rows.push(simulateFullCareer({ difficulty }));
        onProgress?.(rows.length, n);
        if (rows.length >= n) resolve(summarizeCareers(rows, difficulty));
        else setTimeout(step, 0);
      } catch (err) {
        reject(err);
      }
    };
    setTimeout(step, 0);
  });
}

export type { Contract };
