import assert from "node:assert/strict";
import test from "node:test";
import { bustDiagnosis, choiceShowsVoidedExtraYear, extraYearVoided } from "./career-coherence.ts";
import { playCareerSim, toArchive } from "./engine.ts";
import { palmares } from "./legacy.ts";
import { buildLegacyReport } from "./legacy-report.ts";
import { careerEndAge, careerEndingSignal, isCareerOver } from "./peak.ts";
import type { PlayerState } from "./types.ts";

const ROLES = ["PG", "SG", "SF", "PF", "C"] as const;
const PATHS = ["NCAA", "Europa", "G-League"] as const;

/** Same career the G4 collector builds for index i on Pro. */
function g4Pro(i: number) {
  return playCareerSim({
    name: "G4",
    role: ROLES[i % 5]!,
    nationality: "ITA",
    number: 23,
    difficulty: "pro",
    path: PATHS[i % 3]!,
    seed: (i + 1) * 1000 + 17,
    draft: "random",
  });
}

function shell(over: Partial<PlayerState>): PlayerState {
  return over as PlayerState;
}

test("the current retirement rule cannot fire before age 33, whatever the body says", () => {
  const young = shell({
    age: 32,
    injuryDrag: 9,
    seasonHistory: [{ min: 4, age: 32 } as PlayerState["seasonHistory"][number]],
  });
  assert.equal(careerEndingSignal(young), null, "age 32 is below MAX_AGE - 3");
  assert.equal(careerEndingSignal(shell({ ...young, age: 31, injuryDrag: 12 })), null);
  assert.equal(careerEndingSignal(shell({ ...young, age: 33, injuryDrag: 2.5 })), "injury");
  assert.equal(careerEndingSignal(shell({
    ...young,
    age: 33,
    injuryDrag: 0,
    seasonHistory: [{ min: 11.5, age: 33 } as PlayerState["seasonHistory"][number]],
  })), "minutes");
  assert.equal(careerEndingSignal(shell({
    ...young,
    age: 33,
    injuryDrag: 0,
    seasonHistory: [{ min: 11.6, age: 33 } as PlayerState["seasonHistory"][number]],
  })), null);
});

test("an accepted age-36 season is played, even when that summer is already an injury", () => {
  // Seeds whose injury load already says "stop" (injuryDrag >= 2.5) in the age-36 summer.
  // Engine 2.17.0 (P1-INJ) moves the load, so the set moved: 2.16 used 3, 22, 48, 64, 73.
  for (const i of [9, 13, 31, 109]) {
    const s = g4Pro(i);
    assert.equal(s.seed, (i + 1) * 1000 + 17);
    assert.ok(s.injuryDrag >= 2.5, `seed ${s.seed} carries the injury load`);
    assert.equal(s.extraSeason, true);
    assert.equal(s.seasonHistory.some((r) => r.age === 36), true, `seed ${s.seed} plays 36`);
    assert.equal(extraYearVoided(s), false);
    assert.equal(careerEndAge(s), 36);
    const pick = s.choiceLog.find((c) => c.pick === "Gioca a 36 anni");
    assert.ok(pick);
    assert.equal(choiceShowsVoidedExtraYear(pick!, s), false);
  }
});

test("the accepted final season is not erased by an injury that arrives in that summer", () => {
  const row = { age: 35, min: 20 } as PlayerState["seasonHistory"][number];
  const owed = shell({ age: 36, extraSeason: true, injuryDrag: 9, engineVersion: "2.16.0-beta", seasonHistory: [row] });
  assert.equal(isCareerOver(owed), false);
  for (const v of ["2.15.0-beta", "2.14.0-beta", "2.13.0-beta"]) {
    assert.equal(isCareerOver(shell({ ...owed, engineVersion: v })), true, `a ${v} career keeps the rule it started with`);
  }
  const played = shell({ ...owed, seasonHistory: [row, { ...row, age: 36 }] });
  assert.equal(isCareerOver(played), true);
});

