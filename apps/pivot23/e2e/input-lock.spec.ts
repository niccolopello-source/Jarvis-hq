import { expect, test, type Page } from "@playwright/test";
import { freshPlayer } from "../src/lib/pivot/engine";
import { buildLiveSave } from "../src/lib/pivot/save";
import { NBA_TEAMS } from "../src/lib/pivot/teams";
import type { PlayerState, SavedPending, SeasonRow, Team } from "../src/lib/pivot/types";

function team(index: number): Team {
  return structuredClone(NBA_TEAMS[index]!);
}

function career(name: string, seed: number): PlayerState {
  const player = freshPlayer(name, "PG", "Italia", 23, "pro", seed);
  player.team = team(0);
  player.contract = { ...player.contract, teamName: player.team.name, yearsRemaining: 2 };
  player.league = "NBA";
  player.originPath = "NCAA";
  player.season = 4;
  player.age = 24;
  return player;
}

function seasonAt(player: PlayerState, age: number): SeasonRow {
  return {
    season: player.season,
    yearLabel: "2039-40",
    age,
    team: player.team.name,
    teamAbbr: player.team.abbr,
    teamColor: player.team.color,
    teamSecondary: player.team.secondary,
    overall: player.overall,
    gp: 70,
    min: 28,
    ppg: 12,
    rpg: 4,
    apg: 5,
    spg: 1,
    bpg: 0.4,
    fg: 0.45,
    tp: 0.35,
    ft: 0.8,
    tov: 2,
    ts: 0.56,
    per: 16,
    plusMinus: 1,
    wins: 40,
    losses: 30,
    seed: 4,
    conf: player.team.conf,
    awards: [],
    playoff: "",
    salaryM: player.contract.annualM,
    seriesLog: [],
    mood: "",
  };
}

async function openCareer(page: Page, player: PlayerState, pending: SavedPending) {
  const saved = JSON.stringify(buildLiveSave(player, pending, [], "career", "log", 1));
  await page.addInitScript((json) => {
    localStorage.setItem("pivot-v2-save", json);
  }, saved);
  await page.goto("/");
  return saved;
}

async function tripleClick(page: Page, selector: string) {
  const target = page.locator(selector).first();
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error(`missing ${selector}`);
  const point = { x: box.x + box.width / 2, y: box.y + Math.min(box.height / 2, 20) };
  await page.evaluate((click) => {
    for (let i = 0; i < 3; i += 1) {
      const node = document.elementFromPoint(click.x, click.y);
      if (!node) throw new Error("rapid click missed the screen");
      node.dispatchEvent(new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        clientX: click.x,
        clientY: click.y,
        view: window,
      }));
    }
  }, point);
}

async function choicesAfter(page: Page, before: string) {
  await expect.poll(() => page.evaluate(() => localStorage.getItem("pivot-v2-save"))).not.toBe(before);
  await page.waitForTimeout(800);
  return page.evaluate(() => {
    const raw = localStorage.getItem("pivot-v2-save");
    if (!raw) return [];
    return JSON.parse(raw).player.choiceLog as { season: number; title: string; pick: string }[];
  });
}

test("three rapid playoff clicks resolve one round", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const player = career("Lock Playoff", 44017);
  const before = await openCareer(page, player, {
    kind: "playoff",
    round: 0,
    opponent: team(1),
    nerves: "Una serie, un gesto.",
  });
  await expect(page.getByRole("heading", { name: "Primo turno" })).toBeVisible();
  await tripleClick(page, "[data-pending] .choice-btn");
  const choices = await choicesAfter(page, before);
  expect(choices.filter((choice) => choice.title === "Primo turno")).toHaveLength(1);
  expect(choices.filter((choice) => choice.title !== "Primo turno" && choice.title !== "Scambio" && choice.title !== "Scambio estivo")).toEqual([]);
  await expect(page.getByText("Si è verificato un problema")).toHaveCount(0);
});

test("three rapid trade acknowledgements open the next story once", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const player = career("Lock Trade", 64017);
  player.choiceLog = [{ season: 4, title: "Scambio", pick: "Brooklyn Nets → Boston Celtics" }];
  const before = await openCareer(page, player, {
    kind: "trade-notice",
    team: team(0),
    from: "Brooklyn Nets",
    pitch: "Minuti veri, decisione già presa.",
  });
  const ack = page.getByRole("button", { name: "Entra nello spogliatoio nuovo" });
  await expect(ack).toBeVisible();
  await tripleClick(page, "[data-pending] .primary-btn");
  await expect(page.locator("[data-pending] .choice-btn")).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "Scambio chiuso" })).toHaveCount(1);
  const choices = await choicesAfter(page, before);
  expect(choices).toEqual(player.choiceLog);
  await expect(page.getByText("Si è verificato un problema")).toHaveCount(0);
});

test("three rapid retirement clicks play the final season once", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const player = career("Lock Retire", 73117);
  player.age = 35;
  player.season = 15;
  player.extraSeason = false;
  player.injuryDrag = 0;
  player.seasonHistory = [seasonAt(player, 35)];
  const before = await openCareer(page, player, { kind: "retire" });
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toBeVisible();
  await tripleClick(page, "[data-pending] .choice-btn");
  const choices = await choicesAfter(page, before);
  expect(choices.filter((choice) => choice.title === "Ritiro")).toEqual([
    { season: 15, title: "Ritiro", pick: "Gioca a 36 anni" },
  ]);
  expect(choices.filter((choice) => choice.title !== "Ritiro" && choice.title !== "Scambio" && choice.title !== "Scambio estivo")).toEqual([]);
  const age = await page.evaluate(() => {
    const raw = localStorage.getItem("pivot-v2-save");
    return raw ? JSON.parse(raw).player.age as number : 0;
  });
  expect(age).toBe(36);
  await expect(page.getByRole("region", { name: "Career Card" })).toHaveCount(0);
  await expect(page.getByText("Si è verificato un problema")).toHaveCount(0);
});
