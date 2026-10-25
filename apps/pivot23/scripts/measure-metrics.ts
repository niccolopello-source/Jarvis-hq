/**
 * Engine metrics re-measure (read-only, no tuning change). Run from apps/pivot23:
 *   node --import=tsx scripts/measure-metrics.ts <seedBase> <count> <out.json>
 * Careers: current ENGINE_VERSION, role i%5, path i%3, draft "random", seeds seedBase..seedBase+count-1,
 * 4 difficulties x 2 choice policies:
 *   random  = engine sim default (drawn choice on every card).
 *   prudent = "Percorso prudente" whenever an injury card offers it; drawn choice otherwise.
 * Metrics: displayed peak OVR median (max season-row OVR), age of that peak (median, first max),
 * last season played at 29-32 per 1000, share of careers touching the 48 OVR floor (any season row <= 48).
 * Intervals: Wilson 95% for proportions; distribution-free 95% CI for medians (binomial order statistics).
 */
import { writeFileSync } from "node:fs";
import { advanceCareerSim, openCareerSim } from "../src/lib/pivot/engine";
import { ENGINE_VERSION } from "../src/lib/pivot/config";
import { careerEndAge, displayOverall } from "../src/lib/pivot/peak";

const [baseArg = "910000", countArg = "1000", out = "metrics.json"] = process.argv.slice(2);
const base = Number(baseArg), count = Number(countArg);
const roles = ["PG", "SG", "SF", "PF", "C"] as const;
const paths = ["NCAA", "Europa", "G-League"] as const;
const z = 1.96;
const wilson = (k: number, n: number) => {
  const p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d;
  return [+(c - h).toFixed(4), +(c + h).toFixed(4)];
};
const medianCi = (xs: number[]) => {
  const a = [...xs].sort((x, y) => x - y), n = a.length;
  const lo = Math.max(0, Math.floor(n / 2 - z * Math.sqrt(n) / 2)), hi = Math.min(n - 1, Math.ceil(n / 2 + z * Math.sqrt(n) / 2));
  return { median: a[Math.floor((n - 1) / 2)]!, ci95: [a[lo]!, a[hi]!] };
};
const result: Record<string, unknown> = { engine: ENGINE_VERSION, seedBase: base, count };
for (const policy of ["random", "prudent"] as const) for (const d of ["esordio", "pro", "allstar", "leggenda"] as const) {
  const peaks: number[] = [], peakAges: number[] = [];
  let early = 0, floor = 0, injuryCards = 0;
  for (let i = 0; i < count; i++) {
    const job = openCareerSim({ name: "Misura", role: roles[i % 5], nationality: "ITA", number: 23, difficulty: d, path: paths[i % 3], seed: base + i, draft: "random" });
    if (policy === "prudent") job.opts.choose = (_s, ev, _n, drawn) => {
      const k = ev.choices.findIndex((c) => c.label === "Percorso prudente");
      if (k >= 0) { injuryCards++; return k; }
      return drawn;
    };
    for (let k = 0; k < 5000 && !advanceCareerSim(job); k++);
    const rows = job.s.seasonHistory;
    let best = -1, bestAge = 0;
    for (const r of rows) { const o = displayOverall(r.overall); if (o > best) { best = o; bestAge = r.age; } if (o <= 48) { floor++; break; } }
    for (const r of rows) { const o = displayOverall(r.overall); if (o > best) { best = o; bestAge = r.age; } }
    peaks.push(best); peakAges.push(bestAge);
    const end = careerEndAge(job.s);
    if (end >= 29 && end <= 32) early++;
  }
  result[`${policy}/${d}`] = {
    peak: medianCi(peaks), peakAge: medianCi(peakAges),
    lastSeason29to32_per1000: Math.round(early / count * 1000), lastSeason29to32_wilson95_per1000: wilson(early, count).map((x) => Math.round(x * 1000)),
    touchesFloor48: +(floor / count).toFixed(4), touchesFloor48_wilson95: wilson(floor, count),
    prudentChoicesTaken: policy === "prudent" ? injuryCards : undefined,
  };
}
writeFileSync(out, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
