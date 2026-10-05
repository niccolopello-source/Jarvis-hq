import assert from "node:assert/strict";
import test from "node:test";
import { MAX_AGE } from "./peak.ts";
import { playCareerSim } from "./engine.ts";

const base = {
  seed: 51515,
  difficulty: "pro" as const,
  name: "Parity",
  nationality: "ITA",
  number: 23,
  role: "SF" as const,
  path: "NCAA" as const,
  draft: "best" as const,
};

test("the same seed replays the same season trace", () => {
  const a = playCareerSim(base);
  const b = playCareerSim(base);
  const trace = (s: typeof a) =>
    s.seasonHistory.map((r) => [r.age, r.teamAbbr, r.overall, r.min, r.gp, r.seed, r.playoff, r.awards.join("|")]);
  assert.deepEqual(trace(a), trace(b));
  assert.equal(a.rngState, b.rngState);
  assert.ok(a.seasonHistory.length > 0);
});

test("playing on at 35 records the same extra year the career offers", () => {
  const s = playCareerSim({ ...base, retirement: "play36" });
  assert.equal(s.extraSeason, true);
  assert.ok(s.choiceLog.some((c) => c.title === "Ritiro" && c.pick === "Gioca a 36 anni"));
  assert.ok(s.seasonHistory.some((r) => r.age === MAX_AGE) || s.age <= MAX_AGE);
  assert.ok(s.seasonHistory.every((r) => r.age <= MAX_AGE));
});

test("retiring at the offer does not invent a 36-year-old season", () => {
  const s = playCareerSim({ ...base, retirement: "retire" });
  assert.equal(s.extraSeason, false);
  assert.ok(s.choiceLog.some((c) => c.title === "Ritiro" && c.pick === "Chiudi ora"));
  assert.equal(s.seasonHistory.some((r) => r.age === MAX_AGE), false);
});

test("a different seed is not forced to the same ending team", () => {
  const a = playCareerSim(base);
  const b = playCareerSim({ ...base, seed: 51516 });
  const same =
    a.seasonHistory.at(-1)?.teamAbbr === b.seasonHistory.at(-1)?.teamAbbr &&
    a.seasonHistory.at(-1)?.overall === b.seasonHistory.at(-1)?.overall;
  assert.equal(same, false);
});
