import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/* D-07 / D-12: every main screen in Italian and English, checked with axe (WCAG 2.1 A/AA). */

const here = dirname(fileURLToPath(import.meta.url));
const savePath = join(here, "fixtures", "retire-save.json");

test.beforeAll(() => {
  execFileSync("node", ["--import=tsx", join(here, "fixtures", "make-retire-save.ts")], {
    cwd: join(here, ".."),
    stdio: "inherit",
  });
});

const TEXT = {
  it: { start: "Inizia", setup: "Chi sei sul parquet", retire: "L'ultimo inverno", retireNow: "Chiudi ora", archive: "Archivio", tabs: ["Storia", "Anno", "Lega", "Vita"], how: "Come si gioca", name: "Nome", draft: "Gioca il Draft" },
  en: { start: "Start", setup: "Who you are on the floor", retire: "The last winter", retireNow: "Retire now", archive: "Archive", tabs: ["Story", "Year", "League", "Life"], how: "How to play", name: "Name", draft: "Enter the Draft" },
} as const;

async function axe(page: Page, label: string) {
  await page.waitForTimeout(600); // let entrance animations finish so contrast is measured at rest
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const summary = result.violations.map((v) => `${label}: ${v.id} (${v.impact}) ×${v.nodes.length} ${v.nodes[0]?.target.join(" ")} — ${(v.nodes[0]?.failureSummary ?? "").replace(/\s+/g, " ").slice(0, 220)}`);
  return summary;
}

/** The app ignores taps that land within 120 ms of the previous one (ghost-click guard). */
const settle = (page: Page) => page.waitForTimeout(200);

for (const lang of ["it", "en"] as const) {
  test(`main screens pass axe in ${lang}`, async ({ page: first, context }) => {
    let page = first;
    const L = TEXT[lang];
    const found: string[] = [];
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript((l) => {
      if (!sessionStorage.getItem("__lang_seeded")) {
        sessionStorage.setItem("__lang_seeded", "1");
        localStorage.setItem("pivot-lang", l);
      }
    }, lang);
    await page.goto("/");
    await expect(page.getByRole("button", { name: L.start, exact: true })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    found.push(...(await axe(page, "intro")));

    await page.getByRole("button", { name: L.how }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    found.push(...(await axe(page, "guide")));
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await settle(page);

    await page.getByRole("button", { name: L.start, exact: true }).click();
    await expect(page.getByRole("heading", { name: L.setup })).toBeVisible();
    found.push(...(await axe(page, "setup")));
    await page.getByLabel(L.name).fill("Axe Test");
    await page.getByRole("button", { name: L.draft }).click();
    await expect(page.locator(".draft-card").first()).toBeVisible();
    found.push(...(await axe(page, "draft")));

    // A fresh tab, so the draft career started above cannot overwrite the seeded save on pagehide.
    await page.close();
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width: 390, height: 844 });
    const raw = readFileSync(savePath, "utf8");
    await page.goto("/");
    await page.evaluate((saved) => localStorage.setItem("pivot-v2-save", saved), raw);
    await page.reload();
    await expect(page.getByRole("heading", { name: L.retire })).toBeVisible();
    found.push(...(await axe(page, "career-log")));
    for (const tab of L.tabs.slice(1)) {
      await settle(page);
      await page.getByRole("button", { name: tab, exact: true }).click();
      await settle(page);
      found.push(...(await axe(page, `tab-${tab}`)));
    }
    await page.getByRole("button", { name: L.tabs[0], exact: true }).click();
    await settle(page);
    await page.getByRole("button", { name: new RegExp(L.retireNow) }).click();
    await expect(page.locator(".result-view")).toBeVisible({ timeout: 15_000 });
    found.push(...(await axe(page, "result")));
    await settle(page);
    await page.locator(".result-view").getByRole("button", { name: L.archive, exact: true }).click();
    await expect(page.getByRole("heading", { name: L.archive })).toBeVisible();
    found.push(...(await axe(page, "archive")));

    expect(errors).toEqual([]);
    expect(found).toEqual([]);
  });
}

test("reduced motion: no running animations on the intro", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Inizia", exact: true })).toBeVisible();
  await page.waitForTimeout(400);
  const running = await page.evaluate(() =>
    document.getAnimations().filter((a) => a.playState === "running" && Number(a.effect?.getComputedTiming().duration ?? 0) > 50).length,
  );
  expect(running).toBe(0);
});
