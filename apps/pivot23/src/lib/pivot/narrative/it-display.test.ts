import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { nx, loadNarrativeEn } from "./index";

describe("Italian display fixes (stored text unchanged)", () => {
  it("fixes 'a la' preposition at render time", () => {
    assert.equal(nx("Dai una mano a la tua Nazionale senza esporti troppo.", "it"), "Dai una mano alla tua Nazionale senza esporti troppo.");
    assert.equal(nx("Dai una mano a la Nazionale Italiana senza esporti troppo.", "it"), "Dai una mano alla Nazionale Italiana senza esporti troppo.");
    assert.equal(nx("Dai una mano a Team USA senza esporti troppo.", "it"), "Dai una mano a Team USA senza esporti troppo.");
  });
  it("rephrases 'si gioca a crescita' draft news", () => {
    assert.equal(nx("A Atlanta il draft spinge verso la crescita. Caleb Silva è il volto, si gioca a crescita.", "it"), "A Atlanta il draft spinge verso la crescita. Caleb Silva è il volto del nuovo corso.");
  });
  it("English lookup still uses the old stored key", async () => {
    await loadNarrativeEn();
    assert.equal(nx("Dai una mano a la tua Nazionale senza esporti troppo.", "en"), "You help your national team without overexposing yourself.".replace("your national team", nx("la tua Nazionale", "en")));
    assert.equal(nx("A Atlanta il draft spinge verso la crescita. Caleb Silva è il volto, si gioca a crescita.", "en"), "In Atlanta, the draft pushes toward development. Caleb Silva is the face of the development era.");
  });
});
