import { hofTier } from "./legacy.ts";
import { EURO_TEAMS } from "./teams.ts";
import type { PlayerState } from "./types.ts";

/**
 * Structural career fingerprint for replayability measurement.
 * Not the archive card hash, not a save field, not shipped analytics.
 * Same seed and same decisions reproduce it. It does not change the simulation.
 */

export interface CareerShape {
  role: string;
  path: string;
  nationality: string;
  draftPick: number;
  draftBin: string;
  league: string;
  teams: string[];
  teamChanges: number;
  seasons: number;
  seasonsBin: string;
  peak: number;
  peakBin: string;
  apexAge: number;
  endAge: number;
  injuryBin: string;
  titles: number;
  titlesBin: string;
  mvp: number;
  allStar: number;
  allNba: number;
  dpoy: number;
  roy: boolean;
  national: string;
  playoffBin: string;
  playoffRuns: number;
  finalsRuns: number;
  game7: number;
  statShape: string;
  memory: string;
  legacy: string;
  difficulty: string;
}

const SIMILARITY_WEIGHTS = {
  role: 10,
  path: 6,
  nationality: 4,
  draftBin: 8,
  league: 5,
  teams: 12,
  teamChanges: 5,
  seasonsBin: 6,
  peakBin: 8,
  apexAge: 3,
  injuryBin: 6,
  titlesBin: 7,
  awards: 7,
  national: 5,
  playoffBin: 8,
  statShape: 6,
  memory: 6,
  legacy: 4,
  difficulty: 4,
} as const;

const WEIGHT_SUM = Object.values(SIMILARITY_WEIGHTS).reduce((a, b) => a + b, 0);

function avg(rows: PlayerState["seasonHistory"], key: "ppg" | "rpg" | "apg" | "spg" | "bpg") {
  if (!rows.length) return 0;
  return rows.reduce((sum, row) => sum + row[key], 0) / rows.length;
}

export function draftBin(pick: number): string {
  if (pick <= 0) return "none";
  if (pick <= 14) return "lottery";
  if (pick <= 30) return "first";
  return "second";
}

export function peakBin(peak: number): string {
  if (peak < 74) return "role";
  if (peak < 82) return "starter";
  if (peak < 88) return "star";
  if (peak < 93) return "superstar";
  return "legend";
}

export function seasonsBin(seasons: number): string {
  if (seasons < 8) return "short";
  if (seasons < 15) return "standard";
  return "long";
}

export function titlesBin(titles: number): string {
  if (titles <= 0) return "0";
  if (titles === 1) return "1";
  if (titles <= 3) return "2-3";
  return "4+";
}

export function injuryBin(drag: number): string {
  if (drag < 1) return "clean";
  if (drag < 4) return "nagging";
  return "serious";
}

function teamChangesBin(changes: number): string {
  if (changes <= 0) return "0";
  if (changes === 1) return "1";
  if (changes === 2) return "2";
  return "3+";
}

function awardKey(shape: Pick<CareerShape, "mvp" | "allStar" | "allNba" | "dpoy" | "roy">): string {
  return [
    shape.mvp > 0 ? "mvp" : "",
    shape.allStar > 0 ? "as" : "",
    shape.allNba > 0 ? "nba" : "",
    shape.dpoy > 0 ? "dpoy" : "",
    shape.roy ? "roy" : "",
  ]
    .filter(Boolean)
    .join("+") || "none";
}

function memoryFlags(s: PlayerState): string {
  const flags: string[] = [];
  if (s.injuryDrag >= 4) flags.push("injury");
  if (s.titleCount > 0) flags.push("title");
  if (s.mvpCount + s.allStarCount + s.allNbaCount + s.dpoyCount > 0 || s.roy) flags.push("award");
  if (s.international || s.medal) flags.push("nation");
  if (s.seasonHistory.some((row) => (row.seriesLog ?? []).some((series) => series.wins + series.losses >= 7))) {
    flags.push("game7");
  }
  return flags.sort().join("+") || "quiet";
}

function statShape(s: PlayerState): string {
  const rows = s.seasonHistory;
  const ppg = avg(rows, "ppg");
  const rpg = avg(rows, "rpg");
  const apg = avg(rows, "apg");
  const stocks = avg(rows, "spg") + avg(rows, "bpg");
  const score = ppg;
  const glass = rpg * 1.7;
  const create = apg * 2.35;
  const defend = stocks * 8;
  const top = Math.max(score, glass, create, defend);
  if (create === top && apg >= 3) return "creator";
  if (glass === top && rpg >= 3.8) return "rebounder";
  if (defend === top && stocks >= 1.15) return "defender";
  if (score === top && ppg >= 8) return "scorer";
  return "balanced";
}

