import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_LANGS, awardLabel, chromeGaps, demoLang, difficultyFace, t } from "./i18n.ts";

test("the demo offers only Italian and English", () => {
  assert.deepEqual(DEMO_LANGS, ["it", "en"]);
  assert.equal(demoLang("it"), "it");
  assert.equal(demoLang("en"), "en");
  assert.equal(demoLang("es"), "it");
  assert.equal(demoLang("fr"), "it");
  assert.equal(demoLang(null), "it");
  assert.equal(demoLang(undefined), "it");
});

test("chrome strings exist in Italian, English and Spanish", () => {
  assert.deepEqual(chromeGaps(), []);
  assert.equal(t("saveMiss", "it").includes("$"), false);
  assert.equal(t("saveMiss", "en").includes("$"), false);
  assert.equal(t("saveMiss", "es").includes("$"), false);
});

test("award names stay official on every language", () => {
  for (const lang of ["it", "en", "es"] as const) {
    assert.equal(awardLabel("ROY", lang), "Rookie of the Year");
    assert.equal(awardLabel("DPOY", lang), "Defensive Player of the Year");
    assert.equal(awardLabel("FMVP", lang), "Finals MVP");
    assert.equal(awardLabel("MIP", lang), "Most Improved Player");
    assert.equal(awardLabel("6MOY", lang), "Sixth Man of the Year");
    assert.equal(awardLabel("All-NBA First Team", lang), "All-NBA First Team");
    assert.equal(awardLabel("NBA Champion", lang), "NBA Champion");
    assert.equal(t("allNba", lang), "All-NBA");
    assert.equal(t("allNba", lang).includes("All-League"), false);
  }
});

test("a missed save says the last successful write is kept", () => {
  const it = t("saveMiss", "it");
  assert.match(it, /non viene cancellato/);
  assert.match(it, /ricarichi/);
  assert.match(t("statLegend", "it"), /PPG/);
  assert.equal(t("advStats", "en"), "Advanced stats");
});

test("setup and difficulty chrome follow the active language", () => {
  assert.equal(t("setupDraft", "en"), "Enter the Draft");
  assert.equal(t("setupTitle", "it"), "Chi sei sul parquet");
  assert.equal(difficultyFace("esordio", "en").label, "Debut");
  assert.equal(difficultyFace("leggenda", "it").label, "Leggenda");
  assert.equal(difficultyFace("nope", "en").label, "Pro");
  assert.equal(t("guide1Body", "en").includes("Draft"), true);
});
