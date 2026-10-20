import { expect, test } from "@playwright/test";

/*
 * Acceptance 2026-10-19, P0 "offline after load": once the shell is loaded, losing the network
 * must not blank the screen or lose the career. The lazy English catalog and chart chunks may be
 * unreachable; the game must stay playable and keep saving locally.
 */

async function step(page: import("@playwright/test").Page): Promise<boolean> {
  const btn = page.locator("[data-pending] button:not([disabled]), .pending-beat button:not([disabled])").first();
  if (!(await btn.isVisible().catch(() => false))) return false;
  await btn.click({ timeout: 5_000 }).catch(() => undefined);
  await page.waitForTimeout(200);
  return true;
}

test("offline after load: draft, first season beats and save still work, no page errors", async ({ page, context }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Inizia", exact: true })).toBeVisible();
  await context.setOffline(true);

  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await page.getByPlaceholder("Es. Marco Ferrara").fill("Offline Rossi");
  await page.getByRole("button", { name: "Gioca il Draft" }).click();
  const ready = page.getByRole("heading", { name: "Il tuo giocatore è pronto" });
  for (let round = 0; round < 30 && !(await ready.isVisible().catch(() => false)); round += 1) {
    await expect(page.locator(".draft-card").first()).toBeVisible();
    await page.locator(".draft-card").first().click();
    await page.waitForTimeout(650);
  }
  await expect(ready).toBeVisible();
  await page.getByRole("button", { name: "Inizia la carriera" }).click();
  await expect(page.getByRole("region", { name: "Storia" })).toBeVisible();
  for (let i = 0; i < 12; i += 1) if (!(await step(page))) await page.waitForTimeout(300);

  // Tabs whose content may live in lazy chunks: the screen must never go blank.
  for (const tab of ["Lega", "Vita", "Anno"]) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    await page.waitForTimeout(300);
    expect((await page.evaluate(() => document.body.innerText)).trim().length).toBeGreaterThan(50);
  }
  expect(await page.evaluate(() => localStorage.getItem("pivot-v2-save"))).not.toBeNull();
  expect(errors).toEqual([]);
  await context.setOffline(false);
});
