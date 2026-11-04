/** Read-only: A-vs-B choice policies -> OVR. node --import=tsx scripts/choices-ab.ts <version> [N] */
import { advanceCareerSim, openCareerSim, contextualPulse } from "../src/lib/pivot/engine";
import { displayOverall } from "../src/lib/pivot/peak";
import type { PlayerState, StoryEvent } from "../src/lib/pivot/types";
const V = process.argv[2] ?? "2.25.0", N = +(process.argv[3] ?? 600);
const roles = ["PG","SG","SF","PF","C"] as const, paths = ["NCAA","Europa","G-League"] as const;
type Score = (fx: Record<string, unknown>, s: PlayerState) => number;
const pol = (score: Score, sign: 1 | -1) => (s: PlayerState, ev: StoryEvent) => {
  let best = 0, bv = -Infinity;
  ev.choices.forEach((c, i) => { const v = sign * score(c.fx(structuredClone(s)) as never, s); if (v > bv) { bv = v; best = i; } });
  return best;
};
const pulse: Score = (fx, s) => contextualPulse(structuredClone(s), fx as never);
const mood: Score = (fx) => Number(fx.morale ?? 0);
const policies: Record<string, ((s: PlayerState, ev: StoryEvent) => number) | undefined> = {
  random: undefined, bestPulse: pol(pulse, 1), worstPulse: pol(pulse, -1), moraleUp: pol(mood, 1), moraleDown: pol(mood, -1),
};
const out: Record<string, unknown> = { V, N };
for (const [name, choose] of Object.entries(policies)) {
  let peak = 0, at27 = 0, n27 = 0, min = 0, nm = 0, mor = 0;
  for (let i = 0; i < N; i++) {
    const job = openCareerSim({ name: "M", role: roles[i % 5], nationality: "ITA", number: 23, path: paths[i % 3], seed: 910000 + i, engineVersion: V, difficulty: "pro", draft: "random", ...(choose ? { choose } : {}) } as never);
    for (let k = 0; k < 5000 && !advanceCareerSim(job); k++);
    peak += Math.max(...job.s.seasonHistory.map((r) => displayOverall(r.overall)));
    const r27 = job.s.seasonHistory.find((r) => r.age === 27); if (r27) { at27 += displayOverall(r27.overall); n27++; }
    for (const r of job.s.seasonHistory) { min += r.min; nm++; }
    mor += job.s.morale;
  }
  out[name] = { peak: +(peak / N).toFixed(2), ovr27: +(at27 / n27).toFixed(2), mpg: +(min / nm).toFixed(2), endMorale: +(mor / N).toFixed(1) };
}
console.log(JSON.stringify(out));
