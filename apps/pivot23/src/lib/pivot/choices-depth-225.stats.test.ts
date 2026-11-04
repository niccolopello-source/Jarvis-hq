import test from "node:test";
import assert from "node:assert/strict";
import { advanceCareerSim, openCareerSim, contextualPulse } from "./engine";
import { displayOverall } from "./peak";
import type { PlayerState, StoryEvent } from "./types";

// 2.25 depth (not active): choices, morale, events and traits move OVR measurably but moderately.
// Full 600-career run: scripts/choices-ab.ts 2.25.0 600.
const roles = ["PG", "SG", "SF", "PF", "C"] as const;
const paths = ["NCAA", "Europa", "G-League"] as const;
type Score = (fx: Record<string, unknown>, s: PlayerState) => number;
const pol = (score: Score, sign: 1 | -1) => (s: PlayerState, ev: StoryEvent) => {
  let best = 0;
  let bv = -Infinity;
  ev.choices.forEach((c, i) => {
    const v = sign * score(c.fx(structuredClone(s)) as never, s);
    if (v > bv) { bv = v; best = i; }
  });
  return best;
};
const pulse: Score = (fx, s) => contextualPulse(structuredClone(s), fx as never);
const mood: Score = (fx) => Number(fx.morale ?? 0);

function meanPeak(V: string, choose: (s: PlayerState, ev: StoryEvent) => number, N = 240) {
  let peak = 0;
  for (let i = 0; i < N; i++) {
    const job = openCareerSim({ name: "M", role: roles[i % 5], nationality: "ITA", number: 23, path: paths[i % 3], seed: 910000 + i, engineVersion: V, difficulty: "pro", draft: "random", choose } as never);
    for (let k = 0; k < 5000 && !advanceCareerSim(job); k++);
    peak += Math.max(...job.s.seasonHistory.map((r) => displayOverall(r.overall)));
  }
  return peak / N;
}

test("2.25 best vs worst choices: measurable, plausible peak gap", () => {
  const gap = meanPeak("2.25.0", pol(pulse, 1)) - meanPeak("2.25.0", pol(pulse, -1));
  console.log("2.25 best-worst peak gap", gap.toFixed(2));
  assert.ok(gap >= 1.2 && gap <= 3.5, `gap ${gap}`);
});

test("2.25 high vs low morale choices: measurable, plausible peak gap", () => {
  const gap = meanPeak("2.25.0", pol(mood, 1)) - meanPeak("2.25.0", pol(mood, -1));
  console.log("2.25 morale up-down peak gap", gap.toFixed(2));
  assert.ok(gap >= 0.5 && gap <= 2.5, `gap ${gap}`);
});
