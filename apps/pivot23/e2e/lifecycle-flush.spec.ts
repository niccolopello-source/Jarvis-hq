import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/* G6.1: a career already in RAM must survive pagehide and visibility hidden before the delayed save. */

const here = dirname(fileURLToPath(import.meta.url));
const savePath = join(here, "fixtures", "retire-save.json");

test.beforeAll(() => {
  execFileSync("node", ["--import=tsx", join(here, "fixtures", "make-retire-save.ts")], {
    cwd: join(here, ".."),
    stdio: "inherit",
  });
});

async function openRetire(page: Page) {
  const raw = readFileSync(savePath, "utf8");
  await page.addInitScript((saved) => {
    if (!sessionStorage.getItem("__e2e_seeded")) {
      sessionStorage.setItem("__e2e_seeded", "1");
      localStorage.setItem("pivot-v2-save", saved);
    }
  }, raw);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toBeVisible();
}

/** Drops the persisted copy while RAM still holds the career, then fires the lifecycle event. */
async function dropAndFire(page: Page, kind: "pagehide" | "hidden") {
  return page.evaluate((eventKind) => {
    localStorage.removeItem("pivot-v2-save");
    const started = performance.now();
    if (eventKind === "pagehide") {
      window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false }));
    } else {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      document.dispatchEvent(new Event("visibilitychange"));
    }
    const raw = localStorage.getItem("pivot-v2-save");
    return { raw, ms: performance.now() - started, asleep: document.documentElement.classList.contains("pivot-asleep") };
  }, kind);
}

test("pagehide flushes the career still only in RAM", async ({ page }) => {
  await openRetire(page);
  const flushed = await dropAndFire(page, "pagehide");
  expect(flushed.ms).toBeLessThan(50);
  expect(flushed.raw).toContain("Ritiro Test");
});

test("visibility hidden flushes the career still only in RAM and marks the tab asleep", async ({ page }) => {
  await openRetire(page);
  const flushed = await dropAndFire(page, "hidden");
  expect(flushed.ms).toBeLessThan(50);
  expect(flushed.raw).toContain("Ritiro Test");
  expect(flushed.asleep).toBe(true);
});

test("returning visible does not invent a second career or clear the flush", async ({ page }) => {
  await openRetire(page);
  const flushed = await dropAndFire(page, "hidden");
  expect(flushed.raw).toContain("Ritiro Test");
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("pivot-v2-save"))).toContain("Ritiro Test");
  expect(await page.evaluate(() => document.documentElement.classList.contains("pivot-asleep"))).toBe(false);
});

test("a second pagehide and a following visibility hidden stay idempotent", async ({ page }) => {
  await openRetire(page);
  const first = await dropAndFire(page, "pagehide");
  const second = await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false }));
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false }));
    return localStorage.getItem("pivot-v2-save");
  });
  expect(second).toBe(first.raw);
});

test("pagehide after the delayed save does not drop or rewrite the career", async ({ page }) => {
  await openRetire(page);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("pivot-v2-save"))).toContain("Ritiro Test");
  const before = await page.evaluate(() => localStorage.getItem("pivot-v2-save"));
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
  expect(await page.evaluate(() => localStorage.getItem("pivot-v2-save"))).toBe(before);
});

test("pagehide and visibility hidden with no career do not create a save", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Inizia", exact: true })).toBeVisible();
  const after = await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false }));
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
    return localStorage.getItem("pivot-v2-save");
  });
  expect(after).toBeNull();
});

test("the ordinary delayed save still lands without a lifecycle event", async ({ page }) => {
  await openRetire(page);
  await page.evaluate(() => localStorage.removeItem("pivot-v2-save"));
  await expect.poll(() => page.evaluate(() => localStorage.getItem("pivot-v2-save")), { timeout: 3_000 }).toContain("Ritiro Test");
});
