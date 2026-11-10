import { expect, test, type Page } from "@playwright/test";

/* Four clear doors + Storia is home (owner decision 2026-11-10): Anno / Lega / Vita open as sheets
   over the diary, Storia never unmounts, a waiting decision always reopens on Storia, no swipe. */

const settle = (page: Page, ms = 250) => page.waitForTimeout(ms);

async function startCareer(page: Page, name = "Porte Chiare") {
  await page.goto("/");
  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await page.getByPlaceholder("Es. Marco Ferrara").fill(name);
  await page.getByRole("button", { name: "Gioca il Draft" }).click();
  const ready = page.getByRole("heading", { name: "Il tuo giocatore è pronto" });
  for (let r = 0; r < 12 && !(await ready.isVisible().catch(() => false)); r += 1) {
    await page.locator(".draft-card").first().click();
    await page.waitForTimeout(650);
  }
  await page.getByRole("button", { name: "Inizia la carriera" }).click();
  await page.getByRole("button", { name: /College NCAA/ }).click();
  await page.getByRole("button", { name: "Entra in palestra" }).click();
  await expect(page.locator("[data-pending] .choice-btn").first()).toBeVisible();
}

/** Plays decisions (never while a card is held) until the season-end card is on screen. */
async function toSeasonEnd(page: Page) {
  const recap = page.locator("[data-pending] .ghost-btn").filter({ hasText: /Prossima stagione|Entra nei playoff/ });
  for (let i = 0; i < 60; i += 1) {
    await page.waitForTimeout(600);
    const held = (await page.locator(".pending-beat.is-held").count()) > 0;
    if (!held && (await recap.isVisible().catch(() => false))) return;
    if (held) continue;
    const b = page.locator("[data-pending] button:not(.recap-door)").first();
    if (await b.isVisible().catch(() => false)) await b.click({ timeout: 3000 }).catch(() => {});
  }
  throw new Error("season end not reached");
}

const doors = (page: Page) => page.getByRole("navigation", { name: "Sezioni della carriera" });
const door = (page: Page, name: string) => doors(page).getByRole("button", { name, exact: true });

