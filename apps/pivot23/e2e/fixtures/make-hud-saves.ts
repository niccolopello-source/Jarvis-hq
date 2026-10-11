import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { advanceCareerSim, openCareerSim } from "../../src/lib/pivot/engine.ts";
import { buildLiveSave } from "../../src/lib/pivot/save.ts";

/* Career saves on many different clubs, three seasons in, so the tinted career header can be
   checked for contrast against each club colour (the header tint follows the club). */
const saves: Record<string, string> = {};
for (let seed = 1; seed < 400 && Object.keys(saves).length < 30; seed++) {
  const job = openCareerSim({ name: "Contrasto Test", seed, difficulty: "pro", draft: "random" });
  while (job.s.seasonHistory.length < 3 && !advanceCareerSim(job));
  const s = job.s;
  if (s.league !== "NBA" || saves[s.team.abbr] || s.seasonHistory.length < 3) continue;
  s.simulated = false;
  saves[s.team.abbr] = JSON.stringify(buildLiveSave(s, { kind: "retire" }, [], "career", "log", 1));
}
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), "hud-saves.json"), JSON.stringify(saves));
console.log("wrote hud saves", Object.keys(saves).length);
