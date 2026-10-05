import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { STORY_POOL } from "./data.ts";
import { playCareerSim } from "./engine.ts";
import { careerShape, careerSimilarity, careerTelemetry, identityKey, macroIdentity } from "./replayability.ts";

const FIXED = {
  name: "Audit",
  role: "SF" as const,
  nationality: "ITA",
  number: 23,
  path: "NCAA" as const,
  difficulty: "pro" as const,
  draft: "random" as const,
};

test("the same seed and the same decisions replay the same career identity", () => {
  const left = playCareerSim({ ...FIXED, seed: 4242 });
  const right = playCareerSim({ ...FIXED, seed: 4242 });
  const a = careerShape(left);
  const b = careerShape(right);
  assert.equal(identityKey(a), identityKey(b));
  assert.equal(careerSimilarity(a, b), 1);
  assert.equal(careerTelemetry(left).career_fingerprint, identityKey(a));
});

test("a different seed diverges, and a trade decision diverges from the same seed", () => {
  const base = playCareerSim({ ...FIXED, seed: 4242, trade: "accept" });
  const other = playCareerSim({ ...FIXED, seed: 4243, trade: "accept" });
  const refused = playCareerSim({ ...FIXED, seed: 42, role: "PG", trade: "refuse" });
  const accepted = playCareerSim({ ...FIXED, seed: 42, role: "PG", trade: "accept" });
  assert.notEqual(identityKey(careerShape(base)), identityKey(careerShape(other)));
  assert.notEqual(identityKey(careerShape(refused)), identityKey(careerShape(accepted)));
  assert.ok(careerSimilarity(careerShape(base), careerShape(other)) < 1);
});

test("retiring at the offer leaves out the age-36 season the other choice plays", () => {
  const seed = 29930;
  const play = playCareerSim({ ...FIXED, seed, retirement: "play36" });
  const stop = playCareerSim({ ...FIXED, seed, retirement: "retire" });
  assert.equal(play.extraSeason, true);
  assert.equal(stop.extraSeason, false);
  assert.equal(play.seasonHistory.some((row) => row.age === 36), true);
  assert.equal(stop.seasonHistory.some((row) => row.age === 36), false);
  assert.equal(play.choiceLog.some((c) => c.title === "Ritiro" && c.pick === "Gioca a 36 anni"), true);
  assert.equal(stop.choiceLog.some((c) => c.title === "Ritiro" && c.pick === "Chiudi ora"), true);
  assert.equal(stop.seasonHistory.filter((row) => row.age === 35).length, 1);
  assert.equal(play.seasonHistory.filter((row) => row.age === 36).length, 1);
  assert.notEqual(identityKey(careerShape(play)), identityKey(careerShape(stop)));
});

test("a macro archetype is earned by the career, and the same seed repeats it", () => {
  const player = playCareerSim({ ...FIXED, seed: 4242 });
  const again = macroIdentity(playCareerSim({ ...FIXED, seed: 4242 }));
  const id = macroIdentity(player);
  assert.equal(id.key, again.key);
  assert.equal(id.archetype, again.archetype);
  const allowed = new Set([
    null,
    "injury-comeback",
    "franchise-icon",
    "one-team",
    "draft-steal",
    "international-star",
    "international-return",
    "ring-chaser",
    "g-league-elevator",
    "almost-great",
    "journeyman",
    "short-peak",
    "unfulfilled",
    "loyal-star",
    "defensive-specialist",
  ]);
  assert.equal(allowed.has(id.archetype), true);
  if (id.archetype === "franchise-icon") {
    assert.ok(player.titleCount >= 1);
    assert.ok(id.streak >= 8);
  }
  if (id.archetype === "journeyman") {
    assert.equal(player.titleCount, 0);
  }
});

test("story pool events are not repeated inside one career", () => {
  const player = playCareerSim({ ...FIXED, seed: 4242 });
  assert.equal(new Set(player.usedEventIds).size, player.usedEventIds.length);
  const pool = new Set(STORY_POOL.map((event) => event.id));
  const used = player.usedEventIds.filter((id) => pool.has(id));
  assert.equal(new Set(used).size, used.length);
  assert.ok(used.length > 0);
});

test("gameplay modules do not call Math.random", () => {
  const root = dirname(fileURLToPath(import.meta.url));
  const needle = "Math" + ".random(";
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith(".ts")) {
        const text = readFileSync(path, "utf8");
        if (text.includes(needle)) offenders.push(path.slice(root.length + 1));
      }
    }
  };
  walk(root);
  assert.deepEqual(offenders, []);
});
