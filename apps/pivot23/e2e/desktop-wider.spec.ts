import { expect, test } from "@playwright/test";

/**
 * Desktop wider view: the game column grows from 1440 px up, side rails stay
 * at least 200 px for a future 160x600 ad (still empty; ads stay OFF), the
 * bottom band keeps "Powered by Totem" and the Instagram link, and mobile
 * 390x844 must not change.
 */
const INSTAGRAM = "https://www.instagram.com/pivot23poweredbytotem/";

type Metrics = {
  app: { width: number; x: number } | null;
  rails: { width: number; visible: boolean }[];
  foot: { height: number; visible: boolean } | null;
  credit: string;
  ig: string | null;
  overflow: boolean;
  liveAds: number;
};

async function metrics(page: import("@playwright/test").Page): Promise<Metrics> {
  return page.evaluate(() => {
    const app = document.querySelector(".pivot-app");
    const ab = app?.getBoundingClientRect();
    const rails = [...document.querySelectorAll(".ad-rail")].map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { width: r.width, visible: cs.display !== "none" && r.width > 0 && r.height > 0 };
    });
    const foot = document.querySelector(".ad-foot");
    const fb = foot?.getBoundingClientRect();
    const fcs = foot ? getComputedStyle(foot) : null;
    const creditEl = [...document.querySelectorAll(".totem-credit")].find((el) => {
      const cs = getComputedStyle(el);
      return cs.display !== "none" && cs.visibility !== "hidden" && (el as HTMLElement).offsetParent !== null;
    });
    const visibleIg = [...document.querySelectorAll(".ig-link")].find((el) => {
      const cs = getComputedStyle(el);
      return cs.display !== "none" && (el as HTMLElement).offsetWidth > 0;
    }) as HTMLAnchorElement | undefined;
    return {
      app: ab ? { width: ab.width, x: ab.x } : null,
      rails,
      foot: fb && fcs ? { height: fb.height, visible: fcs.display !== "none" && fb.height > 0 } : null,
      credit: (creditEl?.textContent || "").trim(),
      ig: visibleIg?.href ?? null,
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      liveAds: document.querySelectorAll(".ad-rail-live, ins.adsbygoogle").length,
    };
  });
}

async function openHome(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Inizia", exact: true })).toBeVisible({ timeout: 15_000 });
}

async function startWidth(page: import("@playwright/test").Page): Promise<number | null> {
  const box = await page.getByRole("button", { name: "Inizia", exact: true }).boundingBox();
  return box ? box.width : null;
}


async function settleHome(page: import("@playwright/test").Page) {
  await page.locator("#boot").waitFor({ state: "detached", timeout: 15_000 }).catch(() => {});
  const skip = page.getByRole("button", { name: "Salta", exact: true });
  if (await skip.isVisible().catch(() => false)) await skip.click();
}

async function homeFold(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const app = document.querySelector(".pivot-app");
    const foot = document.querySelector(".ad-foot")?.getBoundingClientRect();
    const mark = document.querySelector(".intro-hero.home-screen .court-mark")?.getBoundingClientRect();
    const last = [...document.querySelectorAll(".intro-hero.home-screen > .primary-btn, .intro-hero.home-screen > .ghost-btn")]
      .at(-1)
      ?.getBoundingClientRect();
    return {
      overflow: app ? app.scrollHeight - app.clientHeight : -1,
      markW: mark ? Math.round(mark.width) : 0,
      lastBottom: last ? Math.round(last.bottom) : 0,
      footTop: foot ? Math.round(foot.top) : 0,
    };
  });
}


test("390x844 mobile: no side or footer rails, column stays narrow, totem+instagram on the home row", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);
  const m = await metrics(page);
  expect(m.app?.width).toBeLessThanOrEqual(580);
  expect(m.rails.every((r) => !r.visible)).toBe(true);
  expect(m.foot?.visible ?? false).toBe(false);
  expect(m.credit).toBe("Powered by Totem");
  expect(m.ig).toBe(INSTAGRAM);
  expect(m.overflow).toBe(false);
  expect(m.liveAds).toBe(0);
});

test("1280x800: 880 px column preserved so each rail stays ~200 px, footer band visible, ads OFF", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openHome(page);
  const m = await metrics(page);
  expect(m.app?.width).toBeGreaterThanOrEqual(870);
  expect(m.app?.width).toBeLessThanOrEqual(890);
  const visibleRails = m.rails.filter((r) => r.visible);
  expect(visibleRails.length).toBe(2);
  for (const r of visibleRails) expect(r.width).toBeGreaterThanOrEqual(190);
  expect(m.foot?.visible).toBe(true);
  expect(m.foot?.height).toBeGreaterThanOrEqual(70);
  expect(m.foot?.height).toBeLessThanOrEqual(74);
  expect(m.credit).toBe("Powered by Totem");
  expect(m.ig).toBe(INSTAGRAM);
  expect(m.overflow).toBe(false);
  expect(m.liveAds).toBe(0);
  expect(await startWidth(page)).toBeLessThanOrEqual(640);
  await expect(page.locator(".ad-rail.ad-rail-off")).toHaveCount(2);
  await settleHome(page);
  const fold800 = await homeFold(page);
  // Compact short-height rules start at max-height 780px; 800 must stay at the 168px mark.
  expect(fold800.markW).toBeGreaterThanOrEqual(160);
  expect(fold800.markW).toBeLessThanOrEqual(176);
});

