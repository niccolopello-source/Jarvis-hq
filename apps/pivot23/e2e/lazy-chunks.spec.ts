import { expect, test, type Page } from "@playwright/test";

/**
 * First-load weight (owner decision 2026-11-10, "1. Vai"): the home must not download the chart stack
 * (recharts, chart-vendor ~100 KB gzip) nor any translated narrative catalog. recharts arrives only
 * when the career shows the chart; a language catalog only when that language is picked.
 * Chunk names exist only in the production build, so this runs in the preview job (CI: E2E_PREVIEW=1).
 */
test.skip(!process.env.E2E_PREVIEW, "chunk names exist only in the production build (E2E_PREVIEW=1)");

function track(page: Page): string[] {
  const js: string[] = [];
  page.on("request", (r) => {
    const m = /\/assets\/([^/?]+)\.js(\?|$)/.exec(r.url());
    if (m) js.push(m[1]);
  });
  return js;
}
const has = (js: string[], name: string) => js.some((f) => f.startsWith(`${name}-`));

test("Italian home loads neither recharts nor any translated catalog; the career loads recharts", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const js = track(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Inizia", exact: true })).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(has(js, "chart-vendor"), js.join(",")).toBe(false);
  expect(has(js, "CareerChart"), js.join(",")).toBe(false);
  for (const c of ["catalog-en", "catalog-es", "catalog-zh", "catalog-identity"]) expect(has(js, c), js.join(",")).toBe(false);

  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await page.getByPlaceholder("Es. Marco Ferrara").fill("Alex Rivers");
  await page.getByRole("button", { name: "Gioca il Draft" }).click();
  const ready = page.getByRole("heading", { name: "Il tuo giocatore è pronto" });
  for (let r = 0; r < 12 && !(await ready.isVisible().catch(() => false)); r += 1) {
    await page.locator(".draft-card").first().click();
    await page.waitForTimeout(650);
  }
  await page.getByRole("button", { name: "Inizia la carriera" }).click();
  await page.getByRole("button", { name: "Vita", exact: true }).click();
  await expect.poll(() => has(js, "chart-vendor"), { timeout: 15_000 }).toBe(true);
  await expect(page.locator(".recharts-wrapper").first()).toBeAttached({ timeout: 15_000 });
  for (const c of ["catalog-en", "catalog-es", "catalog-zh", "catalog-identity"]) expect(has(js, c), js.join(",")).toBe(false);
  expect(errors).toEqual([]);
});

/*
 * Spanish and Chinese are layered on the identity entries of the English catalog (names, numbers:
 * catalog-identity, a few KB) and switch without waiting for the whole English catalog
 * (2026-11-10); English still follows right after as their fallback. identity.test.ts pins that
 * the screen text is unchanged.
 */
for (const [pick, own, others] of [
  ["中文", ["catalog-zh", "catalog-identity", "catalog-en"], ["catalog-es"]],
  ["Español", ["catalog-es", "catalog-identity", "catalog-en"], ["catalog-zh"]],
  ["English", ["catalog-en"], ["catalog-es", "catalog-zh", "catalog-identity"]],
] as const) {
  test(`picking ${pick} downloads only its catalog chunks (plus the English fallback), never recharts on the home`, async ({ page }) => {
    const js = track(page);
    await page.goto("/");
    await page.getByRole("button", { name: pick, exact: true }).click();
    for (const c of own) await expect.poll(() => has(js, c), { timeout: 15_000 }).toBe(true);
    await page.waitForLoadState("networkidle");
    for (const c of others) expect(has(js, c), js.join(",")).toBe(false);
    expect(has(js, "chart-vendor"), js.join(",")).toBe(false);
  });
}
