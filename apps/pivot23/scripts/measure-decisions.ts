/**
 * Measures the approved balance decisions on a reproducible seed sample (offline, no game change).
 * Usage: node --import=tsx scripts/measure-decisions.ts <before|after> <difficulty> <count> <seedBase>
 *   before = LEGACY_RULES (fixed story windows, cumulative DPOY fatigue, world "current"); after = shipped TUNING.
 * Prints JSON: D-09 champion Gini over NBA teams (with and without the 3 seeded titles), top champion share;
 * D-23 longest DPOY streak, DPOY total, careers with a streak >= 5; D-11 distinct story calendars.
 */
import { playCareerSim, scriptedSeasonSlot } from "../src/lib/pivot/engine";
import { TITLE_SEED } from "../src/lib/pivot/league";
import { NBA_TEAMS } from "../src/lib/pivot/teams";
import { LEGACY_RULES, resetTuning, TUNING } from "../src/lib/pivot/tuning";

const [variant, difficulty, countArg, seedArg] = process.argv.slice(2);
resetTuning();
if (variant === "before") Object.assign(TUNING, LEGACY_RULES);
const roles = ["PG", "SG", "SF", "PF", "C"] as const;
const paths = ["NCAA", "Europa", "G-League"] as const;
const seeded = new Set(TITLE_SEED.map((t) => `${t.league}:${t.yearLabel}`));
const all = new Map<string, number>(NBA_TEAMS.map((t) => [t.abbr, 0]));
const sim = new Map<string, number>(NBA_TEAMS.map((t) => [t.abbr, 0]));
const calendars = new Set<string>();
let maxStreak = 0, streak5 = 0, dpoyTotal = 0, maxDpoy = 0, errors = 0;

function gini(xs: number[]): number {
  const v = [...xs].sort((a, b) => a - b), n = v.length, sum = v.reduce((a, b) => a + b, 0);
  if (!sum) return 0;
  let acc = 0;
  v.forEach((x, i) => (acc += (2 * (i + 1) - n - 1) * x));
  return acc / (n * sum);
}

for (let i = 0; i < Number(countArg); i++) {
  const seed = Number(seedArg) + i;
  try {
    const s = playCareerSim({ name: "Misura", role: roles[i % 5], nationality: "ITA", number: 23,
      difficulty: difficulty as "pro", path: paths[i % 3], seed, draft: "random" });
    for (const c of s.championLog) {
      if (c.league !== "NBA" || !all.has(c.teamAbbr)) continue;
      all.set(c.teamAbbr, all.get(c.teamAbbr)! + 1);
      if (!seeded.has(`${c.league}:${c.yearLabel}`)) sim.set(c.teamAbbr, sim.get(c.teamAbbr)! + 1);
    }
    const seasons = s.seasonHistory.filter((r) => r.awards.includes("DPOY")).map((r) => r.season);
    let run = 0, best = 0, prev = -9;
    for (const n of seasons) { run = n === prev + 1 ? run + 1 : 1; best = Math.max(best, run); prev = n; }
    maxStreak = Math.max(maxStreak, best); if (best >= 5) streak5++;
    dpoyTotal += s.dpoyCount; maxDpoy = Math.max(maxDpoy, s.dpoyCount);
    const slot = (k: string) => Array.from({ length: 20 }, (_, n) => n + 1).find((n) => scriptedSeasonSlot(s, n) === k) ?? 0;
    calendars.add([slot("rival"), slot("injury"), slot("nation")].join("/"));
  } catch { errors++; }
}
const top = (m: Map<string, number>) => {
  const tot = [...m.values()].reduce((a, b) => a + b, 0);
  const [abbr, n] = [...m].sort((a, b) => b[1] - a[1])[0]!;
  return `${abbr} ${((100 * n) / tot).toFixed(1)}%`;
};
console.log(JSON.stringify({ variant, difficulty, careers: Number(countArg), seedBase: Number(seedArg), errors,
  d09: { giniAll: +gini([...all.values()]).toFixed(3), giniSimulated: +gini([...sim.values()]).toFixed(3), topAll: top(all), topSimulated: top(sim) },
  d23: { maxStreak, careersStreakGe5: streak5, dpoyTotal, maxDpoyInCareer: maxDpoy },
  d11: { distinctCalendars: calendars.size } }));
