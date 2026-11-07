import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
let raw: string;
test.beforeAll(() => {
  const target = join(mkdtempSync(join(tmpdir(), "pivot-ui-")), "save.json");
  execFileSync("node", ["--import=tsx", join(here, "fixtures/make-ui-retire-save.ts"), target], { cwd: join(here, ".."), stdio: "inherit" });
  raw = readFileSync(target, "utf8");
});
for (const width of [360, 390, 1280]) for (const lang of ["it", "en"] as const) {
  test(`${width}px ${lang.toUpperCase()}: synthetic retirement, responsive Legacy and theme integrity`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(({ saved, l }) => {
      if (!sessionStorage.getItem("ui-seeded")) {
        sessionStorage.setItem("ui-seeded", "1");
        localStorage.setItem("pivot-v2-save", saved);
        localStorage.setItem("pivot-lang", l);
      }
    }, { saved: raw, l: lang });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: lang === "it" ? "L'ultimo inverno" : "The last winter" })).toBeVisible();
    await page.getByRole("button", { name: lang === "it" ? /Chiudi ora/ : /Retire now/ }).click();
    const card = page.getByRole("region", { name: "Career Card" });
    await expect(card).toBeVisible();
    expect(JSON.parse(raw).player.role).toBe("SG");
    await expect(card.locator(".lc-meta").first()).toContainText(lang === "it" ? "Guardia tiratrice" : "Shooting guard");
    const award = lang === "it" ? "Sesto uomo dell'anno" : "Sixth Man of the Year";
    await expect(page.locator(".lr-chips")).toContainText(award);
    await expect(page.locator(".lr-timeline")).toContainText(award);
    const out = process.env.UI_SHOTS;
    if (out) { mkdirSync(out, { recursive: true }); await card.screenshot({ path: join(out, `${width}-${lang}-card.png`), animations: "disabled" }); }
    await expect(card.locator(".lc-honors")).toContainText(award);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator(".lc-theme-tag")).toHaveCount(0);
    for (const rail of await page.locator(".ad-rail").all()) {
      await expect(rail).toHaveAttribute("aria-hidden", "true");
      expect((await rail.textContent())?.trim()).toBe("");
    }
    await expect(page.locator("[data-legacy-report]")).not.toContainText("ªª");
    for (const button of await page.locator(".lc-theme").all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    const archiveBefore = await page.evaluate(() => localStorage.getItem("pivot-v2-archive"));
    const beforeCardText = await card.innerText();
    await expect(card).toHaveAttribute("data-theme", "standard");
    await expect(page.locator("[data-theme-option=standard]")).toHaveAttribute("aria-pressed", "true");
    if (out) { await page.locator(".lc-themes").evaluate(el=>el.scrollIntoView({block:"end"})); await page.screenshot({path:join(out,`${width}-${lang}-grafite.png`),animations:"disabled"}); }
    const obsidian = page.locator("[data-theme-option=obsidian]");
    await obsidian.focus(); await page.keyboard.press("Enter");
    await expect(obsidian).toHaveAttribute("aria-pressed", "true");
    await expect(card).toHaveAttribute("data-theme", "obsidian");
    expect(await card.innerText()).toBe(beforeCardText);
    expect(await page.evaluate(() => localStorage.getItem("pivot-v2-archive"))).toBe(archiveBefore);
    if (width === 360) {
      await page.evaluate(() => {
        const w = window as Window & { __uiPngText?: string[] }; w.__uiPngText = [];
        const original = CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText = function (text: string, x: number, y: number, maxWidth?: number) {
          w.__uiPngText!.push(text);
          if (maxWidth === undefined) original.call(this, text, x, y); else original.call(this, text, x, y, maxWidth);
        };
      });
      const downloaded = page.waitForEvent("download");
      await page.locator("[data-export-png]").click();
      const file = await downloaded;
      const bytes = readFileSync((await file.path())!);
      expect(bytes.subarray(1, 4).toString()).toBe("PNG");
      expect(bytes.readUInt32BE(16)).toBe(1080); expect(bytes.readUInt32BE(20)).toBe(1350);
      expect(await page.evaluate(() => (window as Window & { __uiPngText?: string[] }).__uiPngText)).toContain(award);
      if (out) await file.saveAs(join(out, `${width}-${lang}-export.png`));
    }
    const table = page.locator(".lr-table-wrap"); await table.scrollIntoViewIfNeeded(); await table.focus(); await expect(table).toBeFocused();
    const first = table.locator("tbody tr > :first-child").first();
    expect(await first.evaluate(el => getComputedStyle(el).position)).toBe("sticky");
    const teamCells = table.locator("tbody tr > :nth-child(2)");
    const expectedTeams = (JSON.parse(raw).player.seasonHistory as {teamAbbr:string}[]).slice(-10).map(r => r.teamAbbr);
    expect(await teamCells.allTextContents()).toEqual(expectedTeams);
    await expect(table.locator("thead th").nth(1)).toHaveText(lang === "it" ? "Squadra" : "Team");
    await table.evaluate(el => { el.scrollLeft = 0; });
    if (out) await page.screenshot({ path: join(out, `${width}-${lang}-table-start.png`), animations: "disabled" });
    if (width < 1000) {
      const before = (await first.boundingBox())!.x; await page.keyboard.press("ArrowRight");
      await expect.poll(() => table.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
      expect(Math.abs((await first.boundingBox())!.x - before)).toBeLessThanOrEqual(1);
      await table.evaluate(el => { el.scrollLeft = el.scrollWidth; });
      if (out) await page.screenshot({ path: join(out, `${width}-${lang}-table-end.png`), animations: "disabled" });
      const seasonBox = (await first.boundingBox())!;
      const teamBox = (await teamCells.first().boundingBox())!;
      expect(teamBox.x).toBeGreaterThanOrEqual(seasonBox.x + seasonBox.width - 1);
      expect(await teamCells.first().evaluate(el => { const r=el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)); })).toBe(true);
      const last = table.locator("tbody tr").first().locator("td").last();
      const lastBox = (await last.boundingBox())!; const wrapBox = (await table.boundingBox())!;
      expect(lastBox.x).toBeGreaterThanOrEqual(teamBox.x + teamBox.width - 1);
      expect(lastBox.x + lastBox.width).toBeLessThanOrEqual(wrapBox.x + wrapBox.width + 1);
      for (const cell of await table.locator("tbody tr > :last-child, thead th:nth-child(2)").all()) expect(await cell.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    }
    for (const row of await table.locator("tbody tr").all()) {
      const boxes = await row.locator("th,td").evaluateAll(cells=>cells.map(c=>{const r=c.getBoundingClientRect();return {top:r.top,bottom:r.bottom};}));
      expect(Math.max(...boxes.map(b=>b.bottom))-Math.min(...boxes.map(b=>b.bottom))).toBeLessThanOrEqual(1);
      expect(Math.max(...boxes.map(b=>b.top))-Math.min(...boxes.map(b=>b.top))).toBeLessThanOrEqual(1);
    }
    for (const score of await table.locator(".lr-score").all()) expect(await score.evaluate(el=>{const r=document.createRange();r.selectNodeContents(el);return r.getClientRects().length;})).toBe(1);
    const tableFooter = page.locator(".ad-foot");
    if (await tableFooter.isVisible()) {
      await table.evaluate(el => el.scrollIntoView({ block: "center" }));
      const box = (await table.boundingBox())!;
      expect(box.y + box.height).toBeLessThanOrEqual((await tableFooter.boundingBox())!.y);
    }
    if (out) await page.screenshot({ path: join(out, `${width}-${lang}-table.png`), animations: "disabled" });
    const lastRow = table.locator("tbody tr").last();
    await lastRow.evaluate(el=>el.scrollIntoView({block:"end"}));
    if (await tableFooter.isVisible()) { const r=(await lastRow.boundingBox())!; expect(r.y+r.height).toBeLessThanOrEqual((await tableFooter.boundingBox())!.y); }
    if(out) await page.screenshot({path:join(out,`${width}-${lang}-last-row-footer.png`),animations:"disabled"});
    const themes = page.locator(".lc-themes"); await themes.evaluate(el => el.scrollIntoView({ block: "end" }));
    const footer = page.locator(".ad-foot");
    if (out) await page.screenshot({ path: join(out, `${width}-${lang}-themes.png`), animations: "disabled" });
    if (await footer.isVisible()) {
      const t = (await themes.boundingBox())!; const f = (await footer.boundingBox())!;
      console.log(`${width}-${lang} footer gap=${f.y - t.y - t.height}`);
      expect(t.y + t.height).toBeLessThanOrEqual(f.y);
    }
    expect(await card.evaluate(el => el.getAnimations({ subtree: true }).filter(a => a.playState === "running").length)).toBe(0);
    const axe = await new AxeBuilder({ page }).include(".legacy-experience").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(axe.violations.map(v => `${v.id}: ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
    await page.reload(); await page.getByRole("button", { name: lang === "it" ? /Archivio/ : /Archive/ }).click();
    await page.locator(".archive-card").first().click(); await expect(card).toHaveAttribute("data-theme", "obsidian");
    expect(await card.innerText()).toBe(beforeCardText);
    expect(await page.evaluate(() => localStorage.getItem("pivot-v2-archive"))).toBe(archiveBefore);
    expect(errors).toEqual([]);
  });
}
