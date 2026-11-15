import { expect, test } from "@playwright/test";

/**
 * AdSense content pages: every URL in the sitemap answers 200 with real text and no JavaScript,
 * and the in-game link row stays on the home screen only, clear of the rails and the reserved footer.
 */
async function sitemapRoutes(request: import("@playwright/test").APIRequestContext): Promise<string[]> {
  const xml = await (await request.get("/sitemap.xml")).text();
  return [...xml.matchAll(/<loc>https:\/\/www\.pivot23\.com(\/[^<]*)<\/loc>/g)].map((m) => m[1]).filter((r) => r !== "/");
}

test("every sitemap page returns 200 with substantial text without JavaScript", async ({ browser, request }) => {
  // The Vite dev server injects its client script and SPA fallback; the built site (CI: E2E_PREVIEW) is what ships.
  test.skip(!process.env.E2E_PREVIEW, "static pages are checked on the production build");
  const routes = await sitemapRoutes(request);
  expect(routes.length).toBe(32);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const route of routes) {
    const res = await page.goto(route);
    expect(res?.status(), route).toBe(200);
    expect(res?.headers()["content-type"] ?? "", route).toContain("text/html");
    if (process.env.E2E_PREVIEW) expect(res?.headers()["content-security-policy"] ?? "", route).toContain("script-src 'self'");
    await expect(page.locator("script")).toHaveCount(0);
    const text = (await page.locator("main").innerText()).trim();
    const words = text.split(/\s+/).length;
    expect(words, `${route}: ${words} words`).toBeGreaterThanOrEqual(/\/(termini|terms|contatti|contact)\//.test(route) ? 140 : 350);
    await expect(page.locator("footer a[href='/']").first()).toBeVisible();
  }
  await context.close();
});

for (const vp of [{ width: 393, height: 852 }, { width: 1440, height: 900 }]) {
  test(`home shows the site links discreetly, clear of rails and footer, at ${vp.width}x${vp.height}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto("/");
    const nav = page.locator(".home-screen .site-links");
    await expect(nav).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".site-links")).toHaveCount(1);
    await expect(nav.locator("a")).toHaveCount(8);
    await expect(nav.locator("a[href='/privacy/']")).toHaveText("Privacy");
    await nav.scrollIntoViewIfNeeded();
    const n = (await nav.boundingBox())!;
    for (const sel of [".ad-rail:visible", ".ad-foot:visible", ".home-screen .primary-btn"]) {
      for (const el of await page.locator(sel).all()) {
        const r = (await el.boundingBox())!;
        const overlap = n.x < r.x + r.width && n.x + n.width > r.x && n.y < r.y + r.height && n.y + n.height > r.y;
        expect(overlap, `${sel} overlaps the link row`).toBe(false);
      }
    }
    for (const a of await nav.locator("a").all()) expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(24);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    // English UI points to the English pages; leaving the home screen removes the row.
    await page.getByRole("button", { name: "English" }).click();
    await expect(nav.locator("a[href='/en/guide/']")).toHaveText("Guide");
    await page.locator(".home-screen .primary-btn").click();
    await expect(page.locator(".site-links")).toHaveCount(0);
  });
}
