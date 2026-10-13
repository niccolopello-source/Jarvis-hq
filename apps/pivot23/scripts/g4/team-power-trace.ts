/**
 * A4 measurement: team power and franchise-star overall per season, averaged over worlds.
 * Usage: node --import=tsx scripts/g4/team-power-trace.ts <difficulty> <count> [tuningJSON]
 * Same seed scheme as collect.ts. Prints JSON: per season n, mean power and star overall for
 * OKC/CLE/BOS/NYK/DEN/HOU and the league mean, plus champion share per season index.
 */
import * as engine from "../../src/lib/pivot/engine";
import { liveStar } from "../../src/lib/pivot/world";
import { NBA_TEAMS } from "../../src/lib/pivot/teams";
import { TUNING } from "../../src/lib/pivot/tuning";

const [difficulty, countArg, extra] = process.argv.slice(2);
if (extra) Object.assign(TUNING, JSON.parse(extra));
const roles = ["PG", "SG", "SF", "PF", "C"] as const;
const paths = ["NCAA", "Europa", "G-League"] as const;
const watch = ["OKC", "CLE", "BOS", "NYK", "DEN", "HOU"];
const acc: Record<number, { n: number; power: Record<string, number>; star: Record<string, number>; mean: number }> = {};
const champ: Record<number, Record<string, number>> = {};
for (let i = 0; i < Number(countArg); i++) {
  const job = engine.openCareerSim({ name: "G4", role: roles[i % 5], nationality: "ITA", number: 23,
    difficulty: difficulty as "pro", path: paths[i % 3], seed: (i + 1) * 1000 + 17, draft: "random" });
  let n = 0;
  const snap = () => {
    const s = job.s, a = (acc[n] ??= { n: 0, power: {}, star: {}, mean: 0 });
    a.n++;
    a.mean += NBA_TEAMS.reduce((x, t) => x + (s.teamPower[t.abbr] ?? t.power), 0) / NBA_TEAMS.length;
    for (const k of watch) { a.power[k] = (a.power[k] ?? 0) + (s.teamPower[k] ?? 0); a.star[k] = (a.star[k] ?? 0) + (liveStar(s.world, k)?.overall ?? 0); }
  };
  snap();
  while (!engine.advanceCareerSim(job)) { n++; snap(); }
  job.s.championLog.filter((c) => c.league === "NBA").forEach((c, k) => { (champ[k] ??= {})[c.teamAbbr] = (champ[k]![c.teamAbbr] ?? 0) + 1; });
}
const out = Object.entries(acc).map(([n, a]) => ({ season: Number(n), worlds: a.n, leagueMean: +(a.mean / a.n).toFixed(1),
  power: Object.fromEntries(watch.map((k) => [k, +(a.power[k]! / a.n).toFixed(1)])), star: Object.fromEntries(watch.map((k) => [k, +(a.star[k]! / a.n).toFixed(1)])) }));
const shares = Object.entries(champ).map(([k, m]) => { const tot = Object.values(m).reduce((a, b) => a + b, 0); return { title: Number(k), n: tot, OKC: +(100 * (m.OKC ?? 0) / tot).toFixed(1), CLE: +(100 * (m.CLE ?? 0) / tot).toFixed(1), BOS: +(100 * (m.BOS ?? 0) / tot).toFixed(1) }; });
console.log(JSON.stringify({ difficulty, count: Number(countArg), trace: out, titleShareByIndex: shares }));
