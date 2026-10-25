import { expect, test, type Page } from "@playwright/test";

/* The boot splash must never cover a save-recovery notice or a boot error (see src/boot-signal.ts). */

async function timeline(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __splash: { attention?: number; gone?: number } };
    w.__splash = {};
    new MutationObserver(() => {
      const t = w.__splash;
      if (t.attention === undefined && document.documentElement.dataset.bootAttention) t.attention = performance.now();
      if (t.gone === undefined && document.readyState !== "loading" && !document.getElementById("boot")) t.gone = performance.now();
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-boot-attention"] });
  });
}

const read = (page: Page) => page.evaluate(() => (window as unknown as { __splash: { attention?: number; gone?: number } }).__splash);

test("corrupted save: the recovery notice shows and the splash is gone at once, not after its hold", async ({ page }) => {
  await timeline(page);
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("__e2e_seeded")) {
      sessionStorage.setItem("__e2e_seeded", "1");
      localStorage.removeItem("pivot23.introSeen");
      localStorage.setItem("pivot-v2-save", "{\"v\":2,\"screen\":\"career\",\"player\":{\"name\":\"SR tronc");
    }
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-boot-attention", "recovery");
  await expect(page.locator(".app-notice").first()).toBeVisible();
  await expect(page.locator("#boot")).toHaveCount(0);
  const t = await read(page);
  expect(t.attention).toBeDefined();
  expect(t.gone).toBeDefined();
  // Without the signal the curtain holds until SPLASH_MIN_MS and then animates for up to 1.5 s.
  expect(t.gone! - t.attention!).toBeLessThan(250);
});

test("a normal boot raises no attention signal and still opens the home", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Inizia", exact: true })).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute("data-boot-attention", /.+/);
});
