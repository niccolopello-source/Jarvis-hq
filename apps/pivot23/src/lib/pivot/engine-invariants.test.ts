import assert from "node:assert/strict";
import test from "node:test";
import { SIM } from "./config.ts";
import { advanceCareerSim, beginPlayoffs, freshPlayer, openCareerSim, playCareerSim, qualifiesPlayoffs, simulateRegularSeason, type SimOpts } from "./engine.ts";
import { fallbackDraws } from "./rng.ts";
import { RULES, RULES_DEFAULTS, resetRules } from "./rules.ts";
import type { PlayerState } from "./types.ts";

/* Engine audit (PIVOT 23 master cycle 1): seeded randomness, determinism, invariants. */

const DIFFS = ["esordio", "pro", "allstar", "leggenda"] as const;
const PATHS = ["NCAA", "Europa", "G-League"] as const;
const DRAFTS = ["random", "best", "worst", "mixed"] as const;

function optsFor(i: number): SimOpts {
  return { seed: (i * 7919) >>> 0, difficulty: DIFFS[i % 4], path: PATHS[i % 3], draft: DRAFTS[(i >> 2) % 4] };
}

function fingerprint(s: PlayerState) {
  return JSON.stringify([s.seasonHistory, s.choiceLog, s.milestones, s.championLog, s.attrs, s.hidden, s.rngState, s.royClass, s.world?.stars]);
}

test("rule switches default to the shipped engine", () => {
  assert.deepEqual({ ...RULES }, { ...RULES_DEFAULTS });
  assert.equal(RULES.rookieShuffle, "current");
});

test("simulated careers never draw from the unseeded fallback RNG", () => {
  const before = fallbackDraws();
  for (let i = 1; i <= 24; i++) playCareerSim(optsFor(i));
  assert.equal(fallbackDraws() - before, 0);
});

test("the playoff bracket stays on the career seed even when called outside withPlayer", () => {
  const run = () => {
    const job = openCareerSim({ seed: 31337, difficulty: "allstar", path: "NCAA", draft: "best" });
    for (let n = 1; n <= 6; n++) {
      job.s.season = n;
      job.s.rngState = job.rng.getState();
      const row = simulateRegularSeason(job.s, n);
      if (qualifiesPlayoffs(job.s, row)) {
        const before = fallbackDraws();
        const bracket = beginPlayoffs(job.s); // no caller context, as a careless caller would do
        assert.equal(fallbackDraws() - before, 0);
        return JSON.stringify(bracket);
      }
      job.rng.setState(job.s.rngState);
    }
    return "no playoffs";
  };
  assert.equal(run(), run());
});

test("careers advanced in interleaved order equal careers run alone (no shared hidden state)", () => {
  const opts = Array.from({ length: 6 }, (_, i) => optsFor(100 + i));
  const alone = opts.map((o) => fingerprint(playCareerSim(o)));
  const jobs = opts.map((o) => ({ job: openCareerSim(o), done: false }));
  while (jobs.some((j) => !j.done)) {
    for (const j of jobs) if (!j.done) j.done = advanceCareerSim(j.job);
  }
  assert.deepEqual(jobs.map((j) => fingerprint(j.job.s)), alone);
});

/** A stable merge sort with a different comparator call pattern from V8's TimSort (like other engines). */
function withForeignSort<T>(fn: () => T): T {
  const native = Array.prototype.sort;
  function mergeSort<U>(this: U[], cmp?: (a: U, b: U) => number): U[] {
    const compare = cmp ?? ((a: U, b: U) => (String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0));
    const sortRange = (a: U[]): U[] => {
      if (a.length < 2) return a;
      const mid = a.length >> 1;
      const l = sortRange(a.slice(0, mid));
      const r = sortRange(a.slice(mid));
      const out: U[] = [];
      let i = 0;
      let j = 0;
      while (i < l.length && j < r.length) out.push(compare(r[j]!, l[i]!) < 0 ? r[j++]! : l[i++]!);
      return out.concat(l.slice(i), r.slice(j));
    };
    const sorted = sortRange([...this]);
    for (let k = 0; k < sorted.length; k++) this[k] = sorted[k]!;
    return this;
  }
  Object.defineProperty(Array.prototype, "sort", { value: mergeSort, configurable: true, writable: true });
  try {
    return fn();
  } finally {
    Object.defineProperty(Array.prototype, "sort", { value: native, configurable: true, writable: true });
  }
}

test("rookieShuffle: 'current' depends on the engine's sort, 'portable' does not", () => {
  const seeds = Array.from({ length: 8 }, (_, i) => optsFor(300 + i));
  try {
    resetRules();
    const differs = seeds.filter((o) => fingerprint(playCareerSim(o)) !== withForeignSort(() => fingerprint(playCareerSim(o))));
    assert.ok(differs.length > 0, "the shipped shuffle changed outcome under another sort algorithm for at least one seed");
    RULES.rookieShuffle = "portable";
    for (const o of seeds) {
      assert.equal(withForeignSort(() => fingerprint(playCareerSim(o))), fingerprint(playCareerSim(o)), `seed ${o.seed}`);
    }
  } finally {
    resetRules();
  }
});

