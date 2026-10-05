import { expect, test, type Page } from "@playwright/test";

/**
 * Home premiere (`cineReveal`): one logo reveal, 4.8 s, on every device.
 * No basketball. Reduced motion never starts it.
 */

const OPENING_MS = 4800;

type PremiereLog = { shownAt: number; hiddenAt: number; shows: number };

/** Records when `.is-premiere` appears/disappears and pins a non-lean core count so the full timing applies. */
async function recordPremiere(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, get: () => 8 });
    const log = { shownAt: 0, hiddenAt: 0, shows: 0 };
    (window as unknown as { __premiere: typeof log }).__premiere = log;
    let on = false;
    new MutationObserver(() => {
      const now = !!document.querySelector(".court-mark-live.is-premiere");
      if (now && !on) {
        log.shows += 1;
        if (!log.shownAt) log.shownAt = performance.now();
      }
      if (!now && on && !log.hiddenAt) log.hiddenAt = performance.now();
      on = now;
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
  });
}

const premiereLog = (page: Page) => page.evaluate(() => (window as unknown as { __premiere: PremiereLog }).__premiere);
const start = (page: Page) => page.getByRole("button", { name: "Inizia", exact: true });

test("the logo premiere lasts 4.8 s and never draws a basketball", async ({ page }) => {
  test.setTimeout(20_000);
  await recordPremiere(page);
  await page.goto("/");
  const mark = page.locator(".court-mark-live.is-premiere");
  await expect(mark).toBeVisible();
  await expect(page.locator(".cine-ball-body, .cine-net, .cine-shadow")).toHaveCount(0);
  expect(await mark.evaluate((el) => getComputedStyle(el).animationDuration)).toBe("4.8s");
  expect(await mark.evaluate((el) => getComputedStyle(el).animationName)).toBe("cineReveal");
  await page.waitForFunction((ms) => {
    const log = (window as unknown as { __premiere: PremiereLog }).__premiere;
    return log.shownAt > 0 && performance.now() - log.shownAt > ms;
  }, 2500);
  await expect(mark).toHaveCount(1);
  await expect(page.locator(".court-mark-live.is-premiere")).toHaveCount(0, { timeout: 6_000 });
  const log = await premiereLog(page);
  const lasted = log.hiddenAt - log.shownAt;
  expect(lasted).toBeGreaterThanOrEqual(OPENING_MS - 150);
  expect(lasted).toBeLessThan(OPENING_MS + 1500);
  expect(log.shows).toBe(1);
  await expect(page.locator(".court-mark-live.is-sweep")).toBeVisible({ timeout: 4_000 });
});

test("Start works during the premiere and going back home does not replay it", async ({ page }) => {
  await recordPremiere(page);
  await page.goto("/");
  await expect(page.locator(".court-mark-live.is-premiere")).toBeVisible();
  await start(page).click(); // real click, mid-premiere
  await expect(page.getByPlaceholder("Es. Marco Ferrara")).toBeVisible();
  await page.locator(".back-link").click();
  await expect(start(page)).toBeVisible();
  await expect(page.locator(".is-premiere")).toHaveCount(0);
  await expect(page.locator(".cine-skip")).toHaveCount(0);
  // And again after the premiere would have ended: still a single showing for the session.
  await start(page).click();
  await page.locator(".back-link").click();
  await expect(page.locator(".is-premiere")).toHaveCount(0);
  expect((await premiereLog(page)).shows).toBe(1);
});

test("Salta ends the premiere at once and it never comes back in the session", async ({ page }) => {
  await recordPremiere(page);
  await page.goto("/");
  await expect(page.locator(".court-mark-live.is-premiere")).toBeVisible();
  await page.getByRole("button", { name: "Salta", exact: true }).click();
  await expect(page.locator(".is-premiere")).toHaveCount(0);
  const log = await premiereLog(page);
  expect(log.hiddenAt - log.shownAt).toBeLessThan(OPENING_MS - 1000);
  await start(page).click();
  await page.locator(".back-link").click();
  await expect(page.locator(".is-premiere")).toHaveCount(0);
  expect((await premiereLog(page)).shows).toBe(1);
});

test("reduced motion: no premiere, no skip chip, Start usable straight away", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await recordPremiere(page);
  const t0 = Date.now();
  await page.goto("/");
  await start(page).click();
  await expect(page.getByPlaceholder("Es. Marco Ferrara")).toBeVisible();
  expect(Date.now() - t0).toBeLessThan(8000);
  await page.locator(".back-link").click();
  await expect(page.locator(".is-premiere")).toHaveCount(0);
  await expect(page.locator(".cine-skip")).toHaveCount(0);
  expect((await premiereLog(page)).shows).toBe(0);
});

test("mobile, iPad and desktop share the same logo premiere", async ({ page }) => {
  for (const size of [
    { width: 390, height: 844 },
    { width: 1024, height: 1366 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("/");
    const mark = page.locator(".court-mark-live.is-premiere");
    await expect(mark).toBeVisible();
    await expect(page.locator(".cine-ball-body, .cine-net, .cine-shadow")).toHaveCount(0);
    expect(await mark.evaluate((el) => getComputedStyle(el).animationDuration)).toBe("4.8s");
    await expect(page.getByRole("heading", { name: "PIVOT" })).toBeVisible();
  }
});
