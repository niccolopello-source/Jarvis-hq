import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Browser, type Page } from "@playwright/test";

/**
 * G1: fixed-seed saves (fixtures/make-g1-saves.ts) with a pending playoff game, free-agency desk and
 * trade offer. (1) A reload brings the same decision back. (2) A tab killed right after the click,
 * before any pagehide or deferred save could run, still has the decision, applied once, no duplicate log.
 */
const here = dirname(fileURLToPath(import.meta.url));
let saves: Record<string, string> = {};
test.beforeAll(() => {
  // One file per worker: parallel workers must not read each other's half-written output.
  const out = join(tmpdir(), `pivot23-g1-saves-${process.pid}.json`);
  execFileSync("node", ["--import=tsx", join(here, "fixtures", "make-g1-saves.ts"), out], { cwd: join(here, ".."), stdio: "inherit" });
  saves = JSON.parse(readFileSync(out, "utf8"));
});

type Snap = { raw: string; pending: string; kind: string | null; choices: number; log: number; logIds: number; seasons: number; team: string };
const card = (page: Page) => page.locator("[data-pending]").last();
const snap = (page: Page): Promise<Snap> =>
  page.evaluate(() => {
    const raw = localStorage.getItem("pivot-v2-save") ?? "null";
    const d = JSON.parse(raw);
    const log = (d?.log ?? []) as { id: number }[];
    return {
      raw,
      pending: JSON.stringify(d?.pending ?? null),
      kind: d?.pending?.kind ?? null,
      choices: d?.player?.choiceLog?.length ?? -1,
      log: log.length,
      logIds: new Set(log.map((e) => e.id)).size,
      seasons: d?.player?.seasonHistory?.length ?? -1,
      team: d?.player?.team?.abbr ?? "",
    };
  });

async function open(page: Page, raw: string) {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await page.evaluate((v) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem("pivot-v2-save", v); }, raw);
  await page.reload();
  await expect(card(page)).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".pending-beat.is-held")).toHaveCount(0, { timeout: 10_000 });
}

/** Opens `raw` in a brand-new browser context: what a killed tab leaves behind is only storage. */
async function reopen(browser: Browser, raw: string) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await open(page, raw);
  return { ctx, page };
}

for (const kind of ["playoff", "fa", "trade"] as const) {
  test(`G1 ${kind}: reload keeps the pending decision; a kill right after the click keeps it applied once`, async ({ page, browser }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await open(page, saves[kind]!);
    await page.waitForTimeout(1500);
    const before = await snap(page);
    expect(before.kind).toBe(kind);

    await page.reload();
    await expect(card(page)).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1500);
    const reloaded = await snap(page);
    expect({ ...reloaded, raw: "" }, `${kind}: same decision after reload`).toEqual({ ...before, raw: "" });

    // Confirm the first option, then read storage at once: no pagehide, no idle time.
    await card(page).locator("button").first().click();
    await page.waitForTimeout(100);
    const killed = await snap(page);
    expect(killed.pending, `${kind}: the confirmed decision is in storage ~100 ms after the click`).not.toBe(before.pending);
    expect(killed.log, `${kind}: the decision's log entry is saved`).toBeGreaterThan(before.log);
    expect(killed.logIds).toBe(killed.log);

    const { ctx, page: again } = await reopen(browser, killed.raw);
    await again.waitForTimeout(1500);
    const resumed = await snap(again);
    expect(resumed.kind, `${kind}: the old decision is not offered again`).not.toBe(kind === "playoff" ? "__never__" : kind);
    if (kind === "playoff") expect(resumed.pending).not.toBe(before.pending);
    expect(resumed.choices, `${kind}: applied once`).toBe(killed.choices);
    expect(resumed.seasons).toBe(killed.seasons);
    expect(resumed.team).toBe(killed.team);
    expect(resumed.logIds, `${kind}: no duplicate log entry`).toBe(resumed.log);
    expect(resumed.log).toBeGreaterThanOrEqual(killed.log);
    await ctx.close();
    expect(errors).toEqual([]);
  });
}

test("G1 archive: a record that disagrees with its card is shown with a warning, not hidden", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await page.evaluate((v) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem("pivot-v2-archive", v); }, saves.archiveTampered!);
  await page.reload();
  await page.getByRole("button", { name: /Archivio/ }).first().click();
  const entry = page.locator(".archive-card", { hasText: "G1 Archivio" });
  await expect(entry).toContainText("da verificare");
  await entry.click();
  await expect(page.locator('[data-archive-issue="record-mismatch"]')).toBeVisible();
  expect(errors).toEqual([]);
});
