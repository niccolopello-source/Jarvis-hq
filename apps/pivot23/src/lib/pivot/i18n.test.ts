import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_LANGS, demoLang, t } from "./i18n.ts";

test("the demo offers only Italian and English", () => {
  assert.deepEqual(DEMO_LANGS, ["it", "en"]);
  assert.equal(demoLang("it"), "it");
  assert.equal(demoLang("en"), "en");
  assert.equal(demoLang("es"), "it");
  assert.equal(demoLang("fr"), "it");
  assert.equal(demoLang(null), "it");
  assert.equal(demoLang(undefined), "it");
});

test("a missed save says the last successful write is kept", () => {
  const it = t("saveMiss", "it");
  assert.match(it, /non viene cancellato/);
  assert.match(it, /ricarichi/);
  assert.match(t("statLegend", "it"), /PPG/);
  assert.equal(t("advStats", "en"), "Advanced stats");
});
