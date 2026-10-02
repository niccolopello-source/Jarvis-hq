import { expect, test } from "@playwright/test";
import { freshPlayer } from "../src/lib/pivot/engine";
import { buildLiveSave } from "../src/lib/pivot/save";
import { cloneTeam, NBA_TEAMS } from "../src/lib/pivot/teams";
import type { StandingRow, Team } from "../src/lib/pivot/types";

function standing(team: Team): StandingRow {
  return {
    abbr: team.abbr,
    name: team.name,
    city: team.city,
    color: team.color,
    secondary: team.secondary,
    conf: team.conf,
    div: team.div,
    w: 54,
    l: 28,
    seed: 1,
    power: team.power,
    star: team.star,
    ppg: 114.2,
    oppPpg: 108.6,
    rpg: 44,
    apg: 26,
    netRtg: 5.6,
    pace: 98.4,
    note: team.note,
    starPpg: 24.8,
    starRpg: 6.2,
    starApg: 5.1,
  };
}

test("a long franchise name stays readable on a phone Finals card", async ({ page }) => {
  const mine = cloneTeam(NBA_TEAMS.find((team) => team.abbr === "BOS")!);
  const opp = cloneTeam(NBA_TEAMS.find((team) => team.abbr === "OKC")!);
  const player = freshPlayer("Name Check", "PG", "Italia", 23, "pro", 37501);
  player.team = mine;
  player.contract = { ...player.contract, teamName: mine.name, yearsRemaining: 2 };
  player.league = "NBA";
  player.season = 4;
  player.age = 24;
  player.playoff = { conf: "East", seed: 1, round: 3, pairs: [] };
  player.currentLeague = {
    yearLabel: "2029-30",
    east: [standing(mine)],
    west: [standing(opp)],
    euro: [],
    awards: [],
    leaders: [],
    royRace: [],
  };
  const saved = JSON.stringify(buildLiveSave(player, {
    kind: "playoff",
    round: 3,
    opponent: opp,
    nerves: "Una serie, un gesto.",
  }, [], "career", "log", 1));
  await page.addInitScript((json) => {
    localStorage.setItem("pivot-v2-save", json);
  }, saved);

  for (const width of [375, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const name = page.locator(".team-dossier .team-label-name");
    await expect(name).toHaveText("Oklahoma City Thunder");
    const fit = await name.evaluate((node) => ({
      scroll: node.scrollWidth,
      client: node.clientWidth,
      card: node.closest(".log-card")?.getBoundingClientRect().right ?? 0,
      right: node.getBoundingClientRect().right,
      inner: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
    }));
    expect(fit.scroll).toBeLessThanOrEqual(fit.client + 1);
    expect(fit.right).toBeLessThanOrEqual(fit.card + 1);
    expect(fit.page).toBeLessThanOrEqual(fit.inner + 1);
  }
});

test("the home screen offers Italian and English only", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Italiano" })).toBeVisible();
  await expect(page.getByRole("button", { name: "English" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Español" })).toHaveCount(0);
});
