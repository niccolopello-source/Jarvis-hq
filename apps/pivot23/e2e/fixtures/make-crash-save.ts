import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sha256 } from "../../src/lib/pivot/card.ts";
import { playCareerSim } from "../../src/lib/pivot/engine.ts";
import { buildLiveSave } from "../../src/lib/pivot/save.ts";

/*
 * A save that passes the checksum and every shape check in save.ts but breaks the career screen:
 * season rows carry `awards` as a string. It stands for "a valid save the current screens cannot
 * draw" (for example after a deploy changed what a screen expects).
 */
const save = JSON.parse(JSON.stringify(buildLiveSave(playCareerSim({ seed: 4242, difficulty: "pro" }), null, [], "career", "log", 1)));
for (const row of save.player.seasonHistory) row.awards = "x";
/* Four-doors UI (2026-11-10): the season sheet that used to break on `awards` is no longer mounted
   behind Storia, so the diary carries a broken row too (a season recap whose mood line is not text).
   Storia, the home that is always on screen, cannot draw it. */
const last = save.player.seasonHistory[save.player.seasonHistory.length - 1];
save.log = [{ id: "crash-recap", kind: "recap", title: "Stagione", resolved: true, row: { ...last, mood: { broken: true } } }];
const { c: _old, ...body } = save;
void _old;
const signed = { ...body, c: sha256(JSON.stringify(body)).slice(0, 16) };
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), "crash-save.json"), JSON.stringify(signed));
console.log("wrote crash save");
