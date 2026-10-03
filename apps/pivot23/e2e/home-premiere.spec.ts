import { expect, test, type Page } from "@playwright/test";

/**
 * Home premiere (`cineReveal`, src/styles.css): the first-visit settle of the home mark.
 * Owner request 2026-10-04: longer than the 6.3 s cut, with the ball and the sounds on the same beats.
 * The lean (≤2 cores) and returning-visit timings stay at 1.6 s; reduced motion never starts it.
 */

const PREMIERE_MS = 9200;
const OLD_PREMIERE_MS = 6300;

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

test("first visit: the premiere lasts 9.2 s and then hands over to the sweep", async ({ page }) => {
  test.setTimeout(30_000);
  await recordPremiere(page);
  await page.goto("/");
  const mark = page.locator(".court-mark-live.is-premiere");
  await expect(mark).toBeVisible();
  expect(await mark.evaluate((el) => getComputedStyle(el).animationDuration)).toBe("9.2s");
  expect(await mark.evaluate((el) => getComputedStyle(el).animationName)).toBe("cineReveal");
  // Past the old 4.8 s end the premiere is still running.
  await page.waitForFunction((ms) => {
    const log = (window as unknown as { __premiere: PremiereLog }).__premiere;
    return log.shownAt > 0 && performance.now() - log.shownAt > ms;
  }, OLD_PREMIERE_MS + 400);
  await expect(mark).toHaveCount(1);
  await expect(page.locator(".court-mark-live.is-premiere")).toHaveCount(0, { timeout: 6_000 });
  const log = await premiereLog(page);
  const lasted = log.hiddenAt - log.shownAt;
  console.log(`PREMIERE_MS ${Math.round(lasted)}`);
  expect(lasted).toBeGreaterThanOrEqual(PREMIERE_MS - 150);
  expect(lasted).toBeLessThan(PREMIERE_MS + 1500);
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
  expect(log.hiddenAt - log.shownAt).toBeLessThan(PREMIERE_MS - 1000);
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
  expect(Date.now() - t0).toBeLessThan(OLD_PREMIERE_MS);
  await page.locator(".back-link").click();
  await expect(page.locator(".is-premiere")).toHaveCount(0);
  await expect(page.locator(".cine-skip")).toHaveCount(0);
  expect((await premiereLog(page)).shows).toBe(0);
});