test("invariants hold across 320 seeded careers (all difficulties, paths and draft policies)", () => {
  const problems: string[] = [];
  const bad = (msg: string) => {
    if (problems.length < 25) problems.push(msg);
  };
  for (let i = 1; i <= 320; i++) {
    const o = optsFor(i);
    const job = openCareerSim(o);
    let steps = 0;
    let done = false;
    while (!done) {
      done = advanceCareerSim(job);
      steps += 1;
      if (steps > 21) {
        bad(`seed ${o.seed}: simulation did not finish in 21 steps`);
        break;
      }
      const active = job.s.world?.stars.filter((x) => !x.retired) ?? [];
      const ids = new Set<string>();
      for (const st of active) {
        if (ids.has(st.id)) bad(`seed ${o.seed}: star ${st.name} on two rosters`);
        ids.add(st.id);
        if (!st.teamAbbr) bad(`seed ${o.seed}: active star ${st.name} without a team`);
        if (!(st.overall >= 0 && st.overall <= 99)) bad(`seed ${o.seed}: star overall ${st.overall}`);
        if (![st.ppg, st.rpg, st.apg, st.gp].every((x) => Number.isFinite(x) && x >= 0)) bad(`seed ${o.seed}: star ${st.name} negative line`);
      }
    }
    const s = job.s;
    const H = s.seasonHistory;
    if (!H.length || H.length > 20) bad(`seed ${o.seed}: ${H.length} seasons`);
    if (s.age > SIM.overall.maxAge + 1) bad(`seed ${o.seed}: age ${s.age}`);
    let firstNba = -1;
    H.forEach((r, k) => {
      const tag = `seed ${o.seed} season ${r.season}`;
      if (r.season !== k + 1) bad(`${tag}: season number skipped or repeated`);
      if (k > 0 && r.age !== H[k - 1]!.age + 1) bad(`${tag}: age did not advance by one`);
      if (k > 0 && r.yearLabel === H[k - 1]!.yearLabel) bad(`${tag}: duplicate year ${r.yearLabel}`);
      for (const f of ["gp", "min", "ppg", "rpg", "apg", "spg", "bpg", "fg", "tp", "ft", "tov", "ts", "wins", "losses", "salaryM"] as const) {
        if (!(Number.isFinite(r[f]) && r[f] >= 0)) bad(`${tag}: ${f}=${r[f]}`);
      }
      if (!(r.overall >= SIM.overall.min && r.overall <= SIM.overall.max)) bad(`${tag}: overall ${r.overall}`);
      const games = r.conf === "Euro" ? SIM.injury.maxGpEuro : SIM.injury.maxGpNba;
      if (r.gp > games) bad(`${tag}: ${r.gp} games played of ${games}`);
      if (r.wins + r.losses !== games) bad(`${tag}: record ${r.wins}-${r.losses} for a ${games}-game season`);
      if (r.min > 48) bad(`${tag}: ${r.min} minutes`);
      if (new Set(r.awards).size !== r.awards.length) bad(`${tag}: duplicate award ${r.awards}`);
      if (r.awards.filter((a) => a.startsWith("All-NBA")).length > 1) bad(`${tag}: two All-NBA teams`);
      if (r.conf === "Euro" && r.awards.length) bad(`${tag}: NBA award in a EuroLeague season ${r.awards}`);
      if (r.conf !== "Euro" && firstNba < 0) firstNba = k;
      if (r.awards.includes("Rookie of the Year") && k !== firstNba) bad(`${tag}: ROY outside the rookie season`);
      if (k > 0) {
        const d = r.overall - H[k - 1]!.overall;
        if (Math.abs(d) > SIM.overall.yoyYoung) bad(`${tag}: overall moved ${d} in a year`);
        if (H[k - 1]!.age >= s.apexAge && d > 0) bad(`${tag}: overall rose after the peak age ${s.apexAge}`);
      }
    });
    for (const [k, v] of Object.entries(s.attrs)) if (!(v >= SIM.attr.min && v <= SIM.attr.max)) bad(`seed ${o.seed}: attr ${k}=${v}`);
    for (const [k, v] of Object.entries(s.hidden)) if (!(v >= SIM.hidden.min && v <= SIM.hidden.max)) bad(`seed ${o.seed}: hidden ${k}=${v}`);
    const titles = s.milestones.filter((m) => /Champion$/.test(m.label));
    const champRows = H.filter((r) => r.playoff === "Campione").length;
    if (titles.length !== s.titleCount || champRows !== s.titleCount || s.championLog.filter((c) => c.isPlayer).length !== s.titleCount) {
      bad(`seed ${o.seed}: titles ${s.titleCount} vs milestones ${titles.length}, rows ${champRows}`);
    }
    for (const m of s.milestones.filter((x) => x.label === "Finals MVP")) {
      if (!titles.some((t) => t.season === m.season)) bad(`seed ${o.seed}: Finals MVP without a title in season ${m.season}`);
    }
    if (s.milestones.filter((x) => x.label === "Finals MVP").length !== s.fmvpCount) bad(`seed ${o.seed}: fmvpCount`);
    if (H.filter((r) => r.awards.includes("MVP")).length !== s.mvpCount) bad(`seed ${o.seed}: mvpCount`);
    if (H.filter((r) => r.awards.includes("All-Star")).length !== s.allStarCount) bad(`seed ${o.seed}: allStarCount`);
    if (H.filter((r) => r.awards.includes("DPOY")).length !== s.dpoyCount) bad(`seed ${o.seed}: dpoyCount`);
    const champYears = s.championLog.map((c) => `${c.league}:${c.yearLabel}`);
    if (new Set(champYears).size !== champYears.length) bad(`seed ${o.seed}: two champions in one year`);
    if (Math.round(s.peakOverall) < Math.max(...H.map((r) => r.overall))) bad(`seed ${o.seed}: peak below a season overall`);
  }
  assert.deepEqual(problems, []);
});

test("a fresh player starts inside the attribute and overall bounds on every difficulty", () => {
  for (const d of DIFFS) {
    const p = freshPlayer("Bounds", "C", "Italia", 0, d, 99);
    for (const v of Object.values(p.attrs)) assert.ok(v >= SIM.attr.min && v <= SIM.attr.max);
    for (const v of Object.values(p.hidden)) assert.ok(v >= SIM.hidden.min && v <= SIM.hidden.max);
  }
});
