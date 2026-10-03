
/** ROY ~7% anno 1 NBA. DPOY ogni stagione NBA: stessa scala del campo, vince il box difensivo. */
import { SIM } from "./config";
import { TUNING } from "./tuning";
import { diffOf } from "./difficulty";
import { advancedOf } from "./peak";
import { rand } from "./rng";
import { findTeam, NBA_TEAMS } from "./teams";
import type { CpuStar, DpoyCandidate, LeagueAward, PlayerState, RoyCandidate, SeasonRow } from "./types";

function clamp(v: number, min: number, max: number) {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

function round1n(n: number) {
  return Math.round(finite(n) * 10) / 10;
}

function finite(n: unknown, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

/** Toglie ROY da questa stagione (n>1 o non-NBA). Non tocca un ROY legittimo dell'anno 1. */
function stripRoyThisSeason(s: PlayerState, row: SeasonRow, n: number) {
  while (row.awards.includes("Rookie of the Year")) {
    row.awards.splice(row.awards.indexOf("Rookie of the Year"), 1);
  }
  if (n === 1) {
    s.milestones = s.milestones.filter((m) => m.label !== "Rookie of the Year");
    s.roy = false;
    return;
  }
  s.milestones = s.milestones.filter((m) => m.label !== "Rookie of the Year" || m.season === 1);
  const wonY1 = s.milestones.some((m) => m.season === 1 && m.label === "Rookie of the Year");
  if (!wonY1) s.roy = false;
}

/** Un solo DPOY sulla riga. Dedup in-place. Ritorna se ne resta almeno uno. */
export function uniqueDpoy(row: SeasonRow): boolean {
  let seen = 0;
  for (let i = 0; i < row.awards.length; i++) {
    if (row.awards[i] !== "DPOY") continue;
    seen += 1;
    if (seen > 1) {
      row.awards.splice(i, 1);
      i -= 1;
    }
  }
  return seen > 0;
}

/** Box NBA-like: PPG prima, poi WS/VORP/BPM, minuti e presenze. OVR è un tie-break. */
export function royProductionScore(input: {
  ppg: number;
  rpg: number;
  apg: number;
  gp?: number;
  min?: number;
  per?: number;
  ts?: number;
  plusMinus?: number;
  overall?: number;
}): number {
  const gp = finite(input.gp, 70);
  const min = finite(input.min, 24);
  const adv = advancedOf({
    gp,
    min,
    ppg: finite(input.ppg),
    rpg: finite(input.rpg),
    apg: finite(input.apg),
    tov: 1.35,
    ts: finite(input.ts, 0.54),
    per: finite(input.per, 15),
    plusMinus: finite(input.plusMinus, 0),
  });
  const gpW = clamp(gp / 68, 0.52, 1);
  const counting = finite(input.ppg) * 3.55 + finite(input.rpg) * 1.05 + finite(input.apg) * 1.45;
  const impact = finite(adv.ws) * 1.35 + finite(adv.vorp) * 2.15 + finite(adv.bpm) * 0.85;
  const ovr = Math.max(0, clamp(finite(input.overall, 60), SIM.overall.min, SIM.overall.max) - 60) * 0.1;
  const out = round1n((counting + impact) * gpW + Math.max(0, min - 16) * 0.16 + ovr);
  return Number.isFinite(out) ? out : 0;
}

export function royPlayerScore(s: PlayerState, row: SeasonRow): number {
  const d = diffOf(s);
  const ready = Number.isFinite(s.rookReady) ? s.rookReady : 0;
  const raw = royProductionScore({
    ppg: row.ppg,
    rpg: row.rpg,
    apg: row.apg,
    gp: row.gp,
    min: row.min,
    per: row.per,
    ts: row.ts,
    plusMinus: finite(row.plusMinus, 0),
    overall: s.overall,
  });
  const imprint = ready * 0.12 + finite(s.form) * 0.08;
  const out = round1n(raw + imprint + finite(d.roy) * 0.04);
  return Number.isFinite(out) ? out : 0;
}

export function royCpuScore(c: RoyCandidate): number {
  const out = royProductionScore({
    ppg: c.ppg,
    rpg: c.rpg,
    apg: c.apg,
    gp: 64,
    min: clamp(16 + finite(c.ppg) * 0.7, 18, 32),
    overall: 62 + Math.max(0, finite(c.ppg) - 10) * 0.4,
  });
  return Number.isFinite(out) ? out : 0;
}

/** Ricalcola la corsa ROY. Target ~7% delle carriere NBA all'anno 1. */
export function settleRoy(s: PlayerState, row: SeasonRow, n: number): RoyCandidate[] {
  if (n !== 1 || s.league !== "NBA") {
    stripRoyThisSeason(s, row, n);
    return row.league?.royRace ?? [];
  }
  const player: RoyCandidate = {
    name: s.name,
    team: s.team.name,
    teamAbbr: s.team.abbr,
    teamColor: s.team.color,
    ppg: finite(row.ppg),
    rpg: finite(row.rpg),
    apg: finite(row.apg),
    score: finite(royPlayerScore(s, row)),
    isPlayer: true,
  };
  const others = (s.royClass.length ? s.royClass : row.league?.royRace ?? [])
    .filter((c) => !c.isPlayer)
    .map((c) => ({
      ...c,
      score: royCpuScore(c),
      isPlayer: false,
    }));
  const race = [player, ...others].sort((a, b) => b.score - a.score);
  const had = row.awards.includes("Rookie of the Year") || s.roy;
  const lead = race[0]?.isPlayer === true;
  const caliber = finite(row.gp) >= 52 && finite(row.ppg) >= 9.45;
  const bestCpuPpg = others.reduce((m, c) => Math.max(m, finite(c.ppg)), 0);
  const nearBox = finite(row.ppg) + 1.6 >= bestCpuPpg;
  const converts =
    caliber &&
    (lead || nearBox) &&
    (finite(row.ppg) >= 16 ||
      rand() < clamp(0.28 + (finite(row.ppg) - bestCpuPpg) * 0.06, 0.12, 0.46));
  if (converts && !had && n === 1 && s.league === "NBA") {
    s.roy = true;
    if (!row.awards.includes("Rookie of the Year")) row.awards.unshift("Rookie of the Year");
    if (!s.milestones.some((m) => m.label === "Rookie of the Year")) {
      s.milestones.push({ season: n, label: "Rookie of the Year" });
    }
  } else if (!converts && had) {
    s.roy = false;
    const ix = row.awards.indexOf("Rookie of the Year");
    if (ix >= 0) row.awards.splice(ix, 1);
    s.milestones = s.milestones.filter((m) => m.label !== "Rookie of the Year");
  }
  const winner = converts ? (race.find((c) => c.isPlayer) ?? race[0]) : (race.find((c) => !c.isPlayer) ?? race[0]);
  s.royClass = race;
  if (row.league) {
    row.league.royRace = race;
    patchAward(row.league.awards, "ROY", {
      title: "ROY",
      name: winner?.name ?? s.name,
      team: winner?.team ?? s.team.name,
      teamAbbr: winner?.teamAbbr ?? s.team.abbr,
      note: `${finite(winner?.ppg ?? row.ppg).toFixed(1)} / ${finite(winner?.rpg ?? row.rpg).toFixed(1)} / ${finite(winner?.apg ?? row.apg).toFixed(1)}`,
      isPlayer: !!converts,
    });
  }
  return race;
}

function patchAward(list: LeagueAward[] | undefined, title: string, next: LeagueAward) {
  if (!list) return;
  const i = list.findIndex((a) => a.title === title);
  if (i >= 0) list[i] = next;
  else list.push(next);
}

type DpoyShape = {
  spg: number;
  bpg: number;
  rpg: number;
  gp: number;
  min: number;
  role?: string;
  defense?: number;
  teamDef?: number;
  age?: number;
  per?: number;
  plusMinus?: number;
};

/** Stessa scala per te e per il campo.
 *  NBA 2015-2026: il premio vive sulle stoppate dei lunghi (Gobert 2,1-2,7, Wembanyama 3,1),
 *  sulle ali che rubano e chiudono (Leonard ~1,8 / 1,0), e quasi mai su un playmaker
 *  (Smart 2022, Payton 1996: palle rubate alte e difesa di squadra prima in classifica).
 *  Soglia moderna: circa 65 partite. Qui il peso pieno arriva a 65, e sotto 58 non si vince. */
function nbaDpoyScore(b: DpoyShape): number {
  const spg = finite(b.spg);
  const bpg = finite(b.bpg);
  const rpg = finite(b.rpg);
  const role = b.role ?? "SF";
  const big = role === "C" || role === "PF";
  const guard = role === "PG" || role === "SG";
  const blockW = big ? 5.6 : guard ? 3.2 : 4.5;
  const stealW = guard ? 4.6 : big ? 2.7 : 3.7;
  const stocks = spg * stealW + bpg * blockW;
  const glass = big ? clamp(rpg - 7.2, 0, 6) * 0.5 : clamp(rpg - 4.8, 0, 4) * 0.25;
  const gp = finite(b.gp, 70);
  const avail = clamp((gp - 38) / 27, 0.32, 1);
  const minutes = clamp(finite(b.min, 30) / 32, 0.55, 1.1);
  const team = clamp(finite(b.teamDef, 0), 0, 4);
  const anchor = clamp(finite(b.defense, 55) - 64, 0, 28) * 0.05;
  const perLift = clamp(finite(b.per, 15) - 15, -4, 6) * 0.06;
  const pmLift = clamp(finite(b.plusMinus, 0), -6, 8) * 0.1;
  const poss = Math.max(12, (finite(b.min, 30) / 48) * 100);
  const stlPct = clamp((100 * spg) / (poss * 0.48), 0.4, 4.5);
  const blkPct = clamp((100 * bpg) / (poss * 0.48), 0.2, 8);
  const dws = (stlPct * 0.9 + blkPct * 0.75) * clamp(gp / 72, 0.45, 1.1);
  const dbpm = (stlPct - 1.4) * 0.7 + (blkPct - 1.1) * 0.62;
  const youth = (b.age ?? 26) <= 21 ? 1.8 : (b.age ?? 26) === 22 ? 0.6 : 0;
  const raw =
    (stocks * 0.84 + dws * 0.95 + clamp(dbpm, -1, 5) * 0.4 + glass + team + anchor + perLift + pmLift - youth) *
    (0.6 + avail * 0.4) *
    minutes;
  return Number.isFinite(raw) ? raw : 0;
}

/** STL%, BLK%, vittorie difensive e DBPM. Stesse voci che pesano sul Defensive Player of the Year. */
export function defensiveMarks(row: {
  gp?: number;
  min?: number;
  ppg?: number;
  rpg?: number;
  apg?: number;
  tov?: number;
  ts?: number;
  per?: number;
  plusMinus?: number;
  fg?: number;
  tp?: number;
  spg?: number;
  bpg?: number;
}): { stlPct: number; blkPct: number; dws: number; dbpm: number } {
  const adv = advancedOf({
    gp: finite(row.gp, 1),
    min: finite(row.min, 24),
    ppg: finite(row.ppg),
    rpg: finite(row.rpg),
    apg: finite(row.apg),
    tov: finite(row.tov, 1.2),
    ts: finite(row.ts, 0.54),
    per: finite(row.per, 15),
    plusMinus: finite(row.plusMinus, 0),
    fg: row.fg,
    tp: row.tp,
    spg: finite(row.spg, 0.6),
    bpg: finite(row.bpg, 0.4),
  });
  const gpW = clamp(finite(row.gp, 1) / 72, 0.4, 1.15);
  const minW = clamp(finite(row.min, 24) / 32, 0.5, 1.15);
  const dws = clamp((adv.stlPct * 0.9 + adv.blkPct * 0.75 + Math.max(0, finite(row.rpg) - 6) * 0.06) * gpW * minW * 0.72, 0, 8);
  const dbpm = clamp((adv.stlPct - 1.4) * 0.85 + (adv.blkPct - 1.1) * 0.7 + finite(row.plusMinus) * 0.15, -4, 8);
  return {
    stlPct: round1n(adv.stlPct),
    blkPct: round1n(adv.blkPct),
    dws: round1n(dws),
    dbpm: round1n(dbpm),
  };
}

/** Stessa scala per te e per la stella avversaria, senza il rumore del voto. */
export function mvpRaceScore(ppg: number, wins: number, per: number, mine: boolean): number {
  const out = finite(ppg) * (mine ? 2.4 : 2.2) + finite(wins) * 0.45 + finite(per) * 0.8;
  return Number.isFinite(out) ? out : 0;
}

export function quintetRaceScore(ppg: number, per: number, plusMinus: number): number {
  const out = finite(ppg) + finite(per) * 0.32 + finite(plusMinus) * 0.18;
  return Number.isFinite(out) ? out : 0;
}

export function cpuPer(ppg: number, rpg: number, apg: number, ovr: number): number {
  const out = 8.2 + (finite(ovr, 70) - 60) * 0.4 + finite(ppg) * 0.24 + finite(rpg) * 0.17 + finite(apg) * 0.27;
  return Math.max(6.5, Math.min(33, out));
}

/** Numeri che hanno deciso il premio, gli stessi del calcolo. */
export function personalAwardBrief(row: SeasonRow, title: string): string {
  const ppg = finite(row.ppg).toFixed(1);
  const rpg = finite(row.rpg).toFixed(1);
  const apg = finite(row.apg).toFixed(1);
  const gp = Math.round(finite(row.gp));
  if (title === "DPOY") {
    const d = defensiveMarks(row);
    return `${finite(row.spg).toFixed(1)} palle rubate · ${finite(row.bpg).toFixed(1)} stoppate · ${d.dws.toFixed(1)} vittorie difensive · ${gp} partite`;
  }
  if (title === "Rookie of the Year" || title === "ROY") {
    return `${ppg} punti · ${rpg} rimbalzi · ${apg} assist · ${gp} partite, primo anno`;
  }
  if (title === "MVP") {
    return `${ppg} punti · ${Math.round(finite(row.wins))} vittorie · PER ${finite(row.per).toFixed(1)}`;
  }
  if (title === "FMVP" || title.startsWith("Finals")) {
    return `${ppg} punti in stagione · ${row.playoff || "finale"}`;
  }
  if (title.startsWith("All-NBA")) {
    const pm = finite(row.plusMinus);
    return `${ppg} punti · PER ${finite(row.per).toFixed(1)} · +/- ${pm > 0 ? "+" : ""}${pm.toFixed(1)}`;
  }
  if (title === "All-Star") {
    return `${ppg} punti · ${rpg} rimbalzi · ${apg} assist · ${gp} partite`;
  }
  if (title === "MIP" || title === "Most Improved Player") {
    return `${ppg} punti · PER ${finite(row.per).toFixed(1)} · il salto sull'anno prima`;
  }
  if (title === "6MOY" || title === "Sixth Man") {
    return `${finite(row.min).toFixed(1)} minuti · ${ppg} punti · ${gp} partite`;
  }
  return `${ppg} / ${rpg} / ${apg} · ${gp} partite`;
}

function teamDefOf(identity: string | undefined, oppPpg?: number): number {
  const base = identity === "defense" ? 1.45 : identity === "physical" ? 0.7 : identity === "halfCourt" ? 0.25 : 0;
  const opp = Number(oppPpg);
  const low = Number.isFinite(opp) && opp < 112 ? clamp((112 - opp) * 0.04, 0, 0.8) : 0;
  return base + low;
}

export function dpoyScore(s: PlayerState, row: SeasonRow): number {
  const ident = s.world?.teams?.[s.team.abbr]?.identity;
  const table = [...(row.league?.east ?? []), ...(row.league?.west ?? [])];
  const mine = table.find((r) => r.abbr === s.team.abbr);
  const score = nbaDpoyScore({
    spg: finite(row.spg),
    bpg: finite(row.bpg),
    rpg: finite(row.rpg),
    gp: finite(row.gp, 0),
    min: finite(row.min, 24),
    role: s.role,
    defense: finite(s.attrs?.defense, 50),
    teamDef: teamDefOf(ident, mine?.oppPpg),
    age: s.age,
    per: finite(row.per, 15),
    plusMinus: finite(row.plusMinus, 0),
  });
  return score;
}

function starDpoyBits(p: CpuStar, ident?: string) {
  const rim = p.role === "C" || p.role === "PF";
  const g = p.role === "PG" || p.role === "SG";
  const ovr = clamp(finite(p.overall, 74), SIM.overall.min, SIM.overall.max);
  const arch = p.archetype === "rimProtector" ? 1.1 : p.archetype === "twoWay" ? 1.04 : 1;
  const m = arch * (ident === "defense" ? 1.04 : ident === "physical" ? 1.02 : 1);
  const spg = clamp(((g ? 1.28 : rim ? 0.58 : 0.95) + (ovr - 78) * 0.016) * m, 0.4, 2.2);
  const bpg = clamp(((rim ? 1.28 : g ? 0.28 : 0.55) + (ovr - 78) * 0.022) * (p.archetype === "rimProtector" ? 1.12 : 1) * m, 0.15, 3.1);
  const score = nbaDpoyScore({
    spg,
    bpg,
    rpg: finite(p.rpg, rim ? 9.6 : g ? 3.4 : 6.1),
    gp: finite(p.gp, 72),
    min: rim ? 31 : 32,
    role: p.role,
    defense: Math.min(ovr, 80),
    teamDef: teamDefOf(ident),
    age: p.age,
    per: 16,
    plusMinus: ident === "defense" ? 1.4 : 0.2,
  });
  return { spg: round1n(spg), bpg: round1n(bpg), score: round1n(score) };
}

/** Voter fatigue on the player's DPOY score. Shipped rule: 5.5% per DPOY, at most 22%. */
function dpoyFatigue(s: PlayerState): number {
  const count = finite(s.dpoyCount, 0);
  if (TUNING.dpoyFatigue === "steeper") return Math.min(0.36, count * 0.09);
  if (TUNING.dpoyFatigue === "streak") {
    // Only consecutive wins tire voters; a season without DPOY resets the streak.
    let streak = 0;
    for (let i = s.seasonHistory.length - 1; i >= 0; i--) {
      if (!s.seasonHistory[i]!.awards.includes("DPOY")) break;
      streak += 1;
    }
    return Math.min(0.36, streak * 0.12);
  }
  return Math.min(0.22, count * 0.055);
}

function buildDpoyRace(s: PlayerState, row: SeasonRow): DpoyCandidate[] {
  const player: DpoyCandidate = {
    name: s.name, team: s.team.name, teamAbbr: s.team.abbr, teamColor: s.team.color,
    spg: round1n(finite(row.spg, 0)), bpg: round1n(finite(row.bpg, 0)),
    score: finite(round1n(finite(dpoyScore(s, row)) * (1 - dpoyFatigue(s)))), isPlayer: true,
  };
  const seen = new Set<string>([s.name]);
  const others: DpoyCandidate[] = [];
  const byAbbr = new Map([...(row.league?.east ?? []), ...(row.league?.west ?? [])].map((r) => [r.abbr, r]));
  // NBA award: only players on NBA rosters. Same membership test as the MVP field (league.ts nbaField).
  const nba = new Set(NBA_TEAMS.map((t) => t.abbr));
  for (const p of s.world?.stars ?? []) {
    if (p.retired || !nba.has(p.teamAbbr) || p.teamAbbr === s.team.abbr || seen.has(p.name)) continue;
    const stand = byAbbr.get(p.teamAbbr);
    const bits = starDpoyBits(p, stand?.identity ?? s.world?.teams?.[p.teamAbbr]?.identity);
    seen.add(p.name);
    others.push({
      name: p.name, team: stand?.name ?? p.teamAbbr, teamAbbr: p.teamAbbr,
      teamColor: findTeam(p.teamAbbr)?.color ?? s.team.color, spg: bits.spg, bpg: bits.bpg, score: bits.score, isPlayer: false,
    });
  }
  others.sort((a, b) => b.score - a.score);
  return [player, ...others.slice(0, 7)].sort((a, b) => b.score - a.score || b.bpg - a.bpg);
}

/** DPOY: corsa NBA ogni stagione, dal debutto ai 36. Il giocatore è sempre in lista. Vince chi guida il box, con minuti veri. */
export function settleDpoy(s: PlayerState, row: SeasonRow, n: number): boolean {
  if (s.league !== "NBA") {
    if (row.league) row.league.dpoyRace = [];
    return uniqueDpoy(row);
  }
  const race = buildDpoyRace(s, row);
  if (row.league) row.league.dpoyRace = race;
  if (uniqueDpoy(row)) return true;
  const leader = race[0];
  const spg = finite(row.spg, 0);
  const bpg = finite(row.bpg, 0);
  const stocks = spg + bpg;
  const big = s.role === "C" || s.role === "PF";
  const guard = s.role === "PG" || s.role === "SG";
  const ident = s.world?.teams?.[s.team.abbr]?.identity;
  const teamDef = teamDefOf(ident);
  const shape = big
    ? bpg >= 1.45 && stocks >= 1.85
    : guard
      ? spg >= 1.5 && (teamDef >= 1.5 || stocks >= 2.15)
      : stocks >= 1.9 && (spg >= 1.15 || bpg >= 0.85);
  const youthOk = s.age > 21 || stocks >= 2.9 || bpg >= 2.45;
  const gpOk = finite(row.gp, 0) >= 58;
  const mine = race.find((c) => c.isPlayer);
  const myScore = finite(mine?.score);
  const marks = defensiveMarks(row);
  const fieldScore = finite(race.find((c) => !c.isPlayer)?.score, 99);
  const win =
    !!leader?.isPlayer && gpOk && shape && youthOk && marks.dws >= 3 && Number.isFinite(myScore) && myScore + 0.05 >= fieldScore;
  if (!win) {
    if (row.league && leader && !leader.isPlayer) {
      patchAward(row.league.awards, "DPOY", {
        title: "DPOY", name: leader.name, team: leader.team, teamAbbr: leader.teamAbbr,
        note: `${finite(leader.spg).toFixed(1)} palle rubate · ${finite(leader.bpg).toFixed(1)} stoppate`, isPlayer: false,
      });
    }
    return false;
  }
  row.awards.push("DPOY");
  uniqueDpoy(row);
  s.dpoyCount += 1;
  if (!s.milestones.some((m) => m.season === n && m.label === "DPOY")) s.milestones.push({ season: n, label: "DPOY" });
  if (row.league) {
    patchAward(row.league.awards, "DPOY", {
      title: "DPOY", name: s.name, team: s.team.name, teamAbbr: s.team.abbr,
      note: `${finite(row.spg, 0).toFixed(1)} palle rubate · ${finite(row.bpg, 0).toFixed(1)} stoppate · ${marks.dws.toFixed(1)} vittorie difensive`, isPlayer: true,
    });
  }
  return true;
}

export function settlePlayerAwards(s: PlayerState, row: SeasonRow, n: number) {
  settleRoy(s, row, n);
  settleDpoy(s, row, n);
  if (n !== 1 || s.league !== "NBA") stripRoyThisSeason(s, row, n);
  uniqueDpoy(row);
}
