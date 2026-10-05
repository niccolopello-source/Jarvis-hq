import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  FULL_BEATS,
  FULL_TIMELINE,
  LATE_GRACE_MS,
  PREMIERE_MS,
  cssTimeMs,
  introTimeline,
  parsePref,
  planRemaining,
  soundEnabled,
} from "./timeline";

const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const intro = readFileSync(new URL("../intro.css", import.meta.url), "utf8");

function block(css: string, selector: string): string {
  const at = css.indexOf(`${selector} {`);
  assert.ok(at >= 0, `missing ${selector}`);
  return css.slice(at, css.indexOf("}", at));
}

function beat(css: string, name: string): number {
  return cssTimeMs(new RegExp(`${name}:\\s*(-?[\\d.]+(?:ms|s))`).exec(block(css, ".court-mark-live.is-premiere"))?.[1]);
}

test("logo cues are two dribbles then the swish", () => {
  assert.deepEqual(FULL_TIMELINE, [
    { name: "bounce1", at: 1400 },
    { name: "bounce2", at: 2400 },
    { name: "swish", at: 3400 },
  ]);
});

test("the timeline follows the CSS custom properties, not a guessed curve", () => {
  const premiere = block(styles, ".court-mark-live.is-premiere");
  assert.equal(cssTimeMs(/--cine:\s*([\d.]+s)/.exec(premiere)?.[1]), PREMIERE_MS);
  assert.equal(beat(styles, "--beat-b1"), FULL_BEATS.bounce1);
  assert.equal(beat(styles, "--beat-b2"), FULL_BEATS.bounce2);
  assert.equal(cssTimeMs(/--beat-b3:\s*(-?[\d.]+s)/.exec(premiere)?.[1]), -1000);
  assert.equal(beat(styles, "--beat-swish"), FULL_BEATS.swish);
  assert.deepEqual(introTimeline(PREMIERE_MS, FULL_BEATS), FULL_TIMELINE);
});

test("the two dribbles stay apart and the swish resolves the logo before the premiere ends", () => {
  const [b1, b2, sw] = FULL_TIMELINE.map((c) => c.at);
  assert.equal(b2! - b1!, 1000);
  assert.equal(sw! - b2!, 1000);
  assert.ok(PREMIERE_MS - sw! >= 1200 && PREMIERE_MS - sw! <= 1800);
});

test("lean devices and returning visits do not get a second, shorter premiere", () => {
  assert.equal(styles.includes("html.pivot-lean .court-mark-live.is-premiere"), false);
  assert.equal(intro.includes("html.pivot-intro-seen .court-mark-live.is-premiere"), false);
  assert.equal(styles.includes("cine-ball"), false);
  assert.equal(styles.includes("cineBall"), false);
});

test("invalid timing yields no cues instead of NaN schedules", () => {
  assert.deepEqual(introTimeline(NaN, FULL_BEATS), []);
  assert.deepEqual(introTimeline(0, FULL_BEATS), []);
  assert.deepEqual(introTimeline(PREMIERE_MS, {}), []);
  assert.deepEqual(introTimeline(PREMIERE_MS, { bounce1: 100 }), []);
});

test("a gesture before the first beat schedules both dribbles and the swish", () => {
  assert.deepEqual(planRemaining(FULL_TIMELINE, 200), [
    { name: "bounce1", delayMs: 1200 },
    { name: "bounce2", delayMs: 2200 },
    { name: "swish", delayMs: 3200 },
  ]);
});

test("a gesture mid-premiere plays only what is still ahead, in sync", () => {
  assert.deepEqual(planRemaining(FULL_TIMELINE, 1600), [
    { name: "bounce2", delayMs: 800 },
    { name: "swish", delayMs: 1800 },
  ]);
  assert.deepEqual(planRemaining(FULL_TIMELINE, 2500), [{ name: "swish", delayMs: 900 }]);
  assert.deepEqual(planRemaining(FULL_TIMELINE, 4000), []);
});

test("a just-missed cue (inside the grace) plays at once; an older one is skipped", () => {
  assert.deepEqual(planRemaining(FULL_TIMELINE, 2400 + LATE_GRACE_MS - 1)[0], { name: "bounce2", delayMs: 0 });
  assert.equal(planRemaining(FULL_TIMELINE, 2400 + LATE_GRACE_MS + 1)[0]!.name, "swish");
  assert.deepEqual(planRemaining(FULL_TIMELINE, NaN), []);
});

test("css time parsing", () => {
  assert.equal(cssTimeMs("9.2s"), 9200);
  assert.equal(cssTimeMs("1.15s"), 1150);
  assert.equal(cssTimeMs("-1s"), -1000);
  assert.equal(cssTimeMs("700ms"), 700);
  assert.equal(cssTimeMs("0.7s, 1s"), 700);
  assert.ok(Number.isNaN(cssTimeMs("")));
  assert.ok(Number.isNaN(cssTimeMs(undefined)));
});

test("preference: on by default, off by default under reduced motion, explicit choice always wins", () => {
  assert.equal(parsePref("on"), "on");
  assert.equal(parsePref("off"), "off");
  assert.equal(parsePref("yes"), null);
  assert.equal(parsePref(null), null);
  assert.equal(soundEnabled(null, false), true);
  assert.equal(soundEnabled(null, true), false);
  assert.equal(soundEnabled("off", false), false);
  assert.equal(soundEnabled("on", true), true);
});
