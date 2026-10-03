import { expect, test, type Page } from "@playwright/test";

/**
 * Intro sounds (src/intro-sound): three dribbles and a net swish synced to the home premiere.
 * Web Audio is replaced by a recording mock, so the checks are exact and need no sound card:
 * nothing is created before a gesture, the remaining cues are scheduled in sync on the gesture,
 * mute and reduced motion are respected, Salta / Inizia stop everything and nothing replays.
 */

const CUES = { bounce1: 1150, bounce2: 2050, bounce3: 2800, swish: 4850 };

type Rec = {
  contexts: number;
  resumes: number;
  starts: { kind: string; at: number }[];
  stops: { at: number; callAt: number }[];
  premiereStart: number;
  violations: string[];
};

async function setup(page: Page, opts: { mock?: boolean; pref?: "on" | "off" } = {}) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  await page.addInitScript(
    ({ mock, pref }) => {
      Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, get: () => 8 });
      if (pref) localStorage.setItem("pivot23.introSound", pref);
      const rec = { contexts: 0, resumes: 0, starts: [] as { kind: string; at: number }[], stops: [] as { at: number; callAt: number }[], premiereStart: 0, violations: [] as string[] };
      (window as unknown as { __audio: typeof rec }).__audio = rec;
      document.addEventListener("securitypolicyviolation", (e) => rec.violations.push(`${e.violatedDirective} ${e.blockedURI}`));
      document.addEventListener(
        "animationstart",
        (e) => {
          if (e.animationName !== "cineReveal" || rec.premiereStart) return;
          const a = (e.target as Element).getAnimations().find((x) => (x as CSSAnimation).animationName === "cineReveal");
          rec.premiereStart = typeof a?.startTime === "number" ? a.startTime : performance.now() - e.elapsedTime * 1000;
        },
        true,
      );
      if (!mock) return;
      class Param {
        value = 1;
        setValueAtTime() { return this; }
        linearRampToValueAtTime() { return this; }
        exponentialRampToValueAtTime(v: number) {
          if (v <= 0) throw new RangeError("bad ramp");
          return this;
        }
        setTargetAtTime() { return this; }
        cancelScheduledValues() { return this; }
      }
      class Node {
        connect(d: unknown) { return d; }
        disconnect() {}
      }
      class MockContext {
        state = "suspended";
        sampleRate = 48000;
        baseLatency = 0;
        outputLatency = 0;
        destination = new Node();
        private born = performance.now();
        constructor() {
          rec.contexts += 1;
        }
        get currentTime() {
          return (performance.now() - this.born) / 1000;
        }
        resume() {
          rec.resumes += 1;
          this.state = "running";
          return Promise.resolve();
        }
        suspend() {
          this.state = "suspended";
          return Promise.resolve();
        }
        createBuffer(ch: number, length: number, rate: number) {
          const data = Array.from({ length: ch }, () => new Float32Array(length));
          return { length, sampleRate: rate, duration: length / rate, numberOfChannels: ch, getChannelData: (c: number) => data[c] };
        }
        createGain() { return Object.assign(new Node(), { gain: new Param() }); }
        createBiquadFilter() { return Object.assign(new Node(), { frequency: new Param(), Q: new Param(), gain: new Param(), type: "lowpass" }); }
        createConvolver() { return Object.assign(new Node(), { buffer: null }); }
        createDynamicsCompressor() {
          return Object.assign(new Node(), { threshold: new Param(), knee: new Param(), ratio: new Param(), attack: new Param(), release: new Param() });
        }
        private source(kind: string, extra: object) {
          const toPerf = (t: number) => performance.now() + (t - this.currentTime) * 1000;
          return Object.assign(new Node(), extra, {
            onended: null,
            start: (t = 0) => rec.starts.push({ kind, at: toPerf(t) }),
            stop: (t = 0) => rec.stops.push({ at: toPerf(t), callAt: performance.now() }),
          });
        }
        createOscillator() { return this.source("osc", { frequency: new Param(), detune: new Param(), type: "sine" }); }
        createBufferSource() { return this.source("buffer", { buffer: null, loop: false, playbackRate: new Param() }); }
      }
      (window as unknown as { AudioContext: unknown }).AudioContext = MockContext;
    },
    { mock: opts.mock ?? true, pref: opts.pref },
  );
  return errors;
}

