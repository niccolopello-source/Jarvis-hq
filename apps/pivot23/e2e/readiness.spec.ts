import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/* Phase E/G (demo readiness): layout across phone, tablet and desktop widths, keyboard focus,
   and one full career played start to archive with a reload in the middle. */

const here = dirname(fileURLToPath(import.meta.url));
/** Other spec files rewrite the fixtures in their beforeAll; retry until a complete file is read. */
function fixture(name: string) {
  for (let i = 0; ; i += 1) {
    const raw = readFileSync(join(here, "fixtures", name), "utf8");
    try {
      JSON.parse(raw);
      return raw;
    } catch (error) {
      if (i > 20) throw error;
      execFileSync("sleep", ["0.1"]);
    }
  }
}
const retireSave = () => fixture("retire-save.json");
const fullArchive = () => fixture("full-archive.json");

test.beforeAll(() => {
  execFileSync("node", ["--import=tsx", join(here, "fixtures", "make-retire-save.ts")], { cwd: join(here, ".."), stdio: "inherit" });
});

const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 740 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 667, height: 375 },
  { width: 844, height: 390 },
  { width: 640, height: 400 }, // 1280×800 at 200 % zoom
];

/** The app drops a second tap within 120 ms of the previous one (ghost-tap guard). */
const settle = (page: Page, ms = 250) => page.waitForTimeout(ms);

/** Horizontal overflow and controls that are too small to hit, on the screen currently shown. */
async function layout(page: Page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const shown = (el: Element) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0 && r.width > 0 && r.height > 0;
    };
    const clipped = (el: Element) => {
      const r = el.getBoundingClientRect();
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        if (p.getAttribute("aria-hidden") === "true" || p.hasAttribute("inert")) return true;
        if (/(hidden|auto|scroll|clip)/.test(getComputedStyle(p).overflowX)) {
          const pr = p.getBoundingClientRect();
          if (r.right > pr.right + 1 || r.left < pr.left - 1) return true;
        }
      }
      return false;
    };
    const name = (el: Element) => `${el.tagName.toLowerCase()}.${String((el as HTMLElement).className).split(" ")[0]} "${((el as HTMLElement).innerText ?? "").trim().slice(0, 30)}"`;
    const outside = [...document.querySelectorAll("body *")]
      .filter((el) => shown(el) && !clipped(el))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.right > vw + 1 || r.left < -1;
      })
      .map(name);
    const tiny = [...document.querySelectorAll("button, a[href], input, [role=button]")]
      .filter((el) => shown(el) && !el.closest("[inert]"))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width < 24 || r.height < 24; // WCAG 2.2 AA 2.5.8
      })
      .map(name);
    return { overflow: document.documentElement.scrollWidth - vw, outside, tiny };
  });
}

async function expectClean(page: Page, label: string) {
  await settle(page, 400);
  const r = await layout(page);
  expect.soft(r.overflow, `${label}: page wider than viewport`).toBeLessThanOrEqual(1);
  expect.soft(r.outside, `${label}: elements outside viewport`).toEqual([]);
  expect.soft(r.tiny, `${label}: targets under 24×24`).toEqual([]);
}

async function seed(page: Page, entries: Record<string, string>) {
  await page.goto("/");
  await page.evaluate((e) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(e)) localStorage.setItem(k, v);
  }, entries);
  await page.reload();
}

