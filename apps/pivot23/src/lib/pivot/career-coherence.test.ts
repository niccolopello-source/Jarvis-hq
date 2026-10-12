import assert from "node:assert/strict";
import test from "node:test";
import { bustDiagnosis, choiceShowsVoidedExtraYear, extraYearVoided } from "./career-coherence.ts";
import { playCareerSim } from "./engine.ts";
import { careerEndAge, careerEndingSignal } from "./peak.ts";
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

test("G4 seeds that accepted age 36 never recorded that season (A1)", () => {
  // Indices whose seed is (i+1)*1000+17 ∈ {4017, 23017, 49017, 65017, 74017}.
  for (const i of [3, 22, 48, 64, 73]) {
    const s = g4Pro(i);
    assert.equal(s.seed, [4017, 23017, 49017, 65017, 74017][[3, 22, 48, 64, 73].indexOf(i)]);
    assert.equal(extraYearVoided(s), true, `seed ${s.seed} should be a voided extra year`);
    assert.equal(s.seasonHistory.some((r) => r.age === 36), false);
    assert.equal(careerEndAge(s), s.seasonHistory.at(-1)?.age);
    assert.ok(careerEndAge(s)! < 36);
    assert.equal(careerEndingSignal(s), "injury", `seed ${s.seed} signal`);
    assert.ok(s.injuryDrag >= 2.5);
    const pick = s.choiceLog.find((c) => c.pick === "Gioca a 36 anni");
    assert.ok(pick, "the log still records the acceptance");
    assert.equal(choiceShowsVoidedExtraYear(pick!, s), true);
  }
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
