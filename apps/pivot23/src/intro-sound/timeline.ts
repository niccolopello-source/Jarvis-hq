/**
 * Intro sound timeline: two dribbles and a net swish, synced to the logo premiere.
 *
 * Times are milliseconds from the start of `cineReveal` and are the same numbers as the CSS
 * custom properties on `.court-mark-live.is-premiere` (`--beat-b1`, `--beat-b2`, `--beat-swish`).
 * `--beat-b3` stays negative so the third dribble is never scheduled.
 *
 *   bounce1  1400 ms   the outer ring closes
 *   bounce2  2400 ms   the inner arcs close
 *   swish    3400 ms   the 23 turns PIVOT red
 *
 * One premiere for every device. There is no shorter basketball cut.
 */
export type CueName = "bounce1" | "bounce2" | "bounce3" | "swish";
export type Cue = { name: CueName; at: number };

export const CUE_ORDER: readonly CueName[] = ["bounce1", "bounce2", "bounce3", "swish"];

/** Two bounces closer than this sound like a drum roll, not a dribble. */
export const MIN_DRIBBLE_GAP_MS = 350;
/** A cue whose moment passed less than this ago still plays (at once); older ones are skipped. */
export const LATE_GRACE_MS = 90;
/** Length of the last cue's audible tail, used to suspend the AudioContext afterwards. */
export const TAIL_MS = 900;

/** Logo premiere beats. Must match `--beat-*` in src/styles.css. */
export const PREMIERE_MS = 4800;
export const FULL_BEATS: Partial<Record<CueName, number>> = {
  bounce1: 1400,
  bounce2: 2400,
  swish: 3400,
};

/**
 * Builds the cue list from the premiere length and the beat map (both in ms).
 * Negative or non-finite beats are dropped. A beat that would land after the premiere is dropped.
 * Fewer than two dribbles with a swish collapses to the swish alone.
 */
export function introTimeline(revealMs: number, beats: Partial<Record<CueName, number>>): Cue[] {
  if (!Number.isFinite(revealMs) || revealMs <= 0) return [];
  const cues: Cue[] = [];
  for (const name of CUE_ORDER) {
    const at = beats[name];
    if (typeof at !== "number" || !Number.isFinite(at) || at < 0) continue;
    if (at >= revealMs - 120) continue;
    cues.push({ name, at: Math.round(at) });
  }
  const swish = cues.find((cue) => cue.name === "swish");
  const dribbles = cues.filter((cue) => cue.name !== "swish");
  if (!swish) return dribbles.length >= 2 ? dribbles : [];
  const kept: Cue[] = [];
  let prev = -Infinity;
  for (const dribble of dribbles) {
    if (dribble.at - prev < MIN_DRIBBLE_GAP_MS) continue;
    if (swish.at - dribble.at < MIN_DRIBBLE_GAP_MS) continue;
    kept.push(dribble);
    prev = dribble.at;
  }
  if (kept.length < 2) return [swish];
  return [...kept, swish];
}

/** The logo premiere. */
export const FULL_TIMELINE = introTimeline(PREMIERE_MS, FULL_BEATS);

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

/** Parses a CSS time list entry ("12s", "1800ms", "-1s") into ms. */
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
