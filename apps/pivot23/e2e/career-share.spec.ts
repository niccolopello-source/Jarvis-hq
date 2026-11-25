import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const savePath = join(here, "fixtures", "retire-save.json");
const SHOTS = process.env.SHARE_SHOTS || process.env.CARD_SHOTS || "";

test.beforeAll(() => {
  execFileSync("node", ["--import=tsx", join(here, "fixtures", "make-retire-save.ts")], { cwd: join(here, ".."), stdio: "inherit" });
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
});

const settle = (page: Page) => page.waitForTimeout(200);

async function shot(page: Page, name: string) {
  if (!SHOTS) return;
  const bar = page.locator("[data-career-share]");
  await bar.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  await bar.screenshot({ path: join(SHOTS, `${name}-bar.png`), animations: "disabled" });
  const card = page.getByRole("region", { name: "Career Card" });
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: false, animations: "disabled" });
  const box = await page.evaluate(() => {
    const c = document.querySelector("[data-career-card]");
    const s = document.querySelector("[data-career-share]");
    if (!c || !s) return null;
    const a = c.getBoundingClientRect();
    const b = s.getBoundingClientRect();
    const left = Math.max(0, Math.min(a.left, b.left) - 16);
    const top = Math.max(0, Math.min(a.top, b.top) - 16);
    const right = Math.min(window.innerWidth, Math.max(a.right, b.right) + 16);
    const bottom = Math.min(window.innerHeight, Math.max(a.bottom, b.bottom) + 16);
    return { x: left, y: top, width: right - left, height: bottom - top };
  });
  if (box && box.width > 0 && box.height > 0) {
    await page.screenshot({ path: join(SHOTS, `${name}-card-share.png`), animations: "disabled", clip: box });
  }
}

async function retireFromSave(page: Page, lang: "it" | "en" = "it") {
  await page.goto("/");
  await page.evaluate(([saved, l]) => {
    localStorage.setItem("pivot-v2-save", saved);
    localStorage.setItem("pivot-lang", l);
  }, [readFileSync(savePath, "utf8"), lang] as const);
  await page.reload();
  await expect(page.getByRole("heading", { name: lang === "it" ? "L'ultimo inverno" : "The last winter" })).toBeVisible();
  await settle(page);
  await page.getByRole("button", { name: lang === "it" ? /Chiudi ora/ : /Retire now/ }).click();
  await expect(page.locator(".result-view")).toBeVisible({ timeout: 15_000 });
  const card = page.getByRole("region", { name: "Career Card" });
  await expect(card).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("[data-career-share]")).toBeVisible();
  return card;
}

async function simulateCareer(page: Page, lang: "it" | "en" = "it", name = "Share Card E2E") {
  await page.goto("/");
  await page.evaluate((l) => localStorage.setItem("pivot-lang", l), lang);
  await page.reload();
  await page.getByRole("button", { name: lang === "it" ? "Inizia" : "Start", exact: true }).click();
  await page.getByLabel(lang === "it" ? "Nome" : "Name").fill(name);
  await settle(page);
  await page.getByRole("button", { name: lang === "it" ? /Simula la carriera/ : /Simulate the career/ }).click();
  const card = page.getByRole("region", { name: "Career Card" });
  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("[data-career-share]")).toBeVisible();
  return card;
}

test("share bar sits under the card, not on it, with Condividi and Scarica PNG", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 390, height: 844 });
  const card = await simulateCareer(page, "it", "Luca Condivisione");
  const bar = page.locator("[data-career-share]");
  await expect(bar).toBeVisible();
  await expect(bar).toHaveAttribute("data-share-layout", "mobile");
  await expect(card.locator("[data-career-share]")).toHaveCount(0);
  await expect(card.getByRole("button")).toHaveCount(0);
  await expect(bar.getByText("Condividi la carriera")).toBeVisible();
  await expect(bar.locator("[data-share-open]")).toBeVisible();
  await expect(bar.locator("[data-export-png]")).toBeVisible();
  await expect(page.locator("[data-share-picker]")).toHaveCount(0);

  await bar.locator("[data-share-open]").click();
  const picker = page.locator("[data-share-picker]");
  await expect(picker).toBeVisible();
  await expect(picker.locator("[data-share=story]")).toBeVisible();
  await expect(picker.locator("[data-share=feed]")).toBeVisible();
  await expect(picker.locator("[data-share=whatsapp]")).toBeVisible();
  await expect(picker.locator("[data-share=copy]")).toBeVisible();

  const preview = (await picker.locator("[data-share-preview]").innerText()).trim();
  expect(preview).toContain("Ho chiuso la carriera di Luca Condivisione su PIVOT 23:");
  expect(preview).toContain("https://www.pivot23.com");
  expect(preview).toContain("@pivot23poweredbytotem");
  expect(preview).toContain("#PIVOT23");
  expect(preview).not.toMatch(/undefined|NaN|null|\{\w+\}/);
  expect(preview).not.toMatch(/diario|contro i |sui |Mavericks|gratis/i);

  await picker.locator("[data-share=copy]").click();
  await expect(page.locator("[data-share-status]")).toHaveText("Link copiato.");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(preview);

  await page.waitForTimeout(400);
  await shot(page, "share-mobile-390");
  expect(errors).toEqual([]);
});

