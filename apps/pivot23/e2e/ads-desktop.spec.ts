import { expect, test, type Page } from "@playwright/test";

/**
 * Ads gate (src/ads). Phones and tablets must never contact an ad host, even in a flag-ON build.
 * Flag-ON cases run only when the dev server was started with VITE_ADS_ENABLED=true and a
 * placeholder VITE_ADSENSE_CLIENT (see PR description); flag-OFF case runs always.
 * Every ad host is aborted: no request ever leaves the test machine.
 */
const AD_HOST = /(googlesyndication\.com|doubleclick\.net|googleadservices\.com|adtrafficquality\.google|fundingchoicesmessages\.google\.com|adservice\.google\.)/;
const FLAG_ON = process.env.VITE_ADS_ENABLED === "true";

async function watchAdRequests(page: Page) {
  const hits: string[] = [];
  await page.route(AD_HOST, (route) => {
    hits.push(route.request().url());
    return route.abort();
  });
  page.on("request", (r) => {
    if (AD_HOST.test(r.url()) && !hits.includes(r.url())) hits.push(r.url());
  });
  return hits;
}

async function settle(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Inizia", exact: true })).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(2500);
}

const DEVICES = {
  phone: {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
  },
  tabletLandscape: {
    viewport: { width: 1366, height: 1024 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; SM-X910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  },
  // iPadOS reports a desktop Mac UA: only touch signals exclude it.
  ipadAsMac: {
    viewport: { width: 1366, height: 1024 },
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  },
} as const;

for (const [name, device] of Object.entries(DEVICES)) {
  test.describe(`ads: ${name}`, () => {
    test.use(device);
    test(`zero requests to ad hosts on ${name}`, async ({ page }) => {
      const hits = await watchAdRequests(page);
      await settle(page);
      expect(hits).toEqual([]);
      await expect(page.locator(".ad-rail-live, ins.adsbygoogle")).toHaveCount(0);
    });
  });
}

test.describe("ads: desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("flag OFF build: desktop also makes zero ad requests and shows the reserved placeholder", async ({ page }) => {
    test.skip(FLAG_ON, "flag-OFF assertion");
    const hits = await watchAdRequests(page);
    await settle(page);
    expect(hits).toEqual([]);
    await expect(page.locator(".ad-rail-live")).toHaveCount(0);
  });

  test("flag ON: desktop requests only the CMP until consent", async ({ page }) => {
    test.skip(!FLAG_ON, "needs VITE_ADS_ENABLED=true");
    const hits = await watchAdRequests(page);
    await settle(page);
    expect(hits.some((u) => u.includes("fundingchoicesmessages.google.com"))).toBe(true);
    expect(hits.some((u) => u.includes("adsbygoogle.js"))).toBe(false);
  });

  test("flag ON: with TCF consent the ad script loads, non-personalised, slot keeps its size", async ({ page }) => {
    test.skip(!FLAG_ON, "needs VITE_ADS_ENABLED=true");
    await page.addInitScript(() => {
      (window as unknown as { __tcfapi: unknown }).__tcfapi = (cmd: string, _v: number, cb: (d: unknown, ok: boolean) => void) => {
        if (cmd === "addEventListener") cb({ eventStatus: "tcloaded", gdprApplies: true, purpose: { consents: { 1: true } }, listenerId: 1 }, true);
      };
    });
    const hits = await watchAdRequests(page);
    await settle(page);
    expect(hits.some((u) => u.includes("adsbygoogle.js"))).toBe(true);
    expect(await page.evaluate(() => (window as unknown as { adsbygoogle?: { requestNonPersonalizedAds?: number } }).adsbygoogle?.requestNonPersonalizedAds)).toBe(1);
    const box = await page.locator(".ad-slot").first().boundingBox();
    expect(box?.width).toBe(160);
    expect(box?.height).toBe(616);
    // Shrinking below the threshold closes the slots.
    await page.setViewportSize({ width: 1100, height: 900 });
    await expect(page.locator(".ad-rail-live")).toHaveCount(0);
  });
});