test("a played age-36 season is not marked voided", () => {
  const played = {
    extraSeason: true,
    choiceLog: [{ pick: "Gioca a 36 anni" }],
    seasonHistory: [{ age: 35 }, { age: 36 }],
  };
  assert.equal(extraYearVoided(played), false);
  assert.equal(choiceShowsVoidedExtraYear(played.choiceLog[0]!, played), false);
});

function g4(i: number, retirement: "play36" | "retire") {
  return playCareerSim({
    name: "G4",
    role: ROLES[i % 5]!,
    nationality: "ITA",
    number: 23,
    difficulty: "pro",
    path: PATHS[i % 3]!,
    seed: (i + 1) * 1000 + 17,
    draft: "random",
    retirement,
  });
}

/** Card, legacy timeline and the result line must all quote the last played season. */
function assertSameFinalAge(s: ReturnType<typeof g4>) {
  const last = s.seasonHistory.at(-1)!.age;
  const entry = toArchive(s);
  const report = buildLegacyReport(entry);
  const archive = { choices: entry.choices, history: entry.history };
  assert.equal(careerEndAge(s), last);
  assert.equal(entry.card?.ageEnd, last);
  assert.equal(report.ageEnd, last);
  assert.equal(palmares(s).endAge, last);
  assert.equal(report.timeline.find((item) => item.kind === "retire")?.value, last);
  assert.equal(entry.history.at(-1)?.age, last);
  for (const choice of entry.choices) {
    const promised = choice.pick === "Gioca a 36 anni" && !entry.history.some((row) => row.age === 36);
    assert.equal(choiceShowsVoidedExtraYear(choice, archive), promised);
  }
  return { last, entry };
}

test("diary, card and result line agree on the last played season", () => {
  const played = g4(0, "play36");
  assert.equal(assertSameFinalAge(played).last, 36);
  assert.equal(extraYearVoided(played), false);

  const declined = g4(0, "retire");
  assert.equal(assertSameFinalAge(declined).last, 35);
  assert.equal(declined.extraSeason, false);
  assert.ok(declined.choiceLog.some((choice) => choice.pick === "Chiudi ora"));
  assert.equal(extraYearVoided(declined), false);

  // Engine 2.17.0 (P1-INJ): index 3 now ends at 33 on load, so the injury-summer case is index 9.
  const playedFinal = g4(9, "play36");
  assert.equal(assertSameFinalAge(playedFinal).last, 36, "an accepted final season is played");
  assert.equal(extraYearVoided(playedFinal), false);

  const closedInstead = g4(9, "retire");
  assert.equal(assertSameFinalAge(closedInstead).last, 35);
  assert.equal(closedInstead.extraSeason, false);
  assert.equal(extraYearVoided(closedInstead), false);

  // Engine 2.17.0: index 5 now stops at 30, index 2 is the career that ends at 32.
  const early = g4(2, "play36");
  assert.equal(early.age, 33, "state age is already the next summer");
  assert.equal(assertSameFinalAge(early).last, 32);
  assert.equal(early.choiceLog.some((choice) => choice.pick === "Gioca a 36 anni"), false);
  assert.equal(extraYearVoided(early), false);
});

test("bust diagnosis separates opportunity from progression without touching the official label", () => {
  const row = (min: number, gp: number) => ({ teamAbbr: "BOS", min, gp }) as PlayerState["seasonHistory"][number];
  const base = {
    draftPick: 20,
    allStarCount: 0,
    seasonHistory: [row(20, 70), row(18, 60)],
  };
  const opportunity = bustDiagnosis({ ...base, potential: 78, peakOverall: 77 });
  assert.equal(opportunity.official, true);
  assert.equal(opportunity.kind, "opportunity");
  assert.equal(opportunity.labMiss, false);

  const progression = bustDiagnosis({ ...base, potential: 80, peakOverall: 74 });
  assert.equal(progression.official, true);
  assert.equal(progression.kind, "progression");
  assert.equal(progression.gap, 6);

  const star = bustDiagnosis({ ...base, allStarCount: 1, potential: 90, peakOverall: 80 });
  assert.equal(star.official, false);
  assert.equal(star.kind, "none");
  assert.equal(star.labMiss, true);
});
