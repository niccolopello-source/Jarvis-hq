import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const savePath = join(here, "fixtures", "retire-save.json");

test.beforeAll(() => {
  execFileSync("node", ["--import=tsx", join(here, "fixtures", "make-retire-save.ts")], {
    cwd: join(here, ".."),
    stdio: "inherit",
  });
});

test("the boot page is a static fallback and the home mark can sweep", async ({ page }) => {
  const html = await (await page.request.get("/")).text();
  expect(html).toContain("Avvio dell");
  expect(html).toContain("--color-granata");
  expect(html).toContain("M22.2 22.4");
  expect(html).toContain("bootArc");
  expect(html).toContain("prefers-reduced-motion: reduce");

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "PIVOT" })).toBeVisible();
  const sweep = page.locator(".court-mark-live.is-sweep .mark-arcs");
  await expect(sweep).toBeVisible();
  const motion = await sweep.evaluate((el) => {
    const lean = document.documentElement.classList.contains("pivot-lean");
    document.documentElement.classList.remove("pivot-lean");
    const name = getComputedStyle(el).animationName;
    return { lean, name };
  });
  expect(motion.name).toBe("markSweep");

  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  await expect.poll(async () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim())).toBe("#1c1c1e");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect.poll(async () => page.locator(".mark-arcs").first().evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
});

test("the boot mark lights the real logo once and stays still when motion is reduced", async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/src/main.tsx", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  const widths: number[] = [];
  let worst = 0;
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "commit" });
    const logo = page.locator(".boot-logo");
    await expect(logo).toBeVisible();
    await expect(page.locator(".boot-ring")).toContainText("23");
    const box = await logo.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(200);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    await expect.poll(async () => page.locator(".boot-gleam path").first().evaluate((el) => getComputedStyle(el).animationName)).toBe("bootArc");
    widths.push(Math.round(box!.width));
    if (viewport.width === 390) {
      const gaps = await page.evaluate(async () => {
        const samples: number[] = [];
        let last = performance.now();
        await new Promise<void>((resolve) => {
          const step = (now: number) => {
            samples.push(now - last);
            last = now;
            if (samples.length < 40) requestAnimationFrame(step);
            else resolve();
          };
          requestAnimationFrame(step);
        });
        return samples;
      });
      worst = gaps.reduce((max, gap) => Math.max(max, gap), 0);
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "commit" });
  await expect(page.locator(".boot-ring")).toContainText("23");
  await expect.poll(async () => page.locator(".boot-gleam path").first().evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  console.log(`BOOT_FRAMES ${JSON.stringify({ widths, worstMs: Math.round(worst) })}`);
  expect(errors).toEqual([]);
});

test("a failed boot script still shows the logo and the reload link", async ({ page }) => {
  await page.route("**/src/main.tsx", (route) => route.abort());
  await page.goto("/", { waitUntil: "commit" });
  await expect(page.locator("#boot")).toBeVisible();
  await expect(page.locator(".boot-ring")).toContainText("23");
  await expect(page.getByRole("link", { name: "Ricarica PIVOT 23" })).toBeVisible();
});

test("the year sheet explains the main stats and hides the advanced ones", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await page.getByPlaceholder("Es. Marco Ferrara").fill("Anno Test");
  await page.getByRole("button", { name: "Gioca il Draft" }).click();
  const ready = page.getByRole("heading", { name: "Il tuo giocatore è pronto" });
  for (let round = 0; round < 10 && !(await ready.isVisible().catch(() => false)); round += 1) {
    await page.locator(".draft-card").first().click();
    await page.waitForTimeout(650);
  }
  await page.getByRole("button", { name: "Inizia la carriera" }).click();
  await page.getByRole("button", { name: /College NCAA/ }).click();
  await page.getByRole("button", { name: "Entra in palestra" }).click();
  await page.locator("[data-pending] .choice-btn").first().click();
  await expect(page.getByRole("heading", { name: /Stagione 1 ·/ })).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: "Anno", exact: true }).click();
  await expect(page.getByText("PPG punti, RPG rimbalzi, APG assist, a partita.")).toBeVisible();
  const advanced = page.locator(".adv-stats");
  await expect(advanced).toBeVisible();
  await expect(advanced.getByText("USG%")).toBeHidden();
  await advanced.locator("summary").click();
  await expect(advanced.getByText("USG%")).toBeVisible();

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    const heights = await page.locator(".seg-track button").evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(heights.length).toBeGreaterThan(0);
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
});

