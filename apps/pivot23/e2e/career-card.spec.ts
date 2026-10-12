import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/* Missione 2: Career Legacy Report + Career Card, from the real end of career to the archive. */

const here = dirname(fileURLToPath(import.meta.url));
const savePath = join(here, "fixtures", "retire-save.json");
const SHOTS = process.env.CARD_SHOTS || "";

test.beforeAll(() => {
  execFileSync("node", ["--import=tsx", join(here, "fixtures", "make-retire-save.ts")], { cwd: join(here, ".."), stdio: "inherit" });
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
});

const settle = (page: Page) => page.waitForTimeout(200);

async function shot(page: Page, name: string, target?: ReturnType<Page["locator"]>) {
  if (!SHOTS) return;
  if (target) await target.screenshot({ path: join(SHOTS, `${name}.png`), animations: "disabled" });
  else await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true, animations: "disabled" });
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
  await expect(page.locator("[data-legacy-report]")).toBeVisible();
  return card;
}

/** A full career through the real UI: setup, quick simulation, end of career, archive write. */
async function simulateCareer(page: Page, lang: "it" | "en" = "it", name = "Legacy Card E2E") {
  await page.goto("/");
  await page.evaluate((l) => localStorage.setItem("pivot-lang", l), lang);
  await page.reload();
  await page.getByRole("button", { name: lang === "it" ? "Inizia" : "Start", exact: true }).click();
  await page.getByLabel(lang === "it" ? "Nome" : "Name").fill(name);
  await settle(page);
  await page.getByRole("button", { name: lang === "it" ? /Simula la carriera/ : /Simulate the career/ }).click();
  const card = page.getByRole("region", { name: "Career Card" });
  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("[data-legacy-report]")).toBeVisible();
  return card;
}

const noOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test("end of a full career: report and card, archive, reload, reopen — identical data", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  const card = await simulateCareer(page);
  const report = page.locator("[data-legacy-report]");
  for (const h of ["La storia", "Identità", "Carriera", "Premi e riconoscimenti", "Le tappe", "Stagione per stagione"]) {
    await expect(report.getByRole("heading", { name: h, exact: true })).toBeVisible();
  }
  // The card's PPG is the report's PPG.
  const ppgCard = (await card.locator(".lc-stat").filter({ hasText: "PPG" }).locator("dd").textContent())?.trim();
  await expect(report).toContainText(`${ppgCard} PPG`);
  // No placeholders, no invented claims.
  const text = `${await card.textContent()} ${await report.textContent()}`;
  expect(text).not.toMatch(/undefined|NaN|null|\{\w+\}/);
  expect(text).not.toMatch(/autenticat|unic[ao]\b|ufficialmente|rarit|authenticated|officially verified|legendary|epic/i);
  expect(await noOverflow(page)).toBe(true);
  await page.waitForTimeout(800);
  await shot(page, "card-mobile-390", card);
  await shot(page, "result-mobile-390-full");

  const cardBefore = await card.innerText();
  const reportBefore = await report.innerText();
  const careerId = await card.getAttribute("data-career-id");
  expect(careerId).toBeTruthy();

  // Pick a free theme: persisted separately, the career data stay identical.
  await page.locator("[data-theme-option=obsidian]").click();
  await expect(card).toHaveAttribute("data-theme", "obsidian");
  expect(await card.innerText()).toBe(cardBefore);

  await page.locator(".result-view").getByRole("button", { name: "Archivio", exact: true }).click();
  await page.locator(`.archive-card[data-career-id="${careerId}"]`).click();
  await expect(page.getByRole("region", { name: "Career Card" })).toBeVisible();
  expect(await page.getByRole("region", { name: "Career Card" }).innerText()).toBe(cardBefore);

  await page.reload();
  await page.getByRole("button", { name: /Archivio/ }).click();
  await page.locator(`.archive-card[data-career-id="${careerId}"]`).click();
  const again = page.getByRole("region", { name: "Career Card" });
  await expect(again).toBeVisible();
  await expect(again).toHaveAttribute("data-theme", "obsidian");
  expect(await again.innerText()).toBe(cardBefore);
  expect(await page.locator("[data-legacy-report]").innerText()).toBe(reportBefore);
  // A second refresh: still stable.
  await page.reload();
  await page.getByRole("button", { name: /Archivio/ }).click();
  await page.locator(`.archive-card[data-career-id="${careerId}"]`).click();
  expect(await page.getByRole("region", { name: "Career Card" }).innerText()).toBe(cardBefore);
  // Theme lives outside the archive entry and outside the live save.
  const stored = await page.evaluate(() => ({ archive: localStorage.getItem("pivot-v2-archive") ?? "", theme: localStorage.getItem("pivot-v2-card-theme") }));
  expect(stored.theme).toBe("obsidian");
  expect(stored.archive).not.toContain("obsidian");
  expect(stored.archive).toContain("\"legacy\"");
  expect(errors).toEqual([]);
});

