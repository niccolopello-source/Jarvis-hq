/**
 * Offline balance harness (D-11 / D-23). Not part of the game or of CI.
 * Usage: node --import=tsx scripts/balance-sim.ts <variant> <difficulty> <count> <seedBase> <out.jsonl> [tuningJSON]
 *   variant: "before" = pre-2.12 rules (scriptWindows fixed, dpoyFatigue current), "after" = shipped defaults.
 *   tuningJSON: optional extra overrides, e.g. '{"dpoyStreakStep":0.08}'.
 * Writes one compact JSON line per career. Same seeds on both sides.
 */
import { writeFileSync } from "node:fs";
import { careerEndAge, playCareerSim, scriptedSeasonSlot } from "../src/lib/pivot/engine";
import { TITLE_SEED } from "../src/lib/pivot/league";
import { NBA_TEAMS } from "../src/lib/pivot/teams";
import { LEGACY_RULES, resetTuning, TUNING } from "../src/lib/pivot/tuning";

const [variant, difficulty, countArg, seedArg, out, extra] = process.argv.slice(2);
resetTuning();
if (variant === "before") Object.assign(TUNING, LEGACY_RULES);
if (extra) Object.assign(TUNING, JSON.parse(extra));
const roles = ["PG", "SG", "SF", "PF", "C"] as const;
const paths = ["NCAA", "Europa", "G-League"] as const;
const nba = new Set(NBA_TEAMS.map((t) => t.abbr));
const seedLabels = new Set(TITLE_SEED.map((t) => `${t.league}:${t.yearLabel}`));
const lines: string[] = [];
let errors = 0;
for (let i = 0; i < Number(countArg); i++) {
  const seed = Number(seedArg) + i;
  try {
    const s = playCareerSim({
      name: "Bilancio", role: roles[i % 5], nationality: "ITA", number: 23,
      difficulty: difficulty as "pro", path: paths[i % 3], seed, draft: "random",
    });
    const slot = (k: string) => Array.from({ length: 20 }, (_, n) => n + 1).find((n) => scriptedSeasonSlot(s, n) === k) ?? 0;
    const dpoySeasons = s.seasonHistory.filter((r) => r.awards.includes("DPOY")).map((r) => r.season);
    let streak = 0, best = 0, prev = -9;
    for (const n of dpoySeasons) { streak = n === prev + 1 ? streak + 1 : 1; best = Math.max(best, streak); prev = n; }
    const titles = s.championLog
      .filter((c) => !seedLabels.has(`${c.league}:${c.yearLabel}`))
      .map((c) => [c.league === "NBA" ? "N" : "E", c.teamAbbr, c.isPlayer ? 1 : 0]);
    lines.push(JSON.stringify({
      seed, d: difficulty, role: s.role, path: s.originPath, pot: s.potential, peak: s.peakOverall,
      end: careerEndAge(s), seasons: s.seasonHistory.length, startAge: s.startAge,
      dpoy: s.dpoyCount, dpoyStreak: best, mvp: s.mvpCount, titlesP: s.titleCount, allNba: s.allNbaCount,
      nbaSeasons: s.seasonHistory.filter((r) => nba.has(r.teamAbbr)).length,
      dpoyEligible: s.seasonHistory.filter((r) => nba.has(r.teamAbbr) && r.gp >= 58).length,
      script: [slot("rival"), slot("injury"), slot("nation")],
      events: s.usedEventIds.length,
      titles,
    }));
  } catch (e) {
    errors += 1;
    lines.push(JSON.stringify({ seed, d: difficulty, error: String(e) }));
  }
}
writeFileSync(out, lines.join("\n") + "\n");
console.log(`${variant} ${difficulty} ${countArg} careers, ${errors} errors -> ${out}`);
