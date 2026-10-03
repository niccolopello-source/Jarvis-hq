import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { FULL_TIMELINE, LATE_GRACE_MS, cssTimeMs, introTimeline, parsePref, planRemaining, soundEnabled } from "./timeline";

const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

test("first-visit cues sit on the premiere beats: gleam 700 ms, settle start 1260 ms, landing 2400 ms", () => {
  assert.deepEqual(FULL_TIMELINE, [
    { name: "bounce1", at: 700 },
    { name: "bounce2", at: 1260 },
    { name: "swish", at: 2400 },
  ]);
});

test("the timeline follows the CSS: cineReveal 6.3 s and the cineArc 0.7 s delay", () => {
  const reveal = cssTimeMs(/animation:\s*cineReveal\s+([\d.]+s)/.exec(styles)?.[1]);
  const gleam = cssTimeMs(/animation:\s*cineArc\s+[\d.]+s\s+cubic-bezier\([^)]*\)\s+([\d.]+s)/.exec(styles)?.[1]);
  assert.equal(reveal, 6300);
  assert.equal(gleam, 700);
  assert.deepEqual(introTimeline(reveal, gleam), FULL_TIMELINE);
});

test("the dribble keeps a natural rhythm: 560 ms between bounces, swish after a shot-length pause", () => {
  const [b1, b2, sw] = FULL_TIMELINE.map((c) => c.at);
  assert.equal(b2! - b1!, 560);
  assert.ok(sw! - b2! >= 800 && sw! - b2! <= 1400);
  assert.ok(sw! < 6300 - 900, "the swish tail ends well before the premiere hands over to the sweep");
});

test("the 1.6 s premiere (returning visit, lean device) is swish only, on the same landing beat", () => {
  const short = introTimeline(1600, 150);
  assert.deepEqual(short.map((c) => c.name), ["swish"]);
  assert.equal(short[0]!.at, Math.round(320 + 1280 * 0.2262));
});

test("invalid timing yields no cues instead of NaN schedules", () => {
  assert.deepEqual(introTimeline(NaN, 700), []);
  assert.deepEqual(introTimeline(0, 700), []);
  assert.equal(introTimeline(6300, NaN)[0]!.at, 0);
});

test("a gesture before the first beat schedules all three cues with their remaining delays", () => {
  assert.deepEqual(planRemaining(FULL_TIMELINE, 200), [
    { name: "bounce1", delayMs: 500 },
    { name: "bounce2", delayMs: 1060 },
    { name: "swish", delayMs: 2200 },
  ]);
});

test("a gesture mid-premiere plays only what is still ahead, in sync", () => {
  assert.deepEqual(planRemaining(FULL_TIMELINE, 1000), [
    { name: "bounce2", delayMs: 260 },
    { name: "swish", delayMs: 1400 },
  ]);
  assert.deepEqual(planRemaining(FULL_TIMELINE, 2000), [{ name: "swish", delayMs: 400 }]);
  assert.deepEqual(planRemaining(FULL_TIMELINE, 3000), []);
});

test("a just-missed cue (inside the grace) plays at once; an older one is skipped", () => {
  assert.deepEqual(planRemaining(FULL_TIMELINE, 1260 + LATE_GRACE_MS - 1)[0], { name: "bounce2", delayMs: 0 });
  assert.equal(planRemaining(FULL_TIMELINE, 1260 + LATE_GRACE_MS + 1)[0]!.name, "swish");
  assert.deepEqual(planRemaining(FULL_TIMELINE, NaN), []);
});

test("css time parsing", () => {
  assert.equal(cssTimeMs("6.3s"), 6300);
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
