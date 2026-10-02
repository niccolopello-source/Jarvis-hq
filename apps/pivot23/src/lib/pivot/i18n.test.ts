import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_LANGS, demoLang } from "./i18n.ts";

test("the demo offers only Italian and English", () => {
  assert.deepEqual(DEMO_LANGS, ["it", "en"]);
  assert.equal(demoLang("it"), "it");
  assert.equal(demoLang("en"), "en");
  assert.equal(demoLang("es"), "it");
  assert.equal(demoLang("fr"), "it");
  assert.equal(demoLang(null), "it");
  assert.equal(demoLang(undefined), "it");
});
