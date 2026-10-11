/* global document, window, getComputedStyle, SVGElement -- page.evaluate callbacks run in the browser */
/**
 * UX / accessibility audit across viewports (Phase E). Not part of CI: run against a served
 * production build and read the JSON + screenshots it writes.
 *
 *   pnpm build && pnpm exec vite preview --port 4192 &
 *   AUDIT_URL=http://127.0.0.1:4192 AUDIT_OUT=/tmp/ux node scripts/ux-audit.mjs
 *
 * 1. Plays one career at 390×844 through the real UI and snapshots localStorage at each kind of
 *    screen (first choice, recap, playoff, market, trade, retirement, result, archive).
 * 2. For every viewport, restores each snapshot, reloads and measures: horizontal overflow,
 *    elements outside the viewport, clipped text, touch targets, fixed-layer overlaps, axe.
 */
import AxeBuilder from "@axe-core/playwright";
import { chromium, webkit } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.AUDIT_URL ?? "http://127.0.0.1:4192";
const OUT = process.env.AUDIT_OUT ?? "/tmp/ux-audit";
const ENGINE = process.env.AUDIT_ENGINE === "webkit" ? webkit : chromium;
const SHOTS = process.env.AUDIT_SHOTS !== "0";
mkdirSync(OUT, { recursive: true });

export const VIEWPORTS = [
  { name: "320", width: 320, height: 568 },
  { name: "360", width: 360, height: 740 },
  { name: "375", width: 375, height: 667 },
  { name: "390", width: 390, height: 844 },
  { name: "393", width: 393, height: 852 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 900 },
  { name: "667-land", width: 667, height: 375 },
  { name: "844-land", width: 844, height: 390 },
  // WCAG 1.4.4 / 1.4.10: 1280×800 at 200 % page zoom is a 640×400 CSS viewport at DPR 2.
  { name: "zoom200", width: 640, height: 400, dpr: 2 },
];

const settle = (page, ms = 250) => page.waitForTimeout(ms);

async function dump(page) {
  return page.evaluate(() => {
    const o = {};
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      o[k] = localStorage.getItem(k);
    }
    return o;
  });
}

async function pendingKind(page) {
  return page.evaluate(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("pivot-v2-save") ?? "null");
      const save = raw?.data ?? raw;
      return save?.pending?.kind ?? null;
    } catch {
      return null;
    }
  });
}

/** Walk the real UI once and keep a storage snapshot for every screen we want to audit. */
async function capture(browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const snaps = {};
  await page.goto(BASE);
  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await page.getByPlaceholder("Es. Marco Ferrara").fill("Audit Viewport Lungo");
  await page.getByRole("button", { name: "Gioca il Draft" }).click();
  await page.locator(".draft-card").first().waitFor();
  snaps.draft = await dump(page);
  const ready = page.getByRole("heading", { name: "Il tuo giocatore è pronto" });
  for (let r = 0; r < 12 && !(await ready.isVisible().catch(() => false)); r += 1) {
    await page.locator(".draft-card").first().click();
    await settle(page, 700);
  }
  await page.getByRole("button", { name: "Inizia la carriera" }).click();
  await page.getByRole("button", { name: /College NCAA/ }).click();
  await page.getByRole("button", { name: "Entra in palestra" }).click();
  await page.locator("[data-pending]").first().waitFor();
  await settle(page, 400);
  snaps["first-choice"] = await dump(page);
  const want = new Set(["recap", "playoff", "fa", "trade", "trade-notice", "retire", "hold"]);
  let midSaved = false;
  for (let step = 0; step < 260; step += 1) {
    if (await page.locator(".result-view").isVisible().catch(() => false)) break;
    const pending = page.locator("[data-pending]").first();
    if (!(await pending.isVisible().catch(() => false))) {
      await settle(page, 300);
      continue;
    }
    await settle(page, 1300); // the live save is debounced (360 ms + idle); let it land first
    const kind = await pendingKind(page);
    if (kind && want.has(kind) && !snaps[kind]) snaps[kind] = await dump(page);
    if (!midSaved && kind === "recap" && step > 20) {
      snaps["mid-career"] = await dump(page);
      midSaved = true;
    }
    await pending.locator("button").first().click({ timeout: 5000 }).catch(() => {});
  }
  await page.locator(".result-view").waitFor({ timeout: 20_000 });
  snaps.result = await dump(page);
  await ctx.close();
  return snaps;
}

