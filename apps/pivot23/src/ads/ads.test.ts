import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { consentAllowsAds } from "./consent";
import { isDesktop, type DeviceSignals } from "./eligibility";
import { shouldShowInterstitial } from "./frequency";
import { AD_STRINGS } from "./strings";
import { isValidClient } from "./config";

const pc: DeviceSignals = { width: 1440, hoverFine: true, anyCoarse: false, maxTouchPoints: 0, uaMobile: false };

test("eligibility: desktop PC passes, every single failing signal drops it", () => {
  assert.equal(isDesktop(pc), true);
  assert.equal(isDesktop({ ...pc, uaMobile: undefined }), true); // Safari/Firefox: no UA-CH
  assert.equal(isDesktop({ ...pc, width: 1279 }), false);
  assert.equal(isDesktop({ ...pc, hoverFine: false }), false);
  assert.equal(isDesktop({ ...pc, anyCoarse: true }), false); // 2-in-1 / iPad + keyboard
  assert.equal(isDesktop({ ...pc, maxTouchPoints: 5 }), false); // iPadOS as Mac
  assert.equal(isDesktop({ ...pc, uaMobile: true }), false);
  // phone, tablet
  assert.equal(isDesktop({ width: 390, hoverFine: false, anyCoarse: true, maxTouchPoints: 5, uaMobile: true }), false);
  assert.equal(isDesktop({ width: 1366, hoverFine: false, anyCoarse: true, maxTouchPoints: 10, uaMobile: false }), false);
});

test("consent: only tcloaded/useractioncomplete with Purpose 1 or gdprApplies=false", () => {
  assert.equal(consentAllowsAds(null), false);
  assert.equal(consentAllowsAds({ eventStatus: "cmpuishown", gdprApplies: true }), false);
  assert.equal(consentAllowsAds({ eventStatus: "tcloaded", gdprApplies: true, purpose: { consents: {} } }), false);
  assert.equal(consentAllowsAds({ eventStatus: "useractioncomplete", gdprApplies: true, purpose: { consents: { "1": true } } }), true);
  assert.equal(consentAllowsAds({ eventStatus: "tcloaded", gdprApplies: false }), true);
});

test("interstitial cap: guests only, every 3rd season end, min gap", () => {
  const now = 10_000_000;
  assert.equal(shouldShowInterstitial({ seasonEnds: 1, lastShownAt: 0 }, now, false), false);
  assert.equal(shouldShowInterstitial({ seasonEnds: 3, lastShownAt: 0 }, now, false), true);
  assert.equal(shouldShowInterstitial({ seasonEnds: 3, lastShownAt: 0 }, now, true), false);
  assert.equal(shouldShowInterstitial({ seasonEnds: 6, lastShownAt: now - 60_000 }, now, false), false);
});

test("client id validation keeps ads off for empty/placeholder ids", () => {
  assert.equal(isValidClient(""), false);
  assert.equal(isValidClient("ca-pub-XXXXXXXXXXXXXXXX"), false);
  assert.equal(isValidClient("ca-pub-1234567890123456"), true);
});

test("ads strings: IT and EN have the same keys, none empty", () => {
  assert.deepEqual(Object.keys(AD_STRINGS.it).sort(), Object.keys(AD_STRINGS.en).sort());
  for (const v of [...Object.values(AD_STRINGS.it), ...Object.values(AD_STRINGS.en)]) assert.ok(v.trim().length > 0);
});

test("flag OFF by default: no env file enables ads, engine never imports ads", () => {
  const root = new URL("../../", import.meta.url);
  for (const f of readdirSync(root).filter((n) => n.startsWith(".env"))) {
    assert.doesNotMatch(readFileSync(new URL(f, root), "utf8"), /VITE_ADS_ENABLED\s*=\s*true/);
  }
  const lib = new URL("../lib/pivot/", import.meta.url);
  for (const f of readdirSync(lib, { recursive: true }) as string[]) {
    if (!/\.tsx?$/.test(f)) continue;
    assert.doesNotMatch(readFileSync(new URL(f, lib), "utf8"), /@\/ads|\.\.\/\.\.\/ads/, f);
  }
});

test("flag OFF: adBreakAtSeasonEnd proceeds synchronously", async () => {
  const { adBreakAtSeasonEnd } = await import("./adBreak");
  let n = 0;
  adBreakAtSeasonEnd(() => n++);
  assert.equal(n, 1);
});

test("interstitial: game continues after the timeout when no ad starts, and proceed runs once", async () => {
  const g = globalThis as unknown as { window?: unknown };
  const prev = g.window;
  let pushed: Record<string, () => void> | null = null;
  g.window = { setTimeout, clearTimeout, adBreak: (o: Record<string, () => void>) => (pushed = o) };
  try {
    const { adsState, runInterstitial } = await import("./loader");
    adsState.adsLoaded = false;
    let n = 0;
    runInterstitial("t", () => n++, 30);
    assert.equal(n, 1, "no ads loaded -> immediate");
    adsState.adsLoaded = true;
    n = 0;
    runInterstitial("t", () => n++, 30);
    assert.equal(n, 0);
    await new Promise((r) => setTimeout(r, 60));
    assert.equal(n, 1, "timeout -> continue");
    (pushed as unknown as Record<string, () => void>).adBreakDone(); // late callback must not double-advance
    assert.equal(n, 1);
    adsState.adsLoaded = false;
  } finally {
    g.window = prev;
  }
});
