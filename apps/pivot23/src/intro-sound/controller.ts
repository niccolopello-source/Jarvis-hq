import { useSyncExternalStore } from "react";
import { makeMaster, makeNoise, playCue } from "./synth";
import {
  FULL_TIMELINE,
  SOUND_PREF_KEY,
  TAIL_MS,
  cssTimeMs,
  introTimeline,
  parsePref,
  planRemaining,
  soundEnabled,
  type Cue,
  type PlannedCue,
  type SoundPref,
} from "./timeline";

/**
 * Intro sounds runtime. Honest about autoplay: browsers do not let a page start audio on its own, so
 *
 * - nothing audio-related is created on load: no AudioContext, no nodes, no fetches;
 * - the AudioContext is created (and resumed) on the first click, tap or key press while sound is on;
 * - if that gesture lands while the home premiere is still running, the cues that are still ahead play
 *   in sync with the animation clock; cues already past are skipped (a 90 ms grace plays a just-missed one);
 * - with no gesture during the premiere the intro stays silent, and nothing plays later on its own;
 * - Salta, Inizia (leaving the home), the end of the premiere, muting or hiding the tab stop the sounds;
 * - the in-sync sequence plays at most once per page load, so coming back to the home never replays it;
 * - prefers-reduced-motion: no premiere and no sound, unless the visitor turns sound on with the toggle,
 *   which plays the three cues once as a confirmation.
 *
 * Every entry point is wrapped: audio is decoration and must never throw or block the UI.
 */

type Ctor = typeof AudioContext;

let ctx: AudioContext | null = null;
let input: AudioNode | null = null;
let noise: AudioBuffer | null = null;
let seq: GainNode | null = null;
let live = new Set<AudioScheduledSourceNode>();
let suspendTimer = 0;

let cues: Cue[] = [];
let anim: Animation | null = null;
let anchor = 0;
let premiereLive = false;
let premierePlayed = false;

let armed = false;
let disarmTimer = 0;
let observer: MutationObserver | null = null;
const DISARM_MS = 12_000;

let pref: SoundPref = null;
let reduced = false;
const listeners = new Set<() => void>();

function safe<T extends unknown[]>(fn: (...args: T) => void) {
  return (...args: T) => {
    try {
      fn(...args);
    } catch {
      // Audio is decoration: swallow anything a browser's Web Audio implementation throws.
    }
  };
}

function readPref(): SoundPref {
  try {
    return parsePref(window.localStorage.getItem(SOUND_PREF_KEY));
  } catch {
    return null;
  }
}

export function isSoundOn(): boolean {
  return soundEnabled(pref, reduced);
}

function audioCtor(): Ctor | undefined {
  const w = window as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor };
  return w.AudioContext ?? w.webkitAudioContext;
}

/** Creates or resumes the AudioContext. Only ever called from a user gesture (or work queued by one). */
function unlock(): boolean {
  try {
    if (!ctx) {
      const AC = audioCtor();
      if (!AC) return false;
      ctx = new AC({ latencyHint: "interactive" });
      const master = makeMaster(ctx);
      master.output.connect(ctx.destination);
      input = master.input;
      noise = makeNoise(ctx);
    }
    if (ctx.state !== "running") void ctx.resume().catch(() => {});
    return true;
  } catch {
    ctx = null;
    return false;
  }
}

function elapsedMs(): number {
  const t = anim?.currentTime;
  if (typeof t === "number" && Number.isFinite(t)) return t;
  return performance.now() - anchor;
}

function stopSequence() {
  window.clearTimeout(suspendTimer);
  const c = ctx;
  const node = seq;
  seq = null;
  const sources = live;
  live = new Set();
  if (!c || !node) return;
  try {
    const now = c.currentTime;
    node.gain.cancelScheduledValues(now);
    node.gain.setValueAtTime(node.gain.value, now);
    node.gain.linearRampToValueAtTime(0, now + 0.025);
    for (const src of sources) {
      try {
        src.stop(now + 0.04);
      } catch {
        // already stopped
      }
    }
  } catch {
    // ignore
  }
  window.setTimeout(() => {
    try {
      node.disconnect();
    } catch {
      // ignore
    }
  }, 80);
  scheduleSuspend(200);
}

function scheduleSuspend(afterMs: number) {
  window.clearTimeout(suspendTimer);
  suspendTimer = window.setTimeout(() => {
    if (ctx && ctx.state === "running" && live.size === 0) void ctx.suspend().catch(() => {});
  }, afterMs);
}

function track(src: AudioScheduledSourceNode) {
  live.add(src);
  src.onended = () => {
    live.delete(src);
    try {
      src.disconnect();
    } catch {
      // ignore
    }
  };
}

