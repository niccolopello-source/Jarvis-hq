import { expect, test, type Page } from "@playwright/test";

/** Minimal finished career: enough for loadArchive() to accept the entry. No live save. */
const ARCHIVE = [
  {
    id: "fb-e2e-1",
    savedAt: 1_700_000_000_000,
    version: 11,
    name: "Test Player",
    role: "SG",
    verdict: "A career.",
    closing: "Done.",
    seasons: 12,
    peak: 82,
    titles: 1,
    ppg: 18.2,
    history: [],
    milestones: [],
    choices: [],
    difficulty: "pro",
    engineVersion: "2.24.0-beta",
    careerId: "career-fb-e2e-1",
  },
];

async function openHome(page: Page, store: Record<string, string> = {}) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript((entries) => {
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
  }, { "pivot23.introSeen": "1", "pivot-lang": "it", ...store });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "PIVOT", level: 1 })).toBeVisible({ timeout: 20_000 });
}

test("the Feedback button is absent on a device with no finished career", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (req) => requests.push(req.url()));
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);
  await expect(page.getByRole("button", { name: "Inizia", exact: true })).toBeVisible();
  await expect(page.locator("[data-feedback=open]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Pareri" })).toHaveCount(0);
  expect(requests.some((url) => url.includes("/api/feedback"))).toBe(false);
});

test("after a finished career the button sits above the Totem row and opens the form", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page, { "pivot-v2-archive": JSON.stringify(ARCHIVE) });
  const open = page.locator("[data-feedback=open]");
  await expect(open).toBeVisible();
  await expect(open).toHaveText("Pareri");
  const totem = page.locator(".totem-row-home");
  await expect(totem).toBeVisible();
  const b = (await open.boundingBox())!;
  const t = (await totem.boundingBox())!;
  expect(b.y + b.height).toBeLessThanOrEqual(t.y + 1);
  await open.click();
  await expect(page.locator("[data-feedback=page]")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pareri" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "PIVOT", level: 1 })).toHaveCount(0);
});

test("stars and review stay on the device, stars lock for 30 days, no network submit", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (req) => {
    if (req.method() !== "GET" && req.method() !== "HEAD") posts.push(`${req.method()} ${req.url()}`);
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await openHome(page, { "pivot-v2-archive": JSON.stringify(ARCHIVE) });
  await page.locator("[data-feedback=open]").click();
  await page.locator("[data-star='5']").click();
  await page.locator("#feedback-review").fill("Mi è piaciuto il ritmo delle stagioni.");
  await page.locator("[data-feedback=submit]").click();
  await expect(page.locator("[data-feedback=saved]")).toBeVisible();

  const saved = await page.evaluate(() => localStorage.getItem("pivot-v2-feedback"));
  expect(saved).toBeTruthy();
  const rec = JSON.parse(saved!) as { stars: number; review: string; deviceId: string };
  expect(rec.stars).toBe(5);
  expect(rec.review).toContain("ritmo");
  expect(rec.deviceId.length).toBeGreaterThan(4);
  expect(JSON.stringify(rec).includes("Test Player")).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem("pivot-v2-feedback-unlocked"))).toBe("1");

  await expect(page.locator("[data-star='2']")).toBeDisabled();
  await page.locator("[data-feedback=submit]").click();
  const after = JSON.parse(await page.evaluate(() => localStorage.getItem("pivot-v2-feedback")) as string) as { stars: number };
  expect(after.stars).toBe(5);

  await page.locator(".back-link").click();
  await expect(page.getByRole("heading", { name: "PIVOT", level: 1 })).toBeVisible();
  await page.reload();
  await expect(page.locator("[data-feedback=open]")).toBeVisible();
  await page.locator("[data-feedback=open]").click();
  await expect(page.locator("#feedback-review")).toHaveValue("Mi è piaciuto il ritmo delle stagioni.");
  await expect(page.locator("[data-star='5']")).toHaveClass(/on/);
  expect(posts.some((line) => line.includes("/api/feedback"))).toBe(false);
});

test("the English chrome uses Feedback, and the unlock flag alone is enough", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openHome(page, { "pivot-v2-feedback-unlocked": "1", "pivot-lang": "en" });
  await expect(page.locator("[data-feedback=open]")).toHaveText("Feedback");
  await page.locator("[data-feedback=open]").click();
  await expect(page.getByRole("heading", { name: "Feedback" })).toBeVisible();
  await expect(page.getByText("For now your feedback stays in your browser only.")).toBeVisible();
});

test("the review is capped at 500 characters, and the counter shows the limit", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page, { "pivot-v2-archive": JSON.stringify(ARCHIVE) });
  await page.locator("[data-feedback=open]").click();
  const box = page.locator("#feedback-review");
  await expect(box).toHaveAttribute("maxLength", "500");
  await expect(page.locator("[data-feedback=count]")).toHaveText("0 su 500");
  const text = "a".repeat(500);
  await box.fill(text);
  await expect(box).toHaveValue(text);
  await expect(page.locator("[data-feedback=count]")).toHaveText("500 su 500");
  await box.focus();
  await page.keyboard.type("xyz");
  await expect(box).toHaveValue(text);
  await page.locator("[data-star='3']").click();
  await page.locator("[data-feedback=submit]").click();
  await expect(page.locator("[data-feedback=saved]")).toBeVisible();
  const rec = JSON.parse(await page.evaluate(() => localStorage.getItem("pivot-v2-feedback")) as string) as { review: string };
  expect(rec.review.length).toBe(500);
});
