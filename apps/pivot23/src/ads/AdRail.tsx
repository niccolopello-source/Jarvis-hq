/**
 * Desktop side rail (lazy chunk, only when ADS_ENABLED). Fixed 160x600 reserved box = zero CLS.
 * Off desktop or without consent it renders the same "Riservato" placeholder as today and loads nothing.
 */
import { useEffect, useRef, useState } from "react";
import { ADSENSE_CLIENT, isValidClient } from "./config";
import { watchConsent } from "./consent";
import { applyGoldFrame, grantGoldFrame, hasGoldFrame } from "./cosmetic";
import { useDesktopEligibility } from "./eligibility";
import { adsState, loadAdsense, loadCmp, probeRewarded, pushDisplaySlot } from "./loader";
import { adT } from "./strings";
import "./ads.css";

export default function AdRail({ side, lang, placeholder }: { side: "left" | "right"; lang: string; placeholder: string }) {
  const desktop = useDesktopEligibility();
  const valid = isValidClient(ADSENSE_CLIENT);
  const [consent, setConsent] = useState(adsState.consent);
  const [filled, setFilled] = useState<"pending" | "filled" | "unfilled">("pending");
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!desktop || !valid) return;
    loadCmp(ADSENSE_CLIENT);
    applyGoldFrame();
    return watchConsent((ok) => {
      adsState.consent = ok;
      if (ok) loadAdsense(ADSENSE_CLIENT);
      setConsent(ok);
    });
  }, [desktop, valid]);

  const active = desktop && valid && consent;

  useEffect(() => {
    const ins = insRef.current;
    if (!active || !ins) return;
    pushDisplaySlot();
    // AdSense sets data-ad-status="filled" | "unfilled" on the <ins>.
    const mo = new MutationObserver(() => {
      const st = ins.getAttribute("data-ad-status");
      if (st === "filled" || st === "unfilled") setFilled(st);
    });
    mo.observe(ins, { attributes: true, attributeFilter: ["data-ad-status"] });
    return () => mo.disconnect();
  }, [active]);

  if (!active) {
    return (
      <aside className="ad-rail" aria-hidden="true">
        <span>{placeholder}</span>
      </aside>
    );
  }
  return (
    <aside className="ad-rail ad-rail-live" aria-label={adT("adLabel", lang)}>
      <div className={filled === "unfilled" ? "ad-slot ad-slot-collapsed" : "ad-slot"}>
        <span className="ad-slot-label">{adT("adLabel", lang)}</span>
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: "inline-block", width: 160, height: 600 }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={side === "left" ? import.meta.env.VITE_ADSENSE_SLOT_LEFT ?? "" : import.meta.env.VITE_ADSENSE_SLOT_RIGHT ?? ""}
        />
      </div>
      {side === "right" ? <RewardOffer lang={lang} /> : null}
    </aside>
  );
}

function RewardOffer({ lang }: { lang: string }) {
  const [show, setShow] = useState<(() => void) | null>(null);
  const [granted, setGranted] = useState(hasGoldFrame());
  useEffect(() => {
    if (granted) return;
    probeRewarded(
      "gold-frame",
      (fn) => setShow(() => fn),
      () => {
        grantGoldFrame();
        setGranted(true);
      },
      () => setShow(null),
    );
  }, [granted]);
  if (granted) return <p className="ad-reward-note">{adT("rewardGranted", lang)}</p>;
  if (!show) return null;
  return (
    <button type="button" className="ad-reward-btn" onClick={() => show()}>
      {adT("rewardOffer", lang)}
      <span>{adT("rewardOfferDetail", lang)}</span>
    </button>
  );
}
