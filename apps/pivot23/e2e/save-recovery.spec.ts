import { expect, test, type Page } from "@playwright/test";

/* Corrupted save & recovery audit (SR-01/SR-02). Synthetic saves in a fresh browser context per test. */

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  return errors;
}

const FUTURE = JSON.stringify({ v: 9, screen: "career", tab: "log", player: { name: "SR Futuro" }, pending: null, log: [], c: "x" });

test("SR-02 future save, no room for its backup: the home says it is kept, a new career does not overwrite it", async ({ page }) => {
  const errors = watchErrors(page);
  await page.addInitScript((saved) => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "pivot-v2-save-backup" && this === localStorage) throw new DOMException("full", "QuotaExceededError");
      return original.call(this, key, value);
    };
    if (!sessionStorage.getItem("__e2e_seeded")) {
      original.call(sessionStorage, "__e2e_seeded", "1");
      original.call(localStorage, "pivot-v2-save", saved);
    }
  }, FUTURE);
  await page.goto("/");
  await expect(page.getByText("versione più recente")).toBeVisible();
  await expect(page.getByText("una nuova vita non lo sovrascrive")).toBeVisible();
  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await page.getByPlaceholder("Es. Marco Ferrara").fill("SR Nuova");
  await page.getByRole("button", { name: "Gioca il Draft" }).click();
  await page.locator(".draft-card").first().click();
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => localStorage.getItem("pivot-v2-save"))).toBe(FUTURE);
  expect(await page.evaluate(() => sessionStorage.getItem("pivot-v2-save"))).toContain("SR Nuova");
  await expect(page.locator(".app-notice").filter({ hasText: /salv/i }).first()).toBeVisible();
  await page.reload();
  expect(await page.evaluate(() => localStorage.getItem("pivot-v2-save"))).toBe(FUTURE);
  expect(errors).toEqual([]);
});

test("SR-C7 unreadable archive: the notice shows on every load, the raw is kept, no crash or console error", async ({ page }) => {
  const errors = watchErrors(page);
  const raw = "[{\"id\":\"sr-old\",\"name\":\"SR Vecchia\",\"trunc";
  await page.addInitScript((saved) => {
    if (!sessionStorage.getItem("__e2e_seeded")) {
      sessionStorage.setItem("__e2e_seeded", "1");
      localStorage.setItem("pivot-v2-archive", saved);
    }
  }, raw);
  await page.goto("/");
  await expect(page.locator("[data-archive-load=unreadable]")).toBeVisible();
  await page.reload();
  await expect(page.locator("[data-archive-load=unreadable]")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("pivot-v2-archive"))).toBe(raw);
  await expect(page.getByRole("heading", { name: "PIVOT" })).toBeVisible();
  expect(errors).toEqual([]);
});
