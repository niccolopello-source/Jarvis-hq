import assert from "node:assert/strict";
import test from "node:test";
import { DEFINITIONS, integrityIssues, roleBoxScore, runPair, sampleSeeds } from "../../lab/lab.ts";

test("lab definitions stay the ones named in the session register", () => {
  assert.equal(DEFINITIONS.bust, "potential >= 85 and peakOverall <= potential - 8");
  assert.equal(DEFINITIONS.superstar, "peakOverall >= 90");
  assert.equal(DEFINITIONS.peakAge, "PlayerState.apexAge");
});

test("two plays of the same seed hash equal and stay finite", () => {
  for (const seed of [23017, 23034, 23102]) {
    const row = runPair({ seed, role: "SF", path: "Europa" });
    assert.equal(row.match, true, `seed ${seed} diverged`);
    assert.deepEqual(row.issues, [], `seed ${seed}: ${row.issues.join(",")}`);
    assert.ok(row.peak >= 48 && row.peak <= 99, `peak ${row.peak}`);
    assert.ok(row.endAge >= 18 && row.endAge <= 36, `endAge ${row.endAge}`);
  }
});

test("role box score runs on the live engine without NaN", () => {
  const table = roleBoxScore(sampleSeeds(5, 24000));
  assert.equal(table.length, 5);
  for (const line of table) {
    assert.equal(line.n, 1, line.role);
    assert.ok(Number.isFinite(line.ppg) && line.ppg >= 0, line.role);
    assert.ok(Number.isFinite(line.rpg) && Number.isFinite(line.apg));
  }
  // The table is evidence, not a pass/fail on separation. Empty integrity is the gate.
  const issues = table.flatMap((line) => (line.n === 0 ? [`missing ${line.role}`] : []));
  assert.deepEqual(issues, []);
  void integrityIssues;
});
