import { expect, test, type Page } from "@playwright/test";

/* 2.24 prototype (OVR_CURVE_SINCE) through the real UI: a career opened on 2.24 via the dev-only
   "pivot-e2e-engine" flag keeps engineVersion 2.24.0-beta across a mid-career reload (save + resume)
   and reaches the Legacy Report. Skipped on the production preview, where the flag does not exist. */
const KEY = "pivot-v2-save";
const read = (page: Page) => page.evaluate((k) => {
  const d = JSON.parse(localStorage.getItem(k) ?? "null");
  const p = (d?.data ?? d)?.player;
  return { v: p?.engineVersion as string | undefined, seasons: (p?.seasonHistory?.length ?? -1) as number, age: p?.age as number | undefined };
}, KEY);

async function play(page: Page, until: (p: Page) => Promise<boolean>, max = 300) {
  const seen: string[] = [];
  for (let step = 0; step < max; step += 1) {
    if (await until(page)) return;
    const pending = page.locator("[data-pending]").first();
    await expect(pending).toBeVisible({ timeout: 15_000 });
    const sig = (await pending.innerText()).slice(0, 160);
    seen.push(sig);
    const tail = seen.slice(-4);
    if (tail.length === 4 && tail.every((x) => x === tail[0])) throw new Error(`career stalled at step ${step}`);
    await pending.locator("button").first().click({ timeout: 5_000 }).catch(() => {});
    await page.waitForTimeout(150);
  }
}

test("2.24 forced: full career with a mid-career reload keeps engine 2.24 and ends on the Legacy Report", async ({ page }) => {
  test.skip(Boolean(process.env.E2E_PREVIEW), "dev-only engine flag");
  test.setTimeout(300_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("pivot-e2e-engine", "2.24.0-beta"); });
  await page.reload();
  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await page.getByPlaceholder("Es. Marco Ferrara").fill("Prova Curva");
  await page.getByRole("button", { name: "Gioca il Draft" }).click();
  const ready = page.getByRole("heading", { name: "Il tuo giocatore è pronto" });
  for (let round = 0; round < 12 && !(await ready.isVisible().catch(() => false)); round += 1) {
    await page.locator(".draft-card").first().click();
    await page.waitForTimeout(650);
  }
  await page.getByRole("button", { name: "Inizia la carriera" }).click();
  await page.getByRole("button", { name: /College NCAA/ }).click();
  await page.getByRole("button", { name: "Entra in palestra" }).click();
  await expect(page.locator("[data-pending]").first()).toBeVisible({ timeout: 15_000 });
  await expect.poll(async () => (await read(page)).v, { timeout: 10_000 }).toBe("2.24.0-beta");

  // Play until a few pro seasons are saved, then reload: the save must resume on 2.24.
  await play(page, async (p) => (await read(p)).seasons >= 4);
  await page.waitForTimeout(1500);
  const before = await read(page);
  await page.reload();
  await expect(page.locator("[data-pending]").first()).toBeVisible({ timeout: 15_000 });
  const after = await read(page);
  expect(after.v).toBe("2.24.0-beta");
  expect(after.seasons).toBe(before.seasons);

  await play(page, (p) => p.locator(".result-view").isVisible().catch(() => false));
  await expect(page.locator(".result-view")).toBeVisible();
  const end = await read(page);
  expect(end.age ?? 0).toBeLessThanOrEqual(36);
  expect(errors).toEqual([]);
});
