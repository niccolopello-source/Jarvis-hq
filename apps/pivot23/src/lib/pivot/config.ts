
/** Configurazione centrale del motore. Niente magic number sparsi senza nome. */

export const ENGINE_VERSION = "2.11.0-beta";
export const SAVE_VERSION = 11;

/** Quanto resta in evidenza una risposta (scelta, titolo) prima del passo successivo. */
export const HOLD_MS = 1750;
export const HOLD_RECAP_MS = 720;
export const HOLD_TITLE_MS = 1400;
export const HOLD_MARKET_MS = 1500;
export const HOLD_FINALS_MS = 2400;

export const SIM = {
  overall: {
    min: 48,
    max: 99,
    start: 60,
    peakAge: 27,
    maxAge: 36,
    peakBand: [26, 28] as const,
    yoyYoung: 6,
    yoyPeak: 4,
    yoyOld: 3,
  },
  attr: { min: 0, max: 99 },
  hidden: { min: 0, max: 100 },
  choice: {
    mix: 0.74,
    min: -10,
    max: 10,
    eventMin: -1.45,
    eventMax: 1.5,
    remnant: 0.4,
  },
  development: {
    young: 1.22,
    prime: 1.0,
    stabilize: 0.72,
    decline: 0.42,
    workEthicWeight: 0.24,
    lateBloomAge: [24, 28] as const,
    lateBloomRate: 0.09,
    bustRate: 0.1,
  },
  aging: {
    iqGainUntil: 35,
    athDropAfter: 29,
    strengthDropAfter: 31,
    shootingDropAfter: 32,
  },
  injury: {
    baseMiss: 16,
    durabilityWeight: 7.5,
    ageAfter: 32,
    maxGpNba: 82,
    maxGpEuro: 34,
  },
  awards: {
    production: 0.25,
    teamSuccess: 0.2,
    efficiency: 0.15,
    impact: 0.15,
    availability: 0.1,
    consistency: 0.1,
    narrative: 0.05,
    noise: 4,
    royTarget: 0.07,
    dpoyTarget: 0.028,
  },
  draft: {
    rounds: 10,
    hand: 3,
    pickMin: 1,
    pickMax: 60,
  },
  path: {
    NCAA: { ovr: 1.2, age: 21 },
    Europa: { ovr: 1.45, age: 19 },
    "G-League": { ovr: 0.9, age: 19 },
  },
  team: {
    talent: 0.25,
    starting: 0.15,
    depth: 0.1,
    offense: 0.1,
    defense: 0.1,
    fit: 0.1,
    chemistry: 0.08,
    health: 0.05,
    experience: 0.04,
    form: 0.03,
  },
  game: {
    winPMin: 0.08,
    winPMax: 0.92,
    homeEdge: 0.03,
    scale: 10.4,
  },
  world: {
    tradesPerYear: { min: 2, max: 5 },
    faMovesPerYear: { min: 1, max: 4 },
    retireAge: 34,
    draftStarsMean: 1.1,
  },
  market: {
    agePenaltyAfter: 32,
    egoSalary: 0.08,
  },
} as const;

/** Identità di squadra: ritocco piccolo sul batch, non un secondo motore. */
export const IDENTITY_MOD: Record<
  string,
  { pace: number; ppg: number; opp: number; rpg: number; apg: number; starPpg: number }
> = {
  pace: { pace: 4.4, ppg: 2.6, opp: 2.0, rpg: -0.5, apg: 0.7, starPpg: 0.4 },
  halfCourt: { pace: -3.6, ppg: -1.4, opp: -2.2, rpg: 0.5, apg: 0.2, starPpg: -0.2 },
  threePoint: { pace: 1.9, ppg: 1.8, opp: 0.9, rpg: -0.9, apg: 0.5, starPpg: 0.8 },
  isolation: { pace: -1.1, ppg: 0.4, opp: 0.5, rpg: -0.3, apg: -1.5, starPpg: 1.6 },
  ballMovement: { pace: 0.7, ppg: 0.9, opp: -0.5, rpg: 0.1, apg: 2.3, starPpg: -0.6 },
  defense: { pace: -1.8, ppg: -1.1, opp: -3.4, rpg: 0.6, apg: -0.2, starPpg: -0.3 },
  physical: { pace: -0.9, ppg: -0.3, opp: -1.3, rpg: 2.5, apg: -0.7, starPpg: -0.2 },
  development: { pace: 1.1, ppg: -0.7, opp: 1.3, rpg: 0, apg: 0.4, starPpg: -0.8 },
  veteran: { pace: -1.6, ppg: 0.3, opp: -1.1, rpg: 0.4, apg: 0.9, starPpg: 0.2 },
};
