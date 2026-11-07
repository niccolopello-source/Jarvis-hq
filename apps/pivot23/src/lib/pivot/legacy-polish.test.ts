import assert from "node:assert/strict";
import { test } from "node:test";
import { fmtInt, legacyAwardLabel, lt, pickLabel, timelineLine } from "./legacy-i18n.ts";
import { playoffResultLabel } from "./labels.ts";
import { nx } from "./narrative/index.ts";
import { EN_LEGACY } from "./narrative/en/legacy.ts";

test("draft label has a single ordinal mark", () => {
  const it = lt("draftValue", "it", { pick: pickLabel(24, "it"), team: "Denver Nuggets" });
  assert.equal(it, "24ª scelta · Denver Nuggets");
  assert.ok(!it.includes("ªª"));
  assert.equal(lt("draftValueNoTeam", "it", { pick: pickLabel(3, "it") }), "3ª scelta");
});

test("integers are grouped the same way at any size", () => {
  assert.equal(fmtInt(2649, "it"), "2.649");
  assert.equal(fmtInt(15473, "it"), "15.473");
  assert.equal(fmtInt(2649, "en"), "2,649");
  assert.equal(fmtInt(812, "it"), "812");
});

test("award names: Italian in Italian, official full names in English", () => {
  assert.equal(legacyAwardLabel("Most Improved Player", "it"), "Giocatore più migliorato");
  assert.equal(legacyAwardLabel("Sixth Man", "it"), "Sesto uomo dell'anno");
  assert.equal(legacyAwardLabel("Sixth Man", "en"), "Sixth Man of the Year");
  assert.equal(legacyAwardLabel("MVP", "it"), "MVP");
});

test("Italian playoff exits read as a sentence; stored text untouched", () => {
  assert.equal(playoffResultLabel("Elim. Finali Est/Ovest 2-4", "it"), "Eliminato in finale di conference (2-4)");
  assert.equal(playoffResultLabel("Campione", "it"), "Campione");
  assert.equal(playoffResultLabel("Fuori", "it"), "Fuori");
});

test("legacy closing lines drop the redundant 'o più' count", () => {
  assert.equal(nx("Quindici stagioni, o più: 16 anni di referto. La longevità, qui, non è un incidente.", "it"), "16 stagioni a referto. La longevità, qui, non è un incidente.");
  assert.equal(nx("Quattro maglie, o più. 5 squadre. Il mestiere è stato un viaggio, non una casa.", "it"), "5 maglie diverse. Il mestiere è stato un viaggio, non una casa.");
  assert.equal(EN_LEGACY["Quattro maglie, o più. {0} squadre. Il mestiere è stato un viaggio, non una casa."], "{0} different jerseys. Your career was a journey, not a home.");
});

// Presentation only: the timeline must use the same award label as chips/card/PNG.
test("timeline award labels follow the Legacy UI language", () => {
  const item = { kind: "award" as const, subject: "Sixth Man", yearLabel: "2026-27", value: 1 };
  assert.equal(timelineLine(item, "it"), "Sesto uomo dell'anno");
  assert.equal(timelineLine(item, "en"), "Sixth Man of the Year");
});
