import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/* D-02 / D-05 / D-04 / D-06: no career is lost without the player knowing and agreeing. */

const here = dirname(fileURLToPath(import.meta.url));
const savePath = join(here, "fixtures", "retire-save.json");

test.beforeAll(() => {
  execFileSync("node", ["--import=tsx", join(here, "fixtures", "make-retire-save.ts")], {
    cwd: join(here, ".."),
    stdio: "inherit",
  });
});

/** Seeds the retire-pending save once per tab (not again on reload) and lets tests block archive writes. */
async function seedRetire(page: Page) {
  const raw = readFileSync(savePath, "utf8");
  await page.addInitScript((saved) => {
    const w = window as Window & { __blockArchive?: boolean };
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "pivot-v2-archive" && (w.__blockArchive || sessionStorage.getItem("__e2e_block") === "1")) {
        throw new DOMException("quota", "QuotaExceededError");
      }
      return original.call(this, key, value);
    };
    if (!sessionStorage.getItem("__e2e_seeded")) {
      original.call(sessionStorage, "__e2e_seeded", "1");
      original.call(localStorage, "pivot-v2-save", saved);
    }
  }, raw);
}

async function retireNow(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toBeVisible();
  await page.getByRole("button", { name: /Chiudi ora/ }).click();
  await expect(page.getByRole("button", { name: /Un'altra vita/ })).toBeVisible({ timeout: 10_000 });
}

/** The app drops a second click at the same spot within 120 ms (ghost-tap guard). Real users are slower. */
const settle = (page: Page) => page.waitForTimeout(200);

const liveSave = (page: Page) => page.evaluate(() => localStorage.getItem("pivot-v2-save"));
const archiveLen = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("pivot-v2-archive") || "[]").length as number);

test("finished career with archive written: live save removed, Un'altra vita needs no dialog", async ({ page }) => {
  await seedRetire(page);
  await retireNow(page);
  await expect.poll(() => liveSave(page)).toBeNull();
  expect(await archiveLen(page)).toBe(1);
  await page.getByRole("button", { name: /Un'altra vita/ }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Inizia", exact: true })).toBeVisible();
  // Reload: nothing to resume, the archive still holds the career.
  await page.reload();
  await expect(page.getByRole("button", { name: "Riprendi la vita" })).toHaveCount(0);
  expect(await archiveLen(page)).toBe(1);
});

test("finished career is not resumed as if it were still running", async ({ page }) => {
  await seedRetire(page);
  await retireNow(page);
  await page.getByRole("button", { name: "Archivio", exact: true }).click();
  await page.getByRole("button", { name: /Home/ }).click();
  await expect(page.getByRole("button", { name: "Riprendi la vita" })).toHaveCount(0);
  await page.getByRole("button", { name: "Rivedi il finale" }).click();
  await expect(page.getByRole("button", { name: /Un'altra vita/ })).toBeVisible();
});

test("archive unwritable: live save kept, notice shown, dialog cancel keeps everything", async ({ page }) => {
  await seedRetire(page);
  await page.addInitScript(() => sessionStorage.setItem("__e2e_block", "1"));
  await retireNow(page);
  await expect(page.getByText("non è entrata nell'archivio")).toBeVisible();
  const before = await liveSave(page);
  expect(before).not.toBeNull();

  await page.getByRole("button", { name: /Un'altra vita/ }).click();
  const dialog = page.getByRole("dialog", { name: "Questa carriera non è nell'archivio" });
  await expect(dialog).toBeVisible();
  // Safe action has focus first; Escape cancels.
  await expect(dialog.getByRole("button", { name: "Annulla, tengo la carriera" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(await liveSave(page)).toBe(before);
  await settle(page);

  await page.getByRole("button", { name: /Un'altra vita/ }).click();
  await dialog.getByRole("button", { name: "Annulla, tengo la carriera" }).click();
  await expect(dialog).toHaveCount(0);
  expect(await liveSave(page)).toBe(before);
  await expect(page.getByRole("button", { name: /Un'altra vita/ })).toBeVisible();
  await settle(page);

  // Retry while still blocked: an error, not a fake success.
  await page.getByRole("button", { name: /Un'altra vita/ }).click();
  await dialog.getByRole("button", { name: "Riprova a salvare nell'archivio" }).click();
  await expect(dialog.getByRole("alert")).toContainText("non è ancora scrivibile");
  expect(await liveSave(page)).toBe(before);

  // Storage frees up: retry succeeds, then a new life needs no confirmation.
  await page.evaluate(() => sessionStorage.removeItem("__e2e_block"));
  await settle(page);
  await dialog.getByRole("button", { name: "Riprova a salvare nell'archivio" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("Carriera salvata nell'archivio.")).toBeVisible();
  expect(await archiveLen(page)).toBe(1);
  await settle(page);
  await page.getByRole("button", { name: /Un'altra vita/ }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Inizia", exact: true })).toBeVisible();
  await expect.poll(() => liveSave(page)).toBeNull();
});

test("archive unwritable: confirm deletes once, keyboard reachable, double tap safe", async ({ page }) => {
  await seedRetire(page);
  await page.addInitScript(() => sessionStorage.setItem("__e2e_block", "1"));
  await retireNow(page);
  await page.getByRole("button", { name: /Un'altra vita/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // Tab cycles inside the dialog.
  for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
  expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await dialog.getByRole("button", { name: "Cancella e inizia una nuova vita" }).dblclick();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Inizia", exact: true })).toBeVisible();
  await expect.poll(() => liveSave(page)).toBeNull();
  const errors = await page.locator("[role=alert]").count();
  expect(errors).toBe(0);
});

test("reload during an active career resumes it", async ({ page }) => {
  await seedRetire(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toBeVisible();
});

test("damaged save: the home says so and the data is kept", async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("__e2e_seeded")) {
      sessionStorage.setItem("__e2e_seeded", "1");
      localStorage.setItem("pivot-v2-save", "{\"v\":2,\"broken\"");
    }
  });
  await page.goto("/");
  await expect(page.getByText("salvataggio danneggiato")).toBeVisible();
  await expect(page.getByText("una copia è conservata")).toBeVisible();
  expect(await liveSave(page)).toBe("{\"v\":2,\"broken\"");
  expect(await page.evaluate(() => localStorage.getItem("pivot-v2-save-backup"))).toContain("broken");
});

test("save from a newer version is not opened and not deleted", async ({ page }) => {
  const raw = readFileSync(savePath, "utf8").replace("\"v\":2", "\"v\":9");
  await page.addInitScript((saved) => {
    if (!sessionStorage.getItem("__e2e_seeded")) {
      sessionStorage.setItem("__e2e_seeded", "1");
      localStorage.setItem("pivot-v2-save", saved);
    }
  }, raw);
  await page.goto("/");
  await expect(page.getByText("versione più recente")).toBeVisible();
  expect(await liveSave(page)).toBe(raw);
});

test("browser without storage: the player is told saving is off", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("denied", "SecurityError");
      },
    });
  });
  await page.goto("/");
  await expect(page.getByText("Questo browser non permette di salvare")).toBeVisible();
  await expect(page.getByRole("heading", { name: "PIVOT" })).toBeVisible();
});

test("full archive: the last winter warns which career will leave, the result says it left (D-20)", async ({ page }) => {
  const archive = readFileSync(join(here, "fixtures", "full-archive.json"), "utf8");
  const oldest = (JSON.parse(archive) as { name: string }[]).at(-1)!.name;
  await seedRetire(page);
  await page.addInitScript((saved) => {
    if (!sessionStorage.getItem("__e2e_archive")) {
      sessionStorage.setItem("__e2e_archive", "1");
      localStorage.setItem("pivot-v2-archive", saved);
    }
  }, archive);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toBeVisible();
  await expect(page.getByText(`uscirà la più vecchia: ${oldest}`)).toBeVisible();
  await page.getByRole("button", { name: /Chiudi ora/ }).click();
  await expect(page.getByRole("button", { name: /Un'altra vita/ })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(`è uscita la più vecchia, ${oldest}`)).toBeVisible();
  expect(await archiveLen(page)).toBe(8);
  const names = await page.evaluate(() => (JSON.parse(localStorage.getItem("pivot-v2-archive") || "[]") as { name: string }[]).map((c) => c.name));
  expect(names).not.toContain(oldest);
  expect(names[0]).toBe("Ritiro Test");
});
