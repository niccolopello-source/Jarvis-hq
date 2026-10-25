import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { IT_LINE_REWRITES, loadNarrativeEn, nx } from "./narrative/index";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCES = ["story-feel.ts", "story-extra.ts", "story-late.ts", "playoff-doors.ts", "feel.ts"].map((f) =>
  readFileSync(join(here, f), "utf8"),
);
const BANNED_IT = /\b(nud[oaie]|mestiere)\b/i;

test("every rewritten line is still emitted by the engine (old wording stays stored)", () => {
  for (const [old] of IT_LINE_REWRITES) assert.ok(SOURCES.some((s) => s.includes(JSON.stringify(old))), old);
});

test("Italian readers see the new wording, with no 'nudo' / 'mestiere'", () => {
  assert.equal(IT_LINE_REWRITES.length, 13);
  for (const [old, neu] of IT_LINE_REWRITES) {
    assert.equal(nx(old, "it"), neu);
    assert.doesNotMatch(neu, BANNED_IT, neu);
    assert.ok(neu.trim() === neu && neu.length > 0 && neu.length <= old.length + 20, neu);
  }
});

test("English readers get a catalog render without 'bare' for each rewritten line", async () => {
  await loadNarrativeEn();
  for (const [old] of IT_LINE_REWRITES) {
    const en = nx(old, "en");
    assert.notEqual(en, old, `missing EN for ${old}`);
    assert.doesNotMatch(en, /\bbare\b/i, en);
  }
});

test("unrelated Italian text is untouched", () => {
  assert.equal(nx("Il mestiere resta.", "it"), "Il mestiere resta.");
});
