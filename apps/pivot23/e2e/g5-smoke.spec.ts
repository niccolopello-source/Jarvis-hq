import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

/* G5 release smoke: the release-checklist path played entirely in the browser on the production
   build (no pre-generated save). Long name, full draft, path, seasons, save + refresh + resume,
   double activation, playoff/market cards when the career reaches them, retirement, Legacy Report,
   Career Card, archive and reopening after reload. Console errors and page errors must stay empty.
   Screenshots go to G5_SHOTS (default test-results/g5-smoke). */

const SHOTS = process.env.G5_SHOTS || join("test-results", "g5-smoke");
// The setup input caps names at 20 characters (maxLength=20): the career carries the first 20.
const TYPED = "Massimiliano Della Valle-Giordano";
const NAME = TYPED.slice(0, 20);
const settle = (page: Page, ms = 250) => page.waitForTimeout(ms);
const shot = (page: Page, name: string) => page.screenshot({ path: join(SHOTS, `${name}.png`) });

test("G5 smoke: long-name career, draft to archive, refresh resume, double activation, no console errors", async ({ page }) => {
  test.setTimeout(300_000);
  mkdirSync(SHOTS, { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  const save = () =>
    page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("pivot-v2-save") ?? "null");
      const s = raw?.data ?? raw;
      return { seasons: (s?.player?.seasonHistory?.length as number | undefined) ?? 0, log: (s?.player?.log?.length as number | undefined) ?? 0 };
    });

  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const start = page.getByRole("button", { name: "Inizia", exact: true });
  await expect(start).toBeVisible({ timeout: 15_000 });
  await shot(page, "01-home");
  await start.click();
  await page.getByPlaceholder("Es. Marco Ferrara").fill(TYPED);
  await page.getByRole("button", { name: "Gioca il Draft" }).click();
  await expect(page.locator(".draft-card").first()).toBeVisible();
  await shot(page, "02-draft");
  const ready = page.getByRole("heading", { name: "Il tuo giocatore è pronto" });
  for (let round = 0; round < 12 && !(await ready.isVisible().catch(() => false)); round += 1) {
    await page.locator(".draft-card").first().click();
    await page.waitForTimeout(650);
  }
  await expect(ready).toBeVisible();
  await page.getByRole("button", { name: "Inizia la carriera" }).click();
  await page.getByRole("button", { name: /College NCAA/ }).click();
  await shot(page, "03-path");
  await page.getByRole("button", { name: "Entra in palestra" }).click();
  await expect(page.locator("[data-pending]").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".career-chrome")).toContainText(NAME);
  await shot(page, "04-career");

  // Double activation on the first decision: exactly one entry lands in the diary.
  const first = page.locator("[data-pending]").first();
  const logBefore = (await save()).log;
  await first.locator("button").first().dblclick({ timeout: 5_000 });
  await page.waitForTimeout(1500);
  const logAfter = (await save()).log;
  expect(logAfter - logBefore, "double click registers at most one decision").toBeLessThanOrEqual(1);

  const kinds = new Set<string>();
  const seen: string[] = [];
  let resumed = false;
  for (let step = 0; step < 300; step += 1) {
    if (await page.locator(".result-view").isVisible().catch(() => false)) break;
    const pending = page.locator("[data-pending]").first();
    await expect(pending).toBeVisible({ timeout: 15_000 });
    const kind = (await pending.getAttribute("class")) ?? "";
    if (!kinds.has(kind)) {
      kinds.add(kind);
      await settle(page, 400);
      await shot(page, `05-card-${kinds.size}`);
    }
    if (!resumed && (await save()).seasons >= 2) {
      // Save + refresh: home offers "Riprendi la vita", the same career and season come back.
      await page.waitForTimeout(1500);
      const before = await save();
      await page.reload();
      const resume = page.getByRole("button", { name: /Riprendi la vita/ });
      if (await resume.isVisible({ timeout: 8_000 }).catch(() => false)) await resume.click();
      await expect(page.locator("[data-pending]").first()).toBeVisible({ timeout: 15_000 });
      await expect(page.locator(".career-chrome")).toContainText(NAME);
      expect((await save()).seasons).toBe(before.seasons);
      await shot(page, "06-resumed");
      resumed = true;
      continue;
    }
    const sig = (await pending.innerText()).slice(0, 160);
    seen.push(sig);
    const tail = seen.slice(-4);
    if (tail.length === 4 && tail.every((x) => x === tail[0])) throw new Error(`career stalled at step ${step}: ${tail[0]}`);
    await pending.locator("button").first().click({ timeout: 5_000 }).catch(() => {});
    await settle(page, 150);
  }
  expect(resumed).toBe(true);
  await expect(page.locator(".result-view")).toBeVisible();
  await expect(page.getByRole("region", { name: "Career Card" })).toContainText(NAME);
  await settle(page, 400);
  await shot(page, "07-final-report");
  await page.getByRole("region", { name: "Career Card" }).screenshot({ path: join(SHOTS, "08-career-card.png") });
  await page.locator(".result-view").getByRole("button", { name: "Archivio", exact: true }).click();
  await expect(page.getByRole("button", { name: new RegExp(NAME) })).toBeVisible();
  await shot(page, "09-archive");
  await page.reload();
  await page.getByRole("button", { name: /Archivio/ }).click();
  await page.getByRole("button", { name: new RegExp(NAME) }).click();
  await expect(page.getByRole("region", { name: "Career Card" })).toContainText(NAME);
  await shot(page, "10-archive-reopened");
  expect(errors).toEqual([]);
  console.log(`G5_SMOKE ${JSON.stringify({ steps: seen.length, cardKinds: [...kinds], seasons: (await save()).seasons })}`);
});