function playoffFacts(s: PlayerState) {
  let runs = 0;
  let finals = 0;
  let game7 = 0;
  for (const row of s.seasonHistory) {
    const label = row.playoff || "Fuori";
    if (label !== "Fuori") runs += 1;
    if (label === "Campione" || label.includes("Finale")) finals += 1;
    for (const series of row.seriesLog ?? []) {
      if (series.wins + series.losses >= 7) game7 += 1;
    }
  }
  const bin =
    s.titleCount > 0 || s.seasonHistory.some((row) => row.playoff === "Campione")
      ? "champion"
      : finals > 0
        ? "finals"
        : runs > 0
          ? "appeared"
          : "none";
  return { runs, finals, game7, bin };
}

export function careerShape(s: PlayerState): CareerShape {
  const teams: string[] = [];
  for (const row of s.seasonHistory) {
    if (row.teamAbbr && !teams.includes(row.teamAbbr)) teams.push(row.teamAbbr);
  }
  const playoff = playoffFacts(s);
  const end = s.seasonHistory.at(-1);
  return {
    role: s.role,
    path: s.originPath,
    nationality: s.nationality,
    draftPick: s.draftPick,
    draftBin: draftBin(s.draftPick),
    league: s.league,
    teams,
    teamChanges: Math.max(0, teams.length - 1),
    seasons: s.seasonHistory.length,
    seasonsBin: seasonsBin(s.seasonHistory.length),
    peak: s.peakOverall,
    peakBin: peakBin(s.peakOverall),
    apexAge: s.apexAge,
    endAge: end?.age ?? s.age,
    injuryBin: injuryBin(s.injuryDrag),
    titles: s.titleCount,
    titlesBin: titlesBin(s.titleCount),
    mvp: s.mvpCount,
    allStar: s.allStarCount,
    allNba: s.allNbaCount,
    dpoy: s.dpoyCount,
    roy: s.roy,
    national: s.medal ? "medal" : s.international ? "called" : "none",
    playoffBin: playoff.bin,
    playoffRuns: playoff.runs,
    finalsRuns: playoff.finals,
    game7: playoff.game7,
    statShape: statShape(s),
    memory: memoryFlags(s),
    legacy: hofTier(s),
    difficulty: s.difficulty,
  };
}

/** Structural identity. The seed is intentionally absent: a collision is a real duplicate career. */
export function identityKey(shape: CareerShape): string {
  return [
    shape.role,
    shape.path,
    shape.nationality,
    shape.draftPick,
    shape.league,
    shape.teams.join(">"),
    shape.seasons,
    shape.endAge,
    shape.peak,
    shape.apexAge,
    shape.injuryBin,
    shape.titles,
    shape.mvp,
    shape.allStar,
    shape.allNba,
    shape.dpoy,
    shape.roy ? 1 : 0,
    shape.national,
    shape.playoffRuns,
    shape.finalsRuns,
    shape.game7,
    shape.statShape,
    shape.memory,
    shape.legacy,
    shape.difficulty,
  ].join("|");
}

function jaccard(a: readonly string[], b: readonly string[]): number {
  const left = new Set(a);
  const right = new Set(b);
  let shared = 0;
  for (const item of left) if (right.has(item)) shared += 1;
  const union = left.size + right.size - shared;
  return union === 0 ? 1 : shared / union;
}

function same(weight: number, equal: boolean): number {
  return equal ? weight : 0;
}

/** 1 = same shape, 0 = nothing structural in common. Bins, not raw box scores. */
export function careerSimilarity(a: CareerShape, b: CareerShape): number {
  const score =
    same(SIMILARITY_WEIGHTS.role, a.role === b.role) +
    same(SIMILARITY_WEIGHTS.path, a.path === b.path) +
    same(SIMILARITY_WEIGHTS.nationality, a.nationality === b.nationality) +
    same(SIMILARITY_WEIGHTS.draftBin, a.draftBin === b.draftBin) +
    same(SIMILARITY_WEIGHTS.league, a.league === b.league) +
    SIMILARITY_WEIGHTS.teams * jaccard(a.teams, b.teams) +
    same(SIMILARITY_WEIGHTS.teamChanges, teamChangesBin(a.teamChanges) === teamChangesBin(b.teamChanges)) +
    same(SIMILARITY_WEIGHTS.seasonsBin, a.seasonsBin === b.seasonsBin) +
    same(SIMILARITY_WEIGHTS.peakBin, a.peakBin === b.peakBin) +
    same(SIMILARITY_WEIGHTS.apexAge, a.apexAge === b.apexAge) +
    same(SIMILARITY_WEIGHTS.injuryBin, a.injuryBin === b.injuryBin) +
    same(SIMILARITY_WEIGHTS.titlesBin, a.titlesBin === b.titlesBin) +
    same(SIMILARITY_WEIGHTS.awards, awardKey(a) === awardKey(b)) +
    same(SIMILARITY_WEIGHTS.national, a.national === b.national) +
    same(SIMILARITY_WEIGHTS.playoffBin, a.playoffBin === b.playoffBin) +
    same(SIMILARITY_WEIGHTS.statShape, a.statShape === b.statShape) +
    same(SIMILARITY_WEIGHTS.memory, a.memory === b.memory) +
    same(SIMILARITY_WEIGHTS.legacy, a.legacy === b.legacy) +
    same(SIMILARITY_WEIGHTS.difficulty, a.difficulty === b.difficulty);
  return Math.round((score / WEIGHT_SUM) * 1000) / 1000;
}