/** Everything measured on the screen that is currently shown. */
async function measure(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const visible = (el) => {
      const s = getComputedStyle(el);
      if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const clippedByAncestor = (el) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (/(hidden|auto|scroll|clip)/.test(s.overflowX)) {
          const pr = p.getBoundingClientRect();
          const r = el.getBoundingClientRect();
          if (r.right > pr.right + 1 || r.left < pr.left - 1) return true;
        }
        if (p.inert || p.getAttribute("aria-hidden") === "true") return true;
      }
      return false;
    };
    const sel = (el) => {
      const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
      const txt = (el.innerText ?? el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
      return `${el.tagName.toLowerCase()}${cls ? "." + cls : ""}${txt ? ` "${txt}"` : ""}`;
    };
    const all = [...document.querySelectorAll("body *")].filter((el) => !(el instanceof SVGElement) || el.tagName === "svg");
    const outside = [];
    const clipped = [];
    for (const el of all) {
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      if ((r.right > vw + 1 || r.left < -1) && !clippedByAncestor(el)) outside.push({ el: sel(el), left: Math.round(r.left), right: Math.round(r.right) });
      const s = getComputedStyle(el);
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (hasText && /(hidden|clip)/.test(s.overflowX + s.overflowY) && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2)) {
        clipped.push({ el: sel(el), ellipsis: s.textOverflow === "ellipsis" || Number(s.webkitLineClamp) > 0, sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight });
      }
    }
    const targets = [];
    for (const el of document.querySelectorAll("button, a[href], input, select, textarea, [role=button], [role=tab], summary")) {
      if (!visible(el) || el.closest("[inert]")) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > document.documentElement.scrollHeight) continue;
      const inlineLink = el.tagName === "A" && getComputedStyle(el).display === "inline";
      if (r.width < 44 || r.height < 44) targets.push({ el: sel(el), w: Math.round(r.width), h: Math.round(r.height), aa: r.width >= 24 && r.height >= 24, inlineLink, label: el.getAttribute("aria-label") ?? "" });
    }
    // Fixed / sticky layers that cover a control the user may need.
    // A modal scrim covering the page behind it is intended, not an overlap.
    const layers = all.filter((el) => visible(el) && /fixed|sticky/.test(getComputedStyle(el).position) && !el.querySelector("[aria-modal=true], dialog[open]"));
    const overlaps = [];
    for (const layer of layers) {
      const lr = layer.getBoundingClientRect();
      for (const el of document.querySelectorAll("button, a[href], input")) {
        if (layer.contains(el) || el.contains(layer) || !visible(el)) continue;
        const r = el.getBoundingClientRect();
        const ix = Math.min(r.right, lr.right) - Math.max(r.left, lr.left);
        const iy = Math.min(r.bottom, lr.bottom) - Math.max(r.top, lr.top);
        if (ix > 4 && iy > 4) {
          const cx = Math.max(r.left, lr.left) + ix / 2;
          const cy = Math.max(r.top, lr.top) + iy / 2;
          const top = document.elementFromPoint(cx, cy);
          if (top && !el.contains(top) && layer.contains(top)) overlaps.push({ layer: sel(layer), control: sel(el) });
        }
      }
    }
    // Tables / grids that must scroll sideways.
    const scrollers = [...document.querySelectorAll("table, [role=table], .league-table, .table-wrap")].filter(visible).map((el) => ({ el: sel(el), sw: el.scrollWidth, cw: el.clientWidth }));
    const minFont = Math.min(...all.filter((el) => visible(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((el) => parseFloat(getComputedStyle(el).fontSize)));
    return {
      docOverflow: document.documentElement.scrollWidth > vw + 1 ? document.documentElement.scrollWidth - vw : 0,
      vw,
      vh,
      outside: outside.slice(0, 15),
      clipped: clipped.slice(0, 20),
      targets,
      overlaps: overlaps.slice(0, 10),
      scrollers,
      minFont,
    };
  });
}