test("1440x900: game column grows past 880 px, rails stay at least 200 px, ads OFF", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openHome(page);
  const m = await metrics(page);
  expect(m.app?.width).toBeGreaterThanOrEqual(1030);
  expect(m.app?.width).toBeLessThanOrEqual(1050);
  const visibleRails = m.rails.filter((r) => r.visible);
  expect(visibleRails.length).toBe(2);
  for (const r of visibleRails) expect(r.width).toBeGreaterThanOrEqual(200);
  expect(m.foot?.visible).toBe(true);
  expect(m.foot?.height).toBeGreaterThanOrEqual(70);
  expect(m.foot?.height).toBeLessThanOrEqual(74);
  expect(m.credit).toBe("Powered by Totem");
  expect(m.ig).toBe(INSTAGRAM);
  expect(m.overflow).toBe(false);
  expect(m.liveAds).toBe(0);
  expect(await startWidth(page)).toBeLessThanOrEqual(640);
});

// Column cap at 1920 is 1200 today. If Pello picks P1b (1280), change these bounds to 1270–1290.
test("1920x1080: game column grows further, rails stay at least 200 px, ads OFF", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openHome(page);
  const m = await metrics(page);
  expect(m.app?.width).toBeGreaterThanOrEqual(1190);
  expect(m.app?.width).toBeLessThanOrEqual(1210);
  const visibleRails = m.rails.filter((r) => r.visible);
  expect(visibleRails.length).toBe(2);
  for (const r of visibleRails) expect(r.width).toBeGreaterThanOrEqual(200);
  expect(m.foot?.visible).toBe(true);
  expect(m.foot?.height).toBeGreaterThanOrEqual(70);
  expect(m.foot?.height).toBeLessThanOrEqual(74);
  expect(m.credit).toBe("Powered by Totem");
  expect(m.ig).toBe(INSTAGRAM);
  expect(m.overflow).toBe(false);
  expect(m.liveAds).toBe(0);
  expect(await startWidth(page)).toBeLessThanOrEqual(640);
});

// Short-height compact home (Lucille fold fix, max-height 780px). Feasible without
// #168: the default home must not overflow the column, the last CTA must sit
// above the 72px foot, and the court mark shrinks to 112px. 1280x800 is covered
// in the existing test (mark stays ~168).
test("1280x720: short-height home stays compact, no column overflow, last CTA above the foot", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openHome(page);
  await settleHome(page);
  const m = await metrics(page);
  expect(m.app?.width).toBeGreaterThanOrEqual(870);
  expect(m.app?.width).toBeLessThanOrEqual(890);
  expect(m.foot?.visible).toBe(true);
  expect(m.foot?.height).toBeGreaterThanOrEqual(70);
  expect(m.foot?.height).toBeLessThanOrEqual(74);
  expect(m.liveAds).toBe(0);
  expect(await startWidth(page)).toBeLessThanOrEqual(640);
  const fold = await homeFold(page);
  expect(fold.markW).toBeGreaterThanOrEqual(106);
  expect(fold.markW).toBeLessThanOrEqual(118);
  expect(fold.overflow).toBe(0);
  expect(fold.lastBottom).toBeLessThanOrEqual(fold.footTop + 1);
});

test("1366x768: short-height home stays compact, no column overflow, last CTA above the foot", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await openHome(page);
  await settleHome(page);
  const m = await metrics(page);
  expect(m.app?.width).toBeGreaterThanOrEqual(870);
  expect(m.app?.width).toBeLessThanOrEqual(890);
  expect(m.foot?.visible).toBe(true);
  expect(m.foot?.height).toBeGreaterThanOrEqual(70);
  expect(m.foot?.height).toBeLessThanOrEqual(74);
  expect(m.liveAds).toBe(0);
  expect(await startWidth(page)).toBeLessThanOrEqual(640);
  const fold = await homeFold(page);
  expect(fold.markW).toBeGreaterThanOrEqual(106);
  expect(fold.markW).toBeLessThanOrEqual(118);
  expect(fold.overflow).toBe(0);
  expect(fold.lastBottom).toBeLessThanOrEqual(fold.footTop + 1);
});
