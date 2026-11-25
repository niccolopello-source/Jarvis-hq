import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { playCareerSim, toArchive } from "../../src/lib/pivot/engine.ts";
import { withLegacyFacts } from "../../src/lib/pivot/legacy-report.ts";

const here = dirname(fileURLToPath(import.meta.url));
const player = playCareerSim({ seed: 26, difficulty: "pro", name: "Nico Prisma", draft: "random", retirement: "retire" });
const entry = withLegacyFacts(toArchive(player), player);
writeFileSync(join(here, "hof-archive.json"), JSON.stringify(entry));
writeFileSync(
  join(here, "hof-archive.meta.json"),
  JSON.stringify({
    seed: 26,
    titles: player.titleCount,
    mvps: player.mvpCount,
    allNba: player.allNbaCount,
    seasons: player.seasonHistory.length,
    name: player.name,
  }) + "\n",
);