test("a failed write shows the warning and a reload keeps the previous save", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const raw = readFileSync(savePath, "utf8");
  await page.addInitScript((saved) => {
    localStorage.setItem("pivot-v2-save", saved);
  }, raw);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toBeVisible();
  const before = await page.evaluate(() => localStorage.getItem("pivot-v2-save"));
  await page.evaluate(() => {
    const fail = () => {
      throw new DOMException("quota", "QuotaExceededError");
    };
    localStorage.setItem = fail;
    sessionStorage.setItem = fail;
  });
  await page.getByRole("button", { name: "Gioca a 36 anni" }).click();
  await expect(page.getByRole("alert")).toContainText("non viene cancellato", { timeout: 5_000 });
  expect(await page.evaluate(() => localStorage.getItem("pivot-v2-save"))).toBe(before);
  await page.reload();
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toBeVisible();
});

test("choosing to play at 36 leaves the retirement card", async ({ page }) => {
  const raw = readFileSync(savePath, "utf8");
  await page.addInitScript((saved) => {
    localStorage.setItem("pivot-v2-save", saved);
  }, raw);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toBeVisible();
  await page.getByRole("button", { name: "Gioca a 36 anni" }).click();
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toHaveCount(0);
});

test("the age-36 season is played once and the career then closes", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const raw = readFileSync(savePath, "utf8");
  await page.addInitScript((saved) => {
    localStorage.setItem("pivot-v2-save", saved);
  }, raw);
  await page.goto("/");
  await page.getByRole("button", { name: "Gioca a 36 anni" }).click();
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toHaveCount(0);

  const seen: string[] = [];
  for (let step = 0; step < 16; step += 1) {
    if (await page.getByRole("region", { name: "Career Card" }).isVisible().catch(() => false)) break;
    const pending = page.locator("[data-pending]").first();
    if (!(await pending.isVisible().catch(() => false))) {
      if (await page.getByRole("heading", { name: "Carriera conclusa" }).isVisible().catch(() => false)) break;
    }
    await expect(pending).toBeVisible({ timeout: 8_000 });
    const signature = (await pending.innerText()).slice(0, 180);
    seen.push(signature);
    const tail = seen.slice(-4);
    if (tail.length === 4 && tail.every((item) => item === tail[0])) {
      throw new Error(`career stalled: ${tail[0]}`);
    }
    await pending.locator("button").first().click({ timeout: 4_000 }).catch(async (error: unknown) => {
      if (await page.getByRole("heading", { name: "Carriera conclusa" }).isVisible().catch(() => false)) return;
      throw error;
    });
    await expect(page.getByRole("heading", { name: "Carriera conclusa" }).or(page.locator("[data-pending]")).first()).toBeVisible();
  }

  await expect(page.getByRole("heading", { name: "Carriera conclusa" })).toBeVisible();
  await expect(page.getByText("36 anni")).toBeVisible();
  await expect(page.getByText("1 stagione").first()).toBeVisible();
  const card = page.getByRole("region", { name: "Career Card" });
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();
  await expect(card).toContainText("36");
  await expect(page.getByRole("heading", { name: "L'ultimo inverno" })).toHaveCount(0);
  expect(seen.filter((item) => item.includes("L'ultimo inverno"))).toEqual([]);
});

test("welcome becomes clickable and the mark follows reduced motion on every viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const started = Date.now();
  await page.goto("/");
  await page.getByRole("button", { name: "Inizia", exact: true }).click({ trial: true });
  const interactiveMs = Date.now() - started;
  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const paints = performance.getEntriesByType("paint");
    return {
      cores: navigator.hardwareConcurrency,
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      lean: document.documentElement.classList.contains("pivot-lean"),
      domContentLoaded: nav?.domContentLoadedEventEnd ?? null,
      load: nav?.loadEventEnd ?? null,
      firstContentfulPaint: paints.find((paint) => paint.name === "first-contentful-paint")?.startTime ?? null,
    };
  });
  console.log(`STARTUP ${JSON.stringify({ interactiveMs, ...timing })}`);

  const motion: { width: number; reduced: string; normal: string; lean: boolean }[] = [];
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    const reduced = await page.locator(".mark-arcs").first().evaluate((el) => getComputedStyle(el).animationName);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.reload();
    const normal = await page.locator(".court-mark-live.is-sweep .mark-arcs").evaluate((el) => getComputedStyle(el).animationName);
    const lean = await page.evaluate(() => document.documentElement.classList.contains("pivot-lean"));
    motion.push({ width: viewport.width, reduced, normal, lean });
    expect(reduced).toBe("none");
  }
  expect(new Set(motion.map((row) => row.normal)).size).toBe(1);
  expect(new Set(motion.map((row) => row.lean)).size).toBe(1);
  console.log(`MOTION ${JSON.stringify(motion)}`);
});

