import { expect, test, type Page } from "@playwright/test";
import { getSeasonDisplayLabel } from "../src/components/pivot/presentation";
import { freshPlayer, playCareerSim } from "../src/lib/pivot/engine";
import { buildLiveSave } from "../src/lib/pivot/save";
import { NBA_TEAMS } from "../src/lib/pivot/teams";
import type { LiveSave, PlayerState } from "../src/lib/pivot/types";

/* Hybrid 1+3 follow-up (Dallak's runtime repro on 0cdd7d5): resume with a waiting choice, focus on
   sheet close, the Anno sheet on the latest season, and the Lega sheet on a compacted save. The save,
   its schema and the validator are untouched: fixtures are written with the app's own buildLiveSave. */

const doors = (page: Page) => page.getByRole("navigation", { name: "Sezioni della carriera" });
const door = (page: Page, name: string) => doors(page).getByRole("button", { name, exact: true });

async function seed(page: Page, json: string, extra: Record<string, string> = {}) {
  await page.addInitScript(
    ([save, more]) => {
      if (sessionStorage.getItem("hybrid-seeded")) return;
      localStorage.setItem("pivot-v2-save", save);
      for (const [k, v] of Object.entries(more)) localStorage.setItem(k, v);
      sessionStorage.setItem("hybrid-seeded", "1");
    },
    [json, extra] as const,
  );
  await page.goto("/");
}

async function resumeIfAsked(page: Page) {
  const resume = page.locator("button").filter({ hasText: /Riprendi|Resume|Reanudar|继续/ }).first();
  if (await resume.isVisible({ timeout: 4000 }).catch(() => false)) await resume.click();
  await expect(page.locator(".door-bar")).toBeVisible();
}

function tradeNoticeCareer(): PlayerState {
  const player = freshPlayer("Ritorno Porte", "PG", "Italia", 23, "pro", 91123);
  player.team = structuredClone(NBA_TEAMS[0]!);
  player.contract = { ...player.contract, teamName: player.team.name, yearsRemaining: 2 };
  player.league = "NBA";
  player.originPath = "NCAA";
  player.season = 3;
  player.age = 24;
  return player;
}

for (const sheet of ["season", "league", "career"] as const) {
  test(`resume: a waiting choice wins over a saved "${sheet}" door — Storia, card in view, badge, focus on the card`, async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const player = tradeNoticeCareer();
    // Both records say a sheet was the last door: LiveSave.tab (validator accepts the four ids) and pivot-v2-swipe.
    const save: LiveSave = buildLiveSave(player, { kind: "trade-notice", team: structuredClone(NBA_TEAMS[0]!), from: "Brooklyn Nets", pitch: "Minuti veri." }, [], "career", sheet, 1);
    expect(save.tab).toBe(sheet);
    await seed(page, JSON.stringify(save), { "pivot-v2-swipe": JSON.stringify({ tab: sheet, dir: "next", hint: true }) });
    await resumeIfAsked(page);
    await expect(page.locator("[data-pending]").first()).toBeInViewport();
    await expect(page.locator(".door-sheet")).toHaveCount(0);
    await expect(door(page, "Storia")).toHaveAttribute("aria-pressed", "true");
    await expect(door(page, "Storia").locator(".door-badge")).toHaveText("1");
    await expect(door(page, "Storia")).toHaveAccessibleDescription("1 scelta in attesa");
    await expect(page.locator(".story-scroll")).not.toHaveAttribute("inert", "");
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest("[data-pending]"))).toBe(true);
    // The card's main button sits above the doors with the 24 px gap.
    const gap = await page.evaluate(() => document.querySelector(".door-bar")!.getBoundingClientRect().top - document.querySelector("[data-pending] button")!.getBoundingClientRect().bottom);
    expect(gap).toBeGreaterThanOrEqual(24);
  });
}

