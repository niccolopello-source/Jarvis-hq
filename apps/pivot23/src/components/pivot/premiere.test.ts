import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/* Home premiere timings live in CSS. These checks pin the configured values so a change is deliberate. */

const styles = readFileSync(new URL("../../styles.css", import.meta.url), "utf8");
const intro = readFileSync(new URL("../../intro.css", import.meta.url), "utf8");

function block(css: string, selector: string): string {
  const at = css.indexOf(`${selector} {`);
  assert.ok(at >= 0, `missing ${selector}`);
  return css.slice(at, css.indexOf("}", at));
}

test("the first-visit home premiere is 6.3 s: the 4.8 s that shipped plus the requested 1.5 s", () => {
  const rule = block(styles, ".court-mark-live.is-premiere");
  const ms = Number(/cineReveal\s+([\d.]+)s/.exec(rule)?.[1]) * 1000;
  assert.equal(ms, 4800 + 1500);
});

test("lean devices and returning visits keep the short 1.6 s premiere", () => {
  assert.match(block(styles, "html.pivot-lean .court-mark-live.is-premiere"), /animation-duration:\s*1\.6s/);
  assert.match(block(intro, "html.pivot-intro-seen .court-mark-live.is-premiere"), /animation-duration:\s*1\.6s/);
});

test("reduced motion switches the premiere animation off entirely", () => {
  const media = styles.slice(styles.indexOf("@media (prefers-reduced-motion: reduce) {\n  .court-mark-live.is-premiere"));
  assert.match(media.slice(0, 300), /animation:\s*none/);
});

test("the skip chip stacks above the mark wrapper that follows it", () => {
  assert.match(block(intro, ".intro-hero > .cine-skip"), /z-index:\s*2/);
  assert.match(block(styles, ".intro-hero > *"), /z-index:\s*1/);
});
