import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";

/** Deterministic path saves (fixtures/make-path-saves.ts): injuries, awards+playoffs, playoff run, free agency. */
const here = dirname(fileURLToPath(import.meta.url));
let saves: Record<string, string> = {};
test.beforeAll(() => {
  execFileSync("node", ["--import=tsx", join(here, "fixtures", "make-path-saves.ts")], { cwd: join(here, ".."), stdio: "inherit" });
  saves = JSON.parse(readFileSync(join(here, "fixtures", "path-saves.json"), "utf8"));
});

const card = (page: Page) => page.locator("[data-pending]").last();
const saved = (page: Page) =>
  page.evaluate(() => {
    const r = JSON.parse(localStorage.getItem("pivot-v2-save") ?? "null");
    const d = r?.data ?? r;
    return { pending: d?.pending?.kind ?? null, round: d?.pending?.round ?? null, choices: d?.player?.choiceLog?.length ?? -1, seasons: d?.player?.seasonHistory?.length ?? -1, team: d?.player?.team?.abbr ?? "" };
  });

async function open(page: Page, key: string) {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await page.evaluate((v) => { localStorage.clear(); localStorage.setItem("pivot-v2-save", v); }, saves[key]!);
  await page.reload();
  await expect(card(page)).toBeVisible({ timeout: 15_000 });
}

/** Click the first choice of the current card and wait for the next one (or the result view). */
async function choose(page: Page) {
  await expect(page.locator(".pending-beat.is-held")).toHaveCount(0, { timeout: 10_000 });
  const before = await card(page).innerText();
  await card(page).locator("button").first().click();
  await expect.poll(async () => (await page.locator(".result-view").isVisible()) || (await card(page).innerText().catch(() => before)) !== before, { timeout: 15_000 }).toBe(true);
}

async function reloadSame(page: Page) {
  await expect(page.locator(".pending-beat.is-held")).toHaveCount(0, { timeout: 10_000 });
  await page.waitForTimeout(1500);
  const before = await saved(page);
  await page.reload();
  await expect(card(page)).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1000);
  expect(await saved(page)).toEqual(before);
}

test("injury: the scripted injury card shows, survives a reload, and the season goes on", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page, "injury");
  await reloadSame(page);
  const choices = (await saved(page)).choices;
  await choose(page);
  expect((await saved(page)).choices).toBe(choices + 1);
  expect(errors).toEqual([]);
});

test("awards and playoffs: recap with an award, then a playoff card, reload mid-playoffs, one decision per round", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page, "awardsPlayoffs");
  const row = JSON.parse(saves.awardsPlayoffs!).pending.row as { awards: string[] };
  expect(row.awards.length).toBeGreaterThan(0);
  await choose(page);
  await expect(card(page)).toHaveClass(/playoff/);
  await expect.poll(async () => (await saved(page)).pending, { timeout: 5_000 }).toBe("playoff");
  await reloadSame(page);
  const start = (await saved(page)).choices;
  // Double tap: one round decision only.
  await card(page).locator("button").first().dblclick();
  await expect.poll(async () => (await saved(page)).choices, { timeout: 10_000 }).toBe(start + 1);
  await page.waitForTimeout(1500);
  expect((await saved(page)).choices).toBe(start + 1);
  expect(errors).toEqual([]);
});

test("playoff run: play every round to the end of the run without a stall", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page, "playoffFinals");
  await expect(card(page)).toHaveClass(/playoff/);
  let rounds = 0;
  // The persisted save is the source of truth: right after a click the next card can still be
  // mid-reveal (no "playoff" class yet) and the write can land a moment later, so poll the save.
  const settledPending = async () => {
    await expect(page.locator(".pending-beat.is-held")).toHaveCount(0, { timeout: 10_000 });
    let last: string | null = null;
    await expect.poll(async () => { const p = (await saved(page)).pending; const same = p === last; last = p; return same; }, { timeout: 10_000, intervals: [500] }).toBe(true);
    return last;
  };
  for (let i = 0; i < 6 && (await settledPending()) === "playoff"; i += 1) {
    if (i === 1) await reloadSame(page);
    await choose(page);
    rounds += 1;
  }
  expect(rounds).toBeGreaterThan(0);
  expect(await settledPending(), "after the playoffs the career moved on").not.toBe("playoff");
  test.info().annotations.push({ type: "rounds", description: String(rounds) });
  expect(errors).toEqual([]);
});

test("free agency: offers are shown, survive a reload, signing moves the career on", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page, "fa");
  await expect(page.locator(".pending-beat .log-card.market")).toBeVisible();
  await reloadSame(page);
  const before = await saved(page);
  await choose(page);
  const after = await saved(page);
  expect(after.pending).not.toBe("fa");
  expect(after.choices).toBeGreaterThanOrEqual(before.choices);
  expect(errors).toEqual([]);
});
