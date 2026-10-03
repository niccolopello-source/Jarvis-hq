import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

test.beforeAll(() => {
  execFileSync("node", ["--import=tsx", "/tmp/make-retire-save.ts"], {
    cwd: "/tmp/pivot-a84fa7e/apps/pivot23",
    stdio: "inherit",
  });
});

test("the boot page is a static fallback and the home mark can sweep", async ({ page }) => {
  const html = await (await page.request.get("/")).text();
  expect(html).toContain("Avvio dell");
  expect(html).toContain("prefers-color-scheme: dark");
  expect(html).not.toContain("@keyframes");

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "PIVOT" })).toBeVisible();
  const sweep = page.locator(".court-mark-live.is-sweep .mark-arcs");
  await expect(sweep).toBeVisible();
  const motion = await sweep.evaluate((el) => {
    const lean = document.documentElement.classList.contains("pivot-lean");
    document.documentElement.classList.remove("pivot-lean");
    const name = getComputedStyle(el).animationName;
    return { lean, name };
  });
  expect(motion.name).toBe("markSweep");

  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  await expect.poll(async () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim())).toBe("#1c1c1e");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect.poll(async () => page.locator(".mark-arcs").first().evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
});

test("the year sheet explains the main stats and hides the advanced ones", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await page.getByPlaceholder("Es. Marco Ferrara").fill("Anno Test");
  await page.getByRole("button", { name: "Gioca il Draft" }).click();
  const ready = page.getByRole("heading", { name: "Il tuo giocatore è pronto" });
  for (let round = 0; round < 10 && !(await ready.isVisible().catch(() => false)); round += 1) {
    await page.locator(".draft-card").first().click();
    await page.waitForTimeout(650);
  }
  await page.getByRole("button", { name: "Inizia la carriera" }).click();
  await page.getByRole("button", { name: /College NCAA/ }).click();
  await page.getByRole("button", { name: "Entra in palestra" }).click();
  await page.locator("[data-pending] .choice-btn").first().click();
  await expect(page.getByRole("heading", { name: /Stagione 1 ·/ })).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: "Anno", exact: true }).click();
  await expect(page.getByText("PPG punti, RPG rimbalzi, APG assist, a partita.")).toBeVisible();
  const advanced = page.locator(".adv-stats");
  await expect(advanced).toBeVisible();
  await expect(advanced.getByText("USG%")).toBeHidden();
  await advanced.locator("summary").click();
  await expect(advanced.getByText("USG%")).toBeVisible();

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    const heights = await page.locator(".seg-track button").evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(heights.length).toBeGreaterThan(0);
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
});

test("a failed write shows the warning and a reload keeps the previous save", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const raw = readFileSync("/tmp/retire-save.json", "utf8");
  await page.addInitScript((saved) => {
    localStorage.setItem("pivot-v2-save", saved);
  }, raw);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toBeVisible();
  const before = await page.evaluate(() => localStorage.getItem("pivot-v2-save"));
  await page.evaluate(() => {
    const fail = () => {
      throw new DOMException("quota", "QuotaExceededError");
    };
    localStorage.setItem = fail;
    sessionStorage.setItem = fail;
  });
  await page.getByRole("button", { name: "Gioca a 36 anni" }).click();
  await expect(page.getByRole("alert")).toContainText("non viene cancellato", { timeout: 5_000 });
  expect(await page.evaluate(() => localStorage.getItem("pivot-v2-save"))).toBe(before);
  await page.reload();
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toBeVisible();
});

test("choosing to play at 36 leaves the retirement card", async ({ page }) => {
  const raw = readFileSync("/tmp/retire-save.json", "utf8");
  await page.addInitScript((saved) => {
    localStorage.setItem("pivot-v2-save", saved);
  }, raw);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toBeVisible();
  await page.getByRole("button", { name: "Gioca a 36 anni" }).click();
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toHaveCount(0);
});
