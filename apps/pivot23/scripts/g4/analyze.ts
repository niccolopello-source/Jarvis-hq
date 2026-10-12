/**
 * G4 engine science — aggregator. Reads collector JSONL files, writes one JSON with every metric.
 * Usage: node --import=tsx scripts/g4/analyze.ts <tag> <out.json> <file.jsonl>...
 * Proportions carry Wilson 95% CIs; means carry normal-approximation 95% CIs.
 */
import { readFileSync, writeFileSync } from "node:fs";

type Row = [number, number, string, number, number, number, number, number, number, number, string, string];
interface C { i: number; seed: number; d: string; role: string; path: string; ev: string; pot: number; peak: number; apexAge: number;
  obsPeakAge: number; endAge: number; age: number; startAge: number; signal: string | null; extra: boolean; injuryDrag: number; pick: number;
  as: number; an: number; mvp: number; dpoy: number; roy: boolean; titles: number; script: number[]; events: string[]; choices: string[];
  rows: Row[]; champs: [string, string, string, number, number][]; fp: string; error?: string }

const [tag, out, ...files] = process.argv.slice(2);
const all: C[] = files.flatMap((f) => readFileSync(f, "utf8").trim().split("\n").map((l) => JSON.parse(l)));
const errs = all.filter((c) => c.error).length;
const cs = all.filter((c) => !c.error);

const r1 = (x: number, k = 1) => +x.toFixed(k);
function wilson(k: number, n: number) {
  if (!n) return { k, n, pct: null, lo: null, hi: null };
  const z = 1.96, p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return { k, n, pct: r1(100 * p), lo: r1(100 * (c - m) / d), hi: r1(100 * (c + m) / d), small: n < 30 || undefined };
}
function stats(xs: number[]) {
  const v = [...xs].sort((a, b) => a - b), n = v.length;
  if (!n) return { n: 0 };
  const mean = v.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1));
  const q = (p: number) => v[Math.min(n - 1, Math.floor(p * n))]!;
  return { n, mean: r1(mean, 2), ci: [r1(mean - 1.96 * sd / Math.sqrt(n), 2), r1(mean + 1.96 * sd / Math.sqrt(n), 2)], sd: r1(sd, 2),
    min: v[0], p10: q(0.1), p25: q(0.25), median: q(0.5), p75: q(0.75), p90: q(0.9), max: v[n - 1], small: n < 30 || undefined };
}
const hist = (xs: (number | string)[]) => Object.fromEntries([...xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map()).entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)));
const group = <T,>(xs: T[], f: (x: T) => string) => xs.reduce((m, x) => { const k = f(x); (m[k] ??= []).push(x); return m; }, {} as Record<string, T[]>);
function gini(xs: number[]) { const v = [...xs].sort((a, b) => a - b), n = v.length, s = v.reduce((a, b) => a + b, 0); if (!s) return 0; let a = 0; v.forEach((x, i) => (a += (2 * (i + 1) - n - 1) * x)); return a / (n * s); }

const R: Record<string, unknown> = { tag, files, careers: all.length, errors: errs, engineVersions: hist(cs.map((c) => c.ev)), byDifficulty: hist(cs.map((c) => c.d)) };
const pro = cs.filter((c) => c.d === "pro");
const gate1000 = pro.filter((c) => c.i < 1000);

