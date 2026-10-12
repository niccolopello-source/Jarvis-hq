/**
 * G4 engine science — collector (measurement only, changes nothing in the game).
 * Usage: node --import=tsx scripts/g4/collect.ts <difficulty> <fromIndex> <count> <out.jsonl>
 * Seed scheme (same as the P0-LIFE stats test): seed = (i + 1) * 1000 + 17,
 * role = PG/SG/SF/PF/C by i % 5, path = NCAA/Europa/G-League by i % 3, draft "random".
 * One JSON line per career with every field the analysis needs.
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import * as engine from "../../src/lib/pivot/engine";
import * as peak from "../../src/lib/pivot/peak";
import { TITLE_SEED } from "../../src/lib/pivot/league";
import { NBA_TEAMS } from "../../src/lib/pivot/teams";
import { TUNING } from "../../src/lib/pivot/tuning";

const [difficulty, fromArg, countArg, out] = process.argv.slice(2);
// Measurement-only override of TUNING experiments, e.g. G4_TUNING='{"retirement":"graded"}'.
if (process.env.G4_TUNING) Object.assign(TUNING, JSON.parse(process.env.G4_TUNING));
const roles = ["PG", "SG", "SF", "PF", "C"] as const;
const paths = ["NCAA", "Europa", "G-League"] as const;
const nba = new Set(NBA_TEAMS.map((t) => t.abbr));
const seeded = new Set(TITLE_SEED.map((t) => `${t.league}:${t.yearLabel}`));
const slotOf = (engine as Record<string, unknown>).scriptedSeasonSlot as ((s: unknown, n: number) => string | null) | undefined;
const lines: string[] = [];
const t0 = Date.now();
let errors = 0;
for (let i = Number(fromArg); i < Number(fromArg) + Number(countArg); i++) {
  const seed = (i + 1) * 1000 + 17;
  try {
    const s = engine.playCareerSim({ name: "G4", role: roles[i % 5], nationality: "ITA", number: 23,
      difficulty: difficulty as "pro", path: paths[i % 3], seed, draft: "random" });
    const rows = s.seasonHistory;
    const best = rows.reduce((b, r) => (r.overall > b.overall ? r : b), rows[0]!);
    const slot = (k: string) => (slotOf ? Array.from({ length: 20 }, (_, n) => n + 1).find((n) => slotOf(s, n) === k) ?? 0 : -1);
    lines.push(JSON.stringify({
      i, seed, d: difficulty, role: s.role, path: s.originPath, ev: s.engineVersion,
      pot: s.potential, peak: s.peakOverall, apexAge: s.apexAge, obsPeakAge: best?.age ?? null,
      endAge: peak.careerEndAge(s), age: s.age, startAge: s.startAge, signal: peak.careerEndingSignal(s),
      extra: s.extraSeason, injuryDrag: s.injuryDrag, pick: s.draftPick,
      as: s.allStarCount, an: s.allNbaCount, mvp: s.mvpCount, dpoy: s.dpoyCount, roy: s.roy, titles: s.titleCount, fmvp: s.fmvpCount,
      script: [slot("rival"), slot("injury"), slot("nation")],
      events: s.usedEventIds, choices: s.choiceLog.map((c) => `${c.title}=${c.pick}`), milestones: s.milestones.length,
      rows: rows.map((r) => [r.season, r.age, r.teamAbbr, nba.has(r.teamAbbr) ? 1 : 0, r.overall, r.gp, r.min, r.ppg, r.rpg, r.apg, r.awards.join("|"), r.playoff]),
      champs: s.championLog.map((c) => [c.league, c.yearLabel, c.teamAbbr, seeded.has(`${c.league}:${c.yearLabel}`) ? 1 : 0, c.isPlayer ? 1 : 0]),
      fp: createHash("sha256").update(JSON.stringify([rows, s.championLog, s.usedEventIds, s.choiceLog, s.rngState])).digest("hex").slice(0, 16),
    }));
  } catch (e) {
    errors++;
    lines.push(JSON.stringify({ i, seed, d: difficulty, error: String(e) }));
  }
}
writeFileSync(out, lines.join("\n") + "\n");
console.log(`${difficulty} ${fromArg}+${countArg}: ${errors} errors, ${Date.now() - t0} ms -> ${out}`);
