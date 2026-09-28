
import { EURO_TEAMS, NBA_TEAMS, ROOKIE_NAMES, cloneTeam, powerToTier } from "./teams";
import { diffOf } from "./difficulty";
import { SIM } from "./config";
import { pick, rand, randInt } from "./rng";
import { identityModOf, liveStar, mvpScore, starOf, teamStrength } from "./world";
import { royProductionScore } from "./awards-helpers";
import { EURO_GAMES, NBA_GAMES, PLAYOFF_SEEDS, awardNoteIt } from "./data";
import type {
  BracketPair,
  Conference,
  GameLine,
  LeagueAward,
  LeagueSnapshot,
  PlayoffState,
  PlayerState,
  RoyCandidate,
  SeasonRow,
  SeriesResult,
  StandingRow,
  StatLeader,
  Team,
  TitleEntry,
  VoteRow,
} from "./types";

function clamp(v: number, min: number, max: number) {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

/** PER da box CPU: stessa scheletro del motore, senza stocks/tov. */
function estPer(ppg: number, rpg: number, apg: number, ovr: number) {
  return round1(clamp(8.2 + (ovr - 60) * 0.4 + ppg * 0.24 + rpg * 0.17 + apg * 0.27, 6.5, 33));
}

function estTs(ovr: number, ppg: number) {
  return round3(clamp(0.52 + (ovr - 70) * 0.0018 + (ppg - 16) * 0.001, 0.48, 0.67));
}

function estPm(netRtg: number, ovr: number, gp: number) {
  return round1(clamp(netRtg * 0.4 + (ovr - 74) * 0.11 + (gp / 82 - 0.82) * 1.6, -9.5, 11.8));
}

/** +/- sul box se già scritto; altrimenti stima (engine lo fissa dopo lo snapshot). */
function boxPlusMinus(s: PlayerState, box: SeasonRow) {
  if (typeof box.plusMinus === "number" && box.plusMinus !== 0) return box.plusMinus;
  const games = Math.max(1, box.wins + box.losses);
  const minShare = (box.min || 24) / 32;
  return round1(
    clamp(
      (box.wins / games - 0.5) * 9.2 +
        (box.per - 15) * 0.22 * minShare +
        (s.overall - 68) * 0.12 * minShare +
        s.form * 0.12 -
        s.injuryDrag * 0.15,
      -12,
      14,
    ),
  );
}

function awardScore(opts: {
  ovr: number;
  ppg: number;
  per: number;
  ts: number;
  pm: number;
  gp: number;
  games: number;
  wins: number;
  form?: number;
  image?: number;
}) {
  const avail = opts.gp / Math.max(1, opts.games);
  return round1(
    opts.ovr * 0.38 +
      opts.ppg * 1.02 +
      opts.per * 0.52 +
      (opts.ts - 0.54) * 24 +
      opts.pm * 0.48 +
      avail * 4.2 +
      Math.max(0, opts.wins - 42) * 0.11 +
      (opts.form ?? 0) * 0.4 +
      (opts.image ?? 0) * 0.03,
  );
}

export function initTeamPower(): Record<string, number> {
  const m: Record<string, number> = {};
  [...NBA_TEAMS, ...EURO_TEAMS].forEach((t) => {
    m[t.abbr] = t.power;
  });
  return m;
}

export function driftTeamPower(s: PlayerState) {
  const mean = 70;
  Object.keys(s.teamPower).forEach((abbr) => {
    const cur = s.teamPower[abbr] ?? 70;
    const revert = (mean - cur) * 0.08;
    const noise = (rand() - 0.5) * 7.2;
    s.teamPower[abbr] = clamp(cur + revert + noise, 42, 96);
  });
  const p = s.teamPower[s.team.abbr] ?? s.team.power;
  s.team = { ...s.team, power: p, tier: powerToTier(p) };
}

function teamByAbbr(abbr: string): Team {
  return [...NBA_TEAMS, ...EURO_TEAMS].find((t) => t.abbr === abbr) ?? NBA_TEAMS[0]!;
}

function toStanding(s: PlayerState, team: Team, power: number, w: number, l: number, extra?: Partial<StandingRow>): StandingRow {
  const games = Math.max(1, w + l);
  const winPct = w / games;
  const netRtg = round1((winPct - 0.5) * 22 + (rand() - 0.5) * 2.4);
  const tm = s.world?.teams[team.abbr];
  const idm = identityModOf(tm?.identity);
  const ppg = round1(112.4 + netRtg * 0.42 + (power - 70) * 0.08 + idm.ppg + (rand() - 0.5) * 2.2);
  const oppPpg = round1(ppg - netRtg + idm.opp * 0.35);
  const mine = team.abbr === s.team.abbr;
  const star = mine ? undefined : liveStar(s.world, team.abbr);
  const starRaw = Number(star?.ppg);
  const starPpg = mine
    ? 0
    : round1(clamp((Number.isFinite(starRaw) ? starRaw : 15.2 + (power - 70) * 0.32) + idm.starPpg + (rand() - 0.5) * 0.8, 8, 34));
  const rpgRaw = Number(star?.rpg);
  const apgRaw = Number(star?.apg);
  const starRpg = mine ? 0 : round1(clamp((Number.isFinite(rpgRaw) ? rpgRaw : 5.1) + (rand() - 0.5) * 0.35, 1.8, 15));
  const starApg = mine ? 0 : round1(clamp((Number.isFinite(apgRaw) ? apgRaw : 4.2) + (rand() - 0.5) * 0.3, 1.2, 12));
  return {
    abbr: team.abbr,
    name: team.name,
    city: team.city,
    color: team.color,
    secondary: team.secondary,
    conf: team.conf,
    div: team.div,
    w,
    l,
    seed: null,
    power: round1(power),
    star: starOf(s, team.abbr, team.star),
    ppg,
    oppPpg,
    rpg: round1(43.2 + (power - 70) * 0.06 + idm.rpg + (rand() - 0.5) * 2.4),
    apg: round1(24.6 + (power - 70) * 0.08 + idm.apg + (rand() - 0.5) * 2.2),
    netRtg,
    pace: round1(98.8 + (power - 70) * 0.05 + idm.pace + (rand() - 0.5) * 2.4),
    note: team.note,
    starPpg,
    starRpg,
    starApg,
    identity: tm?.identity,
    ambition: tm?.ambition,
    ...extra,
  };
}

function assignSeeds(rows: StandingRow[], playoffCount: number) {
  const cap = Math.min(PLAYOFF_SEEDS, Math.max(0, playoffCount | 0));
  const sorted = [...rows].sort((a, b) => b.w - a.w || b.netRtg - a.netRtg || b.power - a.power);
  sorted.forEach((r, i) => {
    const n = i + 1;
    r.seed = i < cap && n >= 1 && n <= PLAYOFF_SEEDS ? n : null;
  });
  return sorted;
}

function winPctFromPower(power: number, games: number) {
  const x = (power - 70) / SIM.game.scale;
  const p = 1 / (1 + Math.exp(-x));
  const noisy = clamp(p + (rand() - 0.5) * 0.08, SIM.game.winPMin, SIM.game.winPMax);
  return Math.round(games * noisy);
}

/** 60 overall: rotazione. 95: franchise, sposta 12–16 vittorie. */
export function playerImpactOnTeam(s: PlayerState): number {
  const ovr = s.overall;
  const x = Math.max(0, ovr - 60);
  let bump = x * 0.12 + Math.pow(Math.max(0, ovr - 84), 1.5) * 0.15;
  if (ovr < 60) bump = (ovr - 60) * 0.14;
  bump += (s.hidden.chemistry - 50) * 0.045;
  bump += s.form * 0.28;
  bump += (s.coachTrust - 50) * 0.03;
  bump += (s.hidden.clutch - 50) * 0.018;
  bump -= s.injuryDrag * 0.35;
  return bump * diffOf(s).impact;
}

export function seedRookieClass(s: PlayerState): RoyCandidate[] {
  if ((s.season ?? 0) > 1) return [];
  const others = NBA_TEAMS.filter((t) => t.abbr !== s.team.abbr);
  const classList: RoyCandidate[] = [];
  const names = [...ROOKIE_NAMES].sort(() => rand() - 0.5).slice(0, 5);
  const bands = [
    [10.2, 12.4],
    [8.8, 10.6],
    [7.4, 9.2],
    [6.2, 7.8],
    [5.0, 6.6],
  ];
  names.forEach((name, i) => {
    const team = others[(i * 5 + 2) % others.length]!;
    const [lo, hi] = bands[i] ?? [8, 12];
    const ppg = lo + rand() * (hi - lo);
    const rpg = 2.2 + rand() * 4.0;
    const apg = 1.4 + rand() * 3.4;
    classList.push({
      name,
      team: team.name,
      teamAbbr: team.abbr,
      teamColor: team.color,
      ppg: round1(ppg),
      rpg: round1(rpg),
      apg: round1(apg),
      score: royProductionScore({ ppg, rpg, apg, gp: 72, min: clamp(18 + ppg * 0.8, 18, 36) }),
      isPlayer: false,
    });
  });
  s.royClass = classList;
  return classList;
}

function playerRoyScore(s: PlayerState, box: SeasonRow) {
  return royProductionScore({
    ppg: box.ppg,
    rpg: box.rpg,
    apg: box.apg,
    gp: box.gp,
    min: box.min,
    per: box.per,
    ts: box.ts,
    plusMinus: box.plusMinus,
    overall: s.overall,
  });
}

function simulateConference(s: PlayerState, conf: Conference, games: number): StandingRow[] {
  const pool = (conf === "Euro" ? EURO_TEAMS : NBA_TEAMS).filter((t) => t.conf === conf);
  const rows: StandingRow[] = pool.map((team) => {
    const raw = teamStrength(s, team.abbr);
    const power = Number.isFinite(raw) ? raw : 70;
    const w = clamp(winPctFromPower(power, games), 0, games);
    return toStanding(s, team, power, w, games - w);
  });
  const avg = rows.reduce((a, r) => a + r.w, 0) / Math.max(1, rows.length);
  const target = games / 2;
  const lo = games === NBA_GAMES ? 14 : 8;
  const hi = games === NBA_GAMES ? 68 : Math.max(lo, games - 8);
  if (avg > 0 && Number.isFinite(avg)) {
    rows.forEach((r) => {
      r.w = clamp(Math.round(r.w * (target / avg)), lo, hi);
      r.l = games - r.w;
    });
  }
  for (const r of rows) {
    r.w = clamp(Math.round(Number.isFinite(r.w) ? r.w : target), lo, hi);
    r.l = games - r.w;
    if (!Number.isFinite(r.netRtg)) r.netRtg = round1((r.w / Math.max(1, games) - 0.5) * 22);
    if (!Number.isFinite(r.power)) r.power = 70;
    if (!Number.isFinite(r.ppg)) r.ppg = 110;
    if (!Number.isFinite(r.oppPpg)) r.oppPpg = round1(r.ppg - r.netRtg);
    if (r.seed != null && (r.seed < 1 || r.seed > PLAYOFF_SEEDS)) r.seed = null;
  }
  return assignSeeds(rows, PLAYOFF_SEEDS);
}

function syncBox(s: PlayerState, box: SeasonRow, table: StandingRow[]) {
  const mine = table.find((r) => r.abbr === s.team.abbr);
  if (!mine) return;
  box.wins = mine.w;
  box.losses = mine.l;
  box.seed = mine.seed;
  box.conf = mine.conf;
  mine.star = s.name;
  mine.starPpg = box.ppg;
  mine.starRpg = box.rpg;
  mine.starApg = box.apg;
}

export function simulateLeagueSeason(s: PlayerState, n: number, yearLabel: string, box: SeasonRow): LeagueSnapshot {
  const nbaGames = NBA_GAMES;
  const euroGames = EURO_GAMES;
  const east = simulateConference(s, "East", nbaGames);
  const west = simulateConference(s, "West", nbaGames);
  const euro = simulateConference(s, "Euro", euroGames);
  const mineTable = s.league === "EuroLega" ? euro : s.team.conf === "East" ? east : west;
  syncBox(s, box, mineTable);

  const y1Nba = n === 1 && (s.season ?? n) === 1 && s.league === "NBA";
  const royRace = y1Nba ? finishRoyRace(s, box, n) : ((s.royClass = []), []);
  const built = buildAwards(s, box, east, west, euro, royRace, n);
  const awards = built.awards;
  const leaders = buildLeaders(s, box, east, west);
  syncBox(s, box, mineTable);

  // dpoyRace: [] — vuoto qui, filled after settle. settleDpoy è l'autorità sul DPOY giocatore.
  return {
    yearLabel,
    east,
    west,
    euro,
    awards,
    leaders,
    royRace,
    dpoyRace: [],
    mvpBoard: built.mvpBoard,
    nbaBoard: built.nbaBoard,
  };
}

function finishRoyRace(s: PlayerState, box: SeasonRow, n: number): RoyCandidate[] {
  // Corsa ROY: solo stagione 1 NBA. Il premio lo decide settleRoy (awards-helpers), non qui.
  if (n !== 1 || (s.season ?? n) !== 1 || s.league !== "NBA") {
    s.royClass = [];
    return [];
  }
  const player: RoyCandidate = {
    name: s.name,
    team: s.team.name,
    teamAbbr: s.team.abbr,
    teamColor: s.team.color,
    ppg: box.ppg,
    rpg: box.rpg,
    apg: box.apg,
    score: playerRoyScore(s, box),
    isPlayer: true,
  };
  const others = (s.royClass.length ? s.royClass : seedRookieClass(s))
    .filter((c) => !c.isPlayer)
    .map((c) => {
      const ppg = round1(clamp(c.ppg + (rand() - 0.5) * 1.1, 6.2, 22));
      const rpg = round1(clamp(c.rpg + (rand() - 0.5) * 0.45, 1.4, 12));
      const apg = round1(clamp(c.apg + (rand() - 0.5) * 0.45, 0.8, 9));
      const min = clamp(18 + ppg * 0.8, 18, 36);
      return {
        ...c,
        ppg,
        rpg,
        apg,
        score: royProductionScore({ ppg, rpg, apg, gp: 70 + randInt(0, 8), min }),
        isPlayer: false,
      };
    });
  const race = [player, ...others].sort((a, b) => b.score - a.score);
  s.royClass = race;
  return race;
}

function nbaField(s: PlayerState, box: SeasonRow, table: StandingRow[]) {
  const nba = new Set(NBA_TEAMS.map((t) => t.abbr));
  const byAbbr = new Map(table.map((r) => [r.abbr, r]));
  const games = NBA_GAMES;
  const rows: { name: string; abbr: string; score: number; isPlayer: boolean }[] = [];
  for (const p of s.world?.stars ?? []) {
    if (p.retired || !nba.has(p.teamAbbr) || p.teamAbbr === s.team.abbr) continue;
    const row = byAbbr.get(p.teamAbbr);
    rows.push({
      name: p.name,
      abbr: p.teamAbbr,
      score: awardScore({
        ovr: p.overall,
        ppg: p.ppg,
        per: estPer(p.ppg, p.rpg, p.apg, p.overall),
        ts: estTs(p.overall, p.ppg),
        pm: row ? estPm(row.netRtg, p.overall, p.gp) : 0,
        gp: p.gp,
        games,
        wins: row?.w ?? 41,
      }),
      isPlayer: false,
    });
  }
  const pm = boxPlusMinus(s, box);
  rows.push({
    name: s.name,
    abbr: s.team.abbr,
    score: awardScore({
      ovr: s.overall,
      ppg: box.ppg,
      per: box.per,
      ts: box.ts,
      pm,
      gp: box.gp,
      games,
      wins: box.wins,
      form: s.form,
      image: s.publicImage,
    }),
    isPlayer: true,
  });
  rows.sort((a, b) => b.score - a.score);
  return rows;
}

function grantAllStarAwards(
  s: PlayerState,
  box: SeasonRow,
  n: number,
  d: ReturnType<typeof diffOf>,
  rank: number,
) {
  if (s.league !== "NBA" || rank < 0) return;
  const starCut = d.awardOvr >= 6 ? 4 : d.awardOvr >= 4 ? 5 : d.awardOvr < 0 ? 8 : 6;
  const allStar =
    box.gp >= 55 && (rank < starCut || (rank < starCut + 1 && rand() < 0.12 * d.awardP));
  if (allStar && !box.awards.includes("All-Star")) {
    box.awards.push("All-Star");
    s.allStarCount += 1;
    if (!s.milestones.some((m) => m.season === n && m.label === "All-Star")) {
      s.milestones.push({ season: n, label: "All-Star" });
    }
  }
  if (box.gp < 58) return;
  const pm = boxPlusMinus(s, box);
  const allNbaStat = box.ppg + box.per * 0.32 + pm * 0.18;
  let team: string | null = null;
  if (rank < 3 && s.overall >= 84 + d.awardOvr * 0.15 && allNbaStat >= 22 + d.awardStat * 0.35) {
    team = "All-NBA First Team";
  } else if (rank < 6 && s.overall >= 78 + d.awardOvr * 0.12 && allNbaStat >= 18 + d.awardStat * 0.3) {
    team = "All-NBA Second Team";
  } else if (rank < 9 && s.overall >= 74 && allNbaStat >= 16.2) {
    team = "All-NBA Third Team";
  }
  if (team && !box.awards.includes(team)) {
    box.awards.push(team);
    s.allNbaCount += 1;
    if (!s.milestones.some((m) => m.season === n && m.label === team)) {
      s.milestones.push({ season: n, label: team });
    }
  }
}

function faceName(row: { star?: string; name?: string } | undefined, fallback = "—") {
  const n = (row?.star || "").trim();
  if (n) return n;
  const t = (row?.name || "").trim();
  return t || fallback;
}

function polishAwards(list: LeagueAward[] | undefined) {
  if (!list) return;
  for (const a of list) {
    if (!String(a.name || "").trim()) a.name = String(a.team || a.teamAbbr || "—").trim() || "—";
    a.note = awardNoteIt(a.note || "");
  }
}

function bestRecord(rows: StandingRow[]): StandingRow {
  return [...rows].sort((a, b) => b.w - a.w || b.netRtg - a.netRtg)[0]!;
}

function buildAwards(
  s: PlayerState,
  box: SeasonRow,
  east: StandingRow[],
  west: StandingRow[],
  euro: StandingRow[],
  roy: RoyCandidate[],
  n: number,
): { awards: LeagueAward[]; mvpBoard: VoteRow[]; nbaBoard: VoteRow[] } {
  const nba = [...east, ...west];
  const table = s.league === "EuroLega" ? euro : nba;
  const top = bestRecord(table);
  const out: LeagueAward[] = [];

  const d = diffOf(s);
  const games = s.league === "EuroLega" ? EURO_GAMES : NBA_GAMES;
  const field = nbaField(s, box, nba);
  const rank = field.findIndex((f) => f.isPlayer);
  grantAllStarAwards(s, box, n, d, rank);

  const pm = boxPlusMinus(s, box);
  const playerProd = clamp(box.ppg * 2.4 + box.rpg * 0.9 + box.apg * 1.2 + box.per * 0.8, 0, 140);
  const playerEff = clamp(box.ts * 100 + box.per * 1.2, 0, 140);
  const playerImpact = clamp(s.overall + pm * 1.4, 0, 130);
  const playerNar = clamp(s.publicImage * 0.5 + s.hidden.mediaSavvy * 0.5 + s.titleCount * 4, 0, 100);
  const pScore =
    mvpScore(playerProd, box.wins, playerEff, playerImpact, box.gp, games, s.hidden.consistency, playerNar) +
    (rand() - 0.5) * SIM.awards.noise -
    d.awardOvr * 0.8;

  const cpu = [...table]
    .filter((r) => r.abbr !== s.team.abbr)
    .map((r) => {
      const star = liveStar(s.world, r.abbr);
      const ovr = star?.overall ?? r.power;
      const per = estPer(r.starPpg, r.starRpg, r.starApg, ovr);
      const ts = estTs(ovr, r.starPpg);
      const starPm = estPm(r.netRtg, ovr, star?.gp ?? 74);
      const prod = r.starPpg * 2.2 + r.starRpg * 0.8 + r.starApg * 1.1 + per * 0.8;
      const eff = ts * 100 + per * 1.2;
      const impact = ovr + starPm * 1.4;
      const gp = star?.gp ?? 74;
      const nar = clamp(40 + Math.max(0, r.w - 42) * 1.2, 0, 100);
      return {
        row: r,
        score:
          mvpScore(prod, r.w, eff, impact, gp, games, star?.workEthic ?? 55, nar) +
          (rand() - 0.5) * SIM.awards.noise,
      };
    })
    .sort((a, b) => b.score - a.score);
  const cpus = cpu;
  const cpuBest = cpus[0];

  const mvpPlayer =
    s.league === "NBA" && box.awards.includes("All-Star") && box.gp >= 58 && pScore > (cpuBest?.score ?? 80) + 2;

  if (mvpPlayer) {
    out.push({
      title: "MVP",
      name: s.name,
      team: s.team.name,
      teamAbbr: s.team.abbr,
      note: `${box.ppg.toFixed(1)} punti, ${box.wins} vittorie`,
      isPlayer: true,
    });
    if (!box.awards.includes("MVP")) {
      box.awards.unshift("MVP");
      s.mvpCount += 1;
      s.milestones.push({ season: n, label: "MVP" });
    }
  } else {
    const face = cpuBest?.row ?? top;
    out.push({
      title: "MVP",
      name: faceName(face, s.name),
      team: face.name,
      teamAbbr: face.abbr,
      note: `${face.starPpg.toFixed(1)} punti, ${face.w}-${face.l}`,
      isPlayer: false,
    });
  }

  // Snapshot DPOY: solo campo/CPU. settleDpoy è l'autorità sul premio giocatore
  // (niente isPlayer, box.awards, dpoyCount, milestone qui).
  const def =
    [...table]
      .filter((r) => r.abbr !== s.team.abbr)
      .map((r) => {
        const ident = r.identity ?? s.world?.teams[r.abbr]?.identity;
        const idBonus = ident === "defense" ? 5.2 : ident === "physical" ? 2.8 : ident === "halfCourt" ? 0.8 : 0;
        return { r, score: 118 - r.oppPpg + r.netRtg * 0.18 + idBonus };
      })
      .sort((a, b) => b.score - a.score)[0]?.r ?? top;
  if (s.league === "NBA") {
  out.push({
    title: "DPOY",
    name: faceName(def, def.name),
    team: def.name,
    teamAbbr: def.abbr,
    note: `Miglior difesa, ${def.oppPpg.toFixed(1)} punti subiti`,
    isPlayer: false,
  });
  }

  // Snapshot corsa ROY solo n===1 NBA, campo/CPU. Mai ROY giocatore: lo assegna settleRoy.
  if (n === 1 && (s.season ?? n) === 1 && s.league === "NBA") {
    const winner = roy.find((c) => !c.isPlayer && c.name !== s.name);
    if (winner) {
      out.push({
        title: "ROY",
        name: winner.name,
        team: winner.team,
        teamAbbr: winner.teamAbbr,
        note: `${winner.ppg.toFixed(1)} / ${winner.rpg.toFixed(1)} / ${winner.apg.toFixed(1)}`,
        isPlayer: false,
      });
    }
  }

  const last = s.seasonHistory[s.seasonHistory.length - 1];
  const alreadyStar = box.awards.includes("All-NBA First Team") || box.awards.includes("MVP") || s.overall >= 88;
  const ppgJump = last ? box.ppg - last.ppg : 0;
  const perJump = last ? box.per - last.per : 0;
  const mipPlayer =
    last &&
    n >= 2 &&
    last.ppg <= 16.5 &&
    last.per <= 19 &&
    (ppgJump >= 3.5 || (ppgJump >= 2.2 && perJump >= 3.6)) &&
    s.overall >= 66 &&
    !alreadyStar;
  if (mipPlayer) {
    out.push({
      title: "MIP",
      name: s.name,
      team: s.team.name,
      teamAbbr: s.team.abbr,
      note: `Da ${last.ppg.toFixed(1)} a ${box.ppg.toFixed(1)} punti`,
      isPlayer: true,
    });
    if (!box.awards.includes("Most Improved Player")) box.awards.push("Most Improved Player");
  } else if (n >= 2) {
    const mid = table.filter((r) => r.w >= 28 && r.w <= 48 && r.abbr !== s.team.abbr);
    const pool = mid.length ? mid : table.filter((r) => r.abbr !== s.team.abbr);
    const scored = (pool.length ? pool : table)
      .map((r) => {
        const star = liveStar(s.world, r.abbr);
        const age = star?.age ?? 26;
        const ovr = star?.overall ?? r.power;
        const young = age >= 22 && age <= 27 ? 4 : 0;
        const midOvr = ovr < 84 ? 3 : 0;
        return { r, score: young + midOvr + (rand() - 0.5) * 2 };
      })
      .sort((a, b) => b.score - a.score)[0];
    const pickTeam = scored?.r ?? pick(mid.length ? mid : table);
    out.push({
      title: "MIP",
      name: faceName(pickTeam, pickTeam.name),
      team: pickTeam.name,
      teamAbbr: pickTeam.abbr,
      note: "Il salto di qualità della stagione",
      isPlayer: false,
    });
  }

  if (s.league === "NBA") {
    const sixthPlayer =
      box.gp >= 52 &&
      box.min >= 18 &&
      box.min <= 26.8 &&
      box.ppg >= 12.2 &&
      box.per >= 15 &&
      !alreadyStar &&
      !box.awards.includes("All-NBA Second Team");
    if (sixthPlayer) {
      out.push({
        title: "6MOY",
        name: s.name,
        team: s.team.name,
        teamAbbr: s.team.abbr,
        note: `${box.min.toFixed(1)} minuti, ${box.ppg.toFixed(1)} punti`,
        isPlayer: true,
      });
      if (!box.awards.includes("Sixth Man")) box.awards.push("Sixth Man");
    } else {
      const mvpAbbr = out.find((a) => a.title === "MVP")?.teamAbbr;
      const sixthPool = table.filter(
        (r) =>
          r.abbr !== s.team.abbr &&
          r.abbr !== mvpAbbr &&
          r.w >= 36 &&
          r.starPpg >= 12 &&
          r.starPpg <= 19.6 &&
          r.power <= 84,
      );
      const sixth = (sixthPool.length ? sixthPool : table.filter((r) => r.abbr !== s.team.abbr && r.abbr !== mvpAbbr)).sort(
        (a, b) => b.starPpg * 1.1 + b.w * 0.08 - (a.starPpg * 1.1 + a.w * 0.08),
      )[0] ?? top;
      out.push({
        title: "6MOY",
        name: faceName(sixth, sixth.name),
        team: sixth.name,
        teamAbbr: sixth.abbr,
        note: `Dalla panchina, ${sixth.starPpg.toFixed(1)} punti`,
        isPlayer: false,
      });
    }
  }

  polishAwards(out);
  const mvpName = out.find((a) => a.title === "MVP")?.name ?? "";
  const mvpBoard: VoteRow[] = [
    ...cpus.slice(0, 5).map((c) => ({
      name: faceName(c.row, c.row.name),
      abbr: c.row.abbr,
      color: c.row.color,
      score: round1(c.score),
      line: `${c.row.starPpg.toFixed(1)} · ${c.row.w}`,
      isPlayer: false,
      trophy: faceName(c.row, c.row.name) === mvpName,
    })),
    {
      name: s.name,
      abbr: s.team.abbr,
      color: s.team.color,
      score: round1(pScore),
      line: `${box.ppg.toFixed(1)} · ${box.wins} · ${box.per.toFixed(1)}`,
      isPlayer: true,
      trophy: s.name === mvpName,
    },
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  const nbaWon = box.awards.some((a) => a.startsWith("All-NBA"));
  const nbaBoard: VoteRow[] = field.slice(0, 8).map((f) => {
    const club = table.find((r) => r.abbr === f.abbr);
    return {
      name: f.name,
      abbr: f.abbr,
      color: f.isPlayer ? s.team.color : club?.color ?? "#6e6e73",
      score: round1(f.score),
      line: f.isPlayer
        ? `${box.ppg.toFixed(1)} · ${box.per.toFixed(1)}`
        : `${(club?.starPpg ?? 0).toFixed(1)}`,
      isPlayer: f.isPlayer,
      trophy: f.isPlayer && nbaWon,
    };
  });
  return { awards: out, mvpBoard, nbaBoard };
}

function buildLeaders(s: PlayerState, box: SeasonRow, east: StandingRow[], west: StandingRow[]): StatLeader[] {
  const nba = [...east, ...west];
  const scoring = [...nba].sort((a, b) => b.starPpg - a.starPpg)[0]!;
  const rebs = [...nba].sort((a, b) => b.starRpg - a.starRpg)[0]!;
  const asts = [...nba].sort((a, b) => b.starApg - a.starApg)[0]!;
  const perLead = [...nba]
    .map((r) => {
      const star = liveStar(s.world, r.abbr);
      const ovr = star?.overall ?? r.power;
      return { r, per: estPer(r.starPpg, r.starRpg, r.starApg, ovr) };
    })
    .sort((a, b) => b.per - a.per)[0]!;
  const playerLeads = box.ppg >= scoring.starPpg - 0.4 && box.ppg >= 24;
  const playerReb = box.rpg >= Math.max(11, rebs.starRpg - 0.3);
  const playerAst = box.apg >= Math.max(8.4, asts.starApg - 0.3);
  const playerPer = box.per >= perLead.per - 0.4 && box.per >= 22;
  const best = bestRecord(nba);
  return [
    {
      stat: "PPG",
      name: playerLeads ? s.name : faceName(scoring),
      team: playerLeads ? s.team.abbr : scoring.abbr,
      value: (playerLeads ? box.ppg : scoring.starPpg).toFixed(1),
      isPlayer: playerLeads,
    },
    {
      stat: "RPG",
      name: playerReb ? s.name : faceName(rebs),
      team: playerReb ? s.team.abbr : rebs.abbr,
      value: (playerReb ? box.rpg : rebs.starRpg).toFixed(1),
      isPlayer: playerReb,
    },
    {
      stat: "APG",
      name: playerAst ? s.name : faceName(asts),
      team: playerAst ? s.team.abbr : asts.abbr,
      value: (playerAst ? box.apg : asts.starApg).toFixed(1),
      isPlayer: playerAst,
    },
    {
      stat: "PER",
      name: playerPer ? s.name : faceName(perLead.r),
      team: playerPer ? s.team.abbr : perLead.r.abbr,
      value: (playerPer ? box.per : perLead.per).toFixed(1),
      isPlayer: playerPer,
    },
    {
      stat: "VITTORIE",
      name: best.name,
      team: best.abbr,
      value: String(best.w),
      isPlayer: best.abbr === s.team.abbr,
    },
  ];
}

export function standingOf(snap: LeagueSnapshot, abbr: string): StandingRow | undefined {
  return [...snap.east, ...snap.west, ...snap.euro].find((r) => r.abbr === abbr);
}

export function tableFor(s: PlayerState, snap: LeagueSnapshot): StandingRow[] {
  if (s.league === "EuroLega") return snap.euro;
  return s.team.conf === "East" ? snap.east : snap.west;
}

export const TITLE_SEED: TitleEntry[] = [
  {
    yearLabel: "2023-24",
    team: "Boston Celtics",
    teamAbbr: "BOS",
    teamColor: "#007A33",
    star: "Darius Lang",
    isPlayer: false,
    league: "NBA",
  },
  {
    yearLabel: "2024-25",
    team: "Oklahoma City Thunder",
    teamAbbr: "OKC",
    teamColor: "#007AC1",
    star: "Soren Blake",
    isPlayer: false,
    league: "NBA",
  },
  {
    yearLabel: "2025-26",
    team: "Boston Celtics",
    teamAbbr: "BOS",
    teamColor: "#007A33",
    star: "Ellis Ward",
    isPlayer: false,
    league: "NBA",
  },
];

export function settleYearTitle(s: PlayerState, playerChampion: boolean) {
  const last = s.seasonHistory[s.seasonHistory.length - 1];
  if (!last) return;
  const league = s.league;
  polishAwards(s.currentLeague?.awards);
  polishAwards(last.league?.awards);
  if (s.championLog.some((c) => c.yearLabel === last.yearLabel && c.league === league)) return;
  let entry: TitleEntry;
  if (playerChampion) {
    entry = {
      yearLabel: last.yearLabel,
      team: s.team.name,
      teamAbbr: s.team.abbr,
      teamColor: s.team.color,
      star: s.name,
      isPlayer: true,
      league,
    };
  } else {
    const snap = s.currentLeague ?? last.league;
    if (!snap) return;
    const w = championFromBracket(s, snap, league);
    if (!w || w.abbr === s.team.abbr) return;
    entry = {
      yearLabel: last.yearLabel,
      team: w.name,
      teamAbbr: w.abbr,
      teamColor: w.color,
      star: faceName(w, w.name),
      isPlayer: false,
      league,
    };
  }
  s.championLog = [...s.championLog, entry];
  if (s.currentLeague) s.currentLeague.champion = entry;
  if (last.league) last.league.champion = entry;
}

function seriesWinner(
  a: StandingRow,
  b: StandingRow,
  league: "NBA" | "EuroLega" = a.conf === "Euro" || b.conf === "Euro" ? "EuroLega" : "NBA",
  round = 0,
): StandingRow {
  const pa = Number.isFinite(a.power) ? a.power : 70;
  const pb = Number.isFinite(b.power) ? b.power : 70;
  const format = playoffSeriesFormat(league, round);
  const perGame = clamp(pa / (pa + pb + 0.01), SIM.game.winPMin, SIM.game.winPMax);
  const chance = seriesWinProbability(perGame, format, a.seed ?? 4, b.seed ?? 5);
  return rand() < chance ? a : b;
}

const QF_SEEDS: [number, number][] = [
  [1, 8],
  [4, 5],
  [2, 7],
  [3, 6],
];

function seededMap(rows: StandingRow[], excludeAbbr?: string) {
  const m = new Map<number, StandingRow>();
  for (const r of rows) {
    const n = r.seed;
    if (n == null || !Number.isInteger(n) || n < 1 || n > PLAYOFF_SEEDS) continue;
    if (excludeAbbr && r.abbr === excludeAbbr) continue;
    if (!m.has(n)) m.set(n, r);
  }
  return m;
}

function playoffTree(
  rows: StandingRow[],
  excludeAbbr: string | undefined,
  league: "NBA" | "EuroLega",
): StandingRow | undefined {
  const m = seededMap(rows, excludeAbbr);
  if (!m.size) return undefined;
  const pair = (sa: number, sb: number) => {
    const a = m.get(sa);
    const b = m.get(sb);
    if (a && b) return seriesWinner(a, b, league, 0);
    return a ?? b;
  };
  const q: StandingRow[] = [];
  for (const [sa, sb] of QF_SEEDS) {
    const w = pair(sa, sb);
    if (w) q.push(w);
  }
  if (!q.length) return [...m.values()].sort((a, b) => (a.seed ?? 9) - (b.seed ?? 9))[0];
  let round = 1;
  while (q.length > 1) {
    const next: StandingRow[] = [];
    for (let i = 0; i < q.length; i += 2) {
      next.push(q[i + 1] ? seriesWinner(q[i]!, q[i + 1]!, league, round) : q[i]!);
    }
    q.length = 0;
    q.push(...next);
    round += 1;
  }
  return q[0];
}

function winnerOfPair(
  pair: BracketPair,
  excludeAbbr: string,
  league: "NBA" | "EuroLega",
  round: number,
): StandingRow | undefined {
  if (pair.winnerAbbr === pair.a.abbr) return pair.a;
  if (pair.winnerAbbr === pair.b.abbr) return pair.b;
  const userIn = pair.a.abbr === excludeAbbr || pair.b.abbr === excludeAbbr;
  if (userIn) return pair.a.abbr === excludeAbbr ? pair.b : pair.a;
  return seriesWinner(pair.a, pair.b, league, round);
}

/** Continua il tabellone già giocato: niente re-roll, mai il giocatore se ha perso. */
function championFromBracket(
  s: PlayerState,
  snap: LeagueSnapshot,
  league: "NBA" | "EuroLega",
): StandingRow | undefined {
  const exclude = s.team.abbr;
  const p = s.playoff;
  if (p?.pairs?.length) {
    const winners: StandingRow[] = [];
    for (const pair of p.pairs) {
      const w = winnerOfPair(pair, exclude, league, p.round);
      if (w && w.abbr !== exclude) winners.push(w);
    }
    let live = winners;
    let round = p.round + 1;
    while (live.length > 1) {
      const next: StandingRow[] = [];
      for (let i = 0; i < live.length; i += 2) {
        const a = live[i]!;
        const b = live[i + 1];
        next.push(b ? seriesWinner(a, b, league, round) : a);
      }
      live = next;
      round += 1;
    }
    const confChamp = live[0];
    const other = p.otherChamp;
    const otherIn =
      !!other && p.pairs.some((pair) => pair.a.abbr === other.abbr || pair.b.abbr === other.abbr);
    if (other && other.abbr !== exclude && !otherIn && confChamp && other.abbr !== confChamp.abbr) {
      return seriesWinner(confChamp, other, league, round);
    }
    if (confChamp && confChamp.abbr !== exclude) return confChamp;
    if (other && other.abbr !== exclude) return other;
  }
  return pickPlayoffChampion(snap, league, exclude);
}

export function pickPlayoffChampion(
  snap: LeagueSnapshot,
  league: "NBA" | "EuroLega",
  excludeAbbr?: string,
): StandingRow | undefined {
  if (league === "EuroLega") return playoffTree(snap.euro, excludeAbbr, league);
  const east = playoffTree(snap.east, excludeAbbr, league);
  const west = playoffTree(snap.west, excludeAbbr, league);
  if (east && west) return seriesWinner(east, west, league, 3);
  return east ?? west;
}

export function initPlayoffs(s: PlayerState, snap: LeagueSnapshot): PlayoffState | null {
  const table = tableFor(s, snap);
  const mine = table.find((r) => r.abbr === s.team.abbr);
  if (!mine || mine.seed == null || mine.seed < 1 || mine.seed > PLAYOFF_SEEDS) return null;
  const m = seededMap(table);
  const pairs: BracketPair[] = [];
  for (const [sa, sb] of QF_SEEDS) {
    const a = m.get(sa);
    const b = m.get(sb);
    if (!a && !b) continue;
    if (a && !b) {
      pairs.push({ a, b: a, winnerAbbr: a.abbr });
      continue;
    }
    if (b && !a) {
      pairs.push({ a: b, b, winnerAbbr: b.abbr });
      continue;
    }
    const userIn = a!.abbr === s.team.abbr || b!.abbr === s.team.abbr;
    pairs.push({
      a: a!,
      b: b!,
      winnerAbbr: userIn ? undefined : seriesWinner(a!, b!, s.league, 0).abbr,
    });
  }
  if (!pairs.length) return null;
  const otherConf = s.league === "EuroLega" ? null : s.team.conf === "East" ? snap.west : snap.east;
  const otherChamp = otherConf ? playoffTree(otherConf, undefined, "NBA") : undefined;
  const state: PlayoffState = {
    conf: mine.conf,
    seed: mine.seed,
    round: 0,
    pairs,
    otherChamp,
  };
  s.playoff = state;
  return state;
}

export function currentOpponent(s: PlayerState): StandingRow | null {
  const p = s.playoff;
  if (!p) return null;
  const live = p.pairs.filter((x) => !x.winnerAbbr);
  const userPair = live.find((x) => x.a.abbr === s.team.abbr || x.b.abbr === s.team.abbr);
  if (!userPair) return null;
  return userPair.a.abbr === s.team.abbr ? userPair.b : userPair.a;
}

export function opponentAsTeam(row: StandingRow): Team {
  const base = teamByAbbr(row.abbr);
  return cloneTeam({ ...base, star: row.star, note: row.note || base.note }, row.power);
}

export function simulateBestOfSeven(
  winProb: number,
  euro = false,
  userSeed = 4,
  oppSeed = 5,
): { wins: number; losses: number; games: GameLine[] } {
  return simulateSeries(winProb, { winsNeeded: 4, maxGames: 7, homeCourtBySeed: true }, euro, userSeed, oppSeed);
}

export interface PlayoffSeriesFormat {
  winsNeeded: number;
  maxGames: number;
  /** If false, the game is at a neutral venue and seed does not affect home edge. */
  homeCourtBySeed: boolean;
}

/** Regole playoff del modello PIVOT: NBA al meglio delle sette; Eurolega con quarti al meglio delle cinque e Final Four secca. */
export function playoffSeriesFormat(league: "NBA" | "EuroLega", round: number): PlayoffSeriesFormat {
  if (league === "EuroLega") {
    return round === 0
      ? { winsNeeded: 3, maxGames: 5, homeCourtBySeed: true }
      : { winsNeeded: 1, maxGames: 1, homeCourtBySeed: false };
  }
  return { winsNeeded: 4, maxGames: 7, homeCourtBySeed: true };
}

function gameWinChance(winProb: number, format: PlayoffSeriesFormat, game: number, userSeed: number, oppSeed: number) {
  const maxGames = Math.max(Math.floor(format.maxGames), Math.floor(format.winsNeeded) * 2 - 1);
  const better = userSeed <= oppSeed;
  const favoredHomeGames = maxGames >= 7 ? [1, 2, 5, 7] : maxGames >= 5 ? [1, 2, 5] : [];
  const favoredHome = favoredHomeGames.includes(game);
  const userHome = format.homeCourtBySeed && (better ? favoredHome : !favoredHome);
  return clamp(
    winProb + (userHome ? SIM.game.homeEdge : format.homeCourtBySeed ? -SIM.game.homeEdge : 0),
    SIM.game.winPMin,
    SIM.game.winPMax,
  );
}

/** Probabilità esatta di vincere la serie, considerando l'arresto al primo traguardo e il fattore campo. */
export function seriesWinProbability(
  winProb: number,
  format: PlayoffSeriesFormat,
  userSeed = 4,
  oppSeed = 5,
): number {
  const winsNeeded = Math.max(1, Math.floor(format.winsNeeded));
  const maxGames = Math.max(winsNeeded * 2 - 1, Math.floor(format.maxGames));
  const memo = new Map<string, number>();
  const chanceAt = (game: number, wins: number, losses: number): number => {
    if (wins >= winsNeeded) return 1;
    if (losses >= winsNeeded || game > maxGames) return 0;
    const key = `${game}:${wins}:${losses}`;
    const known = memo.get(key);
    if (known !== undefined) return known;
    const p = gameWinChance(winProb, { ...format, winsNeeded, maxGames }, game, userSeed, oppSeed);
    const result = p * chanceAt(game + 1, wins + 1, losses) + (1 - p) * chanceAt(game + 1, wins, losses + 1);
    memo.set(key, result);
    return result;
  };
  return chanceAt(1, 0, 0);
}

export function simulateSeries(
  winProb: number,
  format: PlayoffSeriesFormat,
  euro = false,
  userSeed = 4,
  oppSeed = 5,
  random: () => number = rand,
): { wins: number; losses: number; games: GameLine[] } {
  const winsNeeded = Math.max(1, Math.floor(format.winsNeeded));
  const maxGames = Math.max(winsNeeded * 2 - 1, Math.floor(format.maxGames));
  let uw = 0;
  let ow = 0;
  const games: GameLine[] = [];
  let n = 1;
  const drawInt = (min: number, max: number) => min + Math.floor(clamp(random(), 0, 0.999999999) * (max - min + 1));
  while (uw < winsNeeded && ow < winsNeeded && n <= maxGames) {
    const p = gameWinChance(winProb, { ...format, winsNeeded, maxGames }, n, userSeed, oppSeed);
    const win = random() < p;
    const us = euro ? drawInt(68, 98) : drawInt(94, 128);
    const margin = euro ? drawInt(1, 14) : drawInt(1, 17);
    const them = Math.max(euro ? 58 : 78, win ? us - margin : us + margin);
    games.push({ n, us, them, win });
    if (win) uw += 1;
    else ow += 1;
    n += 1;
  }
  return { wins: uw, losses: ow, games };
}

export function advanceBracket(s: PlayerState, userWon: boolean) {
  const p = s.playoff;
  if (!p) return;
  p.pairs = p.pairs.map((pair) => {
    if (pair.winnerAbbr) return pair;
    const userIn = pair.a.abbr === s.team.abbr || pair.b.abbr === s.team.abbr;
    if (userIn) {
      return { ...pair, winnerAbbr: userWon ? s.team.abbr : pair.a.abbr === s.team.abbr ? pair.b.abbr : pair.a.abbr };
    }
    return pair;
  });
  if (!userWon) return;
  const winners = p.pairs
    .map((pair) => (pair.winnerAbbr === pair.a.abbr ? pair.a : pair.winnerAbbr === pair.b.abbr ? pair.b : null))
    .filter((x): x is StandingRow => !!x);
  p.round += 1;
  if (winners.length >= 2) {
    const next: BracketPair[] = [];
    for (let i = 0; i < winners.length; i += 2) {
      const a = winners[i]!;
      const b = winners[i + 1];
      if (!b) {
        next.push({ a, b: a, winnerAbbr: a.abbr });
        continue;
      }
      const userIn = a.abbr === s.team.abbr || b.abbr === s.team.abbr;
      next.push({
        a,
        b,
        winnerAbbr: userIn ? undefined : seriesWinner(a, b, s.league, p.round).abbr,
      });
    }
    p.pairs = next;
    return;
  }
  if (p.otherChamp && s.currentLeague) {
    const mine = standingOf(s.currentLeague, s.team.abbr);
    if (mine) p.pairs = [{ a: mine, b: p.otherChamp }];
  }
}

export function buildSeriesResult(
  s: PlayerState,
  round: number,
  label: string,
  opp: StandingRow,
  outcome: { wins: number; losses: number; games: GameLine[] },
  won: boolean,
): SeriesResult {
  return {
    round,
    label,
    opponent: opponentAsTeam(opp),
    opponentSeed: opp.seed ?? 0,
    userSeed: s.playoff?.seed ?? 0,
    wins: outcome.wins,
    losses: outcome.losses,
    won,
    games: outcome.games,
  };
}

export const SERIES_WIN_LINES = [
  `Serie chiusa $SCORE. $OPP non ha più risposte.`,
  `$SCORE: il palazzetto canta il tuo nome, $OPP è fuori.`,
  `Li spezzi $SCORE. La difesa di $OPP cede sul più bello.`,
  `Una serie da spogliatoio, $SCORE. $OPP resta sul parquet.`,
  `$SCORE. Hai letto i loro tempi morti meglio di loro.`,
  `Gara dopo gara, $SCORE. $OPP esce a testa bassa.`,
  `$SCORE e via. $OPP ha lottato; tu hai chiuso.`,
  `La serie finisce $SCORE. In tunnel, stavolta, il rumore è tuo.`,
  `$SCORE. La porta della serie si chiude alle loro spalle.`,
  `Li mandi a casa $SCORE. Nessun discorso: il tabellone basta.`,
  `$OPP cede $SCORE. La serie, alla fine, aveva il tuo passo.`,
  `Chiusa $SCORE. Il fiato torna, $OPP no.`,
  `Una vittoria dopo l'altra, $SCORE. $OPP guarda il tabellone spento.`,
  `Li superi $SCORE. Non è stata fortuna: è stato un piano tenuto.`,
  `Serie vinta $SCORE. Il tunnel, all'uscita, ha il tuo respiro.`,
  `$OPP esce $SCORE. Tu resti, e questo basta come discorso.`,
  `La serie si chiude $SCORE. $OPP ha avuto le sue occasioni; voi avete tenuto l'ultimo possesso.`,
  `$SCORE. Il tunnel, all'uscita, ha il tuo respiro e il loro silenzio.`,
];

export const SINGLE_GAME_WIN_LINES = [
  `Partita chiusa $SCORE. $OPP non ha più risposte.`,
  `Una sera sola, $SCORE: il palazzetto canta il tuo nome.`,
  `Final Four superata. $SCORE, e il tabellone resta aperto.`,
  `$SCORE contro $OPP. Hai tenuto l'ultimo possesso.`,
  `Una partita, nessun domani per loro. $SCORE e si va avanti.`,
];

export const SINGLE_GAME_LOSS_LINES = [
  `Finisce $SCORE. Una partita sola, e $OPP va avanti.`,
  `$SCORE contro $OPP. La Final Four finisce qui.`,
  `Il tabellone non concede un'altra sera: $SCORE, stagione finita.`,
  `Una partita decisa in pochi possessi. $OPP ha tenuto l'ultimo.`,
  `$OPP passa dopo una partita sola. Il parquet si svuota in fretta.`,
];

export const SERIES_LOSS_LINES = [
  `$OPP chiude $SCORE. La corsa si ferma qui.`,
  `Un possesso di troppo, una sera di meno. $OPP passa $SCORE.`,
  `La serie scivola via $SCORE. $OPP era più pronto stanotte.`,
  `$SCORE. Hanno trovato l'angolo che non coprivi.`,
  `Fine corsa, $SCORE. $OPP merita il turno successivo.`,
  `$OPP va avanti $SCORE. Tu resti con una primavera incompiuta.`,
  `$SCORE. Non è stata una rapina: sono stati migliori, punto.`,
  `Eliminati $SCORE. Il tunnel, all'uscita, è più lungo.`,
  `$SCORE. Una serie che si è stretta, e voi ci siete passati attraverso stretti.`,
  `$OPP chiude il discorso $SCORE. Resta da ascoltare, e poi andarsene.`,
  `Fuori $SCORE. Non servono alibi: la serie ha scelto loro.`,
  `$SCORE. La primavera si chiude prima del discorso che avevi pronto.`,
  `Eliminati da $OPP, $SCORE. Si torna a casa con i possessi sbagliati in testa.`,
  `$SCORE. Hanno tenuto un possesso in più. Basta quello, a giugno.`,
  `La corsa finisce $SCORE. $OPP va avanti, tu resti con aprile incompleto.`,
  `$SCORE. Si torna a casa con i possessi sbagliati, e nient'altro da dire.`,
  `Fuori $SCORE da $OPP. La primavera si chiude in punta, senza discorso.`,
];

export const TITLE_LINES = [
  `È il titolo. $OPP cede $SCORE, e l'anello pesa al dito.`,
  `$SCORE in finale. Confetti, ghiaccio, silenzio — poi il rumore.`,
  `Li chiudi $SCORE. Per una notte il mondo ha il tuo nome.`,
  `$SCORE. Alzi qualcosa che non si descrive. Si tiene.`,
  `Finale chiusa $SCORE su $OPP. La città, stanotte, è tua.`,
  `$SCORE. Giugno vi appartiene, e $OPP lo sa per ultimo.`,
  `Campioni, $SCORE. Il peso al dito arriva dopo, a casa, in silenzio.`,
  `$OPP cede in finale $SCORE. Non si trova una frase: si alza.`,
  `Anello, $SCORE. $OPP c'è quasi arrivato. Voi ci siete arrivati.`,
  `$SCORE in sette, o meno. Il dito pesa, e la città canta.`,
  `Campioni contro $OPP, $SCORE. Il silenzio dopo i confetti è il più buono.`,
  `Giugno chiude $SCORE. L'anello non si descrive: si tiene, e si tace un poco.`,
  `$SCORE. La serie più lunga dell'anno, e l'unica che resta appesa.`,
  `Titolo, $SCORE su $OPP. Il parquet, stanotte, ha un altro suono.`,
  `$OPP si ferma $SCORE. Voi no. È questo, il discorso.`,
  `Campioni. $SCORE. Il resto, a casa, senza microfoni.`,
  `$SCORE. Per una notte la città non ha altre domande. Poi sì, e tu ci sei.`,
  `Anello. $SCORE su $OPP. Si tiene, e si tace un poco.`,
];

export const EURO_TITLE_LINES = [
  `Eurolega tua. $SCORE contro $OPP, e il trofeo sale con te.`,
  `Una partita per il titolo, $SCORE contro $OPP. Sei campione d'Europa.`,
  `Ultimo possesso, ultima sirena: $SCORE contro $OPP. Il trofeo è tuo.`,
  `Final Four, ultima pagina: campioni d'Europa, $SCORE contro $OPP.`,
  `Una sola finale, e basta così: $SCORE contro $OPP. La coppa è tua.`,
  `$OPP si ferma qui. La finale finisce $SCORE, la coppa parte con te.`,
];
