import { expect, test, type Browser, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Procedural audit P1: a late-* or quiet-* story card restored from the live save must be the very
 * same card, with the same consequences, as the one the player saw before the reload.
 * Fixtures: live saves taken one beat before such a card (`pre-*.json`, recorded from a real run).
 * Path A answers the card without reloading; path B reloads on the card and then answers it.
 */
const KEY = "pivot-v2-save";
const card = (page: Page) => page.locator("[data-pending]").last();
const save = (page: Page) => page.evaluate((k) => localStorage.getItem(k), KEY);
async function settled(page: Page) {
  await expect(card(page)).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".pending-beat.is-held")).toHaveCount(0, { timeout: 10_000 });
  await page.waitForTimeout(1700); // past the hold and the deferred save
}
/** A fresh tab whose storage holds only `raw`, written before the app boots (no old tab can flush over it). */
async function boot(browser: Browser, raw: string): Promise<Page> {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(([k, v]) => {
    if (sessionStorage.getItem("p1-seeded")) return;
    localStorage.clear();
    localStorage.setItem(k!, v!);
    sessionStorage.setItem("p1-seeded", "1");
  }, [KEY, raw]);
  const page = await ctx.newPage();
  await page.goto("/");
  await settled(page);
  return page;
}
async function answerFirst(page: Page) {
  await card(page).locator("button:not([disabled])").first().click();
  await settled(page);
  return JSON.parse((await save(page))!);
}

for (const kind of ["late", "quiet"] as const) {
  test(`P1 resume: a ${kind}-* card rebuilt after reload keeps its text and its consequences`, async ({ browser }) => {
    test.setTimeout(120_000);
    const pre = readFileSync(fileURLToPath(new URL(`./fixtures/pre-${kind}.json`, import.meta.url)), "utf8");

    // A: reach the card and answer it without reloading.
    let page = await boot(browser, pre);
    await card(page).locator("button:not([disabled])").first().click();
    await settled(page);
    const onCard = (await save(page))!;
    const cardSave = JSON.parse(onCard);
    expect(cardSave.pending?.kind).toBe("story");
    expect(String(cardSave.pending?.eventId)).toMatch(new RegExp(`^${kind}-`));
    const shownA = await card(page).innerText();
    const a = await answerFirst(page);

    // B: reload on the very same card, then answer it.
    await page.context().close();
    page = await boot(browser, onCard);
    expect(await card(page).innerText()).toBe(shownA);
    const b = await answerFirst(page);

    expect(b.player.rngState).toBe(a.player.rngState);
    expect(b.player.choiceLog).toEqual(a.player.choiceLog);
    expect(b.player).toEqual(a.player);
    expect(b.pending).toEqual(a.pending);
    await page.context().close();
  });
}
