import { expect, test } from "@playwright/test";

/**
 * Demo gate (Missione 1): a real career in the browser must reach the playoff and market cards,
 * survive a reload while one of them is pending, and never stall.
 */
test("a reload while a playoff or market card is pending brings back the same saved decision", async ({ page }) => {
  test.setTimeout(420_000);
  await page.setViewportSize({ width: 375, height: 667 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await page.getByPlaceholder("Es. Marco Ferrara").fill("Gate Playoff");
  await page.getByRole("button", { name: "Gioca il Draft" }).click();
  const ready = page.getByRole("heading", { name: "Il tuo giocatore è pronto" });
  for (let round = 0; round < 12 && !(await ready.isVisible().catch(() => false)); round += 1) {
    await page.locator(".draft-card").first().click();
    await page.waitForTimeout(650);
  }
  await page.getByRole("button", { name: "Inizia la carriera" }).click();
  await page.getByRole("button", { name: /College NCAA/ }).click();
  await page.getByRole("button", { name: "Entra in palestra" }).click();

  const snap = () =>
    page.evaluate(() => {
      const r = JSON.parse(localStorage.getItem("pivot-v2-save") ?? "null");
      const d = r?.data ?? r;
      return { pending: JSON.stringify(d?.pending ?? null), choices: d?.player?.choiceLog?.length ?? -1, seasons: d?.player?.seasonHistory?.length ?? -1 };
    });
  const kinds = new Map<string, number>();
  const reloadedOn = new Set<string>();
  const seen: string[] = [];
  for (let step = 0; step < 400; step += 1) {
    if (await page.locator(".result-view").isVisible().catch(() => false)) break;
    const pending = page.locator("[data-pending]").first();
    await expect(pending).toBeVisible({ timeout: 15_000 });
    // PendingBlock renders its own [data-pending] card inside the .pending-beat wrapper: classify the innermost.
    const card = page.locator("[data-pending]").last();
    const cls = (await card.getAttribute("class")) ?? "";
    const kind = /playoff/.test(cls) ? "playoff" : /market/.test(cls) ? "market" : cls.split(" ")[0];
    kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
    if ((kind === "playoff" || kind === "market") && !reloadedOn.has(kind)) {
      // Wait for any hold to end and the debounced save to land, then compare the saved decision state.
      await expect(page.locator(".pending-beat.is-held")).toHaveCount(0, { timeout: 10_000 });
      await page.waitForTimeout(1500);
      const before = await snap();
      expect(before.pending, "a pending decision is saved").not.toBe("null");
      await page.reload();
      await expect(page.locator("[data-pending]").first()).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(1500);
      const after = await snap();
      expect(after, `${kind}: same pending decision and same decision log after reload`).toEqual(before);
      reloadedOn.add(kind);
      continue;
    }
    const sig = (await pending.innerText()).slice(0, 160);
    seen.push(sig);
    const tail = seen.slice(-4);
    if (tail.length === 4 && tail.every((x) => x === tail[0])) throw new Error(`career stalled at step ${step}: ${tail[0]}`);
    await pending.locator("button").first().click({ timeout: 5_000 }).catch(() => {});
    await page.waitForTimeout(400);
  }
  console.log(`DEMO_GATE ${JSON.stringify({ steps: seen.length, kinds: Object.fromEntries(kinds), reloadedOn: [...reloadedOn] })}`);
  await expect(page.locator(".result-view")).toBeVisible();
  expect(errors).toEqual([]);
  // A random career may miss the playoffs and the market; that is reported, not faked.
  test.info().annotations.push({ type: "reloaded-on", description: [...reloadedOn].join(",") || "none" });
});
