import { INTERSTITIAL_EVERY_SEASONS, INTERSTITIAL_MIN_GAP_MS } from "./config";

export interface CapState {
  seasonEnds: number;
  lastShownAt: number;
}

/** Pure: should this season end show an interstitial? Guests only; accounts are off today. */
export function shouldShowInterstitial(state: CapState, now: number, hasAccount: boolean): boolean {
  if (hasAccount) return false;
  if (state.seasonEnds <= 0 || state.seasonEnds % INTERSTITIAL_EVERY_SEASONS !== 0) return false;
  return now - state.lastShownAt >= INTERSTITIAL_MIN_GAP_MS;
}

const CAP_KEY = "pivot23-ads-cap"; // sessionStorage, never the save
export function readCap(): CapState {
  try {
    const v = JSON.parse(sessionStorage.getItem(CAP_KEY) ?? "null") as CapState | null;
    if (v && Number.isFinite(v.seasonEnds) && Number.isFinite(v.lastShownAt)) return v;
  } catch {
    /* ignore */
  }
  return { seasonEnds: 0, lastShownAt: 0 };
}
export function writeCap(s: CapState): void {
  try {
    sessionStorage.setItem(CAP_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
