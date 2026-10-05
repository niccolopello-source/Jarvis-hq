import { useEffect } from "react";
import "./intro.css";

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
  const fallback = window.setTimeout(finish, CURTAIN_MAX_MS);
  // The home copy keeps its own short entrance; drop the hook once it has played.
  if (mode === "full") clearTimer = window.setTimeout(() => delete root.dataset.intro, DATA_CLEAR_MS);
  // Start once the first commit has settled, so the hand-off never competes with the first input.
  const idle = "requestIdleCallback" in window;
  const start = () => boot.classList.add(`leave-${mode}`);
  const startHandle = idle ? window.requestIdleCallback(start, { timeout: START_TIMEOUT_MS }) : window.setTimeout(start, 0);
  return () => {
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
