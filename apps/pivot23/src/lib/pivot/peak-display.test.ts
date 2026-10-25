import { test } from "node:test";
import assert from "node:assert/strict";
import { displayedPeak } from "./peak-display";
import { displayOverall } from "./peak";

test("peak shown equals best OVR of the seasons table", () => {
  // Esordio seed 910004 shape: stored mid-season peak 91, table best 87.
  assert.equal(displayedPeak([{ overall: 70 }, { overall: 87 }, { overall: 84 }], 91), 87);
});
test("never exceeds any table row and matches row rounding", () => {
  const rows = [{ overall: 79.6 }, { overall: 82.4 }];
  const p = displayedPeak(rows, 85);
  assert.equal(p, 82);
  assert.ok(rows.every((r) => p >= displayOverall(r.overall)));
});
test("falls back to stored peak without usable rows (old/compacted archives)", () => {
  assert.equal(displayedPeak([], 88), 88);
  assert.equal(displayedPeak(undefined, 88), 88);
  assert.equal(displayedPeak([{ overall: NaN }, {}], 77.4), 77);
});

test("career sheet, legacy report and card face show the seasons-table best (seeds 1..40)", async () => {
  const { playCareerSim, toArchive } = await import("./engine");
  const { buildLegacyReport, cardFaceOf, withLegacyFacts } = await import("./legacy-report");
  let mismatchedEngine = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const s = playCareerSim({ seed });
    const tableBest = Math.max(...s.seasonHistory.map((r) => displayOverall(r.overall)));
    if (displayOverall(s.peakOverall) !== tableBest) mismatchedEngine++;
    assert.equal(displayedPeak(s.seasonHistory, s.peakOverall), tableBest, `sheet ${seed}`);
    const entry = withLegacyFacts(toArchive(s), s);
    const r = buildLegacyReport(entry);
    assert.equal(r.peak, tableBest, `report ${seed}`);
    assert.equal(cardFaceOf(r).peak, tableBest, `face ${seed}`);
    assert.equal(displayedPeak(entry.history, entry.peak), tableBest, `archive ${seed}`);
    // Engine value is not rewritten (display-only fix).
    assert.equal(entry.peak, s.peakOverall);
  }
  console.log(`engine peak differed from table in ${mismatchedEngine}/40 careers`);
});
