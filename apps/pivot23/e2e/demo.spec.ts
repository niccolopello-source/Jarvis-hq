import { expect, test } from "@playwright/test";

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  await testInfo.attach("failure-screenshot", {
    body: await page.screenshot({ fullPage: true }).catch(() => Buffer.from([])),
    contentType: "image/png",
  });
});

test("a player can start a career, finish a season and resume the saved recap", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const runtimeErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const badResponses: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? "request failed"}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
  });

  await page.goto("/");
  await expect(page).toHaveTitle("PIVOT 23 — La tua carriera cestistica");
  await expect(page.getByRole("heading", { name: "PIVOT" })).toBeVisible();
  await page.getByRole("button", { name: "Inizia", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Chi sei sul parquet" })).toBeVisible();
  await page.getByPlaceholder("Es. Marco Ferrara").fill("Giulia Rossi");
  await page.getByRole("button", { name: "Gioca il Draft" }).click();

  const ready = page.getByRole("heading", { name: "Il tuo giocatore è pronto" });
  for (let round = 0; round < 12 && !(await ready.isVisible().catch(() => false)); round += 1) {
    await page.locator(".draft-card").first().click();
  }
  await expect(ready).toBeVisible();
  await page.getByRole("button", { name: "Inizia la carriera" }).click();

  await expect(page.getByRole("heading", { name: "Il percorso verso il professionismo" })).toBeVisible();
  await page.getByRole("button", { name: /College NCAA, Stati Uniti/ }).click();
  await expect(page.getByRole("heading", { name: /scelta/ })).toBeVisible();
  await page.getByRole("button", { name: "Entra in palestra" }).click();

  await expect(page.locator("[data-pending]").first()).toBeVisible();
  await expect(page.getByText("Giulia Rossi").first()).toBeVisible();
  await expect(page.getByText("La partita si è interrotta")).toHaveCount(0);
  await page.locator("[data-pending] .choice-btn").first().click();
  const seasonRecap = page.getByRole("heading", { name: /Stagione 1 ·/ });
  await expect(seasonRecap).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => page.evaluate(() => localStorage.getItem("pivot-v2-save"))).not.toBeNull();
  await page.reload();
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 375, height: 667 },
    { width: 393, height: 852 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.getByRole("heading", { name: /Stagione 1 ·/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  expect(runtimeErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
  expect(badResponses).toEqual([]);

  const navigation = await page.evaluate(() => {
    const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const paints = performance.getEntriesByType("paint");
    return entry
      ? {
          responseStart: entry.responseStart,
          domContentLoaded: entry.domContentLoadedEventEnd,
          load: entry.loadEventEnd,
          firstPaint: paints.find((paint) => paint.name === "first-paint")?.startTime ?? null,
          firstContentfulPaint: paints.find((paint) => paint.name === "first-contentful-paint")?.startTime ?? null,
        }
      : null;
  });
  await test.info().attach("browser-diagnostics", {
    body: JSON.stringify({ url: page.url(), runtimeErrors, consoleErrors, failedRequests, badResponses, navigation }, null, 2),
    contentType: "application/json",
  });
});
