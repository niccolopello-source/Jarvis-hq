import { expect, test, type Page } from "@playwright/test";
import { EN_PROSE, IT_PROSE } from "../src/lib/pivot/narrative/markers";

/**
 * Spanish and Simplified Chinese (owner decision 2026-11-09). Plays the draft and a few seasons
 * in each language on mobile and desktop: no Italian prose on any screen (untranslated narrative
 * falls back to English, by design), no horizontal overflow, no page errors.
 * I18N_SHOTS=<dir> also saves screenshots. Translations are NOT reviewed by native speakers.
 */
const SEASONS = Number(process.env.I18N_SEASONS ?? 2);
const SHOTS = process.env.I18N_SHOTS;

/** Italian words that do not exist in Spanish (IT_PROSE also matches la/con/un/del/ti...). */
const IT_ONLY = /(^|[^\p{L}'’])(il|gli|della|delle|dei|nel|nella|che|non|è|alla|più|tuo|tua|tuoi|anni|punti|stagione|squadra|partita|ancora|dopo|sempre|niente|anche|questa|questo|ogni|resta|chiude|chiudi|Il|Gli|Che|Non|Nel|Nella|È|Più|Tuo|Tua|Niente|Ogni|Dopo|Ancora|Questa|Questo)(?=$|[^\p{L}'’])/u;

const TEXT = {
  es: { pick: "Español", tag: "es", start: "Empezar", name: "P. ej. Marco Ferrara", draft: "Jugar el Draft", ready: "Tu jugador está listo", go: "Empezar la carrera", season: (n: number) => new RegExp(`^Temporada ${n} ·`), tabs: ["Año", "Liga", "Vida"] },
  zh: { pick: "中文", tag: "zh-CN", start: "开始", name: "例如：Marco Ferrara", draft: "进入选秀", ready: "你的球员已就绪", go: "开始生涯", season: (n: number) => new RegExp(`^第${n}个赛季 ·`), tabs: ["本赛季", "联盟", "生涯"] },
} as const;
type L2 = keyof typeof TEXT;

const VIEWPORTS = [
  { id: "mobile", width: 390, height: 844 },
  { id: "desktop", width: 1280, height: 800 },
] as const;

/** Static bilingual boot fallback in index.html (shown only if the app never starts), not app copy. */
const BOOT_FALLBACK = "Se la schermata non cambia, ricarica la pagina. If nothing changes, reload the page.";

type Found = { it: Set<string>; en: Set<string>; overflow: Set<string> };

async function scan(page: Page, lang: L2, where: string, found: Found) {
  const { text, sw, vw } = await page.evaluate(() => ({ text: document.body.innerText, sw: document.documentElement.scrollWidth, vw: window.innerWidth }));
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line === BOOT_FALLBACK) continue;
    if ((lang === "es" ? IT_ONLY : IT_PROSE).test(line)) found.it.add(`${where}: ${line.slice(0, 160)}`);
    // Chinese word order: the conference comes before the seed ("西部第5", not "第5 西部").
    if (lang === "zh" && /第\d+\s*(东部|西部)/.test(line)) found.it.add(`${where} (zh order): ${line.slice(0, 160)}`);
    else if (EN_PROSE.test(line)) found.en.add(line.slice(0, 160));
  }
  if (sw > vw + 1) found.overflow.add(`${where}: scrollWidth ${sw} > ${vw}`);
}

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
}

async function step(page: Page): Promise<boolean> {
  const btn = page.locator("[data-pending] button:not([disabled]), .pending-beat button:not([disabled])").first();
  if (!(await btn.isVisible().catch(() => false))) return false;
  await btn.click({ timeout: 5_000 }).catch(() => undefined);
  await page.waitForTimeout(250);
  return true;
}

