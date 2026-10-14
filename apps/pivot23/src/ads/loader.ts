/**
 * Third-party loading. This module is reached ONLY through dynamic import() from AdRail/adBreak,
 * and only when ADS_ENABLED && desktop. The ad script loads only after TCF consent (Purpose 1).
 * Non-personalised ads only (owner decision 14/10/2026). No game, save or RNG data is passed.
 */
import { AD_BREAK_TIMEOUT_MS } from "./config";

type AdsQueue = unknown[] & { requestNonPersonalizedAds?: number; push: (o: unknown) => number };
type AdBreakFn = (o: Record<string, unknown>) => void;
interface AdsWindow extends Window {
  adsbygoogle?: AdsQueue;
  adBreak?: AdBreakFn;
  adConfig?: AdBreakFn;
}

export const adsState = { cmpRequested: false, adsLoaded: false, consent: false };

function addScript(src: string, attrs: Record<string, string> = {}): HTMLScriptElement {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  s.crossOrigin = "anonymous";
  for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
  document.head.appendChild(s);
  return s;
}

/** Google certified CMP (Privacy & messaging). The exact URL comes from the snippet Google generates for the account. */
export function loadCmp(client: string): void {
  if (adsState.cmpRequested) return;
  adsState.cmpRequested = true;
  const pub = client.replace(/^ca-/, "");
  addScript(`https://fundingchoicesmessages.google.com/i/${pub}?ers=1`);
  // Equivalent of Google's inline "signalGooglefcPresent" (inline scripts are not allowed by our CSP).
  if (!document.querySelector('iframe[name="googlefcPresent"]')) {
    const f = document.createElement("iframe");
    f.name = "googlefcPresent";
    f.style.cssText = "width:0;height:0;border:0;display:none";
    f.title = "";
    f.setAttribute("aria-hidden", "true");
    document.body.appendChild(f);
  }
}

/** AdSense + Ad Placement API (same adsbygoogle.js). Call only after consent. */
export function loadAdsense(client: string): void {
  if (adsState.adsLoaded) return;
  adsState.adsLoaded = true;
  const w = window as AdsWindow;
  const q = (w.adsbygoogle = w.adsbygoogle || ([] as unknown as AdsQueue));
  q.requestNonPersonalizedAds = 1;
  w.adBreak = w.adConfig = (o) => {
    q.push(o);
  };
  addScript(`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`, {
    "data-ad-client": client,
    "data-ad-frequency-hint": "240s",
  });
  w.adConfig({ preloadAdBreaks: "on", sound: "on" });
}

export function pushDisplaySlot(): void {
  const w = window as AdsWindow;
  try {
    (w.adsbygoogle = w.adsbygoogle || ([] as unknown as AdsQueue)).push({});
  } catch {
    /* no-fill / blocked: the slot collapses, the game is unaffected */
  }
}

/**
 * Runs an interstitial and calls proceed() exactly once: after the break, or after
 * AD_BREAK_TIMEOUT_MS if no ad has started, or immediately if the API is missing.
 */
export function runInterstitial(name: string, proceed: () => void, timeoutMs = AD_BREAK_TIMEOUT_MS): void {
  let done = false;
  let started = false;
  const finish = () => {
    if (done) return;
    done = true;
    window.clearTimeout(timer);
    proceed();
  };
  const timer = window.setTimeout(() => {
    if (!started) finish();
  }, timeoutMs);
  const w = window as AdsWindow;
  if (!adsState.adsLoaded || typeof w.adBreak !== "function") return finish();
  try {
    w.adBreak({
      type: "next",
      name,
      beforeAd: () => {
        started = true;
      },
      afterAd: () => {},
      adBreakDone: finish,
    });
  } catch {
    finish();
  }
}

/** Probes a rewarded break; onAvailable gets a show() to call on explicit user click. */
export function probeRewarded(name: string, onAvailable: (show: () => void) => void, onViewed: () => void, onDone: () => void): void {
  const w = window as AdsWindow;
  if (!adsState.adsLoaded || typeof w.adBreak !== "function") return onDone();
  w.adBreak({
    type: "reward",
    name,
    beforeReward: (showAdFn: () => void) => onAvailable(showAdFn),
    adViewed: onViewed, // reward ONLY here
    adDismissed: () => {},
    adBreakDone: onDone,
  });
}
