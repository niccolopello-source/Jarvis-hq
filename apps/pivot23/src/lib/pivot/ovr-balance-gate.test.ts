import assert from "node:assert/strict";
import test from "node:test";
import ref from "./fixtures/ovr-balance-fp-220.json" with { type: "json" };
import { careerFingerprint, GATE_DIFFS, GATE_SEEDS } from "../../../scripts/version-gate-fingerprints.ts";
import { OVR_GATE_VERSIONS, playCreatedAt } from "../../../scripts/ovr-balance-fingerprints.ts";
import { ENGINE_VERSION, freshPlayer, openCareerSim } from "./engine.ts";
import { DIFF_MAP, potentialShiftOf } from "./difficulty.ts";
import { twilightOf } from "./peak.ts";
import {
  LEGACY_LEGGENDA_POTENTIAL_SHIFT,
  LEGACY_TWILIGHT_BASE_WEAR,
  OVR_BALANCE_LEGGENDA_POTENTIAL_SHIFT,
  OVR_BALANCE_SINCE,
  OVR_BALANCE_TWILIGHT_BASE_WEAR,
  twilightBaseWearOf,
  usesOvrBalance220,
} from "./tuning.ts";

/* OVR balance (engine 2.21.0): careers CREATED on 2.16-2.20 must replay byte-identical to main @ 815b1ad
   (engine 2.20.0-beta, #112 merged). Fixture frozen there with scripts/ovr-balance-fingerprints.ts (40 seeds x 4 difficulties x 5 versions). */
const FP = ref as Record<string, string>;

test("OVR balance fixture covers 800 careers frozen on main @ 815b1ad", () => {
  assert.equal(Object.keys(FP).length, OVR_GATE_VERSIONS.length * GATE_DIFFS.length * GATE_SEEDS.length);
});

for (const v of OVR_GATE_VERSIONS) {
  test(`${v} careers (created as ${v}) replay identical to main @ 815b1ad (160 careers)`, () => {
    const bad: string[] = [];
    for (const d of GATE_DIFFS) for (const seed of GATE_SEEDS) {
      const key = `${v}|${d}|${seed}`;
      if (careerFingerprint(playCreatedAt(seed, d, v)) !== FP[key]) bad.push(key);
    }
    assert.deepEqual(bad, []);
  });
}

test("gate constants and version rule", () => {
  assert.equal(OVR_BALANCE_SINCE, "2.21.0");
  assert.equal(DIFF_MAP.leggenda!.potential, LEGACY_LEGGENDA_POTENTIAL_SHIFT, "the shipped spec keeps -6 for old careers");
  assert.equal(LEGACY_LEGGENDA_POTENTIAL_SHIFT, -6);
  assert.equal(OVR_BALANCE_LEGGENDA_POTENTIAL_SHIFT, -4);
  assert.equal(LEGACY_TWILIGHT_BASE_WEAR, 15.4);
  assert.equal(OVR_BALANCE_TWILIGHT_BASE_WEAR, 11.4);
  for (const v of ["2.20.0-beta", "2.20.0", "2.19.0-beta", "2.19.9", "2.18.0-beta", "2.12.0", "", undefined, "garbage"]) {
    assert.equal(usesOvrBalance220({ engineVersion: v as string }), false, String(v));
    assert.equal(twilightBaseWearOf({ engineVersion: v as string }), 15.4, String(v));
    assert.equal(potentialShiftOf("leggenda", v as string), -6, String(v));
  }
  for (const v of ["2.21.0-beta", "2.21.0", "2.22.0", "3.0.0"]) {
    assert.equal(usesOvrBalance220({ engineVersion: v }), true, v);
    assert.equal(twilightBaseWearOf({ engineVersion: v }), 11.4, v);
    assert.equal(potentialShiftOf("leggenda", v), -4, v);
  }
  for (const d of ["esordio", "pro", "allstar"] as const) {
    for (const v of ["2.20.0-beta", "2.21.0-beta"]) assert.equal(potentialShiftOf(d, v), DIFF_MAP[d]!.potential, `${d} ${v}`);
  }
});

test("new careers are 2.21 and get the Leggenda +2 potential on the same roll", () => {
  // 2.23.0: the running engine moved on; the +2 Leggenda roll is unchanged for 2.21+ careers.
  assert.equal(ENGINE_VERSION, "2.23.0-beta");
  assert.equal(openCareerSim({ seed: 9100 }).s.engineVersion, ENGINE_VERSION);
  let moved = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const a = freshPlayer("A", "PG", "ITA", 1, "leggenda", seed, "2.20.0-beta");
    const b = freshPlayer("A", "PG", "ITA", 1, "leggenda", seed);
    assert.equal(a.engineVersion, b.engineVersion, "freshPlayer stamps the running engine either way");
    const d = Math.round((b.potential - a.potential) * 10) / 10;
    assert.ok(d >= 0 && d <= 2, `seed ${seed}: ${d}`);
    if (d === 2) moved++;
    // Pro is untouched by the gate.
    assert.equal(freshPlayer("A", "PG", "ITA", 1, "pro", seed, "2.20.0-beta").potential, freshPlayer("A", "PG", "ITA", 1, "pro", seed).potential);
  }
  assert.ok(moved > 100, `${moved}/200 move by exactly +2 (the rest sit on the 64 floor)`);
});