export interface CareerTelemetry {
  career_length: number;
  peak_age: number;
  peak_overall: number;
  draft_position: number;
  teams_count: number;
  titles: number;
  mvp_count: number;
  all_star_count: number;
  awards_count: number;
  injuries: string;
  playoff_appearances: number;
  finals_appearances: number;
  game7_count: number;
  national_team_events: string;
  major_memories: string;
  career_dna: string;
  legacy_class: string;
  difficulty: string;
  career_fingerprint: string;
}

export function careerTelemetry(s: PlayerState): CareerTelemetry {
  const shape = careerShape(s);
  return {
    career_length: shape.seasons,
    peak_age: shape.apexAge,
    peak_overall: shape.peak,
    draft_position: shape.draftPick,
    teams_count: shape.teams.length,
    titles: shape.titles,
    mvp_count: shape.mvp,
    all_star_count: shape.allStar,
    awards_count: shape.mvp + shape.allNba + shape.dpoy + (shape.roy ? 1 : 0),
    injuries: shape.injuryBin,
    playoff_appearances: shape.playoffRuns,
    finals_appearances: shape.finalsRuns,
    game7_count: shape.game7,
    national_team_events: shape.national,
    major_memories: shape.memory,
    career_dna: [shape.role, shape.statShape, shape.playoffBin, shape.memory].join("/"),
    legacy_class: shape.legacy,
    difficulty: shape.difficulty,
    career_fingerprint: identityKey(shape),
  };
}

export interface DimensionSpread {
  counts: Record<string, number>;
  top: string;
  topShare: number;
}

export interface ReplayabilityReport {
  n: number;
  uniqueIdentities: number;
  identicalPairs: number;
  meanSimilarity: number;
  highSimilarityShare: number;
  dimensions: Record<string, DimensionSpread>;
  collapsed: string[];
}

function spread(values: string[]): DimensionSpread {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  let top = "";
  let topCount = -1;
  for (const [value, count] of Object.entries(counts)) {
    if (count > topCount) {
      top = value;
      topCount = count;
    }
  }
  return { counts, top, topShare: values.length ? topCount / values.length : 0 };
}

const COLLAPSE_AT = 0.9;
const KNOWN_NARROW = new Set(["difficulty", "apexAge"]);

export function analyzeReplayability(players: readonly PlayerState[]): ReplayabilityReport {
  const shapes = players.map(careerShape);
  const keys = shapes.map(identityKey);
  const unique = new Set(keys);
  let identicalPairs = 0;
  const seen = new Map<string, number>();
  for (const key of keys) {
    const prior = seen.get(key) ?? 0;
    identicalPairs += prior;
    seen.set(key, prior + 1);
  }

  let similaritySum = 0;
  let pairs = 0;
  let high = 0;
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const similarity = careerSimilarity(shapes[i]!, shapes[j]!);
      similaritySum += similarity;
      pairs += 1;
      if (similarity >= 0.82) high += 1;
    }
  }

  const dimensions: Record<string, DimensionSpread> = {
    role: spread(shapes.map((s) => s.role)),
    path: spread(shapes.map((s) => s.path)),
    nationality: spread(shapes.map((s) => s.nationality)),
    draftBin: spread(shapes.map((s) => s.draftBin)),
    league: spread(shapes.map((s) => s.league)),
    teamChanges: spread(shapes.map((s) => teamChangesBin(s.teamChanges))),
    seasonsBin: spread(shapes.map((s) => s.seasonsBin)),
    peakBin: spread(shapes.map((s) => s.peakBin)),
    apexAge: spread(shapes.map((s) => String(s.apexAge))),
    endAge: spread(shapes.map((s) => String(s.endAge))),
    injuryBin: spread(shapes.map((s) => s.injuryBin)),
    titlesBin: spread(shapes.map((s) => s.titlesBin)),
    awards: spread(shapes.map(awardKey)),
    national: spread(shapes.map((s) => s.national)),
    playoffBin: spread(shapes.map((s) => s.playoffBin)),
    statShape: spread(shapes.map((s) => s.statShape)),
    memory: spread(shapes.map((s) => s.memory)),
    legacy: spread(shapes.map((s) => s.legacy)),
    difficulty: spread(shapes.map((s) => s.difficulty)),
  };

  const collapsed = Object.entries(dimensions)
    .filter(([name, dim]) => !KNOWN_NARROW.has(name) && dim.topShare >= COLLAPSE_AT)
    .map(([name]) => name);

  return {
    n: players.length,
    uniqueIdentities: unique.size,
    identicalPairs,
    meanSimilarity: pairs ? Math.round((similaritySum / pairs) * 1000) / 1000 : 1,
    highSimilarityShare: pairs ? Math.round((high / pairs) * 1000) / 1000 : 0,
    dimensions,
    collapsed,
  };
}

