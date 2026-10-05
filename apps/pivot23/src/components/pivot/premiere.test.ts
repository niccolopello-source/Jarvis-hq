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

test("the logo premiere is 4.8 s on every device and does not draw a basketball", () => {
  const rule = block(styles, ".court-mark-live.is-premiere");
  const ms = Number(/--cine:\s*([\d.]+)s/.exec(rule)?.[1]) * 1000;
  assert.equal(ms, 4800);
  assert.ok(ms >= 3000 && ms <= 5000);
  assert.equal(styles.includes("cine-ball"), false);
  assert.equal(styles.includes("cineBall"), false);
  assert.equal(styles.includes("html.pivot-lean .court-mark-live.is-premiere"), false);
  assert.equal(intro.includes("html.pivot-intro-seen .court-mark-live.is-premiere"), false);
  assert.match(styles, /#C40018/);
  assert.match(rule, /--beat-swish:\s*3\.4s/);
});

test("reduced motion switches the premiere animation off entirely", () => {
  const media = styles.slice(styles.indexOf("@media (prefers-reduced-motion: reduce) {\n  .court-mark-live.is-premiere"));
  assert.match(media.slice(0, 900), /animation:\s*none/);
});

test("the skip chip stacks above the mark wrapper that follows it", () => {
  assert.match(block(intro, ".intro-hero > .cine-skip"), /z-index:\s*2/);
  assert.match(block(styles, ".intro-hero > *"), /z-index:\s*1/);
});
