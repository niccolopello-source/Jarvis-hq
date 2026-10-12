import assert from "node:assert/strict";
import test from "node:test";
import { careerEndAge, playCareerSim } from "./engine";
import { careerEndingSignal } from "./peak";
import { bustDiagnosis, extraYearVoided } from "./career-coherence";

function histOf(xs: number[]) {
  const m = new Map<number, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
}

/*
 * Statistical engine checks moved verbatim from engine.test.ts (D-22): together they take ~250 s,
 * so they run as their own CI job in parallel with the fast suite (and nightly), not less often.
 * Run locally with `pnpm test:stats`; `pnpm test:all` runs everything.
 */

test("1,000 Pro careers meet the P0-LIFE age distribution without changing the peak window", () => {
  const careers = Array.from({ length: 1000 }, (_, i) =>
    playCareerSim({
      name: "P0-LIFE",
      role: (["PG", "SG", "SF", "PF", "C"] as const)[i % 5],
      nationality: "ITA",
      number: 23,
      difficulty: "pro",
      path: (["NCAA", "Europa", "G-League"] as const)[i % 3],
      seed: (i + 1) * 1000 + 17,
      draft: "random",
    }),
  );
  const endingAges = careers.map(careerEndAge);
  const early = careers.filter((career) => careerEndAge(career) < 34);

  assert.ok(early.length >= 150, `${early.length}/1000 ended before age 34`);
  assert.ok(endingAges.some((age) => age === 36), "no career reached age 36");
  assert.ok(endingAges.every((age, i) => age === careers[i]?.seasonHistory.at(-1)?.age),
    "career ending age differs from the last recorded season");
  assert.ok(new Set(endingAges).size > 1, `all careers ended at age ${endingAges[0]}`);
  assert.ok(careers.every((career) => career.apexAge >= 26 && career.apexAge <= 28), "peak age left 26–28");
  assert.ok(early.every((career) => career.injuryDrag >= 2.5 || (career.seasonHistory.at(-1)?.min ?? Number.POSITIVE_INFINITY) <= 11.5));
  // Measured again on main 3bb757 (engine 2.13.0-beta), same seeds. These counts document
  // the current distribution. They are not targets: a retirement or bust change must
  // replace them with a new measurement, not by nudging a constant until they pass.
  assert.deepEqual(
    Object.fromEntries([...histOf(endingAges)].sort((a, b) => Number(a[0]) - Number(b[0]))),
    { 32: 317, 33: 4, 34: 51, 35: 30, 36: 598 },
  );
  assert.equal(endingAges.filter((age) => age < 32).length, 0, "a career ended before the age-33 signal floor");
  const voided = careers.filter(extraYearVoided);
  assert.equal(voided.length, 17, "accepted age-36 seasons that were never played");
  assert.ok(voided.every((career) => careerEndingSignal(career) === "injury"));
  const diagnosed = careers.map(bustDiagnosis);
  assert.equal(diagnosed.filter((d) => d.labMiss).length, 0, "lab progression bust (pot≥85, peak≤pot−8)");
  assert.equal(diagnosed.filter((d) => d.official).length, 141);
  assert.equal(diagnosed.filter((d) => d.kind === "opportunity").length, 128);
  assert.equal(diagnosed.filter((d) => d.kind === "progression").length, 13);
});


test("an already-won MVP or title makes the next one less common on Esordio", () => {
  const n = 2000;
  let maxMvp = 0;
  let titles6 = 0;
  let anyMvp = 0;
  for (let i = 0; i < n; i++) {
    const role = (["PG", "SG", "SF", "PF", "C"] as const)[i % 5];
    const path = (["NCAA", "Europa", "G-League"] as const)[i % 3];
    const player = playCareerSim({
      name: "Repro",
      role,
      nationality: "ITA",
      number: 23,
      difficulty: "esordio",
      path,
      seed: (i + 1) * 1000 + 3,
      draft: "random",
    });
    maxMvp = Math.max(maxMvp, player.mvpCount);
    if (player.titleCount >= 6) titles6 += 1;
    if (player.mvpCount > 0) anyMvp += 1;
  }
  assert.ok(maxMvp <= 6, `max MVP ${maxMvp}`);
  assert.ok(titles6 / n < 0.02, `six-title share ${titles6 / n}`);
  assert.ok(anyMvp > 0, "MVP disappeared");
  // P0-LIFE permits early retirement. The Pro distribution test separately
  // verifies that viable careers still reach the age-36 final season.
});
