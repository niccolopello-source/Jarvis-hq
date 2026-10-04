import { expect, test, type Page } from "@playwright/test";
import { EN_PROSE, IT_PROSE } from "../src/lib/pivot/narrative/markers";

/**
 * Plays several seasons in one language and reads every screen: the story must not leak the
 * other language. English mode is scanned for Italian prose markers, Italian mode for English
 * ones. Official English award names and brand words are allowed in Italian (they are the
 * league's own names); proper names never contain the stop-words the markers look for.
 */
const SEASONS = Number(process.env.NARRATIVE_SEASONS ?? 4);
const SHOTS = process.env.NARRATIVE_SHOTS;

const IT_ALLOWED = [
  "Defensive Player of the Year",
  "Rookie of the Year",
  "Sixth Man of the Year",
  "Most Improved Player",
  "Finals MVP",
  "All-NBA First Team",
  "All-NBA Second Team",
  "All-NBA Third Team",
  "Career Card",
  "Powered by Totem",
  "Grit and grind", // Memphis motto, quoted in English in the Italian team blurb
];

const TEXT = {
  it: { start: "Inizia", name: "Es. Marco Ferrara", draft: "Gioca il Draft", ready: "Il tuo giocatore è pronto", go: "Inizia la carriera", season: "Stagione", tabs: ["Anno", "Lega", "Vita"] },
  en: { start: "Start", name: "e.g. Marco Ferrara", draft: "Enter the Draft", ready: "Your player is ready", go: "Start the career", season: "Season", tabs: ["Year", "League", "Life"] },
} as const;

function leaks(text: string, lang: "it" | "en"): string[] {
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    let line = raw.trim();
    if (!line) continue;
    if (lang === "it") for (const ok of IT_ALLOWED) line = line.split(ok).join(" ");
    const marker = lang === "en" ? IT_PROSE : EN_PROSE;
    if (marker.test(line)) out.push(raw.trim().slice(0, 200));
  }
  return out;
}

async function scan(page: Page, lang: "it" | "en", where: string, found: Set<string>) {
  const text = await page.evaluate(() => document.body.innerText);
  for (const l of leaks(text, lang)) found.add(`${where}: ${l}`);
}

async function step(page: Page): Promise<boolean> {
  const btn = page.locator("[data-pending] button:not([disabled]), .pending-beat button:not([disabled])").first();
  if (!(await btn.isVisible().catch(() => false))) return false;
  await btn.click({ timeout: 5_000 }).catch(() => undefined);
  await page.waitForTimeout(250);
  return true;
}

for (const lang of ["en", "it"] as const) {
  test(`${SEASONS} played seasons read entirely in ${lang === "en" ? "English" : "Italian"}`, async ({ page }) => {
    test.setTimeout(240_000);
    const L = TEXT[lang];
    const found = new Set<string>();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript((l) => localStorage.setItem("pivot-lang", l), lang);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await page.getByRole("button", { name: L.start, exact: true }).click();
    await page.getByPlaceholder(L.name).fill("Alex Rivers");
    await page.getByRole("button", { name: L.draft }).click();
    const ready = page.getByRole("heading", { name: L.ready });
    for (let round = 0; round < 12 && !(await ready.isVisible().catch(() => false)); round += 1) {
      await expect(page.locator(".draft-card").first()).toBeVisible();
      await scan(page, lang, `draft ${round + 1}`, found);
      await page.locator(".draft-card").first().click();
      await page.waitForTimeout(650);
    }
    await expect(ready).toBeVisible();
    await page.getByRole("button", { name: L.go }).click();

    let shot = 0;
    const seasonHeading = (n: number) => page.getByRole("heading", { name: new RegExp(`^${L.season} ${n} ·`) });
    for (let i = 0; i < 400; i += 1) {
      await scan(page, lang, `step ${i}`, found);
      if (SHOTS && i % 7 === 3 && shot < 6) {
        await page.screenshot({ path: `${SHOTS}/${lang}-story-${++shot}.png`, fullPage: false });
      }
      if (await seasonHeading(SEASONS + 1).first().isVisible().catch(() => false)) break;
      if (await page.locator(".result-view").isVisible().catch(() => false)) break;
      if (!(await step(page))) await page.waitForTimeout(400);
    }
    await expect(seasonHeading(SEASONS).first()).toBeVisible();
    for (const tab of L.tabs) {
      await page.getByRole("button", { name: tab, exact: true }).click();
      await page.waitForTimeout(500);
      await scan(page, lang, `tab ${tab}`, found);
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/${lang}-tab-${tab}.png`, fullPage: false });
    }
    expect(errors).toEqual([]);
    expect([...found]).toEqual([]);
  });
}
