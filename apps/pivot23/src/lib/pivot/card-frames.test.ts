import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EMPTY_FRAME_FACTS,
  FRAME_IDS,
  highestFrameId,
  isFrameUnlocked,
  resolveFrameId,
  unlockedFrameIds,
  type FrameFacts,
} from "./card-frames.ts";

function facts(partial: Partial<FrameFacts>): FrameFacts {
  return { ...EMPTY_FRAME_FACTS, ...partial };
}

test("Grafite is unlocked for every finished career, including a sparse one", () => {
  assert.equal(highestFrameId(EMPTY_FRAME_FACTS), "standard");
  assert.deepEqual(unlockedFrameIds(EMPTY_FRAME_FACTS), ["standard"]);
});

test("Bronzo unlocks with 10 seasons or a playoff series, not with 9 quiet seasons", () => {
  assert.equal(isFrameUnlocked("bronze-frame", facts({ seasons: 9 })), false);
  assert.equal(isFrameUnlocked("bronze-frame", facts({ seasons: 10 })), true);
  assert.equal(isFrameUnlocked("bronze-frame", facts({ seasons: 3, playoffSeries: true })), true);
  assert.equal(highestFrameId(facts({ seasons: 10 })), "bronze-frame");
});

test("Ossidiana unlocks with a title or an All-League award", () => {
  assert.equal(isFrameUnlocked("obsidian", facts({ seasons: 12 })), false);
  assert.equal(isFrameUnlocked("obsidian", facts({ titles: 1 })), true);
  assert.equal(isFrameUnlocked("obsidian", facts({ allLeague: 1 })), true);
  assert.equal(highestFrameId(facts({ titles: 1 })), "obsidian");
  assert.deepEqual(unlockedFrameIds(facts({ titles: 1 })), ["standard", "bronze-frame", "obsidian"]);
});

test("Holo rosso unlocks with three titles or one MVP", () => {
  assert.equal(isFrameUnlocked("holo-red", facts({ titles: 2, allLeague: 4 })), false);
  assert.equal(isFrameUnlocked("holo-red", facts({ titles: 3 })), true);
  assert.equal(isFrameUnlocked("holo-red", facts({ mvps: 1 })), true);
  assert.equal(highestFrameId(facts({ mvps: 1 })), "holo-red");
});

test("Prisma unlocks with five titles or three MVP (OR, not AND)", () => {
  assert.equal(isFrameUnlocked("prisma", facts({ titles: 4, mvps: 2 })), false);
  assert.equal(isFrameUnlocked("prisma", facts({ titles: 5, mvps: 0 })), true);
  assert.equal(isFrameUnlocked("prisma", facts({ titles: 0, mvps: 3 })), true);
  assert.equal(highestFrameId(facts({ titles: 0, mvps: 3 })), "prisma");
});

test("a higher frame implies every lower one, in table order", () => {
  const top = facts({ titles: 5, mvps: 3, allLeague: 7, seasons: 17, playoffSeries: true });
  assert.deepEqual(unlockedFrameIds(top), [...FRAME_IDS]);
  assert.equal(highestFrameId(top), "prisma");
});

test("the kept preference is used only if this career has unlocked it", () => {
  const mid = facts({ titles: 1 });
  assert.equal(resolveFrameId("prisma", mid), "obsidian");
  assert.equal(resolveFrameId("standard", mid), "standard");
  assert.equal(resolveFrameId("obsidian", mid), "obsidian");
  assert.equal(resolveFrameId("bronze-frame", mid), "bronze-frame");
  assert.equal(resolveFrameId(null, mid), "obsidian");
});
