/** Synthetic presentation fixture, not a natural-career balance result. */
import { writeFileSync } from "node:fs";
import { playCareerSim } from "../../src/lib/pivot/engine.ts";
import { buildLiveSave } from "../../src/lib/pivot/save.ts";
const player = playCareerSim({ name: "Synthetic UI", seed: 7107, difficulty: "pro", draft: "random", retirement: "retire" });
player.careerId = "synthetic-ui-7107";
player.draftPick = 24;
player.roy = false;
for (const row of player.seasonHistory) row.awards = [];
player.seasonHistory[0]!.awards = ["Sixth Man"];
player.seasonHistory[0]!.playoff = "Elim. Finali Est/Ovest 2-4";
writeFileSync(process.argv[2]!, JSON.stringify(buildLiveSave(player, { kind: "retire" }, [], "career", "log", 1)));
console.log("synthetic UI seed7107", player.engineVersion, player.seasonHistory.length, "rows");