// 1. P0-LIFE
function life(xs: C[]) {
  const n = xs.length;
  const coh = {
    endAgeEqualsLastRow: wilson(xs.filter((c) => c.endAge === c.rows.at(-1)?.[1]).length, n),
    stateAgeMinusEndAge: hist(xs.map((c) => c.age - c.endAge)),
    extraWithout36Row: xs.filter((c) => c.extra && !c.rows.some((r) => r[1] === 36)).map((c) => c.seed).slice(0, 10),
    row36WithoutExtra: xs.filter((c) => !c.extra && c.rows.some((r) => r[1] === 36)).map((c) => c.seed).slice(0, 10),
    rowsPast36: xs.filter((c) => c.rows.some((r) => r[1] > 36)).map((c) => c.seed).slice(0, 10),
    duplicateAges: xs.filter((c) => new Set(c.rows.map((r) => r[1])).size !== c.rows.length).map((c) => c.seed).slice(0, 10),
    ageGaps: xs.filter((c) => c.rows.some((r, k) => k > 0 && r[1] !== c.rows[k - 1]![1] + 1)).map((c) => c.seed).slice(0, 10),
    reached35NoOfferNoSignal: xs.filter((c) => c.endAge === 35 && c.signal === null && !c.extra).map((c) => c.seed).slice(0, 10),
  };
  const early = xs.filter((c) => c.endAge < 34);
  return {
    n, endAgeHist: hist(xs.map((c) => c.endAge)),
    endBefore34: wilson(early.length, n),
    reach34: wilson(xs.filter((c) => c.endAge >= 34).length, n), reach35: wilson(xs.filter((c) => c.endAge >= 35).length, n),
    reach36: wilson(xs.filter((c) => c.endAge >= 36).length, n),
    apexAssigned26to28: wilson(xs.filter((c) => c.apexAge >= 26 && c.apexAge <= 28).length, n),
    observedPeakAgeHist: hist(xs.map((c) => c.obsPeakAge)),
    observedPeak26to28: wilson(xs.filter((c) => c.obsPeakAge >= 26 && c.obsPeakAge <= 28).length, n),
    signals: hist(xs.map((c) => String(c.signal))),
    earlyBySignal: hist(early.map((c) => String(c.signal))),
    earlyUnexplained: early.filter((c) => !(c.injuryDrag >= 2.5 || (c.rows.at(-1)?.[6] ?? 99) <= 11.5)).map((c) => c.seed).slice(0, 10),
    seasons: stats(xs.map((c) => c.rows.length)), startAge: hist(xs.map((c) => c.startAge)),
    coherence: coh,
  };
}
R.p0life = { gate1000: life(gate1000), pro4000: life(pro), byChunk: Object.fromEntries(Object.entries(group(pro, (c) => String(Math.floor(c.i / 1000)))).map(([k, v]) => [k, wilson(v.filter((c) => c.endAge < 34).length, v.length)])),
  byDifficulty: Object.fromEntries(Object.entries(group(cs, (c) => c.d)).map(([k, v]) => [k, { endBefore34: wilson(v.filter((c) => c.endAge < 34).length, v.length), reach36: wilson(v.filter((c) => c.endAge >= 36).length, v.length) }])),
  byPath: Object.fromEntries(Object.entries(group(pro, (c) => c.path)).map(([k, v]) => [k, { endBefore34: wilson(v.filter((c) => c.endAge < 34).length, v.length), startAge: hist(v.map((c) => c.startAge)) }])) };

