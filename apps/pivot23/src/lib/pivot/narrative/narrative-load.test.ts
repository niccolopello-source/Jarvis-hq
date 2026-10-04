import assert from "node:assert/strict";
import test from "node:test";

const LINE = "Il Draft si avvicina. Alex Rivers, un playmaker greco, deve scegliere i primi passi da professionista.";
const LINE_EN = "The Draft is coming. Alex Rivers, a Greek point guard, has to choose the first steps as a pro.";

test("English stays the stored Italian until the chunk loads, and the switch waits for that chunk", async () => {
  const { nx, loadNarrativeEn } = await import("./index.ts");
  const { getLang, registerLangLoader, setLang } = await import("../i18n.ts");
  assert.equal(nx(LINE, "en"), LINE, "before the chunk, the screen keeps the stored Italian");

  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  registerLangLoader("en", () => gate);
  assert.equal(getLang(), "it");
  setLang("en");
  assert.equal(getLang(), "it", "the reader does not see English before the chunk resolves");
  release();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(getLang(), "en");
  assert.equal(nx(LINE, "en"), LINE, "a resolved switch with an empty catalog still falls back");

  await loadNarrativeEn();
  assert.equal(nx(LINE, "en"), LINE_EN);
  setLang("it");
  assert.equal(getLang(), "it");
  assert.equal(nx(LINE, "it"), LINE);
});
