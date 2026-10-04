/**
 * Raster of the boot mark in index.html. Same paths, same colours, no gleam
 * (the gleam is the intro animation, not the resting mark). Figtree is not
 * shipped, so the "23" uses the same font stack the page already declares.
 * Run: node scripts/render-favicon.mjs
 */
import { chromium } from "playwright";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const html = `<!doctype html><html><head><style>html,body{margin:0;background:#0c0b0d}</style></head>
<body><svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 80 80">
<rect width="80" height="80" fill="#0c0b0d"/>
<circle cx="40" cy="40" r="34.6" fill="none" stroke="#A31D2E" stroke-width="5.4"/>
<g fill="none" stroke="#A31D2E" stroke-width="3.15" stroke-linecap="round">
<path d="M22.2 22.4 A22.2 22.2 0 0 1 57.8 22.4"/>
<path d="M57.8 57.6 A22.2 22.2 0 0 1 22.2 57.6"/>
</g>
<line x1="4.2" y1="40" x2="16.6" y2="40" stroke="#A31D2E" stroke-width="4.4" stroke-linecap="square"/>
<line x1="63.4" y1="40" x2="75.8" y2="40" stroke="#A31D2E" stroke-width="4.4" stroke-linecap="square"/>
<text x="40" y="41.5" text-anchor="middle" dominant-baseline="central" font-size="26" font-weight="700" letter-spacing="-0.07em" fill="#f5f5f7" font-family="Figtree, -apple-system, BlinkMacSystemFont, system-ui, sans-serif">23</text>
</svg></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "load" });
const master = join("/tmp", "pivot-mark-512.png");
await page.screenshot({ path: master, clip: { x: 0, y: 0, width: 512, height: 512 } });
await browser.close();

const py = spawnSync("python3", ["-c", `
from PIL import Image
master = Image.open(${JSON.stringify(master)}).convert("RGBA")
assert master.size == (512, 512)
root = ${JSON.stringify(root)}
for size, name in [(192, "icon-192.png"), (180, "apple-touch-icon.png")]:
    im = master.resize((size, size), Image.Resampling.LANCZOS)
    im.save(f"{root}/{name}", optimize=True)
ico = master
ico.save(f"{root}/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
print("ok")
`], { encoding: "utf8" });
if (py.status !== 0) {
  console.error(py.stdout, py.stderr);
  process.exit(py.status ?? 1);
}
console.log("wrote favicon assets");
