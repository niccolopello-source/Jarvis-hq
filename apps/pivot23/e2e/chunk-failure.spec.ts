import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/* D-03: a lazy chunk that fails must not take the screen down. */

const here = dirname(fileURLToPath(import.meta.url));
const savePath = join(here, "fixtures", "retire-save.json");

test.beforeAll(() => {
  execFileSync("node", ["--import=tsx", join(here, "fixtures", "make-retire-save.ts")], {
    cwd: join(here, ".."),
    stdio: "inherit",
  });
});

test.beforeEach(async ({ page }) => {
  const raw = readFileSync(savePath, "utf8");
  await page.addInitScript((saved) => {
    if (!sessionStorage.getItem("__e2e_seeded")) {
      sessionStorage.setItem("__e2e_seeded", "1");
      localStorage.setItem("pivot-v2-save", saved);
    }
  }, raw);
});

test("chart chunk keeps failing: bounded retries, stable fallback, career still playable", async ({ page }) => {
  let requests = 0;
  await page.route(/CareerChart/, (route) => {
    requests += 1;
    return route.abort("failed");
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toBeVisible();
  await page.getByRole("button", { name: "Vita", exact: true }).click();
  const box = page.locator(".chunk-fallback");
  await expect(box).toContainText("Non è stato possibile caricare il grafico");
  await expect(box).toContainText("La carriera non è toccata");
  for (let i = 0; i < 2; i++) {
    await page.waitForTimeout(200);
    await box.getByRole("button", { name: "Riprova" }).click();
  }
  await expect(box).toContainText("non è disponibile adesso");
  await expect(box.getByRole("button")).toHaveCount(0);
  const seen = requests;
  await page.waitForTimeout(1000);
  expect(requests, "no automatic retry loop").toBe(seen);
  // The rest of the career screen still works.
  await expect(page.getByRole("heading", { name: "Curva overall" })).toBeVisible();
  await page.getByRole("button", { name: "Storia", exact: true }).click();
  await page.getByRole("button", { name: "Gioca a 36 anni" }).click();
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("pivot-v2-save"))).not.toBeNull();
  expect(errors).toEqual([]);
});

test("chart chunk fails once: retry loads the chart", async ({ page }) => {
  let fail = true;
  await page.route(/CareerChart/, (route) => {
    if (fail) {
      fail = false;
      return route.abort("failed");
    }
    return route.continue();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Vita", exact: true }).click();
  const box = page.locator(".chunk-fallback");
  await expect(box).toBeVisible();
  await box.getByRole("button", { name: "Riprova" }).click();
  await expect(page.locator(".chunk-fallback")).toHaveCount(0);
  await expect(page.locator(".recharts-wrapper, .h-44 svg").first()).toBeVisible();
});
