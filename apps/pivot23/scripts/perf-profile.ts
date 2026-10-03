/**
 * Phase F: engine cost and save size, measured in Node (V8) on the shipped defaults.
 *   node --import=tsx scripts/perf-profile.ts [careers=300]
 * Prints JSON: per-season and per-career timings, heap, longest single advance step,
 * live-save and archive sizes, and a determinism hash of every career (compare before/after).
 */
import { createHash } from "node:crypto";
import { ARCHIVE_LIMIT, advanceCareerSim, openCareerSim, toArchive } from "../src/lib/pivot/engine.ts";
import { buildLiveSave } from "../src/lib/pivot/save.ts";

const N = Number(process.argv[2] ?? 300);
const diffs = ["esordio", "pro", "allstar", "leggenda"] as const;
const careerMs: number[] = [];
const stepMs: number[] = [];
const seasons: number[] = [];
const liveBytes: number[] = [];
const archiveBytes: number[] = [];
const hash = createHash("sha256");
let worstStep = 0;
const heap0 = process.memoryUsage().heapUsed;
let heapPeak = heap0;
const archive = [];
for (let i = 0; i < N; i++) {
  const t0 = performance.now();
  const job = openCareerSim({ name: `Perf ${i}`, seed: 9000 + i, difficulty: diffs[i % 4], draft: "random" });
  let done = false;
  while (!done) {
    const s0 = performance.now();
    done = advanceCareerSim(job);
    const d = performance.now() - s0;
    stepMs.push(d);
    worstStep = Math.max(worstStep, d);
  }
  careerMs.push(performance.now() - t0);
  const s = job.s;
  seasons.push(s.seasonHistory.length);
  hash.update(JSON.stringify([s.seasonHistory.map((r) => [r.age, r.overall, r.ppg, r.teamAbbr, r.awards, r.playoff]), s.usedEventIds, s.choiceLog, s.championLog]));
  const live = JSON.stringify(buildLiveSave(s, { kind: "retire" }, [], "career", "log", 1));
  liveBytes.push(live.length);
  const a = toArchive(s);
  archiveBytes.push(JSON.stringify(a).length);
  archive.unshift(a);
  if (archive.length > ARCHIVE_LIMIT) archive.pop();
  heapPeak = Math.max(heapPeak, process.memoryUsage().heapUsed);
}
const q = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(p * xs.length))]!;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const perSeason = careerMs.map((ms, i) => ms / seasons[i]!);
console.log(
  JSON.stringify(
    {
      careers: N,
      node: process.version,
      careerMs: { mean: +(sum(careerMs) / N).toFixed(2), p50: +q(careerMs, 0.5).toFixed(2), p95: +q(careerMs, 0.95).toFixed(2), max: +Math.max(...careerMs).toFixed(2) },
      seasonMs: { mean: +(sum(perSeason) / N).toFixed(2), p95: +q(perSeason, 0.95).toFixed(2) },
      advanceStepMs: { p95: +q(stepMs, 0.95).toFixed(2), max: +worstStep.toFixed(2), over50: stepMs.filter((x) => x > 50).length },
      seasons: { mean: +(sum(seasons) / N).toFixed(2), max: Math.max(...seasons) },
      liveSaveBytes: { mean: Math.round(sum(liveBytes) / N), max: Math.max(...liveBytes) },
      archiveEntryBytes: { mean: Math.round(sum(archiveBytes) / N), max: Math.max(...archiveBytes) },
      archiveOf8Bytes: JSON.stringify(archive).length,
      worstCaseStorageBytes: Math.max(...liveBytes) + Math.max(...archiveBytes) * ARCHIVE_LIMIT,
      heapMB: { start: +(heap0 / 1e6).toFixed(1), peak: +(heapPeak / 1e6).toFixed(1) },
      hash: hash.digest("hex").slice(0, 16),
    },
    null,
    2,
  ),
);
