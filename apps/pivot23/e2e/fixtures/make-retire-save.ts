import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ARCHIVE_LIMIT, freshPlayer, playCareerSim, toArchive } from "../../src/lib/pivot/engine.ts";
import { buildLiveSave } from "../../src/lib/pivot/save.ts";

const player = freshPlayer("Ritiro Test", "SF", "Italia", 23, "pro", 3600);
player.age = 35;
player.season = 15;
const save = buildLiveSave(player, { kind: "retire" }, [], "career", "log", 1);
const out = join(dirname(fileURLToPath(import.meta.url)), "retire-save.json");
writeFileSync(out, JSON.stringify(save));
console.log("wrote", save.player.name, save.pending?.kind);

// A full archive (ARCHIVE_LIMIT finished careers, newest first) for the eviction notices.
const archive = Array.from({ length: ARCHIVE_LIMIT }, (_, i) =>
  toArchive(playCareerSim({ name: `Archivio ${i + 1}`, seed: 7100 + i, difficulty: "pro", draft: "random" })),
).reverse();
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), "full-archive.json"), JSON.stringify(archive));
console.log("wrote archive", archive.length, "oldest", archive[archive.length - 1]!.name);
