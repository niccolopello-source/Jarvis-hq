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

/** CPU profile of the essential taps on the production build, 4× CPU throttling. Prints top self-time by function and chunk. */
test("profile: Inizia tap, story choice and season recap", async ({ page }) => {
  test.setTimeout(240_000);
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const saves = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "fixtures", "path-saves.json"), "utf8")) as Record<string, string>;
  await page.setViewportSize({ width: 390, height: 844 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: Number(process.env.PERF_RATE ?? 4) });
  await page.addInitScript(() => {
    (window as unknown as { __lt: number[] }).__lt = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => (window as unknown as { __lt: number[] }).__lt.push(Math.round(e.duration)))).observe({ type: "longtask", buffered: true });
  });
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.setSamplingInterval", { interval: 200 });
  type Node = { id: number; callFrame: { functionName: string; url: string; lineNumber: number; columnNumber: number }; hitCount?: number };
  const top = (p: { nodes: Node[]; samples: number[]; timeDeltas: number[] }) => {
    const self = new Map<number, number>();
    p.samples.forEach((id, i) => self.set(id, (self.get(id) ?? 0) + (p.timeDeltas[i] ?? 0)));
    const agg = new Map<string, number>();
    for (const n of p.nodes) {
      const f = n.callFrame;
      const key = `${f.functionName || "(anon)"} @${f.url.split("/").pop() || f.url || "native"}:${f.lineNumber + 1}:${f.columnNumber + 1}`;
      agg.set(key, (agg.get(key) ?? 0) + (self.get(n.id) ?? 0) / 1000);
    }
    return [...agg.entries()].filter(([k]) => !/^\((idle|program)\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${v.toFixed(1)}ms ${k}`);
  };
  const measure = async (label: string, act: () => Promise<void>) => {
    await page.evaluate(() => ((window as unknown as { __lt: number[] }).__lt = []));
    await cdp.send("Profiler.start");
    const t = Date.now();
    await act();
    const ms = Date.now() - t;
    const { profile } = await cdp.send("Profiler.stop");
    const lt = await page.evaluate(() => (window as unknown as { __lt: number[] }).__lt);
    console.log(`PROFILE ${label} ${JSON.stringify({ ms, longTasks: lt, top: top(profile as never) }, null, 1)}`);
  };
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Inizia", exact: true }).waitFor();
  await page.waitForTimeout(1500);
  await measure("tap-inizia", async () => {
    await page.getByRole("button", { name: "Inizia", exact: true }).click();
    await page.getByRole("heading", { name: "Chi sei sul parquet" }).waitFor();
  });
  await page.evaluate((v) => { localStorage.clear(); localStorage.setItem("pivot-v2-save", v); }, saves.injury!);
  await page.reload();
  const card = page.locator("[data-pending]").last();
  await card.waitFor();
  await page.waitForTimeout(1500);
  const before = await card.innerText();
  await measure("story-choice", async () => {
    await card.locator("button").first().click();
    await page.waitForFunction((b) => (document.querySelectorAll("[data-pending]")[document.querySelectorAll("[data-pending]").length - 1] as HTMLElement | undefined)?.innerText !== b, before);
  });
  await page.waitForTimeout(1500);
  const before2 = await card.innerText();
  await measure("next-card (season sim when it is the season button)", async () => {
    await card.locator("button").first().click();
    await page.waitForFunction((b) => (document.querySelectorAll("[data-pending]")[document.querySelectorAll("[data-pending]").length - 1] as HTMLElement | undefined)?.innerText !== b, before2);
  });
});