test("guest: no login, no network beyond the app, PNG export works locally", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (!["127.0.0.1", "localhost"].includes(u.hostname) && !u.protocol.startsWith("blob") && !u.protocol.startsWith("data")) external.push(r.url());
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  const card = await simulateCareer(page);
  await expect(page.getByText(/accedi|login|sign in|acquista|buy now|checkout/i)).toHaveCount(0);
  const download = page.waitForEvent("download");
  await page.locator("[data-export-png]").click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^pivot23-[a-z0-9-]+\.png$/);
  const path = SHOTS ? join(SHOTS, "export-card.png") : await file.path();
  if (SHOTS) await file.saveAs(path);
  const bytes = readFileSync(path!);
  expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  expect(bytes.readUInt32BE(16)).toBe(1080);
  expect(bytes.readUInt32BE(20)).toBe(1350);
  expect(statSync(path!).size).toBeGreaterThan(20_000);
  await expect(page.getByRole("status").filter({ hasText: "Immagine scaricata." })).toBeVisible();
  await page.waitForTimeout(800);
  await shot(page, "card-desktop-1280", card);
  await shot(page, "result-desktop-1280-full");
  expect(external).toEqual([]);
});

for (const width of [320, 375, 390, 430, 768, 1280]) {
  test(`layout at ${width}px: no horizontal overflow, nothing clipped`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const card = await simulateCareer(page, "it", width === 320 ? "Bartholomew Okonkwo-Vanderberg" : "Legacy Card E2E");
    expect(await noOverflow(page)).toBe(true);
    const clipped = await card.evaluate((el) => {
      const box = el.getBoundingClientRect();
      return [...el.querySelectorAll<HTMLElement>(".lc-name, .lc-meta, .lc-stat, .lc-honors li, .lc-verdict, .lc-number")].filter((n) => {
        const r = n.getBoundingClientRect();
        return r.right > box.right + 0.5 || r.left < box.left - 0.5 || n.scrollWidth > n.clientWidth + 1;
      }).map((n) => n.className);
    });
    expect(clipped).toEqual([]);
    if ([320, 768].includes(width)) {
      await page.waitForTimeout(800);
      await shot(page, `card-${width}`, card);
    }
  });
}

