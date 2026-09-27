import assert from "node:assert/strict";
import test from "node:test";
import { playCareerSim, simulateFullCareer } from "./engine";

const demoCareer = {
  name: "Giulia Rossi",
  role: "PG" as const,
  nationality: "ITA",
  number: 23,
  difficulty: "pro" as const,
  path: "NCAA" as const,
  seed: 230023,
};

test("a seeded career reaches a valid final state", () => {
  const player = playCareerSim(demoCareer);

  assert.equal(player.name, demoCareer.name);
  assert.equal(player.role, demoCareer.role);
  assert.equal(player.simulated, true);
  assert.ok(player.seasonHistory.length > 0);
  assert.ok(player.seasonHistory.length <= 20);
  assert.ok(player.age >= 20 && player.age <= 36);
  assert.ok(Number.isFinite(player.overall));
  assert.ok(player.overall >= 48 && player.overall <= 99);
  assert.ok(player.team.name.length > 0);
});

test("the same career seed produces the same demo summary", () => {
  const first = simulateFullCareer(demoCareer);
  const second = simulateFullCareer(demoCareer);

  assert.deepEqual(second, first);
});
