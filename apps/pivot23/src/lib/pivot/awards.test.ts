import assert from "node:assert/strict";
import test from "node:test";
import { playCareerSim } from "./engine.ts";
import { NBA_TEAMS } from "./teams.ts";

/* D-01: the NBA Defensive Player of the Year comes from NBA rosters only. */

const nba = new Set(NBA_TEAMS.map((t) => t.abbr));
const DIFFS = ["esordio", "pro", "allstar", "leggenda"] as const;

test("NBA DPOY race and winner never include players from non-NBA teams", () => {
  let nbaSeasons = 0;
  let races = 0;
  for (let i = 0; i < 40; i++) {
    const s = playCareerSim({ seed: 900000 + i, difficulty: DIFFS[i % 4] });
    for (const row of s.seasonHistory) {
      const lg = row.league;
      if (!lg || row.conf === "Euro") continue;
      nbaSeasons += 1;
      const race = lg.dpoyRace ?? [];
      if (race.length) races += 1;
      for (const c of race) {
        if (c.isPlayer) continue;
        assert.ok(nba.has(c.teamAbbr), `seed ${s.seed} ${row.yearLabel}: ${c.name} (${c.teamAbbr}) in NBA DPOY race`);
      }
      const award = (lg.awards ?? []).find((a) => a.title === "DPOY");
      if (award && !award.isPlayer) {
        assert.ok(nba.has(award.teamAbbr), `seed ${s.seed} ${row.yearLabel}: DPOY to ${award.teamAbbr}`);
      }
    }
  }
  assert.ok(nbaSeasons > 200, `enough NBA seasons sampled (${nbaSeasons})`);
  assert.ok(races > 100, `enough DPOY races sampled (${races})`);
});

test("EuroLeague seasons keep no NBA DPOY race", () => {
  for (let i = 0; i < 40; i++) {
    const s = playCareerSim({ seed: 910000 + i, difficulty: DIFFS[i % 4], path: "Europa" });
    for (const row of s.seasonHistory) {
      if (row.conf !== "Euro" || !row.league) continue;
      assert.deepEqual(row.league.dpoyRace ?? [], [], `seed ${s.seed} ${row.yearLabel}`);
    }
  }
});
