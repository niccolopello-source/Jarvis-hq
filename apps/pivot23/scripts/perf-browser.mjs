/* global window, requestAnimationFrame -- page.evaluate callbacks run in the browser */
/**
 * Phase F: in-browser cost of the main interactions on a production build (Chromium headless).
 *   AUDIT_URL=http://127.0.0.1:4192 node scripts/perf-browser.mjs [cpuThrottle=4]
 * Measures long tasks (>50 ms) and wall time for: boot to "Inizia", a simulated full career,
 * one played season (first choice to recap), and Storia/Anno/Lega/Vita tab switches.
 * CPU throttling (CDP) approximates a mid-range phone; it is not a real-device measurement.
 */
import { chromium } from "@playwright/test";

const BASE = process.env.AUDIT_URL ?? "http://127.0.0.1:4192";
const THROTTLE = Number(process.argv[2] ?? 4);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
await ctx.addInitScript(() => {
  window.__lt = [];
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: "longtask", buffered: true });
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
await cdp.send("Performance.enable");
const out = { throttle: THROTTLE };
const lt = () => page.evaluate(() => window.__lt.splice(0));
const sumLt = (xs) => ({ count: xs.length, maxMs: Math.max(0, ...xs.map((x) => x[1])), totalMs: xs.reduce((a, x) => a + x[1], 0) });
const heap = async () => {
  const { metrics } = await cdp.send("Performance.getMetrics");
  return +(metrics.find((m) => m.name === "JSHeapUsedSize").value / 1e6).toFixed(1);
};

let t = Date.now();
await page.goto(BASE);
await page.getByRole("button", { name: "Inizia", exact: true }).waitFor();
out.bootToStartMs = Date.now() - t;
out.bootLongTasks = sumLt(await lt());
out.heapAfterBootMB = await heap();

// Simulated full career.
await page.getByRole("button", { name: "Inizia", exact: true }).click();
await page.getByPlaceholder("Es. Marco Ferrara").fill("Perf Sim");
await lt();
t = Date.now();
await page.getByRole("button", { name: /Simula la carriera/ }).click();
await page.getByRole("region", { name: "Career Card" }).waitFor({ timeout: 120_000 });
out.simCareerMs = Date.now() - t;
out.simCareerLongTasks = sumLt(await lt());
out.heapAfterSimMB = await heap();

// One played season: fresh career, then click through to the first recap.
await page.evaluate(() => localStorage.removeItem("pivot-v2-save"));
await page.goto(BASE);
await page.getByRole("button", { name: "Inizia", exact: true }).click();
await page.getByPlaceholder("Es. Marco Ferrara").fill("Perf Season");
await page.getByRole("button", { name: "Gioca il Draft" }).click();
const ready = page.getByRole("heading", { name: "Il tuo giocatore è pronto" });
for (let r = 0; r < 12 && !(await ready.isVisible().catch(() => false)); r += 1) {
  await page.locator(".draft-card").first().click();
  await page.waitForTimeout(700);
}
await page.getByRole("button", { name: "Inizia la carriera" }).click();
await page.getByRole("button", { name: /College NCAA/ }).click();
await page.getByRole("button", { name: "Entra in palestra" }).click();
await page.locator("[data-pending]").first().waitFor();
await lt();
t = Date.now();
let clicks = 0;
const recap = page.getByRole("heading", { name: /Stagione 1 ·/ });
while (!(await recap.isVisible().catch(() => false)) && clicks < 40) {
  await page.locator("[data-pending] button").first().click({ timeout: 10_000 }).catch(() => {});
  clicks += 1;
  await page.waitForTimeout(150);
}
out.seasonClicks = clicks;
out.seasonWallMs = Date.now() - t; // includes 150 ms waits between clicks
out.seasonLongTasks = sumLt(await lt());

// Tab switches.
const tabs = ["Anno", "Lega", "Vita", "Storia", "Lega", "Anno"];
const times = [];
await lt();
for (const name of tabs) {
  await page.waitForTimeout(250);
  const t0 = Date.now();
  await page.getByRole("button", { name, exact: true }).click();
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  times.push([name, Date.now() - t0]);
}
out.tabSwitchMs = times;
out.tabLongTasks = sumLt(await lt());
out.heapEndMB = await heap();
console.log(JSON.stringify(out, null, 2));
await browser.close();
