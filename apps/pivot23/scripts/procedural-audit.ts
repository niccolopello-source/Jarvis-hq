/**
 * Procedural audit probe (read-only, no save). Seeds: 900000 + i*7919, i=0..N-1, per difficulty.
 * Usage: node --import=tsx scripts/procedural-audit.ts [N]
 */
import { createHash } from "node:crypto";
import { advanceCareerSim, openCareerSim, ENGINE_VERSION } from "../src/lib/pivot/engine.ts";
import { STORY_POOL } from "../src/lib/pivot/data.ts";
import { allTeams } from "../src/lib/pivot/teams.ts";

const N = Number(process.argv[2] ?? 1000);
const DIFFS = ["esordio", "pro", "allstar", "leggenda"] as const;
const META = new Set(["Percorso", "Chiamata", "Scambio", "Agenzia libera"]);
const teamNames = new Set(allTeams().map((t) => t.name));
const poolIds = new Set(STORY_POOL.map((e) => e.id));
const run = (seed: number, d: string) => {
  const job = openCareerSim({ seed, difficulty: d as never });
  let k = 0;
  while (!advanceCareerSim(job) && k++ < 100);
  return job.s;
};
const out: Record<string, unknown> = { engine: ENGINE_VERSION, N, poolSize: STORY_POOL.length };
const globalSeen = new Map<string, number>();
for (const d of DIFFS) {
  const idCount = new Map<string, number>();
  let distinct = 0, events = 0, repeatedTitleCareers = 0, maxUsed = 0, truncated = 0;
  const paths = new Set<string>();
  const issues: Record<string, number> = {};
  const bump = (k: string) => (issues[k] = (issues[k] ?? 0) + 1);
  const examples: Record<string, string> = {};
  let nondet = 0;
  for (let i = 0; i < N; i++) {
    const seed = 900000 + i * 7919;
    const s = run(seed, d);
    if (i < 50) {
      const a = createHash("sha1").update(JSON.stringify({ ...s, careerId: 0 })).digest("hex");
      const b = createHash("sha1").update(JSON.stringify({ ...run(seed, d), careerId: 0 })).digest("hex");
      if (a !== b) nondet++;
    }
    const ids = s.usedEventIds;
    maxUsed = Math.max(maxUsed, ids.length);
    if (ids.length >= 48 && s.seasonHistory.length > 0) truncated++;
    const pool = ids.filter((x) => poolIds.has(x));
    distinct += new Set(ids).size;
    events += ids.length;
    for (const x of new Set(ids)) { idCount.set(x, (idCount.get(x) ?? 0) + 1); globalSeen.set(x, (globalSeen.get(x) ?? 0) + 1); }
    void pool;
    const titles = s.choiceLog.filter((c) => c.season > 0 && !META.has(c.title) && !/playoff|final|turno|semifinal|primo|secondo|play-in|conference|quarti/i.test(c.title)).map((c) => c.title);
    if (new Set(titles).size < titles.length) { repeatedTitleCareers++; const dup = titles.find((t, j) => titles.indexOf(t) !== j); examples.repeatTitle ??= `seed ${seed}: "${dup}"`; }
    paths.add(s.seasonHistory.map((r) => r.teamAbbr).join(">"));
    // consistency checks
    for (const r of s.seasonHistory) {
      if (!teamNames.has(r.team)) { bump("unknownTeam"); examples.unknownTeam ??= `seed ${seed} s${r.season}: ${r.team}`; }
      if (r.awards.some((a) => /MVP/.test(a) && !/Finals/i.test(a)) && r.overall < 70) { bump("mvpLowOvr"); examples.mvpLowOvr ??= `seed ${seed} s${r.season} ovr ${r.overall}: ${r.awards}`; }
      if (r.awards.some((a) => /Rookie/i.test(a)) && r.season !== 1) { bump("royNotRookie"); examples.royNotRookie ??= `seed ${seed} s${r.season}: ${r.awards}`; }
      if (r.awards.some((a) => /Finals MVP/i.test(a)) && !/Campion|Champion|Titolo/i.test(r.playoff)) { bump("fmvpNoTitle"); examples.fmvpNoTitle ??= `seed ${seed} s${r.season}: ${r.playoff}`; }
      if (r.gp < 0 || r.gp > 82 || r.min < 0 || r.min > 48 || ![34, 82].includes(r.wins + r.losses) || r.gp > r.wins + r.losses) { bump("statRange"); examples.statRange ??= `seed ${seed} s${r.season} gp${r.gp} min${r.min} ${r.wins}-${r.losses}`; }
      if (new Set(r.awards).size !== r.awards.length) { bump("dupAward"); examples.dupAward ??= `seed ${seed} s${r.season}: ${r.awards}`; }
      if (r.seed !== null && (r.seed < 1 || r.seed > 15)) bump("badSeed");
      if (r.playoff !== "Fuori" && r.seed === null) { bump("playoffNoSeed"); examples.playoffNoSeed ??= `seed ${seed} s${r.season}: ${r.playoff}`; }
    }
    for (let j = 1; j < s.seasonHistory.length; j++) if (s.seasonHistory[j]!.age !== s.seasonHistory[j - 1]!.age + 1) { bump("ageJump"); examples.ageJump ??= `seed ${seed}`; }
    if (s.rivalName && s.seasonHistory.some((r) => r.team === s.rivalName)) bump("rivalIsTeam");
    const textBlob = JSON.stringify(s.choiceLog);
    if (/\{[a-zA-Z]+\}/.test(textBlob)) { bump("unfilledPlaceholder"); examples.unfilledPlaceholder ??= `seed ${seed}`; }
  }
  const never = [...poolIds].filter((x) => !idCount.has(x));
  const top = [...idCount].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}:${(v / N * 100).toFixed(1)}%`);
  out[d] = {
    avgEvents: +(events / N).toFixed(2), avgDistinct: +(distinct / N).toFixed(2), maxUsedEventIds: maxUsed, careersAt48plus: truncated,
    repeatedTitleCareers, distinctTeamPaths: paths.size, poolNeverShown: never, topEvents: top,
    distinctIdsSeen: idCount.size, nondeterministicOf50: nondet, issues, examples,
  };
}
out.poolNeverShownAnyDiff = [...poolIds].filter((x) => !globalSeen.has(x));
console.log(JSON.stringify(out, null, 1));