test("a career started from the welcome can reach the archive", async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({ path: "/tmp/pivot-shots/01-home.png", fullPage: true });
  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await page.getByPlaceholder("Es. Marco Ferrara").fill("Carriera Intera");
  await page.screenshot({ path: "/tmp/pivot-shots/02-setup.png", fullPage: true });
  await page.getByRole("button", { name: "Gioca il Draft" }).click();
  const ready = page.getByRole("heading", { name: "Il tuo giocatore è pronto" });
  for (let round = 0; round < 10 && !(await ready.isVisible().catch(() => false)); round += 1) {
    await page.locator(".draft-card").first().click();
    await page.waitForTimeout(650);
  }
  await page.getByRole("button", { name: "Inizia la carriera" }).click();
  await page.getByRole("button", { name: /College NCAA/ }).click();
  await page.getByRole("button", { name: "Entra in palestra" }).click();
  await page.screenshot({ path: "/tmp/pivot-shots/03-first-choice.png", fullPage: true });

  const seen: string[] = [];
  for (let step = 0; step < 220; step += 1) {
    if (await page.getByRole("region", { name: "Career Card" }).isVisible().catch(() => false)) break;
    const pending = page.locator("[data-pending]").first();
    if (!(await pending.isVisible().catch(() => false))) {
      if (await page.getByRole("heading", { name: "Carriera conclusa" }).isVisible().catch(() => false)) break;
    }
    await expect(pending).toBeVisible({ timeout: 12_000 });
    const signature = (await pending.innerText()).slice(0, 160);
    seen.push(signature);
    const tail = seen.slice(-4);
    if (tail.length === 4 && tail.every((item) => item === tail[0])) {
      throw new Error(`career stalled at step ${step}: ${tail[0]}`);
    }
    await pending.locator("button").first().click({ timeout: 4_000 }).catch(async (error: unknown) => {
      if (await page.getByRole("heading", { name: "Carriera conclusa" }).isVisible().catch(() => false)) return;
      throw error;
    });
  }

  await expect(page.getByRole("heading", { name: "Carriera conclusa" })).toBeVisible();
  await page.screenshot({ path: "/tmp/pivot-shots/04-result.png", fullPage: true });
  await page.getByRole("button", { name: "Archivio" }).click();
  await expect(page.getByText("Carriera Intera")).toBeVisible();
  console.log(`CAREER_STEPS ${seen.length}`);
});

test("a four-core device still sees the home sweep, and Totem stays out of the career", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, get: () => 4 });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "PIVOT" })).toBeVisible();
  await expect(page.locator(".totem-home")).toBeVisible();
  await expect(page.locator(".ad-foot")).toBeHidden();
  const home = await page.locator(".court-mark-live.is-sweep .mark-arcs").evaluate((el) => ({
    name: getComputedStyle(el).animationName,
    lean: document.documentElement.classList.contains("pivot-lean"),
  }));
  expect(home.lean).toBe(false);
  expect(home.name).toBe("markSweep");

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(".totem-home")).toBeHidden();
  await expect(page.locator(".ad-foot")).toContainText("Powered by Totem");
  const rails = await page.locator(".ad-rail").evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { width: Math.round(box.width), height: Math.round(box.height), text: node.textContent };
    }),
  );
  expect(rails).toHaveLength(2);
  for (const rail of rails) {
    expect(rail.width).toBeGreaterThanOrEqual(72);
    expect(rail.text).toContain("Riservato");
  }

  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Chi sei sul parquet" })).toBeVisible();
  await expect(page.locator(".totem-home")).toHaveCount(0);
  await expect(page.locator(".ad-foot")).toContainText("Powered by Totem");
});