test("twilight is 4.0 higher for 2.21 careers unless a clamp binds", () => {
  const s = openCareerSim({ seed: 4242, difficulty: "pro" }).s;
  s.age = 31;
  s.peakOverall = 80;
  s.injuryDrag = 0;
  const old = twilightOf({ ...s, engineVersion: "2.20.0-beta" });
  const neu = twilightOf({ ...s, engineVersion: "2.21.0-beta" });
  assert.ok(neu >= old, `${neu} >= ${old}`);
  assert.ok(neu - old <= 4.0001, `${neu - old}`);
});

test("Option A (2.22): compensated injury bars; 2.19-2.21 keep injuryRetireBars219", async () => {
  const { TUNING, injuryRetireBarsOf } = await import("./tuning.ts");
  for (const d of ["esordio", "pro", "allstar", "leggenda"] as const) {
    for (const v of ["2.19.0-beta", "2.20.0-beta", "2.20.9", "2.21.0-beta", "2.21.9"]) assert.equal(injuryRetireBarsOf({ engineVersion: v, difficulty: d }), TUNING.injuryRetireBars219[d], `${v} ${d}`);
    for (const v of ["2.22.0-beta", "2.22.0", "3.0.0"]) assert.equal(injuryRetireBarsOf({ engineVersion: v, difficulty: d }), TUNING.injuryRetireBars221[d], `${v} ${d}`);
  }
  assert.equal(injuryRetireBarsOf({ engineVersion: "2.22.0-beta" }), TUNING.injuryRetireBars221.pro, "missing difficulty reads as pro");
  // Option A (22 Oct 2026) replaced the A1 values before the stack shipped (now gated at 2.22.0): bars compensate the minimum scar.
  assert.deepEqual(TUNING.injuryRetireBars221, {
    esordio: { ...TUNING.injuryRetireBars219.esordio },
    pro: { 30: 4.5, 31: 3.5, 32: 2.25 },
    allstar: { 30: 5.22, 31: 2.9, 32: 2.61 },
    leggenda: { 30: 10.08, 31: 5.6, 32: 2.8 },
  });
  assert.deepEqual(TUNING.injuryRetireBars219.pro, { 30: 3.6, 31: 2.8, 32: 1.9 });
  assert.deepEqual(TUNING.injuryRetireBars219.allstar, { 30: 3.6, 31: 2.0, 32: 1.7 });
});

test("Option A (2.22): the prudent injury answer leaves the minimum scar; 2.20/2.21 careers keep zero", async () => {
  const { TUNING } = await import("./tuning.ts");
  const { openCareerSim, advanceCareerSim } = await import("./engine.ts");
  const { seedRookieClass } = await import("./league.ts");
  assert.deepEqual(TUNING.injuryScar221, { esordio: 0, pro: 1.2, allstar: 1.2, leggenda: 1.2 });
  // Always answers "Percorso prudente" on injury cards; records the injuryDrag that answer would leave.
  const prudent = (seed: number, v: string) => {
    const job = openCareerSim({ seed, difficulty: "pro", engineVersion: v });
    if (job.s.engineVersion !== v) { job.s.engineVersion = v; job.s.royClass = []; seedRookieClass(job.s); }
    let minDrag = Infinity, cards = 0;
    job.opts.choose = (s, ev, _n, drawn) => {
      const i = ev.choices.findIndex((c) => c.label === "Percorso prudente");
      if (ev.id.startsWith("injury-") && i >= 0) {
        cards++;
        minDrag = Math.min(minDrag, ev.choices[i]!.fx(structuredClone(s)).injuryDrag ?? 0);
        return i;
      }
      return drawn;
    };
    let done = false;
    for (let k = 0; !done && k < 5000; k++) done = advanceCareerSim(job);
    return { cards, minDrag };
  };
  // Strict: each version must actually meet an injury card on some fixed seed (first of 91000 + 13i, i < 200).
  const firstWithCard = (v: string) => {
    for (let i = 0; i < 200; i++) { const r = prudent(91000 + i * 13, v); if (r.cards > 0) return { seed: 91000 + i * 13, ...r }; }
    return { seed: -1, cards: 0, minDrag: Infinity };
  };
  const neu = firstWithCard("2.22.0-beta");
  assert.ok(neu.cards > 0, "no 2.22 career met an injury card");
  assert.ok(neu.minDrag > 0, `2.22 prudent drag ${neu.minDrag} (seed ${neu.seed})`);
  for (const v of ["2.21.0-beta", "2.20.0-beta"]) {
    const old = firstWithCard(v);
    assert.ok(old.cards > 0, `no ${v} career met an injury card`);
    assert.equal(old.minDrag, 0, `${v} prudent drag (seed ${old.seed})`);
  }
});

/* 2.22.0 stack gate (Pello, 22 Oct 2026): 2.21.0-beta is live on main d800528. Careers CREATED as 2.21 must replay
   byte-identical to main. Frozen on main @ d800528 with playCreatedAt(seed, d, "2.21.0-beta") (scripts/ovr-balance-fingerprints.ts). */
test("2.21 careers replay byte-identical to main @ d800528 (stack-fp-221.json, 160 careers)", async () => {
  const { readFileSync } = await import("node:fs");
  const { careerFingerprint } = await import("../../../scripts/version-gate-fingerprints.ts");
  const { playCreatedAt } = await import("../../../scripts/ovr-balance-fingerprints.ts");
  const ref = JSON.parse(readFileSync(new URL("./fixtures/stack-fp-221.json", import.meta.url), "utf8")) as Record<string, string>;
  assert.equal(Object.keys(ref).length, 160);
  for (const [key, fp] of Object.entries(ref)) {
    const [v, d, seed] = key.split("|");
    assert.equal(careerFingerprint(playCreatedAt(Number(seed), d as "pro", v!)), fp, key);
  }
});
