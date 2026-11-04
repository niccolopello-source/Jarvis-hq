/** Read-only: career-shape summary per path. node --import=tsx scripts/ovr-curve-225-summary.ts <version> [N] */
import { advanceCareerSim, openCareerSim } from "../src/lib/pivot/engine";
import { careerEndAge, displayOverall } from "../src/lib/pivot/peak";
const V = process.argv[2] ?? "2.24.0", N = +(process.argv[3] ?? 1500);
const roles = ["PG","SG","SF","PF","C"] as const, paths = ["NCAA","Europa","G-League"] as const;
const q = (a: number[], p: number) => { const b = [...a].sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(p * b.length))]; };
const sd = (a: number[]) => { const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length); };
const out: Record<string, unknown> = { V, N };
for (const path of paths) {
  const ends: number[] = [], peaks: number[] = [], peakAge: number[] = [], g: Record<number, number[]> = {};
  for (let i = 0; i < N; i++) {
    const job = openCareerSim({ name: "M", role: roles[i % 5], nationality: "ITA", number: 23, path, seed: 730000 + i, engineVersion: V, difficulty: (["esordio","pro","allstar","leggenda"] as const)[i % 4], draft: "random" });
    for (let k = 0; k < 5000 && !advanceCareerSim(job); k++);
    ends.push(careerEndAge(job.s)); let best = -1, ba = 0, prev: number | null = null;
    for (const r of job.s.seasonHistory) { const o = displayOverall(r.overall); if (o > best) { best = o; ba = r.age; } if (prev !== null) (g[r.age] ??= []).push(o - prev); prev = o; }
    peaks.push(best); peakAge.push(ba);
  }
  const growth = Object.fromEntries([22,23,24,25,26,27,28].map((a) => [a, +((g[a] ?? [0]).reduce((x, y) => x + y, 0) / (g[a]?.length || 1)).toFixed(2)]));
  out[path] = { endMedian: q(ends, 0.5), endMax: Math.max(...ends), reach35: +(ends.filter((e) => e >= 35).length / N).toFixed(3), le32: +(ends.filter((e) => e <= 32).length / N).toFixed(3), peakAgeMedian: q(peakAge, 0.5), peakSd: +sd(peaks).toFixed(2), growth };
}
// weak Pro cohort
const wp: number[] = [];
for (let i = 0; i < 300; i++) { const job = openCareerSim({ name: "M", role: roles[i % 5], nationality: "ITA", number: 23, path: paths[i % 3], seed: 830000 + i, engineVersion: V, difficulty: "pro", draft: "worst", potential: 66 }); for (let k = 0; k < 5000 && !advanceCareerSim(job); k++); wp.push(Math.max(...job.s.seasonHistory.map((r) => displayOverall(r.overall)))); }
out.weakPro = { median: q(wp, 0.5), sd: +sd(wp).toFixed(2), min: Math.min(...wp), max: Math.max(...wp) };
console.log(JSON.stringify(out));
