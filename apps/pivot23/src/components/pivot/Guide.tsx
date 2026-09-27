
import { useState } from "react";

const SLIDES = [
  {
    kicker: "01",
    title: "Una vita",
    body: "Entri al draft. Dieci round, tre schede su quattro. Poi scegli il percorso — NCAA, Europa o G-League. Lì si muove l'overall, prima della maglia.",
  },
  {
    kicker: "02",
    title: "La chiamata",
    body: "Vedi solo il numero, dalla 1ª alla 60ª. La società ti prende per roster, città, progetto. Non per la difficoltà che hai scelto.",
  },
  {
    kicker: "03",
    title: "Gli inverni",
    body: "Ogni stagione lascia un segno. Le porte dei playoff cambiano. L'estate decide da sola. A giugno può ancora dire di no.",
  },
  {
    kicker: "04",
    title: "Il picco",
    body: "Il mestiere sale verso i 26, 27, 28 anni, poi cala. Una vita alla volta. Se chiudi, riparti esatto dalla stessa carta.",
  },
] as const;

export function MiniGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  if (!open) return null;
  const s = SLIDES[i]!;
  const last = i === SLIDES.length - 1;
  return (
    <div className="guide-scrim" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <div className="guide-sheet">
        <p className="guide-kicker">{s.kicker} / 04</p>
        <h2 id="guide-title">{s.title}</h2>
        <p className="guide-body">{s.body}</p>
        <div className="guide-pips" aria-hidden>
          {SLIDES.map((_, n) => (
            <span key={n} className={n === i ? "on" : ""} />
          ))}
        </div>
        <div className="guide-actions">
          <button type="button" className="guide-skip" onClick={onClose}>
            Salta
          </button>
          {last ? (
            <button type="button" className="guide-next" onClick={onClose}>
              Ho capito
            </button>
          ) : (
            <button type="button" className="guide-next" onClick={() => setI((n) => n + 1)}>
              Avanti
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
