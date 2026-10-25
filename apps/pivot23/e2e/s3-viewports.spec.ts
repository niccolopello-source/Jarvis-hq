import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * S3 (recovery 22/10): the flow home → setup → quick career → Career Card, in IT and EN, at 320 px, 390 px,
 * desktop, and 1280×800 at 200% zoom (= 640×400 CSS px). Each screen: no horizontal overflow, no WCAG 2.1 AA
 * axe violation, no raw placeholder or "undefined/NaN" in the visible text, and every Tab stop has a visible ring.
 */
const VIEWPORTS = { "320": { width: 320, height: 640 }, "390": { width: 390, height: 844 }, "zoom200": { width: 640, height: 400 }, desktop: { width: 1280, height: 800 } };
const L = {
  it: { start: "Inizia", name: "Nome", sim: /Simula la carriera/ },
  en: { start: "Start", name: "Name", sim: /Simulate the career/ },
} as const;

async function screenOk(page: Page, label: string) {
  await page.waitForTimeout(600); // entrance animations at rest before measuring contrast
  const { sw, w } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: document.documentElement.clientWidth }));
  expect(sw, `${label}: horizontal overflow`).toBeLessThanOrEqual(w);
  const ax = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(ax.violations.map((v) => `${label}: ${v.id} ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
  const text = await page.locator("body").innerText();
  expect(text.match(/\{[a-zA-Z_]+\}|\bundefined\b|\bNaN\b|\[object Object\]/g), `${label}: raw placeholder`).toBeNull();
}

async function focusRings(page: Page, label: string, presses: number) {
  for (let i = 0; i < presses; i++) {
    await page.keyboard.press("Tab");
    const r = await page.evaluate(() => {
      const e = document.activeElement as HTMLElement | null;
      if (!e || e === document.body) return null;
      const cs = getComputedStyle(e);
      return { id: `${e.tagName} ${(e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 30)}`, ring: (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== "none" };
    });
    if (r) expect(r.ring, `${label}: no visible focus on ${r.id}`).toBe(true);
  }
}

for (const lang of ["it", "en"] as const) {
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    test(`S3 ${lang} ${vpName}: overflow, axe, placeholders`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto("/");
      await page.evaluate((l) => localStorage.setItem("pivot-lang", l), lang);
      await page.reload();
      await expect(page.getByRole("button", { name: L[lang].start, exact: true })).toBeVisible();
      await expect(page.locator("#boot")).toHaveCount(0);
      await screenOk(page, `${lang} ${vpName} home`);
      await page.getByRole("button", { name: L[lang].start, exact: true }).click();
      await page.getByLabel(L[lang].name).fill("Prova Accesso");
      await screenOk(page, `${lang} ${vpName} setup`);
      await page.waitForTimeout(200); // ghost-click guard
      await page.getByRole("button", { name: L[lang].sim }).click();
      await expect(page.getByRole("region", { name: "Career Card" })).toBeVisible({ timeout: 30_000 });
      await screenOk(page, `${lang} ${vpName} result`);
    });
  }
  test(`S3 ${lang} keyboard: every Tab stop on home and setup shows a focus ring`, async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto("/");
    await page.evaluate((l) => localStorage.setItem("pivot-lang", l), lang);
    await page.reload();
    await expect(page.locator("#boot")).toHaveCount(0);
    await focusRings(page, `${lang} home`, 8);
    await page.getByRole("button", { name: L[lang].start, exact: true }).click();
    await page.getByLabel(L[lang].name).fill("Tastiera");
    await focusRings(page, `${lang} setup`, 30);
  });
}
