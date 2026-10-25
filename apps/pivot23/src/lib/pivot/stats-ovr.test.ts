/* 2.23.0 (STATS_OVR_SINCE): the OVR starts at 50 and is read from the attributes; every choice moves them. */
import assert from "node:assert/strict";
import test from "node:test";
import { advanceCareerSim, applyChoiceFx, freshPlayer, openCareerSim, refreshOverall, spreadOnAttrs } from "./engine.ts";
import { baseSkillOf, computeOverall, startOverallOf, statsOverall, weightedSkill } from "./peak.ts";
import { createRng, runWithRng } from "./rng.ts";
import { NATIONALITIES } from "./data.ts";
import { STATS_OVR_SINCE, TUNING, usesStatsOvr } from "./tuning.ts";
import type { Role } from "./types.ts";

const ROLES: Role[] = ["PG", "SG", "SF", "PF", "C"];
const V23 = "2.23.0-beta"; // dormant gate: ENGINE_VERSION stays 2.22 until the separate bump PR
const json = (s: unknown) => JSON.stringify({ ...(s as object), careerId: 0 });

test("2.23.0 gate: new careers use the stats OVR, older ones keep the 60 start", () => {
  assert.equal(STATS_OVR_SINCE, "2.23.0");
  assert.ok(usesStatsOvr({ engineVersion: V23 }));
  for (const v of ["2.20.0-beta", "2.21.0-beta", "2.22.0-beta", undefined]) {
    assert.equal(usesStatsOvr({ engineVersion: v }), false, String(v));
    assert.equal(startOverallOf({ engineVersion: v }), 60, String(v));
  }
  assert.equal(startOverallOf({ engineVersion: "2.23.0-beta" }), 50);
});

test("a new player starts at OVR 50 and his attributes read exactly 50, for every role and nationality", () => {
  for (const role of ROLES) for (const nat of NATIONALITIES) {
    const s = freshPlayer("T", role, nat.id, 23, "pro", 7, V23);
    s.engineVersion = V23;
    assert.equal(s.overall, 50, `${role} ${nat.id}`);
    assert.ok(Math.abs(statsOverall(s) - 50) < 1e-9, `${role} ${nat.id} ${statsOverall(s)}`);
    assert.ok(Math.abs(baseSkillOf(s) - weightedSkill(s)) < 1e-9);
  }
});

test("the OVR follows the attributes: more role skill, more OVR; less skill, less OVR", () => {
  const s = openCareerSim({ seed: 2301, role: "SF", difficulty: "pro", engineVersion: V23 }).s;
  s.age = 23;
  s.form = 0;
  s.injuryDrag = 0;
  const base = computeOverall(s);
  const up = structuredClone(s);
  spreadOnAttrs(up, 4, "pulse");
  const down = structuredClone(s);
  spreadOnAttrs(down, -4, "decline");
  assert.ok(computeOverall(up) > base, `${computeOverall(up)} > ${base}`);
  assert.ok(computeOverall(down) < base, `${computeOverall(down)} < ${base}`);
  assert.ok(Math.abs(weightedSkill(up) - weightedSkill(s) - 4) < 1e-6, "spread moves the weighted skill by the asked amount");
});

test("every drawn choice of the draft and of the career moves the attributes", () => {
  let offered = 0;
  let moved = 0;
  const still: string[] = [];
  for (const d of ["esordio", "pro", "allstar", "leggenda"] as const) for (let seed = 1; seed <= 12; seed++) {
    const job = openCareerSim({ seed: 23000 + seed, difficulty: d, role: ROLES[seed % 5], engineVersion: V23 });
    job.opts.choose = (s, ev, _n, drawn) => {
      ev.choices.forEach((ch) => {
        const c = structuredClone(s);
        runWithRng(createRng(1), () => applyChoiceFx(c, ch.fx(c), "probe"));
        offered += 1;
        if (Math.abs(weightedSkill(c) - weightedSkill(s)) >= 0.005) moved += 1;
        else still.push(`${ev.id}:${ch.label}`);
      });
      return drawn;
    };
    for (let k = 0; k < 5000 && !advanceCareerSim(job); k++);
  }
  assert.ok(offered > 300, String(offered));
  assert.ok(moved / offered >= 0.95, `${moved}/${offered}; still: ${still.slice(0, 8).join(", ")}`);
});

test("a choice with any effect moves the attributes on 2.23 and does not on the pre-2.23 rules", () => {
  const fx = { injuryRisk: 2, flavor: "" };
  const s = openCareerSim({ seed: 2302, engineVersion: V23 }).s;
  const a = structuredClone(s);
  applyChoiceFx(a, fx, "t");
  assert.notEqual(weightedSkill(a), weightedSkill(s));
  const old = openCareerSim({ seed: 2302, engineVersion: "2.22.0-beta" }).s;
  const b = structuredClone(old);
  applyChoiceFx(b, fx, "t");
  assert.equal(json(b.attrs), json(old.attrs), "2.22 careers: attributes untouched by a non-attribute effect");
});

test("2.23 careers are deterministic and pre-2.23 careers ignore the stats-OVR knobs", () => {
  const run = (o: object) => { const j = openCareerSim({ seed: 2303, ...o }); for (let k = 0; k < 5000 && !advanceCareerSim(j); k++); return json(j.s); };
  assert.equal(run({ engineVersion: V23 }), run({ engineVersion: V23 }));
  const old = run({ engineVersion: "2.22.0-beta" });
  const keep = { ...TUNING.statsOvr };
  try {
    Object.assign(TUNING.statsOvr, { k: 0.9, pulseToAttrs: 2, start: 40, peakShift: 5 });
    assert.equal(run({ engineVersion: "2.22.0-beta" }), old);
  } finally {
    Object.assign(TUNING.statsOvr, keep);
  }
});

test("option B (lambda 1): refreshOverall reads the attributes, not the choice track", () => {
  const keep = TUNING.statsOvr.lambda;
  try {
    TUNING.statsOvr.lambda = 1;
    const s = openCareerSim({ seed: 2304, engineVersion: V23 }).s;
    s.age = 22;
    const before = refreshOverall(structuredClone(s));
    const t = structuredClone(s);
    t.choiceOvr = s.choiceOvr + 3; // the choice track alone no longer moves the OVR
    assert.equal(refreshOverall(t), before);
  } finally {
    TUNING.statsOvr.lambda = keep;
  }
});

test("option A (default lambda 0.5): half of the OVR comes from the attributes", () => {
  assert.equal(TUNING.statsOvr.lambda, 0.5);
  const s = openCareerSim({ seed: 2305, role: "PG", difficulty: "pro", engineVersion: V23 }).s;
  s.age = 23;
  const up = structuredClone(s);
  spreadOnAttrs(up, 4, "pulse");
  const d = computeOverall(up) - computeOverall(s);
  assert.ok(d > 0 && Math.abs(d - 0.5 * TUNING.statsOvr.k * 4) < 0.05, String(d));
});
