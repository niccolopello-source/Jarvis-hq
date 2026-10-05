import assert from "node:assert/strict";
import test from "node:test";
import { playCareerSim } from "./engine.ts";
import { analyzeReplayability } from "./replayability.ts";

/**
 * 100 Pro careers, fixed seeds. Deterministic.
 * Lives in test:stats so the fast suite stays short.
 * The P1 sample collapsed draft, league, team changes, and titles.
 * Those shares are no longer a pass condition. A title is still the uncommon outcome.
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
  assert.ok(report.meanSimilarity > 0.3 && report.meanSimilarity < 0.62, String(report.meanSimilarity));
  assert.ok(report.highSimilarityShare < 0.08, String(report.highSimilarityShare));

  assert.ok((report.dimensions.draftBin?.topShare ?? 1) < 0.9, JSON.stringify(report.dimensions.draftBin?.counts));
  assert.ok((report.dimensions.league?.topShare ?? 1) < 0.97, JSON.stringify(report.dimensions.league?.counts));
  const untitled = report.dimensions.titlesBin?.counts["0"] ?? 0;
  assert.ok(untitled >= 55 && untitled <= 95, String(untitled));
  assert.equal(report.dimensions.titlesBin?.top, "0");

  for (const role of ["PG", "SG", "SF", "PF", "C"]) {
    assert.ok((report.dimensions.role?.counts[role] ?? 0) >= 8, role);
  }
  assert.ok(Object.keys(report.dimensions.statShape?.counts ?? {}).length >= 4);
  assert.ok(players.every((player) => player.apexAge >= 26 && player.apexAge <= 28));
  assert.ok(new Set(players.map((player) => player.draftPick)).size >= 15);
  assert.ok(players.some((player) => player.draftPick <= 30));
  assert.ok(players.some((player) => player.draftPick >= 31));

  const again = playCareerSim({ name: "Replay", number: 23, difficulty: "pro", draft: "random", seed: 9973 + 11 });
  assert.equal(again.seed, players[0]?.seed);
  assert.equal(again.peakOverall, players[0]?.peakOverall);
  assert.equal(again.titleCount, players[0]?.titleCount);
  assert.equal(again.seasonHistory.length, players[0]?.seasonHistory.length);
});
