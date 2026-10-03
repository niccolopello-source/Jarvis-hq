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
const { c: _old, ...body } = save;
void _old;
const signed = { ...body, c: sha256(JSON.stringify(body)).slice(0, 16) };
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), "crash-save.json"), JSON.stringify(signed));
console.log("wrote crash save");