test("desktop picker offers copy, 4:5, 9:16 and WhatsApp Web", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await simulateCareer(page, "en", "Share Card EN");
  const bar = page.locator("[data-career-share]");
  await expect(bar).toHaveAttribute("data-share-layout", "desktop");
  await expect(bar.getByText("Share the career")).toBeVisible();
  await bar.locator("[data-share-open]").click();
  const picker = page.locator("[data-share-picker]");
  await expect(picker.locator("[data-share=copy]")).toHaveText(/Copy link/);
  await expect(picker.locator("[data-share=download-45]")).toBeVisible();
  await expect(picker.locator("[data-share=download-916]")).toBeVisible();
  await expect(picker.locator("[data-share=whatsapp-web]")).toHaveAttribute("href", /https:\/\/web\.whatsapp\.com\/send\?text=/);
  await expect(picker.locator("[data-share=story]")).toHaveCount(0);
  const preview = (await picker.locator("[data-share-preview]").innerText()).trim();
  expect(preview).toContain("I finished Share Card EN's career on PIVOT 23:");
  expect(preview).toContain("https://www.pivot23.com");
  expect(preview).not.toMatch(/\b(stagion[ei]|titoli|carriera|Condividi|Pallacanestro)\b/);
  await shot(page, "share-desktop-1280");
});

test("Instagram Story prepares a 9:16 image and shows the official handle hint", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await retireFromSave(page);
  await page.locator("[data-share-open]").click();
  const download = page.waitForEvent("download");
  await page.locator("[data-share=story]").click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^pivot23-.+-story\.png$/);
  const path = SHOTS ? join(SHOTS, "export-story-916.png") : await file.path();
  if (SHOTS) await file.saveAs(path!);
  const bytes = readFileSync(path!);
  expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([1080, 1920]);
  await expect(page.locator("[data-share-status]")).toContainText("@pivot23poweredbytotem");
  await shot(page, "share-instagram-hint-390");
});

test("desktop Download 9:16 is 1080×1920 and Download 4:5 stays 1080×1350", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await simulateCareer(page, "it", "Formati E2E");
  await page.locator("[data-share-open]").click();
  const d45 = page.waitForEvent("download");
  await page.locator("[data-share=download-45]").click();
  const feed = await d45;
  expect(feed.suggestedFilename()).toMatch(/^pivot23-formati-e2e\.png$/);
  const p45 = SHOTS ? join(SHOTS, "export-feed-45.png") : await feed.path();
  if (SHOTS) await feed.saveAs(p45!);
  const b45 = readFileSync(p45!);
  expect([b45.readUInt32BE(16), b45.readUInt32BE(20)]).toEqual([1080, 1350]);

  const d916 = page.waitForEvent("download");
  await page.locator("[data-share=download-916]").click();
  const story = await d916;
  expect(story.suggestedFilename()).toMatch(/^pivot23-formati-e2e-story\.png$/);
  const p916 = SHOTS ? join(SHOTS, "export-story-916-desktop.png") : await story.path();
  if (SHOTS) await story.saveAs(p916!);
  const b916 = readFileSync(p916!);
  expect([b916.readUInt32BE(16), b916.readUInt32BE(20)]).toEqual([1080, 1920]);
});

test("Altro opens the native sheet with the PNG, the summary and the site link", async ({ page }) => {
  await page.addInitScript(() => {
    const calls: ShareData[] = [];
    Object.defineProperty(window, "__pivotShareCalls", { value: calls, writable: false });
    navigator.canShare = () => true;
    navigator.share = async (data) => {
      calls.push({
        title: data.title,
        text: data.text,
        url: data.url,
        files: data.files ? [...data.files].map((f) => ({ name: f.name, type: f.type, size: f.size })) as unknown as File[] : undefined,
      });
    };
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await simulateCareer(page, "it", "Native Share E2E");
  await page.locator("[data-share-open]").click();
  const more = page.locator("[data-share=more]");
  await expect(more).toBeVisible();
  await shot(page, "share-native-390");
  await more.click();
  await expect.poll(async () => page.evaluate(() => (window as unknown as { __pivotShareCalls: ShareData[] }).__pivotShareCalls.length)).toBe(1);
  const call = await page.evaluate(() => (window as unknown as { __pivotShareCalls: Array<{ title?: string; text?: string; url?: string; files?: Array<{ name: string; type: string; size: number }> }> }).__pivotShareCalls[0]);
  expect(call.title).toBe("PIVOT 23");
  expect(call.url).toBe("https://www.pivot23.com");
  expect(call.text).toContain("Native Share E2E");
  expect(call.text).toContain("@pivot23poweredbytotem");
  expect(call.files).toHaveLength(1);
  expect(call.files![0].type).toBe("image/png");
  expect(call.files![0].name).toMatch(/^pivot23-native-share-e2e\.png$/);
  expect(call.files![0].size).toBeGreaterThan(20_000);
});

test("share bar adds no third-party requests of its own", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (!["127.0.0.1", "localhost"].includes(u.hostname) && !u.protocol.startsWith("blob") && !u.protocol.startsWith("data")) external.push(r.url());
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await retireFromSave(page);
  await page.locator("[data-share-open]").click();
  await expect(page.locator("[data-share=whatsapp-web]")).toHaveAttribute("href", /https:\/\/web\.whatsapp\.com\/send\?text=/);
  expect(external).toEqual([]);
});
