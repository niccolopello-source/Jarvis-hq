/* PROCEDURAL DEPTH 1–3 (memory.ts). Every number is measured on real simulated careers. */
import assert from "node:assert/strict";
import test from "node:test";
import { STORY_POOL } from "./data.ts";
import { advanceCareerSim, applyChoiceFx, openCareerSim, pickStoryEvent, playCareerSim, settleCareerMemory, type SimOpts } from "./engine.ts";
import { classifyChoice, contextScore, eventTags, excludedBy, memoryOf, MEMORY_APPLIED_CAP, MEMORY_ITEM_CAP, MEMORY_TRAIL_CAP, newMemory, usesDepth } from "./memory.ts";
import { LEGACY_TAG_ANOMALIES } from "./event-tags.ts";
import { buildLiveSave } from "./save.ts";
import type { PlayerState, StoryEvent } from "./types.ts";

const SEEDS = Array.from({ length: 60 }, (_, i) => 7100 + i * 37);
const DIFFS = ["esordio", "pro", "allstar", "leggenda"] as const;

function play(opts: SimOpts) {
  const job = openCareerSim(opts);
  let done = false;
  let guard = 0;
  while (!done && guard++ < 40) done = advanceCareerSim(job);
  assert.ok(done, "career completes");
  return job.s;
}
/** Full state minus careerId (storage identity, random by design, not an RNG input). */
const versionAtLeastLocal = (v: string) => /^2\.(2[1-9]|[3-9]\d)\./.test(v) || /^[3-9]\./.test(v);
const json = (s: PlayerState) => JSON.stringify({ ...s, careerId: "" });
const fresh = (seed = 9100) => {
  const s = openCareerSim({ seed, depth: true }).s;
  s.season = 3;
  return s;
};
const ALLOWED_FX = new Set(["coachTrust", "injuryRisk", "morale", "form", "development", "publicImage", "rivalry", "hidden"]);

/* ───── Compatibility ───── */

test("2.21+ careers get memory by default; 2.19 / 2.20 careers do not and replay byte-identical", () => {
  const s = openCareerSim({ seed: 9100 }).s;
  assert.ok(versionAtLeastLocal(s.engineVersion), s.engineVersion);
  assert.ok(usesDepth(s), "new careers run the depth layer");
  assert.deepEqual(json(play({ seed: 9100 })), json(play({ seed: 9100, depth: true })));
  for (const v of ["2.19.0-beta", "2.20.0-beta"]) for (const seed of [9100, 9137, 9174]) {
    const old = openCareerSim({ seed, engineVersion: v }).s;
    assert.equal(old.memory, undefined, v);
    assert.equal(json(play({ seed, engineVersion: v })), json(play({ seed, engineVersion: v, depth: false })), `${v} ${seed}`);
  }
});

test("older engine versions never run the layer even if a memory field is present", () => {
  const s = openCareerSim({ seed: 9100, depth: true }).s;
  for (const v of ["2.18.0-beta", "2.19.0-beta", "2.20.0-beta"]) {
    s.engineVersion = v;
    assert.equal(memoryOf(s), null, v);
  }
  s.engineVersion = "2.22.0-beta";
  assert.notEqual(memoryOf(s), null);
  (s as { memory: unknown }).memory = { v: 9, junk: true };
  assert.equal(memoryOf(s), null, "malformed memory falls back to legacy rules");
});

test("an old career without memory resumes and completes (memory removed mid-career)", () => {
  const job = openCareerSim({ seed: 9137, depth: true });
  for (let i = 0; i < 6; i++) advanceCareerSim(job);
  delete job.s.memory;
  let done = false;
  let guard = 0;
  while (!done && guard++ < 30) done = advanceCareerSim(job);
  assert.ok(done);
  assert.ok(job.s.seasonHistory.length >= 6);
});

/* ───── Phase 1: causal memory ───── */

