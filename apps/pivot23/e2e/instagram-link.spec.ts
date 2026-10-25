import { expect, test } from "@playwright/test";

const HREF = "https://www.instagram.com/pivot23poweredbytotem/";

for (const vp of [{ width: 375, height: 667 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }, { width: 1440, height: 900 }]) {
  test(`instagram icon sits bottom-left on the Totem row at ${vp.width}x${vp.height}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto("/");
    const credit = page.locator(vp.width >= 1180 ? ".ad-foot .totem-credit" : ".totem-home");
    await expect(credit).toBeVisible({ timeout: 15000 });
    const link = page.locator(".ig-link:visible");
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute("href", HREF);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link).toHaveAttribute("aria-label", /PIVOT 23 (su|on) Instagram/);
    const l = (await link.boundingBox())!;
    const c = (await credit.boundingBox())!;
    expect(l.width).toBeGreaterThanOrEqual(44);
    expect(l.height).toBeGreaterThanOrEqual(44);
    // same row: vertical centres within 2px; link left of the centred credit text
    expect(Math.abs((l.y + l.height / 2) - (c.y + c.height / 2))).toBeLessThanOrEqual(2);
    expect(l.x).toBeLessThan(vp.width / 2);
    // actually tappable (not swallowed by pointer-events:none parents)
    const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest(".ig-link") !== null, { x: l.x + l.width / 2, y: l.y + l.height / 2 });
    expect(hit).toBe(true);
    // no overlap with the reserved ad rails
    for (const rail of await page.locator(".ad-rail:visible").all()) {
      const r = (await rail.boundingBox())!;
      const overlap = l.x < r.x + r.width && l.x + l.width > r.x && l.y < r.y + r.height && l.y + l.height > r.y;
      expect(overlap).toBe(false);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("instagram label follows the language", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".ig-link:visible")).toHaveAttribute("aria-label", "PIVOT 23 su Instagram", { timeout: 15000 });
});
