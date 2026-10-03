
import { useState } from "react";
import { ModalDialog } from "@/components/pivot/Dialog";
import { t, tf, useLang } from "@/lib/pivot/i18n";

const SLIDES = [
  { title: "guide1Title", body: "guide1Body" },
  { title: "guide2Title", body: "guide2Body" },
  { title: "guide3Title", body: "guide3Body" },
  { title: "guide4Title", body: "guide4Body" },
] as const;

/** How-to sheet. Uses the shared ModalDialog: focus trap, Escape closes, focus returns to the opener. */
export function MiniGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  const lang = useLang();
  const slide = SLIDES[i]!;
  const last = i === SLIDES.length - 1;
  const close = () => {
    setI(0);
    onClose();
  };
  return (
    <ModalDialog
      open={open}
      title={t(slide.title, lang)}
      onCancel={close}
      initialFocus="none"
      actions={
        <>
          <button type="button" className="guide-skip" onClick={close}>
            {t("skip", lang)}
          </button>
          {last ? (
            <button type="button" className="guide-next" onClick={close}>
              {t("guideDone", lang)}
            </button>
          ) : (
            <button type="button" className="guide-next" onClick={() => setI((n) => n + 1)}>
              {t("guideNext", lang)}
            </button>
          )}
        </>
      }
    >
      <p className="guide-kicker" aria-live="polite">
        <span className="sr-only">{tf("guideStep", { n: i + 1, total: SLIDES.length }, lang)}</span>
        <span aria-hidden="true">0{i + 1} / 04</span>
      </p>
      <p>{t(slide.body, lang)}</p>
      <div className="guide-pips" aria-hidden="true">
        {SLIDES.map((s, n) => (
          <span key={s.title} className={n === i ? "on" : ""} />
        ))}
      </div>
    </ModalDialog>
  );
}