test("focus: closing a sheet (X, Escape, Storia, Torna) hands focus back to Storia, never lost on <body>", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const player = tradeNoticeCareer();
  await seed(page, JSON.stringify(buildLiveSave(player, { kind: "trade-notice", team: structuredClone(NBA_TEAMS[0]!), from: "Brooklyn Nets", pitch: "Minuti veri." }, [], "career", "log", 1)));
  await resumeIfAsked(page);
  const focused = () => page.evaluate(() => { const a = document.activeElement; return a?.getAttribute("data-door") ?? (a?.closest("[data-pending]") ? "pending" : a?.closest(".door-sheet") ? "sheet" : a?.tagName ?? null); });
  const closers: [string, (p: Page) => Promise<void>, string][] = [
    ["Anno", (p) => p.locator(".door-sheet").getByRole("button", { name: "Chiudi" }).click(), "log"],
    ["Lega", (p) => p.keyboard.press("Escape"), "log"],
    ["Vita", (p) => door(p, "Storia").click(), "log"],
    // Torna goes to the waiting card itself.
    ["Anno", (p) => p.getByRole("button", { name: /Scelta in attesa/ }).click(), "pending"],
  ];
  for (const [name, close, want] of closers) {
    await door(page, name).click();
    await expect(page.locator(".door-sheet")).toBeVisible();
    await expect.poll(focused).toBe("sheet"); // the sheet title takes focus on open
    await close(page);
    await expect(page.locator(".door-sheet")).toHaveCount(0);
    await expect.poll(focused).toBe(want);
  }
});

test("a decision resolved just before opening a sheet does not pull focus or close the sheet when the next card arrives", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const player = tradeNoticeCareer();
  await seed(page, JSON.stringify(buildLiveSave(player, { kind: "trade-notice", team: structuredClone(NBA_TEAMS[0]!), from: "Brooklyn Nets", pitch: "Minuti veri." }, [], "career", "log", 1)));
  await resumeIfAsked(page);
  await page.locator("[data-pending] button").first().click();
  await door(page, "Anno").click();
  await page.waitForTimeout(3000); // past the hold: the next card lands in the diary under the sheet
  await expect(page.locator(".door-sheet")).toBeVisible();
  expect(await page.evaluate(() => !!document.activeElement?.closest(".door-sheet"))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(door(page, "Storia")).toBeFocused();
});

test("Anno opens on the latest completed season (exact label from the save) after more seasons are added", async ({ browser, baseURL }) => {
  const done = playCareerSim({ seed: 3, difficulty: "pro" });
  for (const n of [2, 5, done.seasonHistory.length]) {
    const player = structuredClone(done);
    player.seasonHistory = player.seasonHistory.slice(0, n);
    const json = JSON.stringify(buildLiveSave(player, null, [], "career", "season", 1));
    const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, baseURL, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    await seed(p, json, { "pivot-v2-swipe": JSON.stringify({ tab: "season", dir: "next", hint: true }) });
    await resumeIfAsked(p);
    await door(p, "Storia").click(); // close whatever a restored door opened
    await door(p, "Anno").click();
    const want = getSeasonDisplayLabel(player.seasonHistory[n - 1]!.season);
    await expect(p.locator(".year-now .tabular")).toHaveText(want);
    await expect(p.locator(".year-now")).toContainText("Ultima");
    await expect(p.getByRole("button", { name: "Stagione successiva" })).toBeDisabled();
    await ctx.close();
  }
});

const GONE: Record<string, RegExp> = { it: /non è più salvata/, en: /no longer saved/, es: /ya no está guardada/, zh: /不再保存/ };
for (const [label, seedNo] of [["NBA", 1], ["EuroLega", 4242]] as const) {
  test(`Lega on a compacted ${label} save: full table only when the rows exist, a clear note otherwise (IT/EN/ES/ZH)`, async ({ browser, baseURL }) => {
    const done = playCareerSim({ seed: seedNo, difficulty: "pro" });
    expect(done.league).toBe(label);
    for (const level of [0, 1, 2]) {
      const json = JSON.stringify(buildLiveSave(structuredClone(done), null, [], "career", "log", 1, level));
      for (const lang of ["it", "en", "es", "zh"]) {
        const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, baseURL });
        const page = await ctx.newPage();
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await seed(page, json, { "pivot-lang": lang });
        await resumeIfAsked(page);
        await page.locator(".door-bar [data-door='league']").click();
        const sheet = page.locator(".door-sheet");
        await expect(sheet).toBeVisible();
        if (level === 0) {
          await expect(sheet.locator(".standings-row").first()).toBeVisible();
          await expect(sheet.locator("[data-standings-gone]")).toHaveCount(0);
        } else {
          await expect(sheet.locator("[data-standings-gone]")).toHaveText(GONE[lang]!);
          await expect(sheet.locator(".standings-block")).toHaveCount(0);
          // What the save keeps is still there: season awards and the champions list.
          await expect(sheet.locator(".award-board li").first()).toBeVisible();
          await expect(sheet.locator(".albo-list li").first()).toBeVisible();
        }
        expect(errors, `${label} level ${level} ${lang}`).toEqual([]);
        await ctx.close();
      }
    }
  });
}
