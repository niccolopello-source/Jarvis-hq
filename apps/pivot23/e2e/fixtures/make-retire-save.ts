import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { freshPlayer } from "../../src/lib/pivot/engine.ts";
import { buildLiveSave } from "../../src/lib/pivot/save.ts";

const player = freshPlayer("Ritiro Test", "SF", "Italia", 23, "pro", 3600);
player.age = 35;
player.season = 15;
const save = buildLiveSave(player, { kind: "retire" }, [], "career", "log", 1);
const out = join(dirname(fileURLToPath(import.meta.url)), "retire-save.json");
writeFileSync(out, JSON.stringify(save));
console.log("wrote", save.player.name, save.pending?.kind);
