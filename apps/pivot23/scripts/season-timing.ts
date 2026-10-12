/** One-season simulation timing in Node (lab). Run: node --import=tsx scripts/season-timing.ts */
import { advanceCareerSim, openCareerSim, simulateRegularSeason, withPlayer } from "../src/lib/pivot/engine.ts";
const reg: number[] = [];
const full: number[] = [];
for (let seed = 9000; seed < 9060; seed += 1) {
  const job = openCareerSim({ seed, difficulty: "pro", draft: "random" });
  for (let g = 0; g < 30; g += 1) {
    const s = structuredClone(job.s);
    s.season = job.n;
    let t = performance.now();
    withPlayer(s, () => simulateRegularSeason(s, job.n));
    reg.push(performance.now() - t);
    t = performance.now();
    const done = advanceCareerSim(job);
    full.push(performance.now() - t);
    if (done) break;
  }
}
const q = (a: number[], p: number) => { const v = [...a].sort((x, y) => x - y); return +v[Math.min(v.length - 1, Math.ceil(p * v.length) - 1)]!.toFixed(1); };
console.log(JSON.stringify({ node: process.version, seasons: reg.length, regularSeasonMs: { p50: q(reg, 0.5), p95: q(reg, 0.95), max: q(reg, 1) }, fullSeasonIncPlayoffsOffseasonMs: { p50: q(full, 0.5), p95: q(full, 0.95), max: q(full, 1) } }));
