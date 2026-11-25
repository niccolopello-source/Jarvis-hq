import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { playCareerSim, toArchive } from "../../src/lib/pivot/engine.ts";
import { withLegacyFacts } from "../../src/lib/pivot/legacy-report.ts";

const here = dirname(fileURLToPath(import.meta.url));
// Real engine career with titles (for plaque rings). Seed 6, esordio, retire: 2 titles, 0 MVP.
const player = playCareerSim({ seed: 6, difficulty: "esordio", name: "Nico Anelli", draft: "random", retirement: "retire" });
const entry = withLegacyFacts(toArchive(player), player);
writeFileSync(join(here, "title-archive.json"), JSON.stringify(entry));
writeFileSync(
  join(here, "title-archive.meta.json"),
  JSON.stringify({
    seed: 6,
    difficulty: "esordio",
    titles: player.titleCount,
    mvps: player.mvpCount,
    allNba: player.allNbaCount,
    seasons: player.seasonHistory.length,
    name: player.name,
  }) + "\n",
);