test("sheets open over the diary, close with X, Storia, Escape or a drag, and the diary keeps its place", async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await startCareer(page);
  // No swipe hint, no pager, four doors with Storia active and the waiting-decision badge.
  await expect(page.getByText("Scorri tra Storia, Anno, Lega, Vita")).toHaveCount(0);
  await expect(page.locator(".swipe-pager, .seg-track")).toHaveCount(0);
  await expect(doors(page).getByRole("button")).toHaveCount(4);
  await expect(door(page, "Storia")).toHaveAttribute("aria-pressed", "true");
  await expect(door(page, "Storia")).toHaveAccessibleDescription("1 scelta in attesa");

  await toSeasonEnd(page);
  const story = page.getByRole("region", { name: "Storia" });
  await story.evaluate((el) => (el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight - 120)));
  await settle(page);
  const y = await story.evaluate((el) => el.scrollTop);
  expect(y).toBeGreaterThan(0);

  // Anno: a sheet, latest season, ‹ › stepper, contract here (not in the header), Torna bar.
  await door(page, "Anno").click();
  const sheet = page.getByRole("dialog", { name: "La tua stagione" });
  await expect(sheet).toBeVisible();
  await expect(sheet.locator(".year-now")).toContainText("Ultima");
  await expect(sheet.locator(".year-chips")).toHaveCount(0);
  await expect(sheet.getByRole("button", { name: "Stagione successiva" })).toBeDisabled();
  await expect(sheet).toContainText("Contratto");
  await expect(page.locator(".career-chrome")).not.toContainText("×");
  await expect(sheet.getByRole("button", { name: /Scelta in attesa/ })).toBeVisible();
  // The diary is still mounted under the sheet (inert), with its scroll untouched.
  await expect(page.locator(".story-scroll")).toHaveAttribute("inert", "");
  await sheet.getByRole("button", { name: "Chiudi" }).click();
  await expect(page.locator(".door-sheet")).toHaveCount(0);
  expect(await story.evaluate((el) => el.scrollTop)).toBe(y);

  // Lega via the door, then Storia closes it.
  await door(page, "Lega").click();
  await expect(page.getByRole("dialog", { name: "La stagione NBA" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Premi della stagione" })).toBeVisible();
  await door(page, "Storia").click();
  await expect(page.locator(".door-sheet")).toHaveCount(0);
  expect(await story.evaluate((el) => el.scrollTop)).toBe(y);

  // Vita: no past-choices list (choices live in the diary only); Escape closes.
  await door(page, "Vita").click();
  await expect(page.getByRole("dialog", { name: "Vita" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Scelte", exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.locator(".door-sheet")).toHaveCount(0);

  // Drag down on the sheet handle closes it; a short drag springs back.
  await door(page, "Anno").click();
  const head = page.locator(".door-sheet-head");
  const box = (await head.boundingBox())!;
  await page.mouse.move(box.x + 60, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 60, box.y + 50, { steps: 4 });
  await page.mouse.up();
  await expect(page.locator(".door-sheet")).toHaveCount(1);
  await page.mouse.move(box.x + 60, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 60, box.y + 420, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator(".door-sheet")).toHaveCount(0);
  expect(await story.evaluate((el) => el.scrollTop)).toBe(y);

  // "Torna" lands on the waiting card.
  await door(page, "Lega").click();
  await page.getByRole("button", { name: /Scelta in attesa/ }).click();
  await expect(page.locator(".door-sheet")).toHaveCount(0);
  await expect(page.locator("[data-pending]").first()).toBeInViewport();
});

test("a waiting decision reopens on Storia even if a sheet was the last door; Anno follows the latest season", async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await startCareer(page, "Ritorno Storia");
  await toSeasonEnd(page);
  await door(page, "Lega").click();
  await expect(page.locator(".door-sheet")).toBeVisible();
  await page.waitForTimeout(1500); // let the deferred save land
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("pivot-v2-swipe") ?? "null")?.tab);
  expect(saved).toBe("league"); // the open door is still recorded with the same ids
  await page.reload();
  await expect(page.locator("[data-pending]").first()).toBeVisible();
  await expect(page.locator(".door-sheet")).toHaveCount(0);
  await expect(door(page, "Storia")).toHaveAttribute("aria-pressed", "true");
  const tab = await page.evaluate(() => { const raw = JSON.parse(localStorage.getItem("pivot-v2-save") ?? "null"); return (raw?.data ?? raw)?.tab; });
  expect(["log", "season", "league", "career"]).toContain(tab);

  // Next season: Anno must open on the new latest season, not on the one seen before.
  await door(page, "Anno").click();
  const first = (await page.locator(".year-now .tabular").innerText()).trim();
  await door(page, "Storia").click();
  await page.locator("[data-pending] .ghost-btn").filter({ hasText: /Prossima stagione|Entra nei playoff/ }).click();
  await toSeasonEnd(page);
  await expect(door(page, "Anno").locator(".door-dot")).toHaveCount(1);
  await door(page, "Anno").click();
  const second = (await page.locator(".year-now .tabular").innerText()).trim();
  expect(second).not.toBe(first);
  await expect(page.locator(".year-now")).toContainText("Ultima");
  await expect(door(page, "Anno").locator(".door-dot")).toHaveCount(0);
});

for (const vp of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
]) {
  test(`${vp.width}×${vp.height}: doors ≥ 44 px at the bottom, one-row header on small screens, 24 px above the doors`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(vp);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await startCareer(page, "Spazio Scelta");
    await page.getByRole("region", { name: "Storia" }).evaluate((el) => (el.scrollTop = el.scrollHeight));
    await settle(page, 400);
    const g = await page.evaluate(() => {
      const bar = document.querySelector(".door-bar")!.getBoundingClientRect();
      const card = document.querySelector(".pending-beat")!.getBoundingClientRect();
      const chrome = document.querySelector(".career-chrome")!.getBoundingClientRect();
      const name = document.querySelector(".hud-name")!.getBoundingClientRect();
      const orb = document.querySelector(".career-chrome .ovr-orb")!.getBoundingClientRect();
      const doors = [...document.querySelectorAll(".door-bar button")].map((b) => b.getBoundingClientRect());
      return { vh: innerHeight, barTop: bar.top, barBottom: bar.bottom, gap: bar.top - card.bottom, chromeH: chrome.height, nameTop: name.top, orbTop: orb.top, orbBottom: orb.bottom, doors: doors.map((d) => ({ h: d.height, w: d.width })) };
    });
    expect(Math.round(g.barBottom)).toBe(vp.height);
    expect(Math.round(g.gap)).toBeGreaterThanOrEqual(24);
    for (const d of g.doors) {
      expect(d.h).toBeGreaterThanOrEqual(44);
      expect(d.w).toBeGreaterThanOrEqual(44);
    }
    expect(g.chromeH / g.vh).toBeLessThanOrEqual(0.46);
    if (vp.width < 360 || vp.height < 521) {
      // One row: name and OVR share the line.
      expect(g.nameTop).toBeGreaterThanOrEqual(g.orbTop - 2);
      expect(g.nameTop).toBeLessThanOrEqual(g.orbBottom);
      expect(g.chromeH).toBeLessThanOrEqual(60);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}

test("desktop ≥ 1180: doors on top, the sheet stays inside the content column, rails and footer uncovered", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await startCareer(page, "Desktop Porte");
  await door(page, "Lega").click();
  await expect(page.locator(".door-sheet")).toBeVisible();
  const g = await page.evaluate(() => {
    const r = (el: Element | null) => el!.getBoundingClientRect();
    const rails = [...document.querySelectorAll(".ad-rail")].map(r);
    return { bar: r(document.querySelector(".door-bar")), sheet: r(document.querySelector(".door-sheet")), story: r(document.querySelector(".story-scroll")), app: r(document.querySelector(".pivot-app")), foot: r(document.querySelector(".ad-foot")), rails: rails.map((x) => ({ left: x.left, right: x.right, w: x.width })) };
  });
  expect(g.bar.bottom).toBeLessThanOrEqual(g.story.top + 1); // bar above the diary
  expect(g.sheet.left).toBeGreaterThanOrEqual(g.app.left);
  expect(g.sheet.right).toBeLessThanOrEqual(g.app.right);
  expect(g.sheet.bottom).toBeLessThanOrEqual(g.foot.top);
  for (const rail of g.rails) if (rail.w > 0) expect(rail.right <= g.sheet.left || rail.left >= g.sheet.right).toBe(true);
});