test("a serious injury choice changes the next season through real engine state", () => {
  const injured = fresh();
  applyChoiceFx(injured, { injuryDrag: 4, gamesPenalty: 20, flavor: "" }, "test-injury");
  const item = memoryOf(injured)!.items.find((i) => i.kind === "injury-scar")!;
  assert.equal(item.id, "injury-scar-3");
  assert.equal(item.cause, "test-injury");
  assert.equal(item.season, 3);
  assert.equal(item.status, "open");
  assert.deepEqual(settleCareerMemory(injured, 3), [], "nothing fires in the season of origin");
  const lingering = structuredClone(injured);
  lingering.injuryDrag = 5;
  const healed = structuredClone(injured);
  healed.injuryDrag = 0;
  const t0 = lingering.coachTrust;
  assert.equal(settleCareerMemory(lingering, 4).length, 1);
  settleCareerMemory(healed, 4);
  assert.equal(memoryOf(lingering)!.trail.at(-1)!.branch, "lingering");
  assert.equal(memoryOf(healed)!.trail.at(-1)!.branch, "recovered");
  assert.ok(lingering.coachTrust < t0, "staff trust drops while the injury lingers");
  assert.ok(healed.coachTrust > t0 - 0.001);
  assert.equal(memoryOf(lingering)!.items[0]!.status, "resolved");
});

test("a consequence is applied once: repeated settle, save round-trip and resume", () => {
  const s = fresh();
  applyChoiceFx(s, { injuryRisk: 4, development: 0.6, flavor: "" }, "test-overload");
  settleCareerMemory(s, 4);
  const after = json(s);
  settleCareerMemory(s, 4);
  assert.equal(json(s), after, "second settle in the same season is a no-op");
  const save = buildLiveSave(s, null, [], "career", "log", 1);
  const back = JSON.parse(JSON.stringify(save.player)) as PlayerState;
  settleCareerMemory(back, 4);
  settleCareerMemory(back, 5);
  assert.equal(memoryOf(back)!.trail.length, 1);
  assert.equal(back.injuryRisk, s.injuryRisk);
});

test("memory stays bounded and keeps only decision-relevant facts", () => {
  const s = play({ seed: 9211, depth: true });
  const m = memoryOf(s)!;
  assert.ok(m.items.length <= MEMORY_ITEM_CAP && m.applied.length <= MEMORY_APPLIED_CAP && m.trail.length <= MEMORY_TRAIL_CAP);
  const s2 = fresh();
  for (let i = 0; i < 80; i++) {
    s2.season = i;
    applyChoiceFx(s2, { rivalry: 4, publicImage: 3, injuryRisk: 1, form: 1, flavor: "" }, `spam-${i}`);
    settleCareerMemory(s2, i);
  }
  const m2 = memoryOf(s2)!;
  assert.ok(m2.items.length <= MEMORY_ITEM_CAP, `${m2.items.length}`);
  assert.ok(m2.items.filter((i) => i.status === "open").length <= 6, "one open arc per kind");
  // A trivial choice (no numbers that cross a threshold) records nothing.
  assert.deepEqual(classifyChoice({ form: 0.3, flavor: "" }), []);
});

test("different lives build different memories", () => {
  const trails = new Set(SEEDS.slice(0, 20).map((seed) => JSON.stringify(memoryOf(play({ seed, depth: true }))!.trail.map((t) => `${t.itemId}:${t.branch}`))));
  assert.ok(trails.size >= 15, `${trails.size}/20 distinct causal trails`);
});

