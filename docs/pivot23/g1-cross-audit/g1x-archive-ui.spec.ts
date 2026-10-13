import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
const fx = JSON.parse(readFileSync(new URL("./g1x-archive.json", import.meta.url), "utf8")) as { archive: string; corrupt: string };
const open = async (page: import("@playwright/test").Page, v: string) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate((x) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem("pivot-v2-archive", x); }, v);
  await page.reload();
};
test("G1X DEF-02 UI: valid shown clean, wrong and missing fingerprint flagged", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (e) => errors.push(e.message));
  await open(page, fx.archive);
  await page.getByRole("button", { name: /Archivio/ }).first().click();
  await expect(page.locator(".archive-card", { hasText: "XA Valida" })).not.toContainText("da verificare");
  await expect(page.locator(".archive-card", { hasText: "XA Errata" })).toContainText("da verificare");
  await expect(page.locator(".archive-card", { hasText: "XA Senza" })).toContainText("da verificare");
  await page.locator(".archive-card", { hasText: "XA Errata" }).click();
  await expect(page.locator('[data-archive-issue="card-mismatch"]')).toBeVisible();
  await page.goBack().catch(() => {});
  await open(page, fx.archive);
  await page.getByRole("button", { name: /Archivio/ }).first().click();
  await page.locator(".archive-card", { hasText: "XA Senza" }).click();
  await expect(page.locator('[data-archive-issue="card-unverified"]')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("pivot-v2-archive"))).toBe(fx.archive);
  expect(errors).toEqual([]);
});
for (const [label, raw] of [["unparsable", '[{"id":"x"'], ["non-array", '{"a":1}']] as const)
  test(`G1X DEF-03 UI ${label}: notice, raw untouched across reloads`, async ({ page }) => {
    await open(page, raw);
    for (let i = 0; i < 2; i++) {
      await expect(page.locator('[data-archive-load="unreadable"]')).toBeVisible({ timeout: 15000 });
      expect(await page.evaluate(() => localStorage.getItem("pivot-v2-archive"))).toBe(raw);
      await page.reload();
    }
  });
test("G1X DEF-03 UI single corrupt entry: dropped notice, two entries listed", async ({ page }) => {
  await open(page, fx.corrupt);
  await expect(page.locator('[data-archive-load="dropped"]')).toBeVisible({ timeout: 15000 });
  expect(await page.evaluate(() => localStorage.getItem("pivot-v2-archive"))).toBe(fx.corrupt);
  await page.getByRole("button", { name: /Archivio/ }).first().click();
  await expect(page.locator(".archive-card")).toHaveCount(2);
});
