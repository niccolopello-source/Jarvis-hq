import { expect, test, type Page } from "@playwright/test";

/**
 * G1 re-audit DEF-01: a narrative decision (pending.kind === "story") must be applied exactly once
 * when the page is reloaded 0, 400 or 800 ms after the click, i.e. inside the HOLD_TITLE_MS hold
 * while the answered card is still on screen. The playoff/FA/trade cases live in g1-persistence.spec.
 */
type Live = { kind: string | null; title: string | null; choices: { season: number; title: string; pick: string }[]; seed: number; careerId: string };
const live = (page: Page): Promise<Live> =>
  page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("pivot-v2-save") ?? "null");
    return { kind: d?.pending?.kind ?? null, title: d?.pending?.title ?? null, choices: d?.player?.choiceLog ?? [], seed: d?.player?.seed, careerId: d?.player?.careerId };
  });
const card = (page: Page) => page.locator("[data-pending]").last();
async function settled(page: Page) {
  await expect(card(page)).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".pending-beat.is-held")).toHaveCount(0, { timeout: 10_000 });
  await page.waitForTimeout(1600); // past the hold and the deferred save
}

async function toFirstStory(page: Page, name: string) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await page.getByPlaceholder("Es. Marco Ferrara").fill(name);
  await page.getByRole("button", { name: "Gioca il Draft" }).click();
  const ready = page.getByRole("heading", { name: "Il tuo giocatore è pronto" });
  for (let r = 0; r < 14 && !(await ready.isVisible().catch(() => false)); r++) {
    await page.locator(".draft-card").first().click();
    await page.waitForTimeout(650);
  }
  await page.getByRole("button", { name: "Inizia la carriera" }).click();
  await page.getByRole("button", { name: /College NCAA/ }).click();
  await page.getByRole("button", { name: "Entra in palestra" }).click();
  await settled(page);
}

for (const ms of [0, 400, 800]) {
  test(`G1 DEF-01 story: reload ${ms} ms after the click applies the decision exactly once`, async ({ page }) => {
    test.setTimeout(120_000);
    await toFirstStory(page, `G1 Story ${ms}`);
    const before = await live(page);
    expect(before.kind).toBe("story");
    const title = before.title!;
    const pick = (await card(page).locator("button").first().innerText()).split("\n")[0]!.trim();
    await card(page).locator("button").first().click();
    await page.waitForTimeout(ms);
    await page.reload();
    await settled(page);

    const after = await live(page);
    expect(after.seed).toBe(before.seed);
    expect(after.careerId).toBe(before.careerId);
    const taken = (s: Live) => s.choices.filter((c) => c.title === title);
    // Either the save predates the click (decision offered again, nothing applied yet) or it holds the
    // decision once and the card is gone. Never both: applied and offered again.
    if (after.title === title) {
      expect(taken(after)).toHaveLength(0);
      await card(page).locator("button").first().click();
      await settled(page);
    } else {
      expect(taken(after)).toHaveLength(1);
      expect(taken(after)[0]!.pick).toContain(pick.slice(0, 8));
      await expect(card(page)).not.toContainText(title);
      await card(page).locator("button").first().click(); // resume card or the next beat
      await settled(page);
    }
    expect(taken(await live(page))).toHaveLength(1);
  });
}

test("G1 DEF-03 an unreadable archive is reported on the home and left untouched across reloads", async ({ page }) => {
  await page.goto("/");
  const raw = '[{"id":"broken"';
  await page.evaluate((v) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem("pivot-v2-archive", v); }, raw);
  for (let i = 0; i < 2; i++) {
    await page.reload();
    await expect(page.locator('[data-archive-load="unreadable"]')).toBeVisible({ timeout: 15_000 });
    expect(await page.evaluate(() => localStorage.getItem("pivot-v2-archive"))).toBe(raw);
  }
});