test("no arc imposes awards, titles, playoffs or retirement", () => {
  for (const seed of SEEDS.slice(0, 20)) {
    const s = play({ seed, depth: true });
    for (const t of memoryOf(s)!.trail) {
      for (const k of Object.keys(t.fx)) assert.ok(ALLOWED_FX.has(k), `${t.itemId} uses ${k}`);
      for (const v of Object.values(t.fx)) if (typeof v === "number") assert.ok(Math.abs(v) <= 4, `${t.itemId} ${v}`);
    }
  }
  const s = fresh();
  const before = { t: s.titleCount, m: s.mvpCount, a: s.allStarCount, age: s.age, x: s.extraSeason };
  applyChoiceFx(s, { rivalry: 5, publicImage: 4, injuryDrag: 3, flavor: "" }, "t");
  settleCareerMemory(s, 4);
  assert.deepEqual({ t: s.titleCount, m: s.mvpCount, a: s.allStarCount, age: s.age, x: s.extraSeason }, before);
});

/* ───── Phase 2: contextual selection ───── */

const tagged = (tag: string) => STORY_POOL.find((e) => eventTags(e).includes(tag as never) && !eventTags(e).includes("veteran"))!;

test("score is readable: named reasons follow the state", () => {
  const s = fresh();
  const ego = tagged("ego");
  assert.ok(ego, "pool has an ego-themed event");
  s.hidden.ego = 40;
  const low = contextScore(ego, s, []);
  s.hidden.ego = 75;
  const high = contextScore(ego, s, []);
  assert.ok(high.score > low.score);
  assert.ok(high.reasons.includes("ego-high") && !low.reasons.includes("ego-high"));
  const rep = contextScore(ego, s, [eventTags(ego)]);
  assert.ok(rep.reasons.includes("theme-repeat") && rep.score < high.score, "repetition is damped");
});

test("incompatible events are excluded", () => {
  // 2.23.0 (ROOKIE_TAGS_SINCE): the legacy rookie events tagged "veteran" (LEGACY_TAG_ANOMALIES) are no longer
  // excluded for new careers; careers created as 2.22 keep the old exclusion. A true veteran event stays excluded.
  const vet = STORY_POOL.find((e) => eventTags(e).includes("veteran"));
  if (vet) {
    const s = openCareerSim({ seed: 9100, depth: true, engineVersion: "2.22.0-beta" }).s;
    s.season = 3;
    s.age = 22;
    assert.equal(excludedBy(vet, s), "veteran-theme-too-young");
    s.age = 33;
    assert.equal(excludedBy(vet, s), null);
  }
  const trueVet = STORY_POOL.find((e) => eventTags(e).includes("veteran") && !LEGACY_TAG_ANOMALIES.includes(e.id));
  if (trueVet) {
    const s = fresh();
    s.age = 22;
    assert.equal(excludedBy(trueVet, s), "veteran-theme-too-young");
    s.age = 33;
    assert.equal(excludedBy(trueVet, s), null);
  }
  let excluded = 0;
  let youngVet = 0;
  for (const seed of SEEDS.slice(0, 30)) {
    const job = openCareerSim({ seed, depth: true });
    let done = false;
    while (!done) {
      done = advanceCareerSim(job);
      const lp = memoryOf(job.s)!.lastPick;
      if (lp && lp.season === job.s.season) excluded += lp.excluded;
    }
    for (const c of job.s.choiceLog) {
      const e = STORY_POOL.find((p) => p.title === c.title);
      const row = job.s.seasonHistory.find((r) => r.season === c.season);
      if (e && row && eventTags(e).includes("veteran") && !LEGACY_TAG_ANOMALIES.includes(e.id) && row.age < 29) youngVet += 1;
    }
  }
  console.log(`DEPTH exclusions applied: ${excluded}; veteran-themed pool events at age < 29: ${youngVet}`);
  assert.equal(youngVet, 0);
});

test("same seed, different context: the pick changes for verifiable reasons", () => {
  let changed = 0;
  for (const seed of SEEDS) {
    const a = fresh(seed);
    const b = structuredClone(a);
    b.hidden.ego = 85;
    b.coachTrust = 20;
    b.injuryRisk = 70;
    a.hidden.ego = 30;
    a.coachTrust = 80;
    a.injuryRisk = 5;
    a.age = b.age = 25;
    if (pickStoryEvent(a, 3).id !== pickStoryEvent(b, 3).id) changed += 1;
  }
  assert.ok(changed > 0, `${changed}/${SEEDS.length} picks differ`);
  console.log(`DEPTH context flip changes the pick in ${changed}/${SEEDS.length} seeds`);
});

