
import { useState } from "react";
import { t, useLang } from "@/lib/pivot/i18n";

const SLIDES = [
  { title: "guide1Title", body: "guide1Body" },
  { title: "guide2Title", body: "guide2Body" },
  { title: "guide3Title", body: "guide3Body" },
  { title: "guide4Title", body: "guide4Body" },
] as const;

export function MiniGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  const lang = useLang();
  if (!open) return null;
  const slide = SLIDES[i]!;
  const last = i === SLIDES.length - 1;
  return (
    <div className="guide-scrim" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <div className="guide-sheet">
        <p className="guide-kicker">0{i + 1} / 04</p>
        <h2 id="guide-title">{t(slide.title, lang)}</h2>
        <p className="guide-body">{t(slide.body, lang)}</p>
        <div className="guide-pips" aria-hidden>
          {SLIDES.map((slide, n) => (
            <span key={slide.title} className={n === i ? "on" : ""} />
          ))}
        </div>
        <div className="guide-actions">
          <button type="button" className="guide-skip" onClick={onClose}>
            {t("skip", lang)}
          </button>
          {last ? (
            <button type="button" className="guide-next" onClick={onClose}>
              {t("guideDone", lang)}
            </button>
          ) : (
            <button type="button" className="guide-next" onClick={() => setI((n) => n + 1)}>
              {t("guideNext", lang)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
