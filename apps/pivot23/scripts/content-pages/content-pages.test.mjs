import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { buildAll, plainText, words } from "./build.mjs";

/** Static content pages: committed output matches the sources, and every page is real, JS-free HTML. */
const { files, report } = buildAll();
const PUBLIC_DIR = join(import.meta.dirname, "..", "..", "public");
const pages = [...files].filter(([p]) => p.endsWith("index.html"));
const routes = new Set(report.map((r) => r.route));

test("committed public/ files are up to date with content/", () => {
  for (const [path, body] of files) {
    assert.ok(existsSync(path), `missing ${path}: run node scripts/content-pages/build.mjs`);
    assert.equal(readFileSync(path, "utf8"), body, `${path} is stale: run node scripts/content-pages/build.mjs`);
  }
});

test("every page is static HTML with substantial text and no script", () => {
  assert.equal(pages.length, 32);
  for (const [path, html] of pages) {
    const route = path.slice(PUBLIC_DIR.length);
    assert.doesNotMatch(html, /<script/i, `${route} has a script`);
    assert.doesNotMatch(html, /adsbygoogle|googlesyndication|doubleclick/i, `${route} references an ad network`);
    assert.match(html, /<html lang="(it|en)">/);
    assert.match(html, /<link rel="canonical" href="https:\/\/www\.pivot23\.com\/[^"]*\/" \/>/);
    const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    const min = /\/(termini|terms|contatti|contact)\//.test(route) ? 140 : 350;
    assert.ok(words(plainText(main)) >= min, `${route}: ${words(plainText(main))} words < ${min}`);
  }
});

test("internal links point to the game or to a generated page", () => {
  for (const [path, html] of pages) {
    for (const [, href] of html.matchAll(/href="(\/[^"#]*)(?:#[^"]*)?"/g)) {
      if (href === "/" || /^\/(site\/site\.css|favicon\.ico|icon-192\.png|apple-touch-icon\.png)$/.test(href)) continue;
      assert.ok(routes.has(href), `${path}: broken internal link ${href}`);
    }
  }
});

test("sitemap lists the game and every page; no trademarked league names in page titles", () => {
  const sitemap = files.get(join(PUBLIC_DIR, "sitemap.xml"));
  for (const route of ["/", ...routes]) assert.ok(sitemap.includes(`<loc>https://www.pivot23.com${route}</loc>`), route);
  for (const [, html] of pages) assert.doesNotMatch(html.match(/<title>(.*)<\/title>/)[1], /NBA|NCAA|G League|EuroLeague|Eurolega/);
});