for (const vp of VIEWPORTS) {
  for (const lang of ["es", "zh"] as const) {
    test(`${lang} ${vp.id}: selector, draft and ${SEASONS} seasons with no Italian prose and no overflow`, async ({ page }) => {
      test.setTimeout(240_000);
      const L = TEXT[lang];
      const found: Found = { it: new Set(), en: new Set(), overflow: new Set() };
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      // Pick the language from the selector itself (Italian is the default).
      await page.getByRole("button", { name: L.pick, exact: true }).click();
      await expect(page.locator("html")).toHaveAttribute("lang", L.tag);
      expect(await page.evaluate(() => localStorage.getItem("pivot-lang"))).toBe(lang);
      await expect(page.getByRole("button", { name: L.start, exact: true })).toBeVisible();
      await scan(page, lang, "home", found);
      await shot(page, `${lang}-${vp.id}-01-home`);
      await page.getByRole("button", { name: L.start, exact: true }).click();
      await page.getByPlaceholder(L.name).fill("Alex Rivers");
      await scan(page, lang, "setup", found);
      await shot(page, `${lang}-${vp.id}-02-setup`);
      await page.getByRole("button", { name: L.draft }).click();
      const ready = page.getByRole("heading", { name: L.ready });
      for (let round = 0; round < 12 && !(await ready.isVisible().catch(() => false)); round += 1) {
        await expect(page.locator(".draft-card").first()).toBeVisible();
        await scan(page, lang, `draft ${round + 1}`, found);
        if (round === 0) await shot(page, `${lang}-${vp.id}-03-draft`);
        await page.locator(".draft-card").first().click();
        await page.waitForTimeout(650);
      }
      await expect(ready).toBeVisible();
      await scan(page, lang, "ready", found);
      await shot(page, `${lang}-${vp.id}-04-ready`);
      await page.getByRole("button", { name: L.go }).click();
      let shots = 0;
      for (let i = 0; i < 300; i += 1) {
        await scan(page, lang, `step ${i}`, found);
        if (i % 9 === 4 && shots < 3) await shot(page, `${lang}-${vp.id}-05-story-${++shots}`);
        if (await page.getByRole("heading", { name: L.season(SEASONS + 1) }).first().isVisible().catch(() => false)) break;
        if (await page.locator(".result-view").isVisible().catch(() => false)) break;
        if (!(await step(page))) await page.waitForTimeout(400);
      }
      await expect(page.getByRole("heading", { name: L.season(SEASONS) }).first()).toBeVisible();
      for (const [k, tab] of L.tabs.entries()) {
        await page.getByRole("button", { name: tab, exact: true }).click();
        await page.waitForTimeout(500);
        await scan(page, lang, `tab ${tab}`, found);
        await shot(page, `${lang}-${vp.id}-06-tab-${k + 1}`);
      }
      console.log(`[i18n e2e] ${lang} ${vp.id}: English-fallback lines seen ${found.en.size}`);
      if (process.env.I18N_DEBUG) console.log([...found.en].join("\n"));
      expect(errors).toEqual([]);
      expect([...found.it]).toEqual([]);
      expect([...found.overflow]).toEqual([]);
    });
  }
}

test("switching language mid-career keeps the save byte for byte (it -> zh -> es -> en)", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await page.getByPlaceholder("Es. Marco Ferrara").fill("Alex Rivers");
  await page.getByRole("button", { name: "Gioca il Draft" }).click();
  const ready = page.getByRole("heading", { name: "Il tuo giocatore è pronto" });
  for (let r = 0; r < 12 && !(await ready.isVisible().catch(() => false)); r += 1) {
    await page.locator(".draft-card").first().click();
    await page.waitForTimeout(650);
  }
  await page.getByRole("button", { name: "Inizia la carriera" }).click();
  for (let i = 0; i < 6; i += 1) if (!(await step(page))) await page.waitForTimeout(300);
  const snapshot = () => page.evaluate(() => {
    const out: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k !== "pivot-lang") out[k] = (localStorage.getItem(k) ?? "").replace(/"lang":"(it|en|es|zh)"/g, '"lang":"*"');
    }
    return out;
  });
  const before = await snapshot();
  expect(Object.keys(before).length).toBeGreaterThan(0);
  for (const [l, tag] of [["zh", "zh-CN"], ["es", "es"], ["en", "en"]] as const) {
    await page.evaluate((x) => localStorage.setItem("pivot-lang", x), l);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", tag);
    await page.waitForTimeout(800);
    expect(await snapshot()).toEqual(before);
  }
});

const SIM = {
  es: { name: "Nombre", sim: /Simular la carrera/ },
  zh: { name: "姓名", sim: /模拟整个生涯/ },
} as const;

for (const vp of VIEWPORTS) {
  for (const lang of ["es", "zh"] as const) {
    test(`${lang} ${vp.id}: simulated career, legacy report and Career Card in the language`, async ({ page }) => {
      test.setTimeout(120_000);
      const found: Found = { it: new Set(), en: new Set(), overflow: new Set() };
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.addInitScript((l) => localStorage.setItem("pivot-lang", l), lang);
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("lang", TEXT[lang].tag);
      await page.getByRole("button", { name: TEXT[lang].start, exact: true }).click();
      await page.getByLabel(SIM[lang].name).fill("Alex Rivers");
      await page.waitForTimeout(200);
      await page.getByRole("button", { name: SIM[lang].sim }).click();
      await expect(page.locator("[data-legacy-report]")).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(800);
      await scan(page, lang, "legacy", found);
      await shot(page, `${lang}-${vp.id}-07-legacy`);
      await page.locator("[data-legacy-report]").scrollIntoViewIfNeeded();
      await shot(page, `${lang}-${vp.id}-08-legacy-report`);
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/${lang}-${vp.id}-09-legacy-full.png`, fullPage: true });
      console.log(`[i18n e2e] ${lang} ${vp.id} legacy: English-fallback lines seen ${found.en.size}`);
      if (process.env.I18N_DEBUG) console.log([...found.en].join("\n"));
      expect(errors).toEqual([]);
      expect([...found.it]).toEqual([]);
      expect([...found.overflow]).toEqual([]);
    });
  }
}