test("reproducible: same seed and input, same career, same memory", () => {
  for (const seed of SEEDS.slice(0, 8)) for (const d of DIFFS) {
    assert.equal(json(play({ seed, difficulty: d, depth: true })), json(play({ seed, difficulty: d, depth: true })));
  }
});

test("rare events stay rare: bounded score and no event dominates the pool", () => {
  const s = fresh();
  for (const e of STORY_POOL) {
    const { score } = contextScore(e, s, []);
    assert.ok(score >= 0.35 && score <= 3.5, `${e.id} ${score}`);
  }
  const count = new Map<string, number>();
  let total = 0;
  for (const d of DIFFS) for (const seed of SEEDS.slice(0, 30)) {
    for (const c of play({ seed, difficulty: d, depth: true }).choiceLog) {
      const e = STORY_POOL.find((p) => p.title === c.title);
      if (!e) continue;
      count.set(e.id, (count.get(e.id) ?? 0) + 1);
      total += 1;
    }
  }
  const top = Math.max(...count.values());
  console.log(`DEPTH pool picks ${total}, distinct ${count.size}/${STORY_POOL.length}, top share ${((100 * top) / total).toFixed(2)}%`);
  assert.ok(top / total < 0.05, "no single pool event above 5% of pool picks");
});

test("difficulty changes risks and opportunities, not stats directly", () => {
  const s = fresh();
  const risky = tagged("injury") ?? tagged("ego");
  const scores = DIFFS.map((d) => {
    s.difficulty = d;
    return contextScore(risky, s, []).score;
  });
  assert.ok(scores[0]! < scores[1]! && scores[1]! < scores[2]! && scores[2]! < scores[3]!, scores.join(","));
  const calm = STORY_POOL.find((e) => eventTags(e).length === 0)!;
  const flat = DIFFS.map((d) => {
    s.difficulty = d;
    return contextScore(calm, s, []).score;
  });
  assert.equal(new Set(flat).size, 1, "a non-risky event does not change with difficulty");
});

test("the engine still produces complete careers on every difficulty", () => {
  for (const d of DIFFS) for (const seed of SEEDS.slice(0, 25)) {
    const s = play({ seed, difficulty: d, depth: true });
    assert.ok(s.seasonHistory.length >= 4 && s.age <= 37, `${d} ${seed}`);
    const seasons = s.seasonHistory.map((r) => r.season);
    assert.deepEqual(seasons, [...seasons].sort((a, b) => a - b), "seasons in order");
  }
});

/* ───── Phase 3 + integrated counterfactuals ───── */

function firstPoolSeason(seed: number, difficulty: (typeof DIFFS)[number] = "pro") {
  let at: { n: number; ev: StoryEvent } | null = null;
  play({ seed, difficulty, depth: true, choose: (_s, ev, n, drawn) => {
    if (!at && STORY_POOL.some((p) => p.id === ev.id) && ev.choices.length >= 2) at = { n, ev };
    return drawn;
  } });
  return at as { n: number; ev: StoryEvent } | null;
}

function counterfactual(seed: number, which: number, difficulty: (typeof DIFFS)[number] = "pro") {
  const at = firstPoolSeason(seed, difficulty);
  if (!at) return null;
  const s = play({ seed, difficulty, depth: true, choose: (_s, ev, n, drawn) => (n === at.n && ev.id === at.ev.id ? which : drawn) });
  return { at, s };
}