// 2. D-08
const starter = (c: C) => c.rows.filter((r) => r[3] === 1 && r[6] >= 28 && r[5] >= 50).length;
const bustA = (c: C) => c.pick >= 1 && c.pick <= 30 && c.as === 0 && starter(c) <= 1;
const bustLab = (c: C) => c.pot >= 85 && c.peak <= c.pot - 8;
const band = (p: number) => (p < 70 ? "<70" : p < 75 ? "70-75" : p < 80 ? "75-80" : p < 85 ? "80-85" : "85+");
const pickB = (p: number) => (p <= 0 ? "none" : p <= 14 ? "1-14" : p <= 30 ? "15-30" : p <= 45 ? "31-45" : "46-60");
const primeMin = (c: C) => { const r = c.rows.filter((x) => x[1] >= 25 && x[1] <= 29 && x[3] === 1); return r.length ? r.reduce((a, x) => a + x[6], 0) / r.length : 0; };
function bust(xs: C[]) {
  const n = xs.length, a = xs.filter(bustA);
  return { n, bustA: wilson(a.length, n), labPot85Gap8: wilson(xs.filter(bustLab).length, n), pot85: xs.filter((c) => c.pot >= 85).length,
    labAmongPot85: wilson(xs.filter(bustLab).length, xs.filter((c) => c.pot >= 85).length),
    reachPotential: wilson(xs.filter((c) => c.peak >= c.pot - 1).length, n), gapPotPeak: stats(xs.map((c) => r1(c.pot - c.peak))),
    gapGe3: wilson(xs.filter((c) => c.pot - c.peak >= 3).length, n), peak: stats(xs.map((c) => c.peak)), primeNbaMin: stats(xs.map(primeMin)),
    bustA_opportunity: wilson(a.filter((c) => c.peak >= c.pot - 2).length, a.length), bustA_progression: wilson(a.filter((c) => c.peak < c.pot - 2).length, a.length) };
}
const seg = (xs: C[], f: (c: C) => string) => Object.fromEntries(Object.entries(group(xs, f)).map(([k, v]) => [k, bust(v)]));
R.d08 = { all1200comparable: bust(cs.filter((c) => c.i < 300)), pro: bust(pro), byDifficulty: seg(cs, (c) => c.d), byPotBand: seg(pro, (c) => band(c.pot)), byRole: seg(pro, (c) => c.role),
  byPath: seg(pro, (c) => c.path), byPick: seg(pro, (c) => pickB(c.pick)), byChunk: Object.fromEntries(Object.entries(group(pro, (c) => String(Math.floor(c.i / 1000)))).map(([k, v]) => [k, wilson(v.filter(bustA).length, v.length)])),
  peakByPick: Object.fromEntries(Object.entries(group(pro, (c) => pickB(c.pick))).map(([k, v]) => [k, stats(v.map((c) => c.peak))])) };

// 3. D-09 (one career = one world)
function world(xs: C[], filt: (t: [string, string, string, number, number]) => boolean) {
  const per = new Map<string, number>(); let total = 0; const worldTop: number[] = [], distinct: number[] = [], dyn: number[] = [];
  const era: Record<string, Map<string, number>> = {};
  for (const c of xs) {
    const t = c.champs.filter((x) => x[0] === "NBA" && filt(x)); if (!t.length) continue;
    const m = new Map<string, number>();
    t.forEach((x, k) => { per.set(x[2], (per.get(x[2]) ?? 0) + 1); m.set(x[2], (m.get(x[2]) ?? 0) + 1); total++; const e = k < 5 ? "1-5" : k < 10 ? "6-10" : k < 15 ? "11-15" : "16+"; (era[e] ??= new Map()).set(x[2], (era[e].get(x[2]) ?? 0) + 1); });
    worldTop.push(Math.max(...m.values()) / t.length); distinct.push(m.size);
    let run = 1, best = 1; for (let k = 1; k < t.length; k++) { run = t[k]![2] === t[k - 1]![2] ? run + 1 : 1; best = Math.max(best, run); } dyn.push(best);
  }
  const teams30 = (m: Map<string, number>) => { const v = [...m.values()]; while (v.length < 30) v.push(0); return v; };
  const sorted = [...per].sort((a, b) => b[1] - a[1]);
  return { worlds: xs.length, titles: total, franchisesWithTitle: per.size, gini30: r1(gini(teams30(per)), 3),
    hhi: Math.round(sorted.reduce((a, [, k]) => a + (100 * k / total) ** 2, 0)), top5: sorted.slice(0, 5).map(([t, k]) => `${t} ${r1(100 * k / total)}%`),
    top3Share: r1(100 * sorted.slice(0, 3).reduce((a, [, k]) => a + k, 0) / total), perWorldDistinctChampions: stats(distinct), perWorldTopTeamShare: stats(worldTop.map((x) => r1(100 * x))),
    longestDynasty: stats(dyn), dynastyGe4: wilson(dyn.filter((x) => x >= 4).length, dyn.length),
    byEraGini: Object.fromEntries(Object.entries(era).map(([e, m]) => [e, { titles: [...m.values()].reduce((a, b) => a + b, 0), gini30: r1(gini(teams30(m)), 3), top: [...m].sort((a, b) => b[1] - a[1])[0] }])) };
}
const chunkShares = (xs: C[]) => Object.fromEntries(Object.entries(group(xs, (c) => String(Math.floor(c.i / 1000)))).map(([k, v]) => [k, world(v, (x) => x[3] === 0).top5[0]]));
R.d09 = { proAllTitles: world(pro, () => true), proSimulated: world(pro, (x) => x[3] === 0), proSimulatedExclPlayer: world(pro, (x) => x[3] === 0 && x[4] === 0),
  seededTitlesPerWorld: stats(pro.map((c) => c.champs.filter((x) => x[3] === 1).length)),
  byDifficulty: Object.fromEntries(Object.entries(group(cs, (c) => c.d)).map(([k, v]) => [k, (({ gini30, top5, franchisesWithTitle, longestDynasty }) => ({ gini30, top5: top5.slice(0, 2), franchisesWithTitle, longestDynastyMax: longestDynasty.max, longestDynastyMedian: longestDynasty.median }))(world(v, (x) => x[3] === 0))])),
  topFranchiseByChunk: chunkShares(pro) };