/** Schedules planned cues (delays from now). Replaces any sequence still sounding. */
function schedule(plan: PlannedCue[]) {
  stopSequence();
  const c = ctx;
  if (!c || !input || !noise || plan.length === 0) return;
  window.clearTimeout(suspendTimer);
  const node = c.createGain();
  node.connect(input);
  seq = node;
  const bus = { ctx: c, out: node, noise };
  // Pull cues earlier by the output latency so they are heard on the visible beat.
  const lead = (c.baseLatency || 0) + ((c as { outputLatency?: number }).outputLatency || 0);
  const now = c.currentTime;
  let end = now;
  for (const cue of plan) {
    const when = Math.max(now + 0.005, now + cue.delayMs / 1000 - lead);
    end = Math.max(end, playCue(bus, cue.name, when, track));
  }
  scheduleSuspend((end - now) * 1000 + TAIL_MS);
}

/** After a gesture: plays what is left of the premiere, in sync, once per page load. */
function syncWithPremiere() {
  if (!premiereLive || premierePlayed || !isSoundOn() || !ctx) return;
  const go = safe(() => {
    if (!premiereLive || premierePlayed || !isSoundOn()) return;
    premierePlayed = true;
    schedule(planRemaining(cues, elapsedMs()));
  });
  if (ctx.state === "running") go();
  else ctx.resume().then(go, () => {});
}

const onAnimationStart = safe((event: AnimationEvent) => {
  if (event.animationName !== "cineReveal" || !(event.target instanceof Element)) return;
  const el = event.target;
  const reveal = cssTimeMs(getComputedStyle(el).animationDuration);
  const gleam = el.querySelector(".mark-gleam path");
  const gleamDelay = gleam ? cssTimeMs(getComputedStyle(gleam).animationDelay) : NaN;
  cues = introTimeline(reveal, gleamDelay);
  anim = el.getAnimations?.().find((a) => (a as CSSAnimation).animationName === "cineReveal") ?? null;
  anchor = performance.now() - event.elapsedTime * 1000;
  premiereLive = true;
  syncWithPremiere();
});

const onGesture = safe((event: Event) => {
  if (event instanceof KeyboardEvent && (event.key === "Escape" || event.repeat)) return;
  if (!isSoundOn()) return;
  if (!unlock()) return;
  // Let the click finish first: if it was Salta, Inizia or the mute toggle, the premiere or the
  // preference has already changed by the time this runs, and nothing starts only to be cut off.
  window.setTimeout(safe(syncWithPremiere), 0);
});

const checkPremiere = safe(() => {
  if (!premiereLive) return;
  if (document.querySelector(".court-mark-live.is-premiere")) return;
  premiereLive = false;
  anim = null;
  stopSequence();
  disarm();
});

const onHidden = safe(() => {
  if (document.hidden) stopSequence();
});

function disarm() {
  window.clearTimeout(disarmTimer);
  document.removeEventListener("animationstart", onAnimationStart, true);
  window.removeEventListener("click", onGesture, true);
  window.removeEventListener("keydown", onGesture, true);
  window.removeEventListener("touchend", onGesture, true);
  observer?.disconnect();
  observer = null;
}

/** Call once before React renders. Installs listeners only; creates no audio objects. */
export function armIntroSound(): void {
  if (armed || typeof window === "undefined") return;
  armed = true;
  try {
    pref = readPref();
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.addEventListener("visibilitychange", onHidden);
    if (reduced) return; // no premiere to sync with
    document.addEventListener("animationstart", onAnimationStart, true);
    window.addEventListener("click", onGesture, true);
    window.addEventListener("keydown", onGesture, true);
    window.addEventListener("touchend", onGesture, { capture: true, passive: true });
    observer = new MutationObserver(checkPremiere);
    observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    disarmTimer = window.setTimeout(() => {
      if (!premiereLive) disarm();
    }, DISARM_MS);
  } catch {
    disarm();
  }
}

/** The toggle. Runs inside the click handler, so turning sound on may create the AudioContext. */
export function setSoundOn(on: boolean): void {
  pref = on ? "on" : "off";
  try {
    window.localStorage.setItem(SOUND_PREF_KEY, pref);
  } catch {
    // stays in memory for this visit
  }
  listeners.forEach((fn) => fn());
  try {
    if (!on) {
      stopSequence();
      return;
    }
    if (!unlock()) return;
    if (premiereLive) {
      // Back on mid-premiere: whatever is still ahead plays in sync.
      premierePlayed = false;
      syncWithPremiere();
      return;
    }
    // Outside the premiere (or under reduced motion) the explicit switch plays the cues once as a confirmation.
    const c = ctx!;
    const go = safe(() => {
      if (isSoundOn()) schedule(planRemaining(FULL_TIMELINE, FULL_TIMELINE[0]!.at - 60));
    });
    if (c.state === "running") go();
    else c.resume().then(go, () => {});
  } catch {
    // ignore
  }
}

export function useSoundOn(): boolean {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    isSoundOn,
    () => true,
  );
}
