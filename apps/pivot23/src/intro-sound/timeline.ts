/**
 * Intro sound timeline: two dribbles and a net swish, synced to the home premiere (src/styles.css).
 *
 * All times are milliseconds from the start of the `cineReveal` animation on the home mark.
 * The beats are derived from the CSS, so a change to the premiere timing moves the sounds with it:
 *
 *   bounce1  = cineArc delay          (700 ms)   the gleam ignites on the two arcs, the curtain has cleared
 *   bounce2  = cineReveal 20 % key    (1260 ms)  the mark is fully opaque and the zoom-settle starts
 *   swish    = settle 80 % complete   (2400 ms)  the zoom (scale 1.16 -> 1) has visibly landed
 *
 * The settle uses cubic-bezier(0.16, 1, 0.3, 1) over the 20 %..100 % keyframe interval; it reaches ≈80 % of its
 * travel at 22.6 % of that interval (see SETTLE_80). The short 1.6 s premiere (returning visit, lean device) is
 * too fast for a believable dribble, so it gets the swish alone on the same landing beat.
 */
export type CueName = "bounce1" | "bounce2" | "swish";
export type Cue = { name: CueName; at: number };

/** Keyframe offset where cineReveal stops fading in and starts settling. */
export const REVEAL_SETTLE_KEY = 0.2;
/** Fraction of the settle interval at which cubic-bezier(0.16, 1, 0.3, 1) reaches ≈0.80 (0.795). */
export const SETTLE_80 = 0.2262;
/** Two bounces closer than this sound like a drum roll, not a dribble: the timeline drops to the swish. */
export const MIN_DRIBBLE_GAP_MS = 350;
/** A cue whose moment passed less than this ago still plays (at once); older ones are skipped. */
export const LATE_GRACE_MS = 90;
/** Length of the last cue's audible tail, used to suspend the AudioContext afterwards. */
export const TAIL_MS = 900;

/** Builds the cue list from the computed premiere timing (reveal duration and gleam delay, both in ms). */
export function introTimeline(revealMs: number, gleamDelayMs: number): Cue[] {
  if (!Number.isFinite(revealMs) || revealMs <= 0) return [];
  const settleStart = revealMs * REVEAL_SETTLE_KEY;
  const swish = Math.round(settleStart + revealMs * (1 - REVEAL_SETTLE_KEY) * SETTLE_80);
  const bounce1 = Math.round(Number.isFinite(gleamDelayMs) && gleamDelayMs >= 0 ? gleamDelayMs : 0);
  const bounce2 = Math.round(settleStart);
  if (bounce2 - bounce1 < MIN_DRIBBLE_GAP_MS || swish - bounce2 < MIN_DRIBBLE_GAP_MS) return [{ name: "swish", at: swish }];
  return [
    { name: "bounce1", at: bounce1 },
    { name: "bounce2", at: bounce2 },
    { name: "swish", at: swish },
  ];
}

/** The first-visit premiere: cineReveal 6.3 s, cineArc delay 0.7 s. */
export const FULL_TIMELINE = introTimeline(6300, 700);

export type PlannedCue = { name: CueName; delayMs: number };

/**
 * Which cues are still ahead `elapsedMs` into the premiere, and how long until each one.
 * Used when the first user gesture (which unlocks audio) lands mid-premiere: the rest plays in sync.
 */
export function planRemaining(cues: readonly Cue[], elapsedMs: number, graceMs = LATE_GRACE_MS): PlannedCue[] {
  if (!Number.isFinite(elapsedMs)) return [];
  return cues
    .filter((cue) => cue.at - elapsedMs >= -graceMs)
    .map((cue) => ({ name: cue.name, delayMs: Math.max(0, cue.at - elapsedMs) }));
}

/** Parses a CSS time list entry ("6.3s", "700ms") into ms. */
export function cssTimeMs(value: string | null | undefined): number {
  const first = (value ?? "").split(",")[0]!.trim();
  const m = /^(-?[\d.]+)(ms|s)$/.exec(first);
  if (!m) return NaN;
  const n = Number(m[1]);
  return m[2] === "s" ? n * 1000 : n;
}

export type SoundPref = "on" | "off" | null;
export const SOUND_PREF_KEY = "pivot23.introSound";

export function parsePref(raw: string | null | undefined): SoundPref {
  return raw === "on" || raw === "off" ? raw : null;
}

/** Sound is on by default, except under prefers-reduced-motion, where only an explicit "on" enables it. */
export function soundEnabled(pref: SoundPref, reducedMotion: boolean): boolean {
  if (pref) return pref === "on";
  return !reducedMotion;
}
