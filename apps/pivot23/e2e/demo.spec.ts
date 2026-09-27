import { expect, test } from "@playwright/test";

test("a player can start a career and reach the rookie story", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

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
  expect(runtimeErrors).toEqual([]);
});
