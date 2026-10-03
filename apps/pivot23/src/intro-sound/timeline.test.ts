import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  FULL_BEATS,
  FULL_TIMELINE,
  LATE_GRACE_MS,
  PREMIERE_MS,
  SHORT_TIMELINE,
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

test("first-visit cues sit on the picture: three dribbles then the swish", () => {
  assert.deepEqual(FULL_TIMELINE, [
    { name: "bounce1", at: 1150 },
    { name: "bounce2", at: 2050 },
    { name: "bounce3", at: 2800 },
    { name: "swish", at: 4850 },
  ]);
});

test("the timeline follows the CSS custom properties, not a guessed curve", () => {
  const premiere = block(styles, ".court-mark-live.is-premiere");
  assert.equal(cssTimeMs(/--cine:\s*([\d.]+s)/.exec(premiere)?.[1]), PREMIERE_MS);
  assert.equal(beat(styles, "--beat-b1"), FULL_BEATS.bounce1);
  assert.equal(beat(styles, "--beat-b2"), FULL_BEATS.bounce2);
  assert.equal(beat(styles, "--beat-b3"), FULL_BEATS.bounce3);
  assert.equal(beat(styles, "--beat-swish"), FULL_BEATS.swish);
  assert.deepEqual(introTimeline(PREMIERE_MS, FULL_BEATS), FULL_TIMELINE);
});

test("the dribble keeps a natural rhythm and the swish is the shot, not another bounce", () => {
  const [b1, b2, b3, sw] = FULL_TIMELINE.map((c) => c.at);
  assert.equal(b2! - b1!, 900);
  assert.equal(b3! - b2!, 750);
  assert.ok(sw! - b3! >= 1600 && sw! - b3! <= 2400, "a readable shot flight between the gather and the net");
  assert.ok(sw! < PREMIERE_MS - 900, "the swish tail ends before the premiere hands over to the sweep");
});

test("the 1.6 s premiere (returning visit, lean device) is swish only", () => {
  assert.deepEqual(SHORT_TIMELINE, [{ name: "swish", at: 610 }]);
  for (const css of [styles, intro]) {
    const rule = css.includes("html.pivot-lean") ? block(css, "html.pivot-lean .court-mark-live.is-premiere") : block(css, "html.pivot-intro-seen .court-mark-live.is-premiere");
    assert.match(rule, /animation-duration:\s*1\.6s/);
    assert.equal(cssTimeMs(/--beat-swish:\s*(-?[\d.]+s)/.exec(rule)?.[1]), 610);
    assert.equal(cssTimeMs(/--beat-b1:\s*(-?[\d.]+s)/.exec(rule)?.[1]), -1000);
  }
});

test("invalid timing yields no cues instead of NaN schedules", () => {
  assert.deepEqual(introTimeline(NaN, FULL_BEATS), []);
  assert.deepEqual(introTimeline(0, FULL_BEATS), []);
  assert.deepEqual(introTimeline(PREMIERE_MS, {}), []);
  assert.deepEqual(introTimeline(PREMIERE_MS, { bounce1: 100 }), []);
});

test("a gesture before the first beat schedules every cue with its remaining delay", () => {
  assert.deepEqual(planRemaining(FULL_TIMELINE, 200), [
    { name: "bounce1", delayMs: 950 },
    { name: "bounce2", delayMs: 1850 },
    { name: "bounce3", delayMs: 2600 },
    { name: "swish", delayMs: 4650 },
  ]);
});

test("a gesture mid-premiere plays only what is still ahead, in sync", () => {
  assert.deepEqual(planRemaining(FULL_TIMELINE, 1500), [
    { name: "bounce2", delayMs: 550 },
    { name: "bounce3", delayMs: 1300 },
    { name: "swish", delayMs: 3350 },
  ]);
  assert.deepEqual(planRemaining(FULL_TIMELINE, 3000), [{ name: "swish", delayMs: 1850 }]);
  assert.deepEqual(planRemaining(FULL_TIMELINE, 5000), []);
});

test("a just-missed cue (inside the grace) plays at once; an older one is skipped", () => {
  assert.deepEqual(planRemaining(FULL_TIMELINE, 2050 + LATE_GRACE_MS - 1)[0], { name: "bounce2", delayMs: 0 });
  assert.equal(planRemaining(FULL_TIMELINE, 2050 + LATE_GRACE_MS + 1)[0]!.name, "bounce3");
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
