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

// P1b: Pello chose a 1280 column cap at 1920 (rails 320).
test("1920x1080: game column caps at 1280 px, rails stay at least 200 px, ads OFF", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openHome(page);
  const m = await metrics(page);
  expect(m.app?.width).toBeGreaterThanOrEqual(1270);
  expect(m.app?.width).toBeLessThanOrEqual(1290);
  const visibleRails = m.rails.filter((r) => r.visible);
  expect(visibleRails.length).toBe(2);
  for (const r of visibleRails) {
    expect(r.width).toBeGreaterThanOrEqual(310);
    expect(r.width).toBeLessThanOrEqual(330);
  }
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

/** Simulate the finished-career home with the real Italian labels:
 *  "Rivedi il finale", "Nuova vita", "Come si gioca", "Archivio", and
 *  "Pareri" when a 5th CTA is needed (Pareri lands with #168).
 */
async function simulateFinishedCareerHome(
  page: import("@playwright/test").Page,
  options: { pareri?: boolean } = {},
) {
  await page.evaluate((pareri) => {
    const hero = document.querySelector(".intro-hero.home-screen");
    const start = hero?.querySelector(":scope > .primary-btn");
    if (!hero || !start) return;
    start.textContent = "Rivedi il finale";
    const wanted = ["Nuova vita", "Come si gioca", "Archivio", ...(pareri ? ["Pareri"] : [])];
    for (const btn of [...hero.querySelectorAll(":scope > .ghost-btn")]) btn.remove();
    let after: Element = start;
    for (const label of wanted) {
      const b = document.createElement("button");
      b.className = "ghost-btn mt-2.5";
      b.textContent = label;
      after.insertAdjacentElement("afterend", b);
      after = b;
    }
  }, options.pareri === true);
}

async function appPadding(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector(".pivot-app")!);
    return { top: cs.paddingTop, bottom: cs.paddingBottom };
  });
}

// 5-CTA compact (Lucille): :has() of primary + four ghost siblings, up to 860px tall.
// Injected on this branch so the assertion does not depend on #168.
test("1280x800 with 5 home CTAs: compact typography, no column overflow, last CTA above the foot", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openHome(page);
  await settleHome(page);
  await simulateFinishedCareerHome(page, { pareri: true });
  const fold = await homeFold(page);
  expect(fold.markW).toBeGreaterThanOrEqual(106);
  expect(fold.markW).toBeLessThanOrEqual(118);
  expect(fold.overflow).toBe(0);
  expect(fold.lastBottom).toBeLessThanOrEqual(fold.footTop + 1);
  const pad = await appPadding(page);
  expect(pad.top).toBe("16px");
  expect(pad.bottom).toBe("16px");
  const m = await metrics(page);
  expect(m.foot?.height).toBeGreaterThanOrEqual(70);
  expect(m.foot?.height).toBeLessThanOrEqual(74);
  expect(m.liveAds).toBe(0);
});

test("1280x720 with 5 home CTAs: compact typography, no column overflow, last CTA above the foot", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openHome(page);
  await settleHome(page);
  await simulateFinishedCareerHome(page, { pareri: true });
  const fold = await homeFold(page);
  expect(fold.markW).toBeGreaterThanOrEqual(106);
  expect(fold.markW).toBeLessThanOrEqual(118);
  expect(fold.overflow).toBe(0);
  expect(fold.lastBottom).toBeLessThanOrEqual(fold.footTop + 1);
  const pad = await appPadding(page);
  expect(pad.top).toBe("16px");
  expect(pad.bottom).toBe("16px");
  const m = await metrics(page);
  expect(m.foot?.visible).toBe(true);
  expect(m.foot?.height).toBeGreaterThanOrEqual(70);
  expect(m.foot?.height).toBeLessThanOrEqual(74);
  expect(m.liveAds).toBe(0);
});

test("1440x900 with 5 home CTAs: compact 860 threshold does not apply, mark stays ~168", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openHome(page);
  await settleHome(page);
  await simulateFinishedCareerHome(page, { pareri: true });
  const fold = await homeFold(page);
  expect(fold.markW).toBeGreaterThanOrEqual(160);
  expect(fold.markW).toBeLessThanOrEqual(176);
  expect(fold.overflow).toBe(0);
});

// P2 polish: from 1180px, title/lede/languages share the centred 640px axis of the CTAs.
test("1280x800: title and Inizia share the centred 640 px axis", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openHome(page);
  await settleHome(page);
  const axis = await page.evaluate(() => {
    const title = document.querySelector(".intro-hero.home-screen > .display-title")?.getBoundingClientRect();
    const lede = document.querySelector(".intro-hero.home-screen > .lede")?.getBoundingClientRect();
    const lang = document.querySelector(".intro-hero.home-screen > .lang-row")?.getBoundingClientRect();
    const start = document.querySelector(".intro-hero.home-screen > .primary-btn")?.getBoundingClientRect();
    return {
      titleX: title && Math.round(title.x),
      ledeX: lede && Math.round(lede.x),
      langX: lang && Math.round(lang.x),
      startX: start && Math.round(start.x),
      startW: start && Math.round(start.width),
      titleW: title && Math.round(title.width),
      langW: lang && Math.round(lang.width),
    };
  });
  expect(axis.startW).toBeLessThanOrEqual(640);
  expect(axis.titleW).toBe(640);
  expect(axis.langW).toBe(640);
  expect(axis.titleX).toBe(axis.startX);
  expect(axis.langX).toBe(axis.startX);
  expect(axis.ledeX).toBe(axis.startX);
});

test("desktop footer and mobile home show Instagram plus X, TikTok and YouTube as Presto, not as links", async ({ page }) => {
  for (const vp of [
    { width: 390, height: 844 },
    { width: 1280, height: 800 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(vp);
    await openHome(page);
    const row = page.locator(vp.width >= 1180 ? ".ad-foot .totem-row" : ".totem-row-home");
    await expect(row).toBeVisible({ timeout: 15_000 });
    const ig = row.locator(".ig-link");
    await expect(ig).toHaveCount(1);
    await expect(ig).toHaveAttribute("href", INSTAGRAM);
    const soon = row.locator(".social-soon");
    await expect(soon).toBeVisible();
    await expect(soon).toHaveAttribute("aria-label", /presto|soon|pronto|即将推出/i);
    const items = soon.locator(".social-soon-item");
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toHaveAttribute("aria-label", /X/i);
    await expect(items.nth(1)).toHaveAttribute("aria-label", /TikTok/i);
    await expect(items.nth(2)).toHaveAttribute("aria-label", /YouTube/i);
    expect(await soon.locator("a").count()).toBe(0);
    expect(await soon.locator("button").count()).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});
