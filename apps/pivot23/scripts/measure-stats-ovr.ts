/**
 * Engine metrics re-measure (read-only, no tuning change). Run from apps/pivot23:
 *   node --import=tsx scripts/measure-stats-ovr.ts <seedBase> <count> <out.json>
 * Careers: current ENGINE_VERSION, role i%5, path i%3, draft "random", seeds seedBase..seedBase+count-1,
 * 4 difficulties x 2 choice policies:
 *   random  = engine sim default (drawn choice on every card).
 *   prudent = "Percorso prudente" whenever an injury card offers it; drawn choice otherwise.
 * Metrics: displayed peak OVR median (max season-row OVR), age of that peak (median, first max),
 * last season played at 29-32 per 1000, share of careers touching the 48 OVR floor (any season row <= 48).
 * 2.23 additions: ENGINE=<version> (default ENGINE_VERSION), TUNE='{"lambda":0.5,...}' overrides TUNING.statsOvr;
 * share of offered choice options whose effect moves the attributes (probe on a clone, isolated RNG);
 * Pearson correlation between yearly change of the weighted role skill and yearly change of the OVR.
 * Intervals: Wilson 95% for proportions; distribution-free 95% CI for medians (binomial order statistics).
 */
import { writeFileSync } from "node:fs";
import { advanceCareerSim, applyChoiceFx, openCareerSim } from "../src/lib/pivot/engine";
import { createRng, runWithRng } from "../src/lib/pivot/rng";
import { TUNING } from "../src/lib/pivot/tuning";
import { weightedSkill } from "../src/lib/pivot/peak";
import { ENGINE_VERSION } from "../src/lib/pivot/config";
import { careerEndAge, displayOverall } from "../src/lib/pivot/peak";
import type { PlayerState } from "../src/lib/pivot/types";

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
const engine = process.env.ENGINE || ENGINE_VERSION;
if (process.env.TUNE) Object.assign(TUNING.statsOvr, JSON.parse(process.env.TUNE));
const result: Record<string, unknown> = { engine, statsOvr: { ...TUNING.statsOvr }, seedBase: base, count };
const pearson = (xs: number[], ys: number[]) => {
  const n = xs.length; if (n < 3) return NaN;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i]! - mx, dy = ys[i]! - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  return +(sxy / Math.sqrt(sxx * syy)).toFixed(4);
};
for (const policy of ["random", "prudent"] as const) for (const d of ["esordio", "pro", "allstar", "leggenda"] as const) {
  const peaks: number[] = [], peakAges: number[] = [];
  let early = 0, floor = 0, injuryCards = 0, offered = 0, moving = 0, picked = 0, pickedMoving = 0;
  const dSkill: number[] = [], dOvr: number[] = [];
  const probe = (s: PlayerState, ch: { fx: (s: PlayerState) => Parameters<typeof applyChoiceFx>[1] }) => {
    const c = structuredClone(s);
    runWithRng(createRng(7), () => applyChoiceFx(c, ch.fx(c), "probe"));
    return Math.abs(weightedSkill(c) - weightedSkill(s)) >= 0.005;
  };
  for (let i = 0; i < count; i++) {
    const job = openCareerSim({ name: "Misura", role: roles[i % 5], nationality: "ITA", number: 23, difficulty: d, path: paths[i % 3], seed: base + i, draft: "random", engineVersion: engine });
    const sample = i % 10 === 0; // probe 1 career in 10 (cost); same seeds every run
    job.opts.choose = (s, ev, _n, drawn) => {
      let k = drawn;
      if (policy === "prudent") { const p = ev.choices.findIndex((c) => c.label === "Percorso prudente"); if (p >= 0) { injuryCards++; k = p; } }
      if (sample) ev.choices.forEach((ch, j) => { const m = probe(s, ch); offered++; if (m) moving++; if (j === k) { picked++; if (m) pickedMoving++; } });
      return k;
    };
    let lastAge = job.s.age, lastW = weightedSkill(job.s), lastO = job.s.overall;
    for (let k = 0; k < 5000 && !advanceCareerSim(job); k++) {
      if (job.s.age !== lastAge && job.s.seasonHistory.length) {
        const w = weightedSkill(job.s), o = job.s.overall;
        dSkill.push(w - lastW); dOvr.push(o - lastO); lastAge = job.s.age; lastW = w; lastO = o;
      }
    }
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
    choiceOptionsMovingStats: offered ? +(moving / offered).toFixed(4) : null, choiceOptionsProbed: offered,
    pickedChoicesMovingStats: picked ? +(pickedMoving / picked).toFixed(4) : null,
    corrYearlySkillVsOvr: pearson(dSkill, dOvr),
    prudentChoicesTaken: policy === "prudent" ? injuryCards : undefined,
  };
}
writeFileSync(out, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
