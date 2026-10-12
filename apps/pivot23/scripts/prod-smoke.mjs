// Read-only production smoke (G5). Usage: node scripts/prod-smoke.mjs [url] [outDir]
// Loads the page in headless Chromium, records console/page errors, failed requests and the
// assets served, checks the "Inizia" button appears, and screenshots home + setup. No save is written
// on the server; only the local browser profile (thrown away) is touched.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const url = process.argv[2] || "https://www.pivot23.com";
const out = process.argv[3] || "test-results/prod-smoke";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [], failed = [], assets = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));
page.on("requestfailed", (r) => failed.push(`${r.url()} ${r.failure()?.errorText}`));
page.on("response", (r) => { if (r.url().includes("/assets/")) assets.push(`${r.status()} ${new URL(r.url()).pathname}`); });
const t0 = Date.now();
const res = await page.goto(url, { waitUntil: "load" });
const start = page.getByRole("button", { name: /^(Inizia|Start)$/ });
let startVisibleMs = null;
try { await start.waitFor({ state: "visible", timeout: 15000 }); startVisibleMs = Date.now() - t0; } catch {}
await page.screenshot({ path: join(out, "prod-home.png") });
const bg = await page.evaluate(() => {
  const b = document.body.innerText.trim().length;
  return { textChars: b, rootChildren: document.getElementById("root")?.childElementCount ?? 0 };
});
let setup = false;
if (startVisibleMs !== null) {
  await start.click();
  setup = await page.locator("#setup-name").isVisible({ timeout: 8000 }).catch(() => false);
  await page.screenshot({ path: join(out, "prod-setup.png") });
}
const result = { url, status: res?.status(), startVisibleMs, setupReached: setup, ...bg, assets: [...new Set(assets)], errors, failed, at: new Date().toISOString() };
writeFileSync(join(out, "prod-smoke.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
process.exit(result.status === 200 && startVisibleMs !== null && setup && errors.length === 0 && failed.length === 0 ? 0 : 1);
