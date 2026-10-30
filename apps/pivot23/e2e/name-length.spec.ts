import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

/* Career name up to 32 characters: kept whole through draft, career header, Legacy Report,
   Career Card and archive, with no horizontal overflow at 320 and 390 px. Screenshots: NAME_SHOTS. */

const SHOTS = process.env.NAME_SHOTS || join("test-results", "name-length");
const TYPED = "Massimiliano Della Valle-Giordano"; // 33 characters
const NAME = TYPED.slice(0, 32);
const settle = (page: Page, ms = 250) => page.waitForTimeout(ms);

async function noOverflow(page: Page, label: string) {
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: window.innerWidth }));
  expect(r.sw, `${label}: page wider than viewport`).toBeLessThanOrEqual(r.w + 1);
}

async function both(page: Page, label: string) {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
    await settle(page, 350);
    await noOverflow(page, `${label} @${width}`);
    await page.screenshot({ path: join(SHOTS, `name-${label}-${width}.png`) });
  }
}

test("a 32-character name survives draft, career, Legacy Report, Career Card and archive at 320/390 px", async ({ page }) => {
  test.setTimeout(300_000);
  mkdirSync(SHOTS, { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  const input = page.getByPlaceholder("Es. Marco Ferrara");
  await input.fill(TYPED);
  await expect(input).toHaveValue(NAME);
  await both(page, "setup");
  await page.getByRole("button", { name: "Gioca il Draft" }).click();
  const ready = page.getByRole("heading", { name: "Il tuo giocatore è pronto" });
  for (let round = 0; round < 12 && !(await ready.isVisible().catch(() => false)); round += 1) {
    await page.locator(".draft-card").first().click();
    await page.waitForTimeout(650);
  }
  await page.getByRole("button", { name: "Inizia la carriera" }).click();
  await page.getByRole("button", { name: /College NCAA/ }).click();
  await page.getByRole("button", { name: "Entra in palestra" }).click();
  await expect(page.locator("[data-pending]").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".career-chrome")).toContainText(NAME);
  const stored = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("pivot-v2-save") ?? "null");
    return (raw?.data ?? raw)?.player?.name as string | undefined;
  });
  await page.waitForTimeout(1500);
  expect(stored ?? (await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("pivot-v2-save") ?? "null");
    return (raw?.data ?? raw)?.player?.name as string | undefined;
  }))).toBe(NAME);
  await both(page, "career");

  const seen: string[] = [];
  for (let step = 0; step < 300; step += 1) {
    if (await page.locator(".result-view").isVisible().catch(() => false)) break;
    const pending = page.locator("[data-pending]").first();
    await expect(pending).toBeVisible({ timeout: 15_000 });
    const sig = (await pending.innerText()).slice(0, 160);
    seen.push(sig);
    const tail = seen.slice(-4);
    if (tail.length === 4 && tail.every((x) => x === tail[0])) throw new Error(`career stalled at step ${step}`);
    await pending.locator("button").first().click({ timeout: 5_000 }).catch(() => {});
    await settle(page, 150);
  }
  await expect(page.locator(".result-view")).toBeVisible();
  const card = page.getByRole("region", { name: "Career Card" });
  // The Career Card is a lazy chunk: under parallel load it can mount after the default 5 s, so wait for it.
  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(card).toContainText(NAME);
  await both(page, "report");
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await settle(page, 350);
    await card.scrollIntoViewIfNeeded();
    const box = await card.boundingBox();
    expect(box && box.x >= -1 && box.x + box.width <= width + 1, `Career Card inside ${width}px`).toBe(true);
    await card.screenshot({ path: join(SHOTS, `name-career-card-${width}.png`) });
  }
  await page.locator(".result-view").getByRole("button", { name: "Archivio", exact: true }).click();
  await expect(page.getByRole("button", { name: new RegExp(NAME) })).toBeVisible();
  await both(page, "archive");
  await page.reload();
  await page.getByRole("button", { name: /Archivio/ }).click();
  await page.getByRole("button", { name: new RegExp(NAME) }).click();
  await expect(page.getByRole("region", { name: "Career Card" })).toContainText(NAME);
  expect(errors).toEqual([]);
});
