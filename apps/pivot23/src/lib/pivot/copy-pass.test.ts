import test from "node:test";
import assert from "node:assert/strict";
import { t } from "./i18n";
import { nx } from "./narrative";

test("T2/T3 peak copy matches measured 25-27", () => {
  for (const k of ["guide4Body", "ovrCurveCap"] as const) {
    assert.match(t(k, "it"), /25/); assert.doesNotMatch(t(k, "it"), /26-28|26 e 28/);
    assert.match(t(k, "en"), /25/); assert.doesNotMatch(t(k, "en"), /26 to 28|26 and 28/);
  }
});
test("T4 draft three logic, T8 terminology, T11 brand", () => {
  assert.equal(t("draftThree", "it"), "Tre carte. Ne scegli una.");
  assert.equal(t("draftThree", "en"), "Three cards. You keep one.");
  assert.equal(t("ambContender", "it"), "corsa al titolo");
  assert.match(t("simSlow", "it"), /^PIVOT 23/); assert.match(t("simSlow", "en"), /^PIVOT 23/);
});
test("G League spelled officially in IT display", () => {
  assert.doesNotMatch(nx("Dalla G-League al salto. Boston firma corto. Niente alibi di campus, solo minuti da coprire.", "it"), /G-League/);
});
