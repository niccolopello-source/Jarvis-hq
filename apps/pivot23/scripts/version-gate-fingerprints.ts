/**
 * Fingerprints of whole careers forced to an engine version, for the #83 gate (2.16.0).
 * Run on a main checkout to freeze the reference: the test replays the same careers on this
 * branch and requires identical hashes for 2.15 / 2.14 / 2.13 / 2.12.
 *   node --import=tsx scripts/version-gate-fingerprints.ts > src/lib/pivot/fixtures/version-gate-fp.json
 */
import { createHash } from "node:crypto";
import { advanceCareerSim, openCareerSim } from "../src/lib/pivot/engine.ts";
import { seedRookieClass } from "../src/lib/pivot/league.ts";
import type { PlayerState } from "../src/lib/pivot/types.ts";

export const GATE_VERSIONS = ["2.15.0-beta", "2.14.0-beta", "2.13.0-beta", "2.12.0-beta"] as const;
export const GATE_DIFFS = ["esordio", "pro", "allstar", "leggenda"] as const;
export const GATE_SEEDS = Array.from({ length: 40 }, (_, i) => 9100 + i * 37);

export function careerFingerprint(s: PlayerState): string {
  const body = JSON.stringify({
    created: [s.name, s.role, s.potential, s.hidden, s.draftPick, s.startAge, s.apexAge],
    progression: s.seasonHistory.map((r) => [r.age, r.overall, r.ppg, r.rpg, r.apg, r.min, r.gp, r.teamAbbr]),
    events: s.usedEventIds,
    choices: s.choiceLog,
    awards: s.seasonHistory.map((r) => r.awards),
    leagueAwards: s.seasonHistory.map((r) => r.league?.awards),
    standings: s.seasonHistory.map((r) => [r.wins, r.losses]),
    playoffs: s.seasonHistory.map((r) => r.playoff),
    champions: s.championLog,
    retirement: [s.age, s.seasonHistory.at(-1)?.age, s.seasonHistory.length, s.extraSeason ?? null],
    rng: s.rngState,
  });
  return createHash("sha256").update(body).digest("hex").slice(0, 20);
}

export function playAt(seed: number, difficulty: (typeof GATE_DIFFS)[number], version: string): PlayerState {
  // 2.20: the Leggenda potential shift is drawn at creation, so create the career as the forced version
  // (as a real save of that version was). Without this, forced 2.19-or-older Leggenda careers get the 2.20 shift.
  const job = openCareerSim({ seed, difficulty, engineVersion: version });
  job.s.engineVersion = version;
  // The rookie class is drawn at career start with the running engine (isolated RNG); redraw it
  // for the forced version, as scripts/awards-gate-fingerprints.ts does.
  job.s.royClass = [];
  seedRookieClass(job.s);
  let done = false;
  while (!done) done = advanceCareerSim(job);
  return job.s;
}

if (process.argv[1]?.endsWith("version-gate-fingerprints.ts")) {
  const out: Record<string, string> = {};
  for (const v of GATE_VERSIONS) for (const d of GATE_DIFFS) for (const seed of GATE_SEEDS) out[`${v}|${d}|${seed}`] = careerFingerprint(playAt(seed, d, v));
  process.stdout.write(JSON.stringify(out, null, 0) + "\n");
}
