/**
 * Ads build flags. Both are read at build time by Vite and constant-folded.
 * VITE_ADS_ENABLED !== "true" (the default) -> every ads branch is dead code: no ads module, no
 * third-party script, no request. VITE_ADSENSE_CLIENT is the AdSense publisher id
 * ("ca-pub-XXXXXXXXXXXXXXXX"); empty -> nothing loads even with the flag ON.
 */
// __PIVOT_ADS_*__ are injected by vite.config.ts `define` (literals, so dead branches are removed).
// node --test has no define: the typeof guards keep ads OFF there.
declare const __PIVOT_ADS_ENABLED__: boolean | undefined;
declare const __PIVOT_ADSENSE_CLIENT__: string | undefined;
export const ADS_ENABLED: boolean = typeof __PIVOT_ADS_ENABLED__ === "boolean" ? __PIVOT_ADS_ENABLED__ : false;
export const ADSENSE_CLIENT: string = typeof __PIVOT_ADSENSE_CLIENT__ === "string" ? __PIVOT_ADSENSE_CLIENT__.trim() : "";

/** Valid AdSense client ids only; anything else keeps ads off. */
export function isValidClient(id: string): boolean {
  return /^ca-pub-\d{16}$/.test(id);
}

/** Side rail threshold: 1280px leaves >= 200px per rail beside the 880px game column (160x600 fits). */
export const DESKTOP_MIN_WIDTH = 1280;

/** Interstitial frequency cap: at most one every N season ends and never twice within MIN_GAP_MS. */
export const INTERSTITIAL_EVERY_SEASONS = 3;
export const INTERSTITIAL_MIN_GAP_MS = 4 * 60_000;
/** If the ad has not started within this window the game continues. */
export const AD_BREAK_TIMEOUT_MS = 2000;

/** Hosts the ads stack may contact; e2e asserts zero requests to these on mobile/tablet. */
export const AD_HOST_PATTERN =
  /(googlesyndication\.com|doubleclick\.net|googleadservices\.com|adtrafficquality\.google|fundingchoicesmessages\.google\.com|adservice\.google\.)/;