for (const lang of ["it", "en"] as const) {
  test(`axe AA on card and report (${lang})`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await simulateCareer(page, lang);
    await page.waitForTimeout(1200);
    const res = await new AxeBuilder({ page }).include(".legacy-experience").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(res.violations.map((v) => `${v.id} ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
    if (lang === "en") {
      const text = await page.locator(".legacy-experience").innerText();
      expect(text).not.toMatch(/\b(stagion[ei]|squadr[ae]|scelt[ao]|Nessun|In bacheca|La storia)\b/);
      await expect(page.locator("[data-legacy-report]").getByRole("heading", { name: "The story" })).toBeVisible();
      await shot(page, "report-en-390", page.locator("[data-legacy-report]"));
    } else {
      await shot(page, "report-it-390", page.locator("[data-legacy-report]"));
    }
  });
}

test("keyboard: theme buttons and export are reachable and work with Enter", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await retireFromSave(page);
  const btn = page.locator("[data-theme-option=obsidian]");
  await btn.focus();
  await expect(btn).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(btn).toHaveAttribute("aria-pressed", "true");
  await settle(page);
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("[data-theme-option=standard]")).toBeFocused();
  await settle(page);
  await page.keyboard.press("Space");
  await expect(page.getByRole("region", { name: "Career Card" })).toHaveAttribute("data-theme", "standard");
});

test("reduced motion: the card does not animate", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  const card = await retireFromSave(page);
  const running = await card.evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === "running").length);
  expect(running).toBe(0);
});

test("prototype themes are not offered in the default build", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await retireFromSave(page);
  await expect(page.locator("[data-theme-option]")).toHaveCount(2);
  await expect(page.getByText(/Prototipo/)).toHaveCount(0);
});

test("played career closed from the retirement screen: sparse data are omitted, not invented", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const card = await retireFromSave(page);
  const report = page.locator("[data-legacy-report]");
  // The fixture has no season rows: no averages, no totals, no timeline, no table.
  await expect(card.locator(".lc-stats")).toHaveCount(0);
  await expect(report.getByRole("heading", { name: "Le tappe" })).toHaveCount(0);
  await expect(report.getByRole("heading", { name: "Stagione per stagione" })).toHaveCount(0);
  await expect(report).not.toContainText("0,0 PPG");
  await expect(report.getByText("Nessun premio individuale.")).toHaveCount(1);
  await expect(card).toContainText("Ritiro Test");
  const careerId = await card.getAttribute("data-career-id");
  await page.reload();
  await page.getByRole("button", { name: /Archivio/ }).click();
  await page.locator(`.archive-card[data-career-id="${careerId}"]`).click();
  await expect(page.getByRole("region", { name: "Career Card" })).toContainText("Ritiro Test");
});

test("legacy archive entry (written before Missione 2, no facts, no card) still opens after refresh", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const card = await simulateCareer(page, "it", "Vecchio Archivio");
  const careerId = await card.getAttribute("data-career-id");
  await page.evaluate((id) => {
    const all = JSON.parse(localStorage.getItem("pivot-v2-archive") ?? "[]");
    for (const e of all) if (e.careerId === id) { delete e.legacy; delete e.card; delete e.fingerprint; e.choices = []; }
    localStorage.setItem("pivot-v2-archive", JSON.stringify(all));
    localStorage.removeItem("pivot-v2-save");
  }, careerId);
  await page.reload();
  await page.getByRole("button", { name: /Archivio/ }).click();
  await page.locator(`.archive-card[data-career-id="${careerId}"]`).click();
  const again = page.getByRole("region", { name: "Career Card" });
  await expect(again).toContainText("Vecchio Archivio");
  await expect(again.locator(".lc-number")).toHaveCount(0); // jersey was never stored: omitted
  const report = page.locator("[data-legacy-report]");
  await expect(report).not.toContainText("Maglia");
  await expect(report).not.toContainText("scelta");
  await expect(report.getByRole("heading", { name: "Stagione per stagione" })).toBeVisible();
});

test("mobile PNG export downloads a complete 1080×1350 image", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await simulateCareer(page);
  const download = page.waitForEvent("download");
  await page.locator("[data-export-png]").click();
  const file = await download;
  const path = SHOTS ? join(SHOTS, "export-card-mobile.png") : await file.path();
  if (SHOTS) await file.saveAs(path);
  const bytes = readFileSync(path!);
  expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([1080, 1350]);
  expect(bytes.subarray(-8, -4).toString()).toBe("IEND");
});
