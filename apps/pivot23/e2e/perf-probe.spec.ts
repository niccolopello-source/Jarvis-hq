import { test } from "@playwright/test";

/**
 * Lab measurement, not a gate: run with PERF=1 E2E_PREVIEW=1 against the production build.
 * Chromium headless on the shared box with 4× CPU throttling via CDP. Not a real device.
 */
test.skip(!process.env.PERF, "measurement only: set PERF=1");

test("startup and first interactions on a throttled phone viewport", async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.addInitScript(() => {
    (window as unknown as { __lt: number[] }).__lt = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => (window as unknown as { __lt: number[] }).__lt.push(Math.round(e.duration)))).observe({ type: "longtask", buffered: true });
  });
  const runs: Record<string, number>[] = [];
  for (let i = 0; i < 12; i += 1) {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    const t0 = Date.now();
    await page.reload();
    await page.getByRole("button", { name: "Inizia", exact: true }).waitFor();
    const ready = Date.now() - t0;
    const nav = await page.evaluate(() => {
      const n = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? -1;
      const js = performance.getEntriesByType("resource").filter((r) => r.name.endsWith(".js")).reduce((a, r) => a + (r as PerformanceResourceTiming).transferSize, 0);
      return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), fcp: Math.round(fcp), jsTransfer: js };
    });
    const t1 = Date.now();
    await page.getByRole("button", { name: "Inizia", exact: true }).click();
    await page.getByRole("heading", { name: "Chi sei sul parquet" }).waitFor();
    const tap = Date.now() - t1;
    const lt = await page.evaluate(() => (window as unknown as { __lt: number[] }).__lt);
    runs.push({ ready, ...nav, tapToSetup: tap, longTasks: lt.length, maxLongTask: Math.max(0, ...lt) });
  }
  const pct = (k: string, p: number) => { const v = runs.map((r) => r[k]).sort((a, b) => a - b); return v[Math.min(v.length - 1, Math.ceil(p * v.length) - 1)]; };
  const sum = Object.fromEntries(["ready", "fcp", "dcl", "tapToSetup", "maxLongTask"].map((k) => [k, { p50: pct(k, 0.5), p75: pct(k, 0.75), p95: pct(k, 0.95) }]));
  console.log(`PERF ${JSON.stringify({ throttle: "4x CPU", viewport: "390x844", runs: runs.length, jsTransfer: runs[0].jsTransfer, sum })}`);
});
