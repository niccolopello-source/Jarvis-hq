import { test } from "node:test";
import assert from "node:assert/strict";
import { excludedBy, ROOKIE_TAGS_SINCE } from "./memory";
import { STORY_POOL } from "./data";
import { LEGACY_TAG_ANOMALIES } from "./event-tags";
import type { PlayerState } from "./types";

const ev = (id: string) => { const e = STORY_POOL.find((x) => x.id === id); assert.ok(e, id); return e!; };
const st = (engineVersion: string, age = 21) => ({ engineVersion, age, injuryDrag: 0, gamesPenalty: 0 }) as unknown as PlayerState;

test("rookie-tag gate is dormant until 2.23.0", () => {
  assert.equal(ROOKIE_TAGS_SINCE, "2.23.0");
  for (const id of LEGACY_TAG_ANOMALIES) {
    for (const v of ["2.20.0-beta", "2.21.0-beta", "2.22.0-beta", "2.22.9"]) assert.equal(excludedBy(ev(id), st(v)), "veteran-theme-too-young", `${id} ${v}`);
    for (const v of ["2.23.0-beta", "2.23.0", "3.0.0"]) assert.equal(excludedBy(ev(id), st(v)), null, `${id} ${v}`);
  }
});
