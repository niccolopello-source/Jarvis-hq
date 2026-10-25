import { displayOverall } from "./peak";

/**
 * Peak OVR as shown to the player: the best OVR of the seasons table.
 * PlayerState.peakOverall also records mid-season values the table never shows,
 * so it can exceed every row. Display only: the engine value is untouched and
 * still drives legacy verdicts, labs and saves. Falls back to the stored peak
 * when no season row carries a finite OVR (empty or legacy-compacted history).
 */
export function displayedPeak(rows: ReadonlyArray<{ overall?: unknown }> | null | undefined, storedPeak: number): number {
  let best = -Infinity;
  for (const r of rows ?? []) {
    const n = Number(r?.overall);
    if (Number.isFinite(n)) best = Math.max(best, displayOverall(n));
  }
  return Number.isFinite(best) ? best : displayOverall(storedPeak);
}