// 4. D-11 / D-23
const awards = (xs: C[]) => hist(xs.flatMap((c) => c.rows.flatMap((r) => (r[10] ? r[10].split("|") : []))));
const streak = (c: C, a: string) => { let run = 0, best = 0, prev = -9; for (const r of c.rows) { if (!r[10].split("|").includes(a)) continue; run = r[0] === prev + 1 ? run + 1 : 1; prev = r[0]; best = Math.max(best, run); } return best; };
function variety(xs: C[]) {
  const sets = xs.map((c) => new Set(c.events)); let jac = 0, pairs = 0;
  for (let k = 0; k + 1 < sets.length && pairs < 3000; k += 1) { const a = sets[k]!, b = sets[(k * 7919 + 13) % sets.length]!; if (a === b) continue; const inter = [...a].filter((x) => b.has(x)).length; jac += inter / (a.size + b.size - inter || 1); pairs++; }
  return { n: xs.length, distinctCalendars: new Set(xs.map((c) => c.script.join("/"))).size, calendarHist: hist(xs.map((c) => c.script.join("/"))),
    distinctEventSequences: new Set(xs.map((c) => c.events.join(","))).size, distinctEventIds: new Set(xs.flatMap((c) => c.events)).size,
    eventsPerCareer: stats(xs.map((c) => c.events.length)), meanPairwiseJaccardEvents: r1(jac / pairs, 3), pairs,
    distinctChoicePaths: new Set(xs.map((c) => c.choices.join("|"))).size };
}
function awardBlock(xs: C[]) {
  const n = xs.length;
  const dp = xs.map((c) => c.dpoy).sort((a, b) => b - a); const totalD = dp.reduce((a, b) => a + b, 0);
  return { n, awardCounts: awards(xs), dpoy: { total: totalD, careersWith: wilson(xs.filter((c) => c.dpoy > 0).length, n), max: dp[0], maxStreak: Math.max(0, ...xs.map((c) => streak(c, "DPOY"))),
      streakHist: hist(xs.map((c) => streak(c, "DPOY")).filter((x) => x > 0)), top1pctShare: totalD ? r1(100 * dp.slice(0, Math.ceil(n / 100)).reduce((a, b) => a + b, 0) / totalD) : 0 },
    mvp: { total: xs.reduce((a, c) => a + c.mvp, 0), max: Math.max(0, ...xs.map((c) => c.mvp)), maxStreak: Math.max(0, ...xs.map((c) => streak(c, "MVP"))) } };
}
function coherence(xs: C[]) {
  const rowsWith = (a: string) => xs.flatMap((c) => c.rows.filter((r) => r[3] === 1 && r[10].split("|").includes(a)));
  const rowsWithout = (a: string) => xs.flatMap((c) => c.rows.filter((r) => r[3] === 1 && r[5] >= 50 && !r[10].split("|").includes(a)));
  const s = (rs: Row[], k: number) => stats(rs.map((r) => r[k] as number));
  const out: Record<string, unknown> = {};
  for (const a of ["MVP", "DPOY", "ROY"]) { const w = rowsWith(a), o = rowsWithout(a); out[a] = { n: w.length, ppgWith: s(w, 7).median, ppgWithout: s(o, 7).median, rpgWith: s(w, 8).median, rpgWithout: s(o, 8).median, ovrWith: s(w, 4).median, ovrWithout: s(o, 4).median, minWith: s(w, 6).median, gpWithMin: Math.min(...w.map((r) => r[5])) }; }
  return out;
}
R.d11d23 = { variety: variety(pro), varietyAllDiff: variety(cs), awardsPro: awardBlock(pro), byDifficulty: Object.fromEntries(Object.entries(group(cs, (c) => c.d)).map(([k, v]) => [k, (({ dpoy, mvp }) => ({ dpoy, mvp }))(awardBlock(v))])),
  dpoyByRole: Object.fromEntries(Object.entries(group(pro, (c) => c.role)).map(([k, v]) => [k, { dpoyTotal: v.reduce((a, c) => a + c.dpoy, 0), careersWith: wilson(v.filter((c) => c.dpoy > 0).length, v.length), maxStreak: Math.max(0, ...v.map((c) => streak(c, "DPOY"))) }])),
  awardStatCoherence: coherence(pro) };

