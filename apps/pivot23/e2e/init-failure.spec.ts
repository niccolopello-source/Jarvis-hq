import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/* A saved career that breaks rendering must not trap the player in a reload loop. */

const here = dirname(fileURLToPath(import.meta.url));

test.beforeAll(() => {
  execFileSync("node", ["--import=tsx", join(here, "fixtures", "make-crash-save.ts")], { cwd: join(here, ".."), stdio: "inherit" });
});

test("a save that crashes the screens: reload alone loops, 'set aside' opens a clean home and keeps a copy", async ({ page }) => {
  const raw = readFileSync(join(here, "fixtures", "crash-save.json"), "utf8");
  await page.addInitScript((saved) => {
    if (!sessionStorage.getItem("__seeded")) {
      sessionStorage.setItem("__seeded", "1");
      localStorage.setItem("pivot-v2-save", saved);
    }
  }, raw);
  await page.goto("/");
  const crash = page.getByRole("heading", { name: "Si è verificato un problema" });
  await expect(crash).toBeVisible();
  // Before the fix this was the only way out, and it led straight back here.
  await page.getByRole("button", { name: "Ricarica PIVOT 23" }).click();
  await expect(crash).toBeVisible();
  await page.getByRole("button", { name: /metti da parte la carriera/ }).click();
  await expect(page.getByRole("button", { name: "Inizia", exact: true })).toBeVisible();
  const kept = await page.evaluate(() => ({
    live: localStorage.getItem("pivot-v2-save"),
    aside: JSON.parse(localStorage.getItem("pivot-v2-save-crashed") || "null") as { raw?: string; reason?: string } | null,
  }));
  expect(kept.live).toBeNull();
  expect(kept.aside?.reason).toBe("crashed");
  expect(kept.aside?.raw).toBe(raw);
  await page.reload();
  await expect(page.getByRole("button", { name: "Inizia", exact: true })).toBeVisible();
});