for (const vp of VIEWPORTS) {
  test(`no horizontal overflow or tiny targets at ${vp.width}×${vp.height}`, async ({ page: first, context }) => {
    let page = first;
    test.setTimeout(60_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(vp);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await seed(page, {});
    await expect(page.getByRole("button", { name: "Inizia", exact: true })).toBeVisible();
    await expectClean(page, "home");
    await page.getByRole("button", { name: "Inizia", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Chi sei sul parquet" })).toBeVisible();
    await expectClean(page, "setup");
    await page.getByPlaceholder("Es. Marco Ferrara").fill("Massimiliano Della Valle-Giordano");
    await page.getByRole("button", { name: "Gioca il Draft" }).click();
    await expect(page.locator(".draft-card").first()).toBeVisible();
    await expectClean(page, "draft");

    // A fresh tab: the draft career above would otherwise overwrite the seeded save on pagehide.
    await page.close();
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(vp);
    await seed(page, { "pivot-v2-save": retireSave(), "pivot-v2-archive": fullArchive() });
    await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toBeVisible();
    await expectClean(page, "career");
    // The fixed career header must leave most of a short screen to the story.
    const chrome = await page.locator(".career-chrome").boundingBox();
    expect.soft(chrome!.height / vp.height, "career header share of the screen").toBeLessThanOrEqual(0.46); // was 0.53-0.55 on landscape phones
    for (const tab of ["Anno", "Lega", "Vita"]) {
      await settle(page);
      await page.getByRole("button", { name: tab, exact: true }).click();
      await expectClean(page, `tab ${tab}`);
    }
    await page.getByRole("button", { name: "Storia", exact: true }).click();
    await settle(page);
    await page.getByRole("button", { name: /Chiudi ora/ }).click();
    await expect(page.locator(".result-view")).toBeVisible({ timeout: 15_000 });
    await expectClean(page, "result");
    await settle(page);
    await page.locator(".result-view").getByRole("button", { name: "Archivio", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Archivio" })).toBeVisible();
    await expectClean(page, "archive");
    expect(errors).toEqual([]);
  });
}

test("career header text keeps AA contrast on every NBA club colour", async ({ page }) => {
  test.setTimeout(120_000);
  execFileSync("node", ["--import=tsx", join(here, "fixtures", "make-hud-saves.ts")], { cwd: join(here, ".."), stdio: "inherit" });
  const saves = JSON.parse(fixture("hud-saves.json")) as Record<string, string>;
  expect(Object.keys(saves).length).toBeGreaterThanOrEqual(25);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const failures: string[] = [];
  for (const [i, [abbr, save]] of Object.entries(saves).entries()) {
    await page.emulateMedia({ colorScheme: i % 3 === 2 ? "dark" : "light" }); // every third club in dark mode
    await page.setViewportSize(abbr < "M" ? { width: 320, height: 568 } : { width: 390, height: 844 });
    await seed(page, { "pivot-v2-save": save });
    await expect(page.locator(".career-chrome .hud-line")).toBeVisible();
    await settle(page, 500);
    const r = await new AxeBuilder({ page }).include(".career-chrome").withRules(["color-contrast"]).analyze();
    failures.push(...r.violations.flatMap((v) => v.nodes.map((n) => `${abbr}: ${n.target.join(" ")} ${(n.failureSummary ?? "").slice(60, 160)}`)));
  }
  expect(failures).toEqual([]);
});

test("keyboard only: every focused control shows a ring and focus follows the new story card", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Inizia", exact: true })).toBeVisible();
  const ring = () =>
    page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return "body";
      const s = getComputedStyle(el);
      return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2 ? "ring" : `none:${el.tagName}.${el.className}`;
    });
  for (let i = 0; i < 4; i += 1) {
    await page.keyboard.press("Tab");
    expect(await ring()).toBe("ring");
  }
  await page.getByRole("button", { name: "Inizia", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Chi sei sul parquet" })).toBeVisible();
  await page.getByPlaceholder("Es. Marco Ferrara").focus();
  expect(await ring()).toBe("ring");

  await seed(page, { "pivot-v2-save": retireSave() });
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toBeVisible();
  const play = page.getByRole("button", { name: /Gioca a 36 anni/ });
  await play.focus();
  expect(await ring()).toBe("ring");
  await page.keyboard.press("Enter");
  // The used button is gone; focus must land on the next card, not fall back to <body>.
  await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest("[data-pending]"))), { timeout: 15_000 }).toBe(true);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest("[data-pending]")) && document.activeElement?.tagName === "BUTTON")).toBe(true);
});

