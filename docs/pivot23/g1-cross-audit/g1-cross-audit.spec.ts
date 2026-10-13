import { writeFileSync, mkdirSync } from "node:fs";
import { expect, test, type Browser, type Page } from "@playwright/test";

/* G1 cross-audit (independent QA, not part of the product suite). Fixed state: the first story card of one
   career, captured once per test and re-injected for every repetition, so every rep starts from the same
   seed, RNG state and pending card. Modes: reload, close (page.close -> new page same context),
   kill (storage copied with no lifecycle event -> fresh context), background (visibilitychange hidden ->
   storage copied -> fresh context; then same page resumes). */
const REPS = Number(process.env.G1X_REPS || 5);
type S = { raw: string; kind: string | null; title: string | null; choices: { title: string; pick: string }[]; dec: number; logLen: number; logIds: number; attrs: string; form: number; overall: number; season: number; seed: number; hist: number };
const read = (raw: string): S => {
  const d = JSON.parse(raw);
  const log = (d?.log ?? []) as { id: number; kind?: string; title?: string }[];
  return { raw, kind: d?.pending?.kind ?? null, title: d?.pending?.title ?? null, choices: d?.player?.choiceLog ?? [], dec: 0, logLen: log.length,
    logIds: new Set(log.map((e) => e.id)).size, attrs: JSON.stringify(d?.player?.attrs), form: d?.player?.form, overall: d?.player?.overall,
    season: d?.player?.season, seed: d?.player?.seed, hist: d?.player?.seasonHistory?.length ?? -1 };
};
const decCount = (raw: string, title: string) => ((JSON.parse(raw)?.log ?? []) as { kind?: string; title?: string }[]).filter((e) => e.kind === "decision" && e.title === title).length;
const rawOf = (page: Page) => page.evaluate(() => localStorage.getItem("pivot-v2-save") ?? "null");
const card = (page: Page) => page.locator("[data-pending]").last();
async function settled(page: Page) {
  await expect(card(page)).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".pending-beat.is-held")).toHaveCount(0, { timeout: 10_000 });
  await page.waitForTimeout(1600);
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
  for (let r = 0; r < 14 && !(await ready.isVisible().catch(() => false)); r++) { await page.locator(".draft-card").first().click(); await page.waitForTimeout(650); }
  await page.getByRole("button", { name: "Inizia la carriera" }).click();
  await page.getByRole("button", { name: /College NCAA/ }).click();
  await page.getByRole("button", { name: "Entra in palestra" }).click();
  await settled(page);
}
async function inject(page: Page, raw: string) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate((v) => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem("pivot-v2-save", v); }, raw);
  await page.reload();
  await settled(page);
}
async function fresh(browser: Browser, raw: string) {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await inject(p, raw);
  return { ctx, p };
}
mkdirSync("/workspace/reports/g1x", { recursive: true });

for (const mode of ["reload", "close", "kill", "background"] as const)
  for (const ms of [0, 150, 400, 800, 1500]) {
    test(`G1X DEF-01 ${mode} @${ms}ms x${REPS}`, async ({ page, browser }) => {
      test.setTimeout(60_000 + REPS * 40_000);
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await toFirstStory(page, `G1X ${mode} ${ms}`);
      const base = await rawOf(page);
      const b = read(base);
      expect(b.kind).toBe("story");
      const title = b.title!;
      // Reference: the state right after one application (immediate save, read before any season runs).
      await card(page).locator("button").first().click();
      await page.waitForTimeout(60);
      const ref = read(await rawOf(page));
      expect(ref.choices.filter((c) => c.title === title)).toHaveLength(1);
      expect(ref.kind, "immediate save after the click stores no pending story card").toBeNull();
      const out: unknown[] = [];
      for (let i = 0; i < REPS; i++) {
        // Fresh context per rep: re-injecting into a page that already runs this career would let its
        // pagehide flush overwrite the injected save (same careerId) and contaminate the rep.
        const repCtx = await browser.newContext();
        page = await repCtx.newPage(); page.on("pageerror", (e) => errors.push(e.message));
        await inject(page, base);
        await card(page).locator("button").first().click();
        await page.waitForTimeout(ms);
        let after: string; let resumePage: Page = page; let ctx: { close(): Promise<void> } | null = null;
        if (mode === "reload") { await page.reload(); await settled(page); after = await rawOf(page); }
        else if (mode === "close") {
          const c = page.context(); await page.close({ runBeforeUnload: true });
          page = await c.newPage(); page.on("pageerror", (e) => errors.push(e.message));
          await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/"); await settled(page); after = await rawOf(page); resumePage = page;
        } else {
          if (mode === "background") await page.evaluate(() => {
            Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
            Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
            document.dispatchEvent(new Event("visibilitychange"));
          });
          const killed = await rawOf(page);
          const f = await fresh(browser, killed); ctx = f.ctx; resumePage = f.p; after = await rawOf(f.p);
          if (mode === "background") { // resume the original page too: must not apply again
            await page.evaluate(() => {
              Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
              Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
              document.dispatchEvent(new Event("visibilitychange"));
            });
            await settled(page);
            const r0 = read(await rawOf(page));
            expect(r0.choices.filter((c) => c.title === title), "background resume, same page").toHaveLength(1);
          }
        }
        const a = read(after);
        const taken = a.choices.filter((c) => c.title === title).length;
        const offeredAgain = a.title === title;
        const rec = { rep: i, mode, ms, kind: a.kind, offeredAgain, taken, dec: decCount(after, title), season: a.season, hist: a.hist, logLen: a.logLen, logIds: a.logIds,
          attrsEqRef: a.attrs === ref.attrs, formEqRef: a.form === ref.form, attrsEqBase: a.attrs === b.attrs };
        out.push(rec); console.log("G1XDBG", JSON.stringify({ i, title, baseChoices: b.choices.length, refChoices: ref.choices.length, refKind: ref.kind, baseIq: JSON.parse(b.attrs).iq, refIq: JSON.parse(ref.attrs).iq, aIq: JSON.parse(a.attrs).iq, baseForm: b.form, refForm: ref.form, aForm: a.form, kind: a.kind, pendTitle: a.title, hist: [b.hist, a.hist], rng: [JSON.parse(base).player.rngState, JSON.parse(ref.raw).player.rngState, JSON.parse(after).player.rngState], choices: a.choices }));
        expect(a.seed).toBe(b.seed);
        expect(a.logIds, "no duplicate log ids").toBe(a.logLen);
        if (offeredAgain) {
          expect(taken, "offered again => not applied").toBe(0);
          expect(a.attrs).toBe(b.attrs); expect(a.form).toBe(b.form);
        } else {
          expect(taken, "applied exactly once").toBe(1);
          expect(rec.dec, "one decision log entry").toBe(1);
          if (a.hist === b.hist) { expect(a.attrs, "attrs = one application").toBe(ref.attrs); expect(a.form).toBe(ref.form); }
        }
        // continue one more beat: the choice must still be counted once
        await card(resumePage).locator("button").first().click();
        await settled(resumePage);
        const n = read(await rawOf(resumePage));
        expect(n.choices.filter((c) => c.title === title), "after the next beat").toHaveLength(1);
        expect(decCount(n.raw, title)).toBe(1);
        if (ctx) await ctx.close();
        await repCtx.close();
      }
      writeFileSync(`/workspace/reports/g1x/def01-${mode}-${ms}.json`, JSON.stringify({ title, base: { attrs: b.attrs, form: b.form }, ref: { attrs: ref.attrs, form: ref.form }, reps: out, errors }, null, 1));
      expect(errors).toEqual([]);
    });
  }