// 5. D-ROLE (NBA seasons, gp >= 20)
function role(xs: C[]) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(group(xs, (c) => c.role))) {
    const rs = v.flatMap((c) => c.rows.filter((r) => r[3] === 1 && r[5] >= 20));
    const per36 = (idx: number) => stats(rs.filter((r) => r[6] >= 10).map((r) => r1(36 * (r[idx] as number) / r[6], 2)));
    out[k] = { careers: v.length, seasons: rs.length, ppg: stats(rs.map((r) => r[7])), rpg: stats(rs.map((r) => r[8])), apg: stats(rs.map((r) => r[9])), min: stats(rs.map((r) => r[6])),
      per36: { pts: per36(7), reb: per36(8), ast: per36(9) },
      byOvr: Object.fromEntries(Object.entries(group(rs, (r) => (r[4] < 70 ? "<70" : r[4] < 80 ? "70-79" : "80+"))).map(([b, x]) => [b, { n: x.length, ppg: stats(x.map((r) => r[7])).median, rpg: stats(x.map((r) => r[8])).median, apg: stats(x.map((r) => r[9])).median }])),
      byMin: Object.fromEntries(Object.entries(group(rs, (r) => (r[6] < 20 ? "<20" : r[6] < 30 ? "20-29" : "30+"))).map(([b, x]) => [b, { n: x.length, ppg: stats(x.map((r) => r[7])).median, rpg: stats(x.map((r) => r[8])).median, apg: stats(x.map((r) => r[9])).median }])) };
  }
  return out;
}
R.drole = { pro: role(pro), byPath: Object.fromEntries(Object.entries(group(pro, (c) => c.path)).map(([k, v]) => [k, Object.fromEntries(Object.entries(role(v)).map(([r, x]) => [r, (({ ppg, rpg, apg }) => ({ ppg: ppg.median, rpg: rpg.median, apg: apg.median }))(x as { ppg: { median?: number }; rpg: { median?: number }; apg: { median?: number } })]))])) };

R.fingerprints = Object.fromEntries(cs.map((c) => [`${c.d}:${c.i}`, c.fp]));
writeFileSync(out, JSON.stringify(R, null, 1));
console.log(`${tag}: ${cs.length} careers, ${errs} errors -> ${out}`);