const rec = (page: Page) => page.evaluate(() => (window as unknown as { __audio: Rec }).__audio);
const elapsed = (page: Page) => page.evaluate(() => performance.now() - (window as unknown as { __audio: Rec }).__audio.premiereStart);
const waitElapsed = (page: Page, ms: number) =>
  page.waitForFunction((ms) => {
    const r = (window as unknown as { __audio: Rec }).__audio;
    return r.premiereStart > 0 && performance.now() - r.premiereStart >= ms;
  }, ms);

/** Groups source starts into cues (sources of one cue start within ~200 ms) and returns their premiere times. */
function cueTimes(r: Rec): number[] {
  const times = r.starts.map((s) => s.at - r.premiereStart).sort((a, b) => a - b);
  const groups: number[] = [];
  for (const t of times) if (!groups.length || t - groups[groups.length - 1]! > 250) groups.push(t);
  return groups;
}

const neutral = (page: Page) => page.locator(".intro-hero .display-title");
const toggle = (page: Page) => page.locator(".sound-toggle");

function clean(errors: string[], r: Rec) {
  expect(errors, "console errors").toEqual([]);
  expect(r.violations, "CSP violations").toEqual([]);
}

test("first visit without interaction: no AudioContext is ever created (silent intro)", async ({ page }) => {
  const errors = await setup(page);
  await page.goto("/");
  await expect(page.locator(".court-mark-live.is-premiere")).toBeVisible();
  await waitElapsed(page, 3000);
  const r = await rec(page);
  expect(r.contexts).toBe(0);
  expect(r.starts).toHaveLength(0);
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  clean(errors, r);
});

test("a gesture mid-premiere schedules only the remaining cues, on the animation beats", async ({ page }) => {
  const errors = await setup(page);
  await page.goto("/");
  await waitElapsed(page, 850);
  await neutral(page).click();
  const at = await elapsed(page);
  await page.waitForFunction(() => (window as unknown as { __audio: Rec }).__audio.starts.length > 0);
  const r = await rec(page);
  expect(r.contexts).toBe(1);
  expect(r.resumes).toBeGreaterThan(0);
  const times = cueTimes(r);
  const expected = Object.values(CUES).filter((t) => t > at + 90);
  console.log(`gesture at ${Math.round(at)} ms -> cues at ${times.map(Math.round).join(", ")} ms`);
  expect(times).toHaveLength(expected.length);
  times.forEach((t, i) => expect(Math.abs(t - expected[i]!)).toBeLessThan(80));
  clean(errors, r);
});

test("a gesture before the first beat schedules the three dribbles and the swish", async ({ page }) => {
  const errors = await setup(page);
  await page.goto("/");
  await expect(page.locator(".court-mark-live.is-premiere")).toBeVisible();
  await page.keyboard.press("Tab");
  const at = await elapsed(page);
  test.skip(at > CUES.bounce1, `page too slow to gesture before ${CUES.bounce1} ms (${Math.round(at)})`);
  await page.waitForFunction(() => (window as unknown as { __audio: Rec }).__audio.starts.length > 0);
  const r = await rec(page);
  const times = cueTimes(r);
  expect(times).toHaveLength(4);
  times.forEach((t, i) => expect(Math.abs(t - Object.values(CUES)[i]!)).toBeLessThan(80));
  // Bounce: body + two ring partials. Swish: the net flutter. Three dribbles + one flutter.
  expect(r.starts.filter((s) => s.kind === "osc")).toHaveLength(3 + 3 + 3 + 1);
  clean(errors, r);
});

test("muted (stored off): a gesture creates nothing; the toggle turns sound on and the rest plays in sync", async ({ page }) => {
  const errors = await setup(page, { pref: "off" });
  await page.goto("/");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await expect(toggle(page)).toHaveAccessibleName("Suoni dell’intro");
  await waitElapsed(page, 300);
  await neutral(page).click();
  await page.waitForTimeout(200);
  expect((await rec(page)).contexts).toBe(0);
  await waitElapsed(page, 3400);
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await page.waitForFunction(() => (window as unknown as { __audio: Rec }).__audio.starts.length > 0);
  const r = await rec(page);
  expect(cueTimes(r)).toHaveLength(1); // only the swish was still ahead
  expect(Math.abs(cueTimes(r)[0]! - CUES.swish)).toBeLessThan(80);
  expect(await page.evaluate(() => localStorage.getItem("pivot23.introSound"))).toBe("on");
  clean(errors, r);
});

