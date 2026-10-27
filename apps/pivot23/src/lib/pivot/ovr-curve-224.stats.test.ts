/* 2.24 OVR career curve (OVR_CURVE_SINCE). Measured targets, not tuned in the test: if one fails after an
   engine change, report the new value instead of moving the threshold. 2.23 is replayed on the same seeds
   as the baseline for the "within ±1" and "less concentrated at 36" checks. */
import assert from "node:assert/strict";
import test from "node:test";
import { careerBust } from "./bust.ts";
import { advanceCareerSim, openCareerSim, playCareerSim } from "./engine.ts";
import { careerEndAge, displayOverall } from "./peak.ts";
import { SIM } from "./config.ts";

const V24 = "2.24.0-beta", V23 = "2.23.0-beta";
const ROLES = ["PG", "SG", "SF", "PF", "C"] as const;
const PATHS = ["NCAA", "Europa", "G-League"] as const;
type Row = { age: number; ovr: number; per: number };
type Cohort = { careers: Row[][]; ends: number[] };

function cohort(version: string, opts: Record<string, unknown>, n = 250, base = 730000): Cohort {
  const careers: Row[][] = [], ends: number[] = [];
  for (let i = 0; i < n; i++) {
    const job = openCareerSim({ name: "M", role: ROLES[i % 5], nationality: "ITA", number: 23, path: PATHS[i % 3],
      seed: base + i, engineVersion: version, ...opts } as never);
    for (let k = 0; k < 5000 && !advanceCareerSim(job); k++);
    careers.push(job.s.seasonHistory.map((r) => ({ age: r.age, ovr: displayOverall(r.overall), per: r.per })));
    ends.push(careerEndAge(job.s));
  }
  return { careers, ends };
}
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2; };
function corr(xs: number[], ys: number[]) {
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let sxy = 0, sxx = 0, syy = 0;
  xs.forEach((x, i) => { const dx = x - mx, dy = ys[i]! - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; });
  return sxy / Math.sqrt(sxx * syy);
}
function metrics(c: Cohort) {
  let dec = 0, minus1 = 0, early = 0;
  const peaks: number[] = [], ovr: number[] = [], per: number[] = [];
  for (const rows of c.careers) {
    let best = rows[0]!;
    rows.forEach((r, i) => {
      if (r.ovr > best.ovr) best = r;
      ovr.push(r.ovr); per.push(r.per);
      if (i > 0 && r.age >= 30) { dec++; if (r.ovr - rows[i - 1]!.ovr === -1) minus1++; }
    });
    peaks.push(best.ovr);
    if (best.age <= 23) early++;
  }
  return { minus1: minus1 / dec, early: early / c.careers.length, corrPer: corr(ovr, per), peak: median(peaks),
    end36: c.ends.filter((a) => a === SIM.overall.maxAge).length / c.ends.length, maxEnd: Math.max(...c.ends) };
}

for (const difficulty of ["esordio", "pro", "allstar", "leggenda"] as const)
test(`2.24 curve (${difficulty}, 250 careers): varied decline, no early peak, PER decoupled, same peak, spread exits, 36 max`, () => {
  const a = metrics(cohort(V24, { difficulty, draft: "random" }));
  const b = metrics(cohort(V23, { difficulty, draft: "random" }));
  console.log(difficulty, "2.24", a, "2.23", b);
  assert.ok(a.minus1 < 0.35, `exact -1 after 30: ${a.minus1}`);
  assert.ok(a.early < 0.05, `peak by 23: ${a.early}`);
  assert.ok(a.corrPer < 0.95, `corr OVR-PER: ${a.corrPer}`);
  assert.ok(Math.abs(a.peak - b.peak) <= 1, `median peak ${a.peak} vs 2.23 ${b.peak}`);
  assert.ok(a.end36 < b.end36, `share ending at 36: ${a.end36} vs 2.23 ${b.end36}`);
  assert.ok(a.maxEnd <= SIM.overall.maxAge, `career past ${SIM.overall.maxAge}: ${a.maxEnd}`);
});

for (const [label, opts] of [["strong", { difficulty: "pro", draft: "best", potential: 97 }], ["weak", { difficulty: "pro", draft: "worst", potential: 66 }]] as const)
test(`2.24 curve (${label} Pro, 250 careers): varied decline, no early peak, 36 max`, () => {
  const a = metrics(cohort(V24, opts));
  console.log(label, "2.24", a);
  assert.ok(a.minus1 < 0.35, `exact -1 after 30: ${a.minus1}`);
  assert.ok(a.early < 0.05, `peak by 23: ${a.early}`);
  assert.ok(a.corrPer < 0.95, `corr OVR-PER: ${a.corrPer}`);
  assert.ok(a.maxEnd <= SIM.overall.maxAge);
});

test("2.24 Pro bust rate lands in 12–18% (1,000 P0-LIFE careers)", () => {
  let busts = 0;
  for (let i = 0; i < 1000; i++) {
    const s = playCareerSim({ name: "P0-LIFE", role: ROLES[i % 5], nationality: "ITA", number: 23, difficulty: "pro",
      path: PATHS[i % 3], seed: (i + 1) * 1000 + 17, draft: "random", engineVersion: V24 });
    if (careerBust(s).bust) busts++;
  }
  assert.ok(busts / 1000 >= 0.12 && busts / 1000 <= 0.18, `Pro bust ${busts / 1000}`);
});

test("2.24 D-08 bust 10–15% (1,200 careers) and D-23 DPOY streak ≤5 (300 Esordio)", () => {
  let busts = 0, n = 0, maxRun = 0;
  for (const [difficulty, base] of [["esordio", 100000], ["pro", 200000], ["allstar", 300000], ["leggenda", 400000]] as const)
    for (let i = 0; i < 300; i++, n++) {
      const s = playCareerSim({ name: "Misura", role: ROLES[i % 5], nationality: "ITA", number: 23, difficulty,
        path: PATHS[i % 3], seed: base + i, draft: "random", engineVersion: V24 });
      if (careerBust(s).bust) busts++;
      if (difficulty !== "esordio") continue;
      let run = 0, prev = -9;
      for (const r of s.seasonHistory) {
        if (!r.awards.includes("DPOY")) continue;
        run = r.season === prev + 1 ? run + 1 : 1; prev = r.season; maxRun = Math.max(maxRun, run);
      }
    }
  assert.ok(busts / n >= 0.1 && busts / n <= 0.15, `D-08 bust ${busts / n}`);
  assert.ok(maxRun <= 5, `max DPOY streak ${maxRun}`);
});
