import test from "node:test";
import assert from "node:assert/strict";
import { advanceCareerSim, openCareerSim } from "./engine";
import { careerEndAge, displayOverall } from "./peak";
import { ENGINE_VERSION } from "./config";

// 2.25 career shape (not active: ENGINE_VERSION stays 2.24). Full 1500/path run: scripts/ovr-curve-225-summary.ts.
const roles = ["PG", "SG", "SF", "PF", "C"] as const;
const diffs = ["esordio", "pro", "allstar", "leggenda"] as const;
const N = 450;

test("2.25 is not active", () => assert.match(ENGINE_VERSION, /^2\.24\./));

for (const path of ["NCAA", "Europa", "G-League"] as const) {
  test(`2.25 retirement shape (${path})`, () => {
    const ends: number[] = [];
    for (let i = 0; i < N; i++) {
      const job = openCareerSim({ name: "M", role: roles[i % 5], nationality: "ITA", number: 23, path, seed: 730000 + i, engineVersion: "2.25.0", difficulty: diffs[i % 4], draft: "random" });
      for (let k = 0; k < 5000 && !advanceCareerSim(job); k++);
      ends.push(careerEndAge(job.s));
    }
    ends.sort((a, b) => a - b);
    assert.equal(ends[Math.floor(N / 2)], 34, "median retirement age");
    assert.ok(Math.max(...ends) <= 36, "max age 36");
    const r35 = ends.filter((e) => e >= 35).length / N;
    assert.ok(r35 >= 0.28 && r35 <= 0.38, `reach 35 share ${r35}`);
  });
}

test("2.25 weak Pro peaks spread around a soft floor (~62±3)", () => {
  const p: number[] = [];
  for (let i = 0; i < 200; i++) {
    const job = openCareerSim({ name: "M", role: roles[i % 5], nationality: "ITA", number: 23, path: (["NCAA", "Europa", "G-League"] as const)[i % 3], seed: 830000 + i, engineVersion: "2.25.0", difficulty: "pro", draft: "worst", potential: 66 });
    for (let k = 0; k < 5000 && !advanceCareerSim(job); k++);
    p.push(Math.max(...job.s.seasonHistory.map((r) => displayOverall(r.overall))));
  }
  const m = p.reduce((a, b) => a + b, 0) / p.length;
  const sd = Math.sqrt(p.reduce((a, b) => a + (b - m) ** 2, 0) / p.length);
  assert.ok(m >= 60 && m <= 65, `mean ${m}`);
  assert.ok(sd >= 1.2, `sd ${sd}`);
  assert.ok(Math.min(...p) >= 58 && Math.max(...p) <= 66);
});