test("muting mid-play stops the sounds at once and the choice persists across reloads", async ({ page }) => {
  const errors = await setup(page);
  await page.goto("/");
  await waitElapsed(page, 300);
  await neutral(page).click();
  await page.waitForFunction(() => (window as unknown as { __audio: Rec }).__audio.starts.length > 0);
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  const r = await rec(page);
  const stopCall = Math.max(...r.stops.map((s) => s.callAt));
  // Every source got a stop within ~50 ms of the toggle, well before its scheduled end.
  expect(r.stops.filter((s) => s.callAt === stopCall || s.at - s.callAt < 60).length).toBeGreaterThanOrEqual(r.starts.length);
  const startsBefore = r.starts.length;
  await page.waitForTimeout(2500);
  expect((await rec(page)).starts.length).toBe(startsBefore);
  await page.reload();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  clean(errors, await rec(page));
});

test("Salta as the first gesture: nothing plays", async ({ page }) => {
  const errors = await setup(page);
  await page.goto("/");
  await waitElapsed(page, 500);
  await page.getByRole("button", { name: "Salta", exact: true }).click();
  await expect(page.locator(".is-premiere")).toHaveCount(0);
  await page.waitForTimeout(2500);
  const r = await rec(page);
  expect(r.starts).toHaveLength(0);
  clean(errors, r);
});

test("Salta and Inizia stop a playing sequence; going back home never replays it", async ({ page }) => {
  const errors = await setup(page);
  await page.goto("/");
  await waitElapsed(page, 300);
  await neutral(page).click();
  await page.waitForFunction(() => (window as unknown as { __audio: Rec }).__audio.starts.length > 0);
  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await expect(page.getByPlaceholder("Es. Marco Ferrara")).toBeVisible();
  let r = await rec(page);
  const stopped = r.stops.filter((s) => s.at - s.callAt < 60).length;
  expect(stopped).toBeGreaterThanOrEqual(r.starts.length);
  const starts = r.starts.length;
  await page.locator(".back-link").click();
  await expect(page.getByRole("button", { name: "Inizia", exact: true })).toBeVisible();
  await neutral(page).click();
  await page.waitForTimeout(3000);
  r = await rec(page);
  expect(r.starts.length).toBe(starts);
  expect(r.contexts).toBe(1);
  clean(errors, r);

  const errors2 = await setup(page);
  await page.goto("/");
  await waitElapsed(page, 300);
  await neutral(page).click();
  await page.waitForFunction(() => (window as unknown as { __audio: Rec }).__audio.starts.length > 0);
  await page.getByRole("button", { name: "Salta", exact: true }).click();
  r = await rec(page);
  expect(r.stops.filter((s) => s.at - s.callAt < 60).length).toBeGreaterThanOrEqual(r.starts.length);
  clean(errors2, r);
});

test("reduced motion: off by default, gestures create nothing; the explicit switch plays the cues once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = await setup(page);
  await page.goto("/");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await neutral(page).click();
  await page.keyboard.press("Tab");
  await page.waitForTimeout(1500);
  expect((await rec(page)).contexts).toBe(0);
  await toggle(page).click();
  await page.waitForFunction(() => (window as unknown as { __audio: Rec }).__audio.starts.length > 0);
  const r = await rec(page);
  expect(r.contexts).toBe(1);
  const groups = r.starts.map((s) => s.at).sort((a, b) => a - b);
  expect(groups[groups.length - 1]! - groups[0]!).toBeGreaterThan(3000); // bounce ... swish
  clean(errors, r);
});

test("the switch speaks Italian and English", async ({ page }) => {
  const errors = await setup(page);
  await page.goto("/");
  await expect(toggle(page)).toHaveAccessibleName("Suoni dell’intro");
  await expect(toggle(page)).toHaveText("Suoni");
  await page.getByRole("button", { name: "English" }).click();
  await expect(toggle(page)).toHaveAccessibleName("Sounds of the intro");
  await expect(toggle(page)).toHaveAttribute("title", "Sounds on: tap to turn them off");
  clean(errors, await rec(page));
});

test("real Web Audio (no mock): a gesture mid-premiere plays without errors or CSP violations", async ({ page }) => {
  const errors = await setup(page, { mock: false });
  await page.goto("/");
  await waitElapsed(page, 400);
  await neutral(page).click();
  await waitElapsed(page, 3200);
  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await page.locator(".back-link").click();
  await page.waitForTimeout(300);
  clean(errors, await rec(page));
});