async function axe(page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, first: v.nodes[0]?.target.join(" "), summary: (v.nodes[0]?.failureSummary ?? "").replace(/\s+/g, " ").slice(0, 200) }));
}

const TABS = [
  ["tab-anno", "Anno"],
  ["tab-lega", "Lega"],
  ["tab-vita", "Vita"],
];

async function open(page, snap) {
  await page.goto(BASE);
  await page.evaluate((s) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
  }, snap);
  await page.reload();
  await settle(page, 700);
}

async function run() {
  const browser = await ENGINE.launch();
  const snaps = await capture(browser);
  writeFileSync(join(OUT, "snapshots.json"), JSON.stringify(Object.keys(snaps)));
  const results = [];
  const only = process.env.AUDIT_VIEWPORTS?.split(",");
  for (const vp of VIEWPORTS.filter((v) => !only || only.includes(v.name))) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr ?? 1, reducedMotion: "reduce", hasTouch: vp.width < 1000, isMobile: false });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const record = async (screen) => {
      await settle(page, 500);
      const m = await measure(page);
      const a = await axe(page);
      if (SHOTS) await page.screenshot({ path: join(OUT, `${vp.name}-${screen}.png`), fullPage: true });
      results.push({ viewport: vp.name, screen, ...m, axe: a });
    };
    // Home, guide, setup.
    await page.goto(BASE);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole("button", { name: "Inizia", exact: true }).waitFor();
    await record("home");
    await page.getByRole("button", { name: "Come si gioca" }).click();
    await record("guide");
    await page.keyboard.press("Escape");
    await settle(page);
    await page.getByRole("button", { name: "Inizia", exact: true }).click();
    await page.getByRole("heading", { name: "Chi sei sul parquet" }).waitFor();
    await record("setup");
    for (const [name, snap] of Object.entries(snaps)) {
      if (name === "result") continue;
      await open(page, snap);
      await record(name);
      if (name === "mid-career") {
        for (const [label, tab] of TABS) {
          await page.getByRole("button", { name: tab, exact: true }).click().catch(() => {});
          await record(label);
        }
      }
    }
    // Result and archive: the archive snapshot from the finished career.
    await open(page, snaps.result);
    const archiveBtn = page.getByRole("button", { name: /Archivio/ }).first();
    if (await archiveBtn.isVisible().catch(() => false)) {
      await archiveBtn.click();
      await settle(page);
      await record("archive");
      const card = page.locator(".archive-row, .archive-item, [data-archive] button").first();
      const entry = page.getByRole("button", { name: /Audit Viewport Lungo/ }).first();
      if (await entry.isVisible().catch(() => false)) {
        await entry.click();
        await record("career-card");
      } else if (await card.isVisible().catch(() => false)) {
        await card.click();
        await record("career-card");
      }
    }
    results.push({ viewport: vp.name, screen: "_errors", errors });
    await ctx.close();
  }
  await browser.close();
  writeFileSync(join(OUT, "audit.json"), JSON.stringify(results, null, 2));
  // Compact summary.
  const lines = [];
  for (const r of results) {
    if (r.screen === "_errors") {
      if (r.errors.length) lines.push(`${r.viewport} ERRORS ${r.errors.join(" | ")}`);
      continue;
    }
    const small = r.targets.filter((t) => !t.inlineLink);
    lines.push(
      `${r.viewport.padEnd(9)} ${r.screen.padEnd(13)} overflow=${r.docOverflow} outside=${r.outside.length} clipped=${r.clipped.filter((c) => !c.ellipsis).length}/${r.clipped.length} targets<44=${small.length} (<24=${small.filter((t) => !t.aa).length}) overlaps=${r.overlaps.length} axe=${r.axe.map((a) => `${a.id}×${a.n}`).join(",") || 0} minFont=${r.minFont}`,
    );
  }
  writeFileSync(join(OUT, "summary.txt"), lines.join("\n") + "\n");
  console.log(lines.join("\n"));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
