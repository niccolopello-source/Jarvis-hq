/**
 * Awards v2 gate (2.15.0): fingerprints of whole careers forced to an older engine version.
 * Generated on main before the awards change; awards-v2.test.ts replays the same careers and
 * requires identical hashes, so 2.14 / 2.13 / 2.12 careers keep every award, stat and RNG draw.
 *   node --import=tsx scripts/awards-gate-fingerprints.ts > src/lib/pivot/fixtures/awards-gate-fp.json
 */
import { createHash } from "node:crypto";
import { advanceCareerSim, openCareerSim } from "../src/lib/pivot/engine.ts";
import { seedRookieClass } from "../src/lib/pivot/league.ts";
import type { PlayerState } from "../src/lib/pivot/types.ts";

export const AWARD_GATE_VERSIONS = ["2.14.0-beta", "2.13.0-beta", "2.12.0-beta"] as const;
export const AWARD_GATE_DIFFS = ["esordio", "pro", "allstar", "leggenda"] as const;
export const AWARD_GATE_SEEDS = Array.from({ length: 25 }, (_, i) => 4200 + i * 131);

export function awardFingerprint(s: PlayerState): string {
  const body = JSON.stringify({
    progression: s.seasonHistory.map((r) => [r.age, r.overall, r.ppg, r.rpg, r.apg, r.min, r.gp, r.teamAbbr, r.wins]),
    awards: s.seasonHistory.map((r) => r.awards),
    leagueAwards: s.seasonHistory.map((r) => r.league?.awards),
    royRace: s.seasonHistory.map((r) => r.league?.royRace),
    dpoyRace: s.seasonHistory.map((r) => r.league?.dpoyRace),
    counts: [s.mvpCount, s.allStarCount, s.allNbaCount, s.dpoyCount, s.roy, s.fmvpCount, s.titleCount],
    milestones: s.milestones,
    choices: s.choiceLog,
    rng: s.rngState,
  });
  return createHash("sha256").update(body).digest("hex").slice(0, 20);
}

export function playAwardsAt(seed: number, difficulty: string, version: string): PlayerState {
  const job = openCareerSim({ seed, difficulty: difficulty as never });
  job.s.engineVersion = version;
  // The rookie class is drawn at career start with the running engine; redraw it for the forced version.
  job.s.royClass = [];
  seedRookieClass(job.s);
  let done = false;
  while (!done) done = advanceCareerSim(job);
  return job.s;
}

if (process.argv[1]?.endsWith("awards-gate-fingerprints.ts")) {
  const out: Record<string, string> = {};
  for (const v of AWARD_GATE_VERSIONS) for (const d of AWARD_GATE_DIFFS) for (const seed of AWARD_GATE_SEEDS) out[`${v}|${d}|${seed}`] = awardFingerprint(playAwardsAt(seed, d, v));
  process.stdout.write(JSON.stringify(out) + "\n");
}
