import { useEffect } from "react";
import "./intro.css";
import { onBootAttention } from "./boot-signal";

/**
 * First-impression hand-off between the static boot mark in index.html and the mounted app.
 *
 * - full:  first visit, motion allowed. The dark boot field wipes off like a broadcast stinger
 *          and the home copy rises in.
 * - brief: returning visitor. The boot field fades out. The logo premiere is the same one.
 * - still: prefers-reduced-motion. A short opacity fade only.
 *
 * The curtain never takes pointer events: the app below is live from its first commit, and any
 * tap, click or key press finishes the curtain at once. Only transform and opacity are animated.
 */
export type IntroMode = "full" | "brief" | "still";

export const INTRO_SEEN_KEY = "pivot23.introSeen";
const CURTAIN_MAX_MS = 1500;
const SKIP_FADE_MS = 160;
const START_TIMEOUT_MS = 150;
const DATA_CLEAR_MS = 2400;
const PREMIERE_KEYS_MS = 16000;
/**
 * First-visit exit style. "slice" (default, Passes-style launch screen): the mark splits into horizontal
 * bands that slide sideways, a one-frame granata flash, then the dark field opens like a letterbox.
 * "wipe" is the previous broadcast stinger, kept for comparison (`?splash=wipe`).
 */
export type SplashExit = "slice" | "wipe";
export const SPLASH_EXIT_DEFAULT: SplashExit = "slice";
/** Shortest time the boot mark stays on screen from navigation start, only to avoid a flash. Never added on top of a slow load. */
export const SPLASH_MIN_MS = 1200;
const SLICE_BANDS = 4;

export function pickSplashExit(search: string): SplashExit {
  return /(?:^|[?&])splash=wipe(?:&|$)/.test(search) ? "wipe" : SPLASH_EXIT_DEFAULT;
}

/** Remaining wait so the mark is visible at least `min` ms since navigation start (0 when the app was slower). */
export function splashHoldMs(now: number, min = SPLASH_MIN_MS): number {
  return Math.max(0, Math.round(min - now));
}

/** Replaces the static mark with N clipped copies the exit animation slides apart. Transform/opacity only. */
function sliceMark(boot: HTMLElement) {
  const mark = boot.querySelector<HTMLElement>(".boot-mark");
  if (!mark) return;
  const box = mark.getBoundingClientRect();
  const layer = document.createElement("div");
  layer.className = "boot-bands";
  layer.style.cssText = `left:${box.left}px;top:${box.top}px;width:${box.width}px;height:${box.height}px`;
  for (let i = 0; i < SLICE_BANDS; i += 1) {
    const band = mark.cloneNode(true) as HTMLElement;
    band.className = "boot-band";
    const top = (i * 100) / SLICE_BANDS;
    const bottom = 100 - ((i + 1) * 100) / SLICE_BANDS;
    band.style.clipPath = `inset(${top}% 0 ${bottom}% 0)`;
    band.style.setProperty("--dx", `${(i % 2 ? -1 : 1) * (8 + i * 3)}px`);
    layer.appendChild(band);
  }
  mark.style.visibility = "hidden";
  boot.appendChild(layer);
}

let curtain: HTMLElement | null = null;
let mode: IntroMode = "still";

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    // Private mode or storage disabled: the full intro simply plays again next time.
  }
}

export function pickIntroMode(reduced: boolean, seen: boolean): IntroMode {
  if (reduced) return "still";
  return seen ? "brief" : "full";
}

/** Runs before React renders: lifts #boot out of #app so the first commit cannot cut it to blank. */
export function prepareIntro(): void {
  const boot = document.getElementById("boot");
  if (!boot) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const seen = readSeen();
  mode = pickIntroMode(reduced, seen);
  const root = document.documentElement;
  root.dataset.intro = mode;
  if (seen) root.classList.add("pivot-intro-seen");
  boot.removeAttribute("role");
  boot.removeAttribute("aria-live");
  boot.setAttribute("aria-hidden", "true");
  boot.inert = true;
  boot.classList.add("is-curtain");
  document.body.appendChild(boot);
  curtain = boot;
}

function playCurtain(): () => void {
  const boot = curtain;
  const root = document.documentElement;
  if (!boot) return () => {};
  curtain = null;
  markSeen();
  let finished = false;
  let clearTimer = 0;
  let skipTimer = 0;
  const skip = () => {
    if (skipTimer) return;
    boot.classList.add("leave-now");
    skipTimer = window.setTimeout(finish, SKIP_FADE_MS);
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(fallback);
    window.clearTimeout(skipTimer);
    window.removeEventListener("pointerdown", skip, true);
    window.removeEventListener("keydown", skip, true);
    boot.remove();
    if (mode !== "full") delete root.dataset.intro;
  };
  const onEnd = (event: AnimationEvent) => {
    if (event.target === boot && event.animationName.startsWith("curtain")) finish();
  };
  boot.addEventListener("animationend", onEnd);
  window.addEventListener("pointerdown", skip, { capture: true, passive: true });
  window.addEventListener("keydown", skip, true);
  // The home copy keeps its own short entrance; drop the hook once it has played.
  if (mode === "full") clearTimer = window.setTimeout(() => delete root.dataset.intro, DATA_CLEAR_MS);
  // Start once the first commit has settled, so the hand-off never competes with the first input.
  const idle = "requestIdleCallback" in window;
  const exit = pickSplashExit(window.location.search);
  const start = () => {
    if (finished) return;
    if (mode === "full" && exit === "slice") {
      try {
        sliceMark(boot);
      } catch {
        // Decoration only: without bands the field still opens.
      }
      boot.classList.add("fx-slice");
    }
    boot.classList.add(`leave-${mode}`);
  };
  // The app is already live underneath; the hold only stops a sub-600ms flash and never stacks on a slow boot.
  const hold = mode === "still" ? 0 : splashHoldMs(performance.now());
  let startHandle = 0;
  const holdTimer = window.setTimeout(() => {
    startHandle = idle ? window.requestIdleCallback(start, { timeout: START_TIMEOUT_MS }) : window.setTimeout(start, 0);
  }, hold);
  const fallback = window.setTimeout(finish, CURTAIN_MAX_MS + hold);
  // A save-recovery notice or a boot error is on screen: no hold, no animation, the splash goes now.
  const stopAttention = onBootAttention(() => {
    window.clearTimeout(holdTimer);
    finish();
  });
  return () => {
    stopAttention();
    window.clearTimeout(holdTimer);
    if (idle) window.cancelIdleCallback(startHandle);
    else window.clearTimeout(startHandle);
    window.clearTimeout(clearTimer);
    finish();
  };
}

/** Escape skips the home mark premiere the same way the visible "Salta" button does. */
function listenPremiereEscape(): () => void {
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    const button = document.querySelector<HTMLButtonElement>(".cine-skip");
    if (button) button.click();
  };
  window.addEventListener("keydown", onKey);
  const stop = window.setTimeout(() => window.removeEventListener("keydown", onKey), PREMIERE_KEYS_MS);
  return () => {
    window.clearTimeout(stop);
    window.removeEventListener("keydown", onKey);
  };
}

/** Mounted next to the app: its effect runs after the first commit has been painted. */
export function IntroCurtain(): null {
  useEffect(() => {
    const stopCurtain = playCurtain();
    const stopEscape = listenPremiereEscape();
    return () => {
      stopCurtain();
      stopEscape();
    };
  }, []);
  return null;
}
