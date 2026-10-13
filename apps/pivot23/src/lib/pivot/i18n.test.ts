import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_LANGS, awardLabel, chromeGaps, demoLang, difficultyFace, msgKeys, t, tf } from "./i18n.ts";
import { confLabel, dossierPlace, nationLabel, playoffResultLabel, roleLabel, roundLabel } from "./labels.ts";

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

/** Keys whose English text is intentionally identical to Italian: official award names, units, brand words. */
const SAME_IN_BOTH = new Set(["mvp", "allStar", "allNba", "fmvp", "dpoy", "roy", "mip", "sixth", "overallN", "home", "draftLine"]);
const ITALIAN_WORDS = /(^|[^\p{L}])(il|lo|gli|di|che|non|una|sei|nel|della|alla|ancora|anni|stagione|carriera|squadra|tuo|tua|qui|dopo|prima|è|perché|più)(?=$|[^\p{L}])/iu;

test("English chrome is complete and contains no Italian", () => {
  assert.deepEqual(chromeGaps(["it", "en"]), []);
  for (const key of msgKeys()) {
    const it = t(key, "it");
    const en = t(key, "en");
    if (it === en) assert.ok(SAME_IN_BOTH.has(key), `${key} is identical in IT and EN: "${en}"`);
    assert.equal(ITALIAN_WORDS.test(en), false, `${key} looks Italian in EN: "${en}"`);
  }
});

test("placeholders survive in both languages", () => {
  for (const key of msgKeys()) {
    const names = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    assert.deepEqual(names(t(key, "en")), names(t(key, "it")), `${key} placeholders differ`);
  }
  assert.equal(tf("seasonN", { n: 4 }, "en"), "Season 4");
  assert.equal(tf("seasonN", { n: 4 }, "it"), "Stagione 4");
});

test("stored Italian labels are translated at render time, not rewritten", () => {
  assert.equal(roleLabel("Playmaker", "en"), roleLabel("Playmaker", "en"));
  assert.notEqual(confLabel("East", "en"), "");
  assert.equal(playoffResultLabel("Campione", "it"), "Campione");
  assert.notEqual(playoffResultLabel("Campione", "en"), "Campione");
  assert.notEqual(playoffResultLabel("Fuori", "en"), "Fuori");
  assert.equal(playoffResultLabel(undefined, "en"), "");
  assert.equal(nationLabel("it", "it").length > 0, true);
  assert.equal(typeof roundLabel("Finale", "en"), "string");
  assert.equal(dossierPlace("Boston", "Atlantic", "East", "it"), "Boston · Atlantic · Est");
  assert.equal(dossierPlace("Madrid", "Eurolega", "Euro", "it"), "Madrid · Eurolega");
  assert.equal(dossierPlace("Madrid", "Eurolega", "Euro", "en"), "Madrid · EuroLeague");
  assert.equal(dossierPlace("—", "", "East", "it"), "— · Est");
});

test("league award notes read in English without touching Italian", async () => {
  const { awardNoteLabel } = await import("./labels.ts");
  assert.equal(awardNoteLabel("24.1 punti, 55 vittorie", "it"), "24.1 punti, 55 vittorie");
  assert.equal(awardNoteLabel("24.1 punti, 55 vittorie", "en"), "24.1 points, 55 wins");
  assert.equal(awardNoteLabel("Miglior difesa, 101.2 punti subiti", "en"), "Best defense, 101.2 points allowed");
  assert.equal(awardNoteLabel("Da 8.1 a 15.0 punti", "en"), "From 8.1 to 15.0 points");
  assert.equal(awardNoteLabel("1.9 palle rubate · 2.4 stoppate · 4.1 vittorie difensive", "en"), "1.9 steals · 2.4 blocks · 4.1 defensive win shares");
});

/* Copy review IT/EN 2026-10-13 (docs/pivot23/COPY-REVIEW-IT-EN-2026-10-13.md). */
test("copy review 2026-10-13: corrected chrome lines keep their verified meaning", () => {
  assert.equal(t("resume", "it"), "Riprendi la carriera");
  assert.equal(t("resume", "en"), "Resume career");
  assert.equal(t("setupTitle", "en"), "Create your player");
  // MVP: 65 games on awards v2 (AWARD_MIN_GAMES), 58 only on careers before 2.15.
  assert.match(t("raceMvpCap", "it"), /65 partite \(58 /);
  assert.match(t("raceMvpCap", "en"), /65 games \(58 /);
  // DPOY: the metric is an estimate of defensive win shares (awards-helpers.ts nbaDpoyScore), not team wins.
  for (const l of ["it", "en"] as const) {
    assert.match(t("dpoyCap", l), /defensive win shares/);
    assert.doesNotMatch(t("dpoyCap", l), /vittorie difensive|defensive wins\b/);
  }
  assert.match(t("raceNbaCap", "en"), /All-NBA First, Second and Third Team/);
  assert.match(t("raceMipCap", "en"), /points per game/);
  // Draft: 10 rounds, 3 cards dealt out of 4, one picked (PivotApp DraftView, data.ts + draft-character.ts).
  assert.match(t("guide1Body", "it"), /dieci round/);
  assert.match(t("guide1Body", "en"), /ten rounds, and in each one you pick one of the three cards/);
});

test("copy review 2026-10-13: English chrome avoids the known calques", () => {
  const banned = [/\bcraft\b/i, /playoff doors/i, /Resume this life/, /defensive wins\b/, /roll of honour/i, /lift the ring/i, /\bthe year too many\b/, /\bsuffer it\b/];
  const bad: string[] = [];
  for (const k of msgKeys()) for (const re of banned) if (re.test(t(k, "en"))) bad.push(`${k}: ${t(k, "en")}`);
  assert.deepEqual(bad, []);
});

test("copy review 2026-10-13: Italian and English chrome carry the same placeholders", () => {
  const slots = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
  const bad = msgKeys().filter((k) => slots(t(k, "it")) !== slots(t(k, "en")));
  assert.deepEqual(bad, []);
});
