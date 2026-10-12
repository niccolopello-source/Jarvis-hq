import { expect, test, type Page } from "@playwright/test";
import { freshPlayer } from "../src/lib/pivot/engine";
import { buildLiveSave } from "../src/lib/pivot/save";
import { NBA_TEAMS } from "../src/lib/pivot/teams";
import type { PlayerState, SavedPending, Team } from "../src/lib/pivot/types";

/* G3 red team: one logical decision = one transition + one persistent effect,
   whatever the input channel (mouse, keyboard, repeated taps after the debounce window). */

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

async function openCareer(page: Page, player: PlayerState, pending: SavedPending) {
  const saved = JSON.stringify(buildLiveSave(player, pending, [], "career", "log", 1));
  await page.addInitScript((json) => {
    if (!sessionStorage.getItem("g3-seeded")) {
      localStorage.setItem("pivot-v2-save", json);
      sessionStorage.setItem("g3-seeded", "1");
    }
  }, saved);
  await page.goto("/");
  return saved;
}

function savedChoices(page: Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem("pivot-v2-save");
    if (!raw) return [] as { season: number; title: string; pick: string }[];
    return JSON.parse(raw).player.choiceLog as { season: number; title: string; pick: string }[];
  });
}

async function storyOnScreen(page: Page, name: string, seed: number) {
  const player = career(name, seed);
  player.choiceLog = [{ season: 4, title: "Scambio", pick: "Brooklyn Nets → Boston Celtics" }];
  await openCareer(page, player, {
    kind: "trade-notice",
    team: team(0),
    from: "Brooklyn Nets",
    pitch: "Minuti veri, decisione già presa.",
  });
  await page.getByRole("button", { name: "Entra nello spogliatoio nuovo" }).click();
  await expect(page.locator("[data-pending] .choice-btn")).not.toHaveCount(0);
  return player;
}

test("keyboard on a held (visually disabled) story choice does not apply the choice twice", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const player = await storyOnScreen(page, "G3 Keys", 73011);
  const option = page.locator("[data-pending] .choice-btn").first();
  await option.focus();
  await page.keyboard.press("Enter");
  // Past the 600 ms gesture window, still inside the 1400 ms title hold: the button is only
  // pointer-events:none, keyboard activation still reaches it.
  await page.waitForTimeout(750);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await page.waitForTimeout(2600);
  const choices = await savedChoices(page);
  const added = choices.slice(player.choiceLog.length).filter((c) => c.season === 4);
  expect(added, JSON.stringify(choices)).toHaveLength(1);
  await expect(page.getByText("Si è verificato un problema")).toHaveCount(0);
});

test("reload during a story decision neither skips it nor applies it twice", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const player = await storyOnScreen(page, "G3 Reload", 73012);
  await page.waitForTimeout(900);
  await page.reload();
  await expect(page.locator("[data-pending] .choice-btn")).not.toHaveCount(0);
  const before = await savedChoices(page);
  expect(before).toEqual(player.choiceLog);
  await page.locator("[data-pending] .choice-btn").first().click();
  await page.waitForTimeout(2600);
  const after = await savedChoices(page);
  expect(after.length).toBe(before.length + 1);
});

async function playDraft(page: Page, rapid: boolean) {
  // Same seeded draft for both runs: a fresh player resumed on the draft screen.
  const player = freshPlayer("Draft Twin", "SF", "Italia", 7, "pro", 91001);
  const saved = JSON.stringify(buildLiveSave(player, null, [], "draft", "log", 1));
  await page.addInitScript((json) => {
    if (!sessionStorage.getItem("g3-seeded")) {
      localStorage.setItem("pivot-v2-save", json);
      sessionStorage.setItem("g3-seeded", "1");
    }
  }, saved);
  await page.goto("/");
  const resume = page.getByRole("button", { name: /Riprendi|Continua/ }).first();
  if (await resume.isVisible().catch(() => false)) await resume.click();
  const total = Number((await page.getByText(/Round 1 di \d+/).textContent())!.match(/di (\d+)/)![1]);
  for (let r = 1; r <= total; r += 1) {
    await expect(page.getByText(`Round ${r} di ${total}`)).toBeVisible();
    const card = page.locator(".draft-card").first();
    if (rapid) {
      await card.evaluate((node) => {
        for (let i = 0; i < 3; i += 1) node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      });
      await card.dblclick({ force: true, timeout: 400 }).catch(() => {});
    } else {
      await card.click();
    }
    if (r < total) await expect(page.getByText(`Round ${r + 1} di ${total}`)).toBeVisible();
    await page.waitForTimeout(700); // next round is a new decision: wait out the 600 ms gesture window
  }
  await expect(page.getByText(/Round \d+ di/)).toHaveCount(0);
  await page.waitForTimeout(900);
  return page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem("pivot-v2-save")!).player;
    return { total: p.draftHand?.length, attrs: p.attrs, hidden: p.hidden, potential: p.potential, overall: p.overall, rng: p.rngState, choices: p.choiceLog };
  });
}

test("rapid double/triple click on every draft round consumes one round each and changes nothing", async ({ browser }) => {
  test.setTimeout(120_000);
  const single = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const a = await playDraft(single, false);
  const rapid = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const b = await playDraft(rapid, true);
  expect(b).toEqual(a);
  await single.close();
  await rapid.close();
});
