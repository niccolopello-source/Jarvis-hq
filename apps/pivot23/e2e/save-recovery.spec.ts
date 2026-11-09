import { expect, test, type Page } from "@playwright/test";

/* Corrupted save & recovery audit (SR-01/SR-02). Synthetic saves in a fresh browser context per test. */

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  return errors;
}

const FUTURE = JSON.stringify({ v: 9, screen: "career", tab: "log", player: { name: "SR Futuro" }, pending: null, log: [], c: "x" });

test("SR-02 future save stays read-only even after quota recovers; no fallback career or rotation", async ({ page }) => {
  const errors = watchErrors(page);
  await page.addInitScript((saved) => {
    const original = Storage.prototype.setItem;
    Object.defineProperty(window,"__restoreSyntheticQuota",{value:()=>{Storage.prototype.setItem=original;}});
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
  const protection=page.getByTestId("live-protection");
  await expect(protection).toHaveAttribute("data-reason","data");
  await expect(protection).toHaveAttribute("data-ready","true");
  await expect(page.getByRole("button",{name:"Inizia",exact:true})).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Esporta localStorage/pivot-v2-save",exact:true})).toBeVisible();
  const snapshot=()=>page.evaluate(()=>[localStorage.getItem("pivot-v2-save"),sessionStorage.getItem("pivot-v2-save"),localStorage.getItem("pivot-v2-save-backup"),sessionStorage.getItem("pivot-v2-save-backup")]);
  expect(await snapshot()).toEqual([FUTURE,null,null,null]);
  await page.evaluate(()=>(window as unknown as {__restoreSyntheticQuota():void}).__restoreSyntheticQuota());
  await page.getByRole("button",{name:"Riprova",exact:true}).click();
  await expect(protection).toHaveAttribute("data-reason","data");
  await page.waitForTimeout(800);
  expect(await snapshot()).toEqual([FUTURE,null,null,null]);
  await page.goto("/robots.txt");
  expect(await snapshot()).toEqual([FUTURE,null,null,null]);
  await page.goBack();
  await expect(protection).toHaveAttribute("data-reason","data");
  await page.reload();
  await expect(protection).toHaveAttribute("data-ready","true");
  expect(await snapshot()).toEqual([FUTURE,null,null,null]);
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