const EURO_ABBR = new Set(EURO_TEAMS.map((team) => team.abbr));

export interface MacroIdentity {
  leaguePath: string;
  loyalty: string;
  euroSeasons: number;
  streak: number;
  key: string;
  /** Null when the career does not meet a specific archetype's evidence. */
  archetype: string | null;
}

function loyaltyOf(streak: number, teams: number): string {
  if (teams <= 1) return "one-team";
  if (streak >= 8) return "franchise";
  if (streak >= 5) return "settled";
  if (teams >= 6) return "mover";
  return "mixed";
}

/** Path identity. Not a random label, and not a target to optimize. */
export function macroIdentity(s: PlayerState): MacroIdentity {
  const shape = careerShape(s);
  let euroSeasons = 0;
  let streak = 0;
  let best = 0;
  let prev = "";
  for (const row of s.seasonHistory) {
    if (EURO_ABBR.has(row.teamAbbr)) euroSeasons += 1;
    if (row.teamAbbr && row.teamAbbr === prev) streak += 1;
    else streak = 1;
    best = Math.max(best, streak);
    prev = row.teamAbbr;
  }
  const seasons = Math.max(1, shape.seasons);
  const euroShare = euroSeasons / seasons;
  let leaguePath = "nba-only";
  if (euroSeasons === seasons) leaguePath = "euro-only";
  else if (euroShare >= 0.65) leaguePath = "europe-main";
  else if (euroSeasons >= 3 && shape.league === "NBA") leaguePath = "returned";
  else if (euroSeasons > 0 && shape.league === "EuroLega") leaguePath = "nba-to-euro";
  else if (euroSeasons > 0) leaguePath = "passed-through";
  const loyalty = loyaltyOf(best, shape.teams.length);
  const star = shape.peakBin === "star" || shape.peakBin === "superstar" || shape.peakBin === "legend";
  const elite = shape.peakBin === "superstar" || shape.peakBin === "legend";
  let archetype: string | null = null;
  if (shape.injuryBin === "serious" && seasons >= 8 && shape.peakBin !== "role") archetype = "injury-comeback";
  else if (best >= 8 && shape.titles >= 1 && star) archetype = "franchise-icon";
  else if (shape.teamChanges === 0 && seasons >= 10 && shape.titles >= 1) archetype = "one-team";
  else if (shape.draftPick >= 31 && elite) archetype = "draft-steal";
  else if (euroShare >= 0.65 && seasons >= 8) archetype = "international-star";
  else if (leaguePath === "returned" && star) archetype = "international-return";
  else if (shape.titles >= 1 && shape.teamChanges >= 4 && best < 6) archetype = "ring-chaser";
  else if (shape.path === "G-League" && shape.draftPick >= 25 && star) archetype = "g-league-elevator";
  else if (star && shape.titles === 0 && shape.finalsRuns > 0) archetype = "almost-great";
  else if (shape.teamChanges >= 5 && shape.titles === 0 && !star) archetype = "journeyman";
  else if (seasons < 8 && star) archetype = "short-peak";
  else if (s.potential >= 86 && shape.peak < 78 && seasons >= 8) archetype = "unfulfilled";
  else if (best >= 6 && shape.teamChanges <= 2 && star) archetype = "loyal-star";
  else if (shape.statShape === "defender" && (shape.dpoy > 0 || star)) archetype = "defensive-specialist";
  return {
    leaguePath,
    loyalty,
    euroSeasons,
    streak: best,
    key: [shape.path, shape.draftBin, leaguePath, loyalty, shape.peakBin, shape.titlesBin, shape.injuryBin, shape.statShape].join("|"),
    archetype,
  };
}
