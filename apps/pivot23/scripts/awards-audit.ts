/**
 * Awards audit: distributions over many seeded careers, forced to an engine version.
 *   node --import=tsx scripts/awards-audit.ts <version> <seeds> [difficulty]
 */
import { advanceCareerSim, openCareerSim } from "../src/lib/pivot/engine.ts";
import { seedRookieClass } from "../src/lib/pivot/league.ts";
import { ROY_ROLES } from "../src/lib/pivot/rookie-box.ts";
import { ROOKIE_NAMES } from "../src/lib/pivot/teams.ts";

const version = process.argv[2] ?? "2.14.0-beta";
const N = Number(process.argv[3] ?? 1000);
const diffs = (process.argv[4] ?? "esordio,pro,allstar,leggenda").split(",");
const PLAYER_LABELS: Record<string, string> = { MVP: "MVP", ROY: "Rookie of the Year", DPOY: "DPOY", MIP: "Most Improved Player", "6MOY": "Sixth Man" };

const c = {
  careers: 0, nbaY1: 0, playerRoy: 0, royRole: {} as Record<string, number>, cpuRookiePpg: [] as number[], cpuRoyWinnerPpg: [] as number[],
  rookieNames: new Set<string>(), playerRoyPpg: [] as number[], playerLostRoyBetter: 0,
  seasons: 0, nbaSeasons: 0, mvp: 0, mvpPpg: [] as number[], mvpWins: [] as number[], mvpGp: [] as number[], cpuMvpTeamRank: [] as number[],
  allStar: 0, allNba: 0, dpoy: 0, dpoyMaxStreak: 0, mip: 0, mipLowGp: 0, sixth: 0, sixthLowGp: 0, dupes: 0, dupeLabels: {} as Record<string, number>,
  mismatch: 0, boardLeaderNoTrophy: 0, boardLeaderIneligible: 0, mismatchKinds: {} as Record<string, number>, lowGpAward: 0, dominantNoMvp: 0, euroAward: 0, ms: 0,
};
const avg = (a: number[]) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 100) / 100 : 0);
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 10000) / 100 : 0);