test("counterfactual: one choice changed, immediate and later effects differ; log matches", () => {
  let immediate = 0;
  let later = 0;
  let n = 0;
  for (const seed of SEEDS.slice(0, 30)) {
    const a = counterfactual(seed, 0);
    const b = counterfactual(seed, 1);
    if (!a || !b) continue;
    n += 1;
    const ev = a.at.ev;
    const fa = JSON.stringify(ev.choices[0]!.fx(a.s));
    const fb = JSON.stringify(ev.choices[1]!.fx(b.s));
    if (fa !== fb) immediate += 1;
    const later0 = memoryOf(a.s)!.trail.filter((t) => t.season > a.at.n).map((t) => t.itemId + t.branch).join();
    const later1 = memoryOf(b.s)!.trail.filter((t) => t.season > b.at.n).map((t) => t.itemId + t.branch).join();
    if (later0 !== later1 || json(a.s) !== json(b.s)) later += 1;
    // Log coherence: the logged pick is the label of the option actually applied.
    const logA = a.s.choiceLog.find((c) => c.season === a.at.n && c.title === ev.title);
    const logB = b.s.choiceLog.find((c) => c.season === b.at.n && c.title === ev.title);
    assert.equal(logA?.pick, ev.choices[0]!.label);
    assert.equal(logB?.pick, ev.choices[1]!.label);
    // Trail coherence: every applied consequence has its applied key and a visible note.
    for (const s of [a.s, b.s]) for (const t of memoryOf(s)!.trail) {
      assert.ok(memoryOf(s)!.applied.some((k) => k.startsWith(`${t.itemId}@${t.branch}#`)), t.itemId);
    }
  }
  console.log(`DEPTH counterfactual: ${n} careers, immediate fx differ ${immediate}, later seasons differ ${later}`);
  assert.ok(n >= 20 && immediate >= n * 0.9 && later >= n * 0.5);
});

test("counterfactual: no option is always the best one", () => {
  let wins0 = 0;
  let wins1 = 0;
  for (const d of DIFFS) for (const seed of SEEDS.slice(0, 20)) {
    const a = counterfactual(seed, 0, d);
    const b = counterfactual(seed, 1, d);
    if (!a || !b) continue;
    if (a.s.peakOverall > b.s.peakOverall) wins0 += 1;
    if (b.s.peakOverall > a.s.peakOverall) wins1 += 1;
  }
  console.log(`DEPTH dominance: option0 better ${wins0}, option1 better ${wins1}`);
  assert.ok(wins0 > 0 && wins1 > 0);
});

test("deferred consequences depend on the starting state, not only on the option", () => {
  const fx = { injuryRisk: 4, development: 0.6, flavor: "" };
  const tough = fresh();
  tough.hidden.durability = 70;
  tough.injuryDrag = 0;
  const fragile = structuredClone(tough);
  fragile.hidden.durability = 40;
  applyChoiceFx(tough, fx, "x");
  applyChoiceFx(fragile, fx, "x");
  settleCareerMemory(tough, 4);
  settleCareerMemory(fragile, 4);
  assert.equal(memoryOf(tough)!.trail[0]!.branch, "payoff");
  assert.equal(memoryOf(fragile)!.trail[0]!.branch, "wear");
});

test("difficulties differ without forcing outcomes", () => {
  const titles: number[] = [];
  for (const d of DIFFS) {
    let t = 0;
    for (const seed of SEEDS.slice(0, 25)) t += play({ seed, difficulty: d, depth: true }).titleCount;
    titles.push(t);
  }
  console.log(`DEPTH titles per difficulty (25 careers each): ${titles.join(" / ")}`);
  assert.ok(new Set(titles).size > 1);
  assert.ok(titles.every((t) => t < 25 * 6), "no difficulty hands out titles");
});

test("memory helper: newMemory is the empty compact shape", () => {
  assert.deepEqual(newMemory(), { v: 1, items: [], applied: [], trail: [] });
  assert.ok(playCareerSim({ seed: 1 }).memory !== undefined);
  assert.ok(playCareerSim({ seed: 1, depth: false }).memory === undefined);
});
