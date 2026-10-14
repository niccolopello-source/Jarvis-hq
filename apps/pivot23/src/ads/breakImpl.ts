import { ADSENSE_CLIENT, isValidClient } from "./config";
import { isDesktop, readSignals } from "./eligibility";
import { readCap, shouldShowInterstitial, writeCap } from "./frequency";
import { adsState, runInterstitial } from "./loader";

export function seasonEndBreak(proceed: () => void, account: boolean): void {
  let called = false;
  const go = () => {
    if (!called) {
      called = true;
      proceed();
    }
  };
  try {
    const cap = readCap();
    cap.seasonEnds += 1;
    const eligible =
      isValidClient(ADSENSE_CLIENT) && adsState.adsLoaded && adsState.consent && isDesktop(readSignals());
    if (!eligible || !shouldShowInterstitial(cap, Date.now(), account)) {
      writeCap(cap);
      return go();
    }
    cap.lastShownAt = Date.now();
    writeCap(cap);
    runInterstitial("season-end", go);
  } catch {
    go();
  }
}
