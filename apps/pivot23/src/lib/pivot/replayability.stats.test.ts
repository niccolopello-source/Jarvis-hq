import assert from "node:assert/strict";
import test from "node:test";
import { playCareerSim } from "./engine.ts";
import { analyzeReplayability } from "./replayability.ts";

/** Narrow bins on this sample, each caused by a certified system. Named in docs/pivot23/P1-REPLAYABILITY.md. */
const NARROW_SYSTEMS = ["draftBin", "league", "teamChanges", "titlesBin"];

/**
 * 100 Pro careers, fixed seeds. Deterministic.
 * Lives in test:stats so the fast suite stays short.
 */
test("100 seeded Pro careers are structurally distinct and not one cluster", () => {
  const players = Array.from({ length: 100 }, (_, i) =>
    playCareerSim({
      name: "Replay",
      number: 23,
      difficulty: "pro",
      draft: "random",
      seed: (i + 1) * 9973 + 11,
    }),
  );
  const report = analyzeReplayability(players);

  assert.equal(report.n, 100);
  assert.equal(report.uniqueIdentities, 100);
  assert.equal(report.identicalPairs, 0);
  assert.ok(report.meanSimilarity > 0.4 && report.meanSimilarity < 0.65, String(report.meanSimilarity));
  assert.ok(report.highSimilarityShare < 0.05, String(report.highSimilarityShare));

  for (const name of report.collapsed) {
    assert.ok(NARROW_SYSTEMS.includes(name), `collapsed without a named system: ${name}`);
  }
  assert.deepEqual(report.collapsed.slice().sort(), [...NARROW_SYSTEMS].sort());

  for (const role of ["PG", "SG", "SF", "PF", "C"]) {
    assert.ok((report.dimensions.role?.counts[role] ?? 0) >= 10, role);
  }
  assert.ok(Object.keys(report.dimensions.statShape?.counts ?? {}).length >= 4);
  assert.ok((report.dimensions.legacy?.counts.hall ?? 0) <= 12);
  assert.ok((report.dimensions.titlesBin?.counts["0"] ?? 0) >= 80);
  assert.ok(new Set(players.map((player) => player.draftPick)).size >= 20);
  assert.ok(new Set(players.map((player) => player.seasonHistory.map((row) => row.teamAbbr).join(">"))).size >= 90);

  const again = playCareerSim({ name: "Replay", number: 23, difficulty: "pro", draft: "random", seed: 9973 + 11 });
  assert.equal(again.seed, players[0]?.seed);
  assert.equal(again.peakOverall, players[0]?.peakOverall);
  assert.equal(again.titleCount, players[0]?.titleCount);
  assert.equal(again.seasonHistory.length, players[0]?.seasonHistory.length);
});