const t0 = performance.now();
for (const d of diffs) for (let i = 0; i < N; i++) {
  const seed = 50000 + i * 7919;
  const job = openCareerSim({ seed, difficulty: d as never });
  job.s.engineVersion = version;
  // The rookie class is drawn at career start with the running engine; redraw it for the forced version.
  job.s.royClass = [];
  seedRookieClass(job.s);
  c.careers++;
  let done = false;
  let streak = 0;
  while (!done) {
    done = advanceCareerSim(job);
    const s = job.s;
    const row = s.seasonHistory.at(-1);
    if (!row || (row as { _seen?: boolean })._seen) continue;
    (row as { _seen?: boolean })._seen = true;
    c.seasons++;
    const seen = new Map<string, number>();
    for (const a of row.awards) seen.set(a, (seen.get(a) ?? 0) + 1);
    for (const [a, k] of seen) if (k > 1) { c.dupes++; c.dupeLabels[a] = (c.dupeLabels[a] ?? 0) + 1; }
    const lg = row.league;
    if (s.league !== "NBA" && row.awards.some((a) => a !== "Champion")) c.euroAward++;
    if (row.teamAbbr && lg && (lg.east.length || lg.west.length)) {
      const nba = row.league!.east.length > 0;
      if (nba && row.league!.euro.length >= 0) c.nbaSeasons += row.conf ? 1 : 0;
      // consistency: league list says isPlayer <=> row.awards contains
      for (const [t, lab] of Object.entries(PLAYER_LABELS)) {
        const la = lg.awards.find((a) => a.title === t);
        if (!la) continue;
        if (!!la.isPlayer !== row.awards.includes(lab)) { c.mismatch++; c.mismatchKinds[t] = (c.mismatchKinds[t] ?? 0) + 1; }
      }
      const top = lg.mvpBoard?.[0];
      if (top?.isPlayer && !row.awards.includes("MVP")) { if (row.awards.includes("All-Star") && row.gp >= 65) c.boardLeaderNoTrophy++; else c.boardLeaderIneligible++; }
      const mvpA = lg.awards.find((a) => a.title === "MVP");
      if (mvpA && !mvpA.isPlayer) {
        const tab = [...lg.east, ...lg.west].sort((a, b) => b.w - a.w);
        const r = tab.findIndex((x) => x.abbr === mvpA.teamAbbr);
        if (r >= 0) c.cpuMvpTeamRank.push(r + 1);
      }
      if (row.season === 1 && lg.royRace?.length) {
        c.nbaY1++;
        for (const r of lg.royRace) if (!r.isPlayer) { c.cpuRookiePpg.push(r.ppg); c.rookieNames.add(r.name); }
        const roy = lg.awards.find((a) => a.title === "ROY");
        if (row.awards.includes("Rookie of the Year")) { c.playerRoy++; c.playerRoyPpg.push(row.ppg); c.royRole[s.role] = (c.royRole[s.role] ?? 0) + 1; }
        else if (roy) {
          const w = lg.royRace.find((r) => r.name === roy.name && !r.isPlayer);
          if (w) {
            c.cpuRoyWinnerPpg.push(w.ppg);
            const ix = ROOKIE_NAMES.indexOf(w.name);
            const role = ix >= 0 && ix < 5 ? ROY_ROLES[ix]! : (w as { role?: string }).role ?? "?";
            c.royRole[role] = (c.royRole[role] ?? 0) + 1;
            if (row.ppg > w.ppg + 3 && row.gp >= 65) c.playerLostRoyBetter++;
          }
        }
      }
    }
    if (row.awards.includes("MVP")) { c.mvp++; c.mvpPpg.push(row.ppg); c.mvpWins.push(row.wins); c.mvpGp.push(row.gp); }
    else if (row.ppg >= 30 && row.wins >= 55 && row.gp >= 70 && s.league === "NBA") c.dominantNoMvp++;
    if (row.awards.includes("All-Star")) c.allStar++;
    if (row.awards.some((a) => a.startsWith("All-NBA"))) c.allNba++;
    if (row.awards.includes("Most Improved Player")) { c.mip++; if (row.gp < 58) c.mipLowGp++; }
    if (row.awards.includes("Sixth Man")) { c.sixth++; if (row.gp < 58) c.sixthLowGp++; }
    if (row.awards.includes("DPOY")) { c.dpoy++; streak++; c.dpoyMaxStreak = Math.max(c.dpoyMaxStreak, streak); } else streak = 0;
  }
}
c.ms = Math.round(performance.now() - t0);
const roleTot = Object.values(c.royRole).reduce((a, b) => a + b, 0);
console.log(JSON.stringify({
  version, careers: c.careers, seasons: c.seasons, ms: c.ms,
  roy: { nbaY1: c.nbaY1, playerRoyPct: pct(c.playerRoy, c.nbaY1), playerRoyPpg: avg(c.playerRoyPpg), cpuRookiePpg: avg(c.cpuRookiePpg), cpuRoyWinnerPpg: avg(c.cpuRoyWinnerPpg),
    distinctRookieNames: c.rookieNames.size, winnerRoleShare: Object.fromEntries(Object.entries(c.royRole).map(([k, v]) => [k, pct(v, roleTot)])), playerLostWhileClearlyBetter: c.playerLostRoyBetter },
  mvp: { perCareer: Math.round((c.mvp / c.careers) * 1000) / 1000, ppg: avg(c.mvpPpg), wins: avg(c.mvpWins), gp: avg(c.mvpGp), dominantNoMvp: c.dominantNoMvp, playerTopsMvpBoardEligibleNoTrophy: c.boardLeaderNoTrophy, playerTopsBoardIneligible: c.boardLeaderIneligible,
    cpuMvpTeamRankAvg: avg(c.cpuMvpTeamRank), cpuMvpTop5Pct: pct(c.cpuMvpTeamRank.filter((r) => r <= 5).length, c.cpuMvpTeamRank.length), cpuMvpTeamOutside15: pct(c.cpuMvpTeamRank.filter((r) => r > 15).length, c.cpuMvpTeamRank.length) },
  perCareer: { allStar: +(c.allStar / c.careers).toFixed(3), allNba: +(c.allNba / c.careers).toFixed(3), dpoy: +(c.dpoy / c.careers).toFixed(3), mip: +(c.mip / c.careers).toFixed(3), sixth: +(c.sixth / c.careers).toFixed(3) },
  dpoyMaxStreak: c.dpoyMaxStreak, mipLowGp: c.mipLowGp, sixthLowGp: c.sixthLowGp, dupes: c.dupes, dupeLabels: c.dupeLabels,
  leagueVsRowMismatch: c.mismatch, mismatchKinds: c.mismatchKinds, dominantNoMvp: c.dominantNoMvp, euroAwards: c.euroAward,
}, null, 1));
