import { test } from "node:test";
import assert from "node:assert/strict";
import { STORY_POOL } from "./data";
import { EVENT_TAGS, LEGACY_TAG_ANOMALIES } from "./event-tags";
import { eventTags, type EventTag } from "./memory";

// Frozen copy of the 2.22.0-beta regex tagger, used only to prove the explicit table is identical.
const LEGACY_RX: [EventTag, RegExp][] = [
  ["ego", /ego|giornale|media|riflettor|intervist/],
  ["coach", /allenator|coach|sistema|panchina|staff/],
  ["injury", /infortun|ginocchio|fisico|gamba|corpo|caviglia/],
  ["veteran", /veteran|ritir|ultimo anno|ultima stagione/],
  ["work", /palestra|lavoro|estate|ripetiz|allenament/],
  ["locker", /spogliatoio|gruppo|compagn/],
  ["contract", /contratt|rinnov|mercato|agente/],
  ["rival", /rival/],
];
const legacy = (title: string, subtitle: string) => {
  const t = `${title} ${subtitle}`.toLowerCase();
  return LEGACY_RX.filter(([, rx]) => rx.test(t)).map(([k]) => k);
};
const VOCAB = new Set<EventTag>(["ego", "coach", "injury", "veteran", "work", "locker", "contract", "rival"]);

test("every pool event has an explicit tag entry and no stale entries exist", () => {
  const ids = new Set(STORY_POOL.map((e) => e.id));
  assert.equal(ids.size, STORY_POOL.length, "duplicate event ids");
  for (const id of ids) assert.ok(id in EVENT_TAGS, `missing tags for ${id}`);
  for (const id of Object.keys(EVENT_TAGS)) assert.ok(ids.has(id), `stale tag entry ${id}`);
});

test("explicit tags equal the 2.22 regex output for every event (selection unchanged)", () => {
  for (const e of STORY_POOL) assert.deepEqual(eventTags(e), legacy(e.title, e.subtitle), e.id);
});

test("tags are independent of the text: editing title/subtitle does not change them", () => {
  for (const e of STORY_POOL) {
    assert.deepEqual(eventTags({ ...e, title: "x", subtitle: "infortunio veterano contratto" }), eventTags(e), e.id);
  }
});

test("tags use the controlled vocabulary, no duplicates", () => {
  for (const [id, tags] of Object.entries(EVENT_TAGS)) {
    assert.equal(new Set(tags).size, tags.length, id);
    for (const t of tags) assert.ok(VOCAB.has(t), `${id}: ${t}`);
  }
});

test("coherence: veteran-tagged rookie events are only the documented legacy anomalies", () => {
  const odd = STORY_POOL.filter((e) => e.phase === "rookie" && eventTags(e).includes("veteran")).map((e) => e.id);
  assert.deepEqual(odd.sort(), [...LEGACY_TAG_ANOMALIES].sort());
});

test("untagged events are an explicit, counted set", () => {
  const untagged = STORY_POOL.filter((e) => eventTags(e).length === 0).length;
  assert.equal(untagged, 39, "update this count deliberately when tagging new/untagged events");
});
