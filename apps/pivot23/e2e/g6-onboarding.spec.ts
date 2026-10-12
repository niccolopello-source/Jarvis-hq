import { expect, test, type Page } from "@playwright/test";

/** G6: first impression — home, Inizia and the hand-off to career creation. */
const start = (page: Page) => page.getByRole("button", { name: "Inizia", exact: true });
const setupHeading = (page: Page) => page.getByRole("heading", { name: "Chi sei sul parquet" });

async function fresh(page: Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(start(page)).toBeVisible();
}

for (const vp of [{ width: 844, height: 390 }, { width: 667, height: 375 }, { width: 640, height: 360 }]) {
  test(`landscape phone ${vp.width}×${vp.height}: Inizia is on screen without scrolling`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(vp);
    await fresh(page);
    const box = (await start(page).boundingBox())!;
    expect(box.y + box.height, "Inizia bottom edge inside the first screen").toBeLessThanOrEqual(vp.height);
    await expect(page.getByRole("heading", { name: "PIVOT", level: 1 })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
}

test("keyboard: Enter on Inizia hands focus to the setup heading, page starts at the top", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await fresh(page);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await start(page).focus();
  await page.keyboard.press("Enter");
  await expect(setupHeading(page)).toBeVisible();
  await expect(setupHeading(page)).toBeFocused();
  expect(await page.evaluate(() => Math.round(scrollY))).toBe(0);
  // Next Tab goes into the form, not back to the top of the document.
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.closest("section") !== null)).toBe(true);
});

test("double tap on Inizia opens setup once and Home goes back cleanly", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await fresh(page);
  await start(page).dblclick();
  await expect(setupHeading(page)).toHaveCount(1);
  await page.getByRole("button", { name: /Home/ }).click();
  await expect(start(page)).toBeVisible();
  await expect(page.locator(".cine-skip")).toHaveCount(0); // the premiere is not replayed
  expect(errors).toEqual([]);
});

test("audio unavailable: AudioContext throws, the home and Inizia still work", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const boom = function () { throw new Error("blocked"); } as unknown as typeof AudioContext;
    Object.defineProperty(window, "AudioContext", { value: boom, configurable: true });
    Object.defineProperty(window, "webkitAudioContext", { value: boom, configurable: true });
  });
  await page.setViewportSize({ width: 375, height: 667 });
  await fresh(page);
  await page.getByRole("button", { name: /Suoni/i }).click();
  await start(page).click();
  await expect(setupHeading(page)).toBeVisible();
  expect(errors).toEqual([]);
});

test("the premiere ends: nothing keeps animating on the home", async ({ page }) => {
  test.setTimeout(40_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await fresh(page);
  await expect(page.locator(".cine-skip")).toHaveCount(0, { timeout: 20_000 });
  await page.waitForTimeout(500);
  const running = () => page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").map((a) => `${(a as CSSAnimation).animationName ?? "?"}@${(a.effect as KeyframeEffect | null)?.target?.className ?? ""}:${a.effect?.getComputedTiming().iterations}`));
  console.log("RUNNING", JSON.stringify(await running()));
  await expect.poll(running, { timeout: 15_000 }).toEqual([]);
});