test("a full career: draft to retirement to archive, with a reload in the middle", async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await seed(page, {});
  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await page.getByPlaceholder("Es. Marco Ferrara").fill("Demo Completa");
  await page.getByRole("button", { name: "Gioca il Draft" }).click();
  const ready = page.getByRole("heading", { name: "Il tuo giocatore è pronto" });
  for (let round = 0; round < 12 && !(await ready.isVisible().catch(() => false)); round += 1) {
    await page.locator(".draft-card").first().click();
    await page.waitForTimeout(650);
  }
  await page.getByRole("button", { name: "Inizia la carriera" }).click();
  await page.getByRole("button", { name: /College NCAA/ }).click();
  await page.getByRole("button", { name: "Entra in palestra" }).click();

  const season = () =>
    page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("pivot-v2-save") ?? "null");
      const save = raw?.data ?? raw;
      return (save?.player?.seasonHistory?.length as number | undefined) ?? 0;
    });
  let reloaded = false;
  let before = { seasons: 0, name: "" };
  const seen: string[] = [];
  const checked = new Set<string>();
  const contrast: string[] = [];
  for (let step = 0; step < 300; step += 1) {
    if (await page.locator(".result-view").isVisible().catch(() => false)) break;
    const pending = page.locator("[data-pending]").first();
    await expect(pending).toBeVisible({ timeout: 15_000 });
    if (!reloaded && (await season()) >= 6) {
      // Mid-career: let the debounced save land, reload, and expect the same career back.
      await page.waitForTimeout(1500);
      before = { seasons: await season(), name: (await page.locator(".career-chrome .font-display").first().innerText()).trim() };
      await page.reload();
      await expect(page.locator("[data-pending]").first()).toBeVisible({ timeout: 15_000 });
      expect(await season()).toBe(before.seasons);
      await expect(page.locator(".career-chrome")).toContainText(before.name);
      reloaded = true;
      continue;
    }
    // Every card the career shows (story, playoff, market, trade) is checked for AA contrast once per kind.
    const kind = await pending.getAttribute("class");
    if (kind && !checked.has(kind)) {
      checked.add(kind);
      await settle(page, 450);
      const r = await new AxeBuilder({ page }).include("[data-pending]").withRules(["color-contrast"]).analyze();
      contrast.push(...r.violations.flatMap((v) => v.nodes.map((n) => `${kind}: ${n.target.join(" ")} ${(n.failureSummary ?? "").slice(60, 150)}`)));
    }
    const sig = (await pending.innerText()).slice(0, 160);
    seen.push(sig);
    const tail = seen.slice(-4);
    if (tail.length === 4 && tail.every((x) => x === tail[0])) throw new Error(`career stalled at step ${step}: ${tail[0]}`);
    await pending.locator("button").first().click({ timeout: 5_000 }).catch(() => {});
    await settle(page, 150);
  }
  expect(reloaded, "the career reached season 6 and was reloaded").toBe(true);
  expect(contrast).toEqual([]);
  await expect(page.locator(".result-view")).toBeVisible();
  await expect(page.getByRole("region", { name: "Career Card" })).toContainText("Demo Completa");
  await settle(page);
  await page.locator(".result-view").getByRole("button", { name: "Archivio", exact: true }).click();
  await expect(page.getByRole("button", { name: /Demo Completa/ })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /Archivio/ }).click();
  await page.getByRole("button", { name: /Demo Completa/ }).click();
  await expect(page.getByRole("region", { name: "Career Card" })).toContainText("Demo Completa");
  expect(await page.evaluate(() => localStorage.getItem("pivot-v2-save"))).toBeNull();
  expect(errors).toEqual([]);
  console.log(`FULL_CAREER ${JSON.stringify({ steps: seen.length, reloadedAtSeason: before.seasons, cardKinds: [...checked] })}`);
});
