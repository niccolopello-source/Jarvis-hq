import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const savePath = join(here, "fixtures", "retire-save.json");
const hofPath = join(here, "fixtures", "hof-archive.json");
const SHOTS = process.env.HOLO_SHOTS || process.env.CARD_SHOTS || "";

test.beforeAll(() => {
  execFileSync("node", ["--import=tsx", join(here, "fixtures", "make-retire-save.ts")], { cwd: join(here, ".."), stdio: "inherit" });
  execFileSync("node", ["--import=tsx", join(here, "fixtures", "make-hof-archive.ts")], { cwd: join(here, ".."), stdio: "inherit" });
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
});

const settle = (page: Page) => page.waitForTimeout(200);

async function shot(page: Page, name: string, target?: ReturnType<Page["locator"]>) {
  if (!SHOTS) return;
  if (target) await target.screenshot({ path: join(SHOTS, `${name}.png`), animations: "disabled" });
  else await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true, animations: "disabled" });
}

async function retireFromSave(page: Page) {
  await page.goto("/");
  await page.evaluate(([saved]) => {
    localStorage.setItem("pivot-v2-save", saved);
    localStorage.setItem("pivot-lang", "it");
  }, [readFileSync(savePath, "utf8")] as const);
  await page.reload();
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toBeVisible();
  await settle(page);
  await page.getByRole("button", { name: /Chiudi ora/ }).click();
  await expect(page.locator(".result-view")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("region", { name: "Career Card" })).toBeVisible({ timeout: 15_000 });
}

async function openHofArchive(page: Page) {
  const entry = readFileSync(hofPath, "utf8");
  await page.goto("/");
  await page.evaluate((raw) => {
    localStorage.setItem("pivot-lang", "it");
    localStorage.removeItem("pivot-v2-save");
    localStorage.setItem("pivot-v2-archive", raw.startsWith("[") ? raw : `[${raw}]`);
  }, entry);
  await page.reload();
  await page.getByRole("button", { name: /Archivio/ }).click();
  await page.locator(".archive-card").first().click();
  await expect(page.getByRole("region", { name: "Career Card" })).toBeVisible({ timeout: 15_000 });
}

test("just-retired career opens the ceremony first, then the figurine", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await retireFromSave(page);
  const ceremony = page.locator("[data-ceremony]");
  await expect(ceremony).toBeVisible();
  await expect(ceremony.getByRole("heading", { name: /sale tra i travi/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "Career Card" })).toBeVisible();
  await shot(page, "ceremony-mobile-390", ceremony);
  await page.locator("[data-ceremony-continue]").click();
  await expect(ceremony).toHaveCount(0);
  await expect(page.locator("[data-ceremony-replay]")).toBeVisible();
  await expect(page.getByRole("region", { name: "Career Card" })).toBeVisible();
  await page.locator("[data-ceremony-replay]").click();
  await expect(page.locator("[data-ceremony]")).toBeVisible();
  await page.locator("[data-ceremony-skip]").click();
  await expect(page.locator("[data-ceremony]")).toHaveCount(0);
});

test("archive reopen does not autoplay the ceremony; Prisma from real seed 26 is unlocked", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHofArchive(page);
  await expect(page.locator("[data-ceremony]")).toHaveCount(0);
  const card = page.getByRole("region", { name: "Career Card" });
  await expect(card).toContainText("Nico Prisma");
  await expect(card).toHaveAttribute("data-theme", "prisma");
  await expect(card).toHaveAttribute("data-foil", "prism");
  await expect(card.locator("[data-card-seal]")).toHaveText("Mito");
  await expect(page.locator("[data-theme-option=prisma]")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-theme-option]:not([data-locked])")).toHaveCount(5);
  await expect(page.locator("[data-frame-unlock]")).toContainText("Prisma");
  await expect(page.locator("[data-frame-unlock]")).toContainText("solo cosmetico");
  await page.locator("[data-theme-option=standard]").click();
  await expect(card).toHaveAttribute("data-theme", "standard");
  await expect(card).toContainText("Nico Prisma");
  await page.locator("[data-theme-option=prisma]").click();
  await expect(card).toHaveAttribute("data-theme", "prisma");
  await page.locator("[data-ceremony-replay]").click();
  await expect(page.locator("[data-ceremony]")).toBeVisible();
  await expect(page.locator("[data-plaque]")).toContainText("Nico Prisma");
  await page.locator("[data-ceremony-continue]").click();
  await shot(page, "card-prisma-390", card);
  await shot(page, "end-career-mobile-390-full");
});

test("desktop 1440: ceremony, then figurine with the frame collection beside it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openHofArchive(page);
  const card = page.getByRole("region", { name: "Career Card" });
  await expect(card).toHaveAttribute("data-theme", "prisma");
  const collection = page.locator("[data-frame-collection]");
  await expect(collection).toBeVisible();
  const sideBySide = await page.evaluate(() => {
    const stage = document.querySelector(".lc-stage") as HTMLElement | null;
    const cardEl = document.querySelector("[data-career-card]") as HTMLElement | null;
    const frames = document.querySelector("[data-frame-collection]") as HTMLElement | null;
    if (!stage || !cardEl || !frames) return false;
    const s = getComputedStyle(stage);
    return s.gridTemplateColumns.split(" ").filter(Boolean).length >= 2 && cardEl.getBoundingClientRect().right <= frames.getBoundingClientRect().left + 1;
  });
  expect(sideBySide).toBe(true);
  await page.locator("[data-ceremony-replay]").click();
  await expect(page.locator("[data-ceremony]")).toBeVisible();
  await shot(page, "ceremony-desktop-1440", page.locator("[data-ceremony]"));
  await page.locator("[data-ceremony-continue]").click();
  await shot(page, "card-prisma-1440", card);
  await shot(page, "end-career-desktop-1440-full");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("reduced motion: ceremony and card have no running animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await retireFromSave(page);
  const ceremony = page.locator("[data-ceremony]");
  await expect(ceremony).toBeVisible();
  const running = await page.locator(".legacy-experience").evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === "running").length);
  expect(running).toBe(0);
  await page.locator("[data-ceremony-skip]").click();
  const card = page.getByRole("region", { name: "Career Card" });
  const cardRunning = await card.evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === "running").length);
  expect(cardRunning).toBe(0);
});

test("English ceremony and frames have no leftover Italian", async ({ page }) => {
  const entry = readFileSync(hofPath, "utf8");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate((raw) => {
    localStorage.setItem("pivot-lang", "en");
    localStorage.removeItem("pivot-v2-save");
    localStorage.setItem("pivot-v2-archive", raw.startsWith("[") ? raw : `[${raw}]`);
  }, entry);
  await page.reload();
  await page.getByRole("button", { name: /Archive|Archivio/ }).click();
  await page.locator(".archive-card").first().click();
  const card = page.getByRole("region", { name: "Career Card" });
  await expect(card).toBeVisible();
  await expect(card.locator("[data-card-seal]")).toHaveText("Mythic");
  await expect(page.locator("[data-frame-unlock]")).toContainText("cosmetic only");
  await page.locator("[data-ceremony-replay]").click();
  await expect(page.locator("[data-ceremony]")).toContainText("Hall of Legends");
  const text = await page.locator(".legacy-experience").innerText();
  expect(text).not.toMatch(/\b(stagion[ei]|squadr[ae]|scelt[ao]|Nessun|In bacheca|La storia|Cornice|Maglia ritirata|Sala delle)\b/);
});
