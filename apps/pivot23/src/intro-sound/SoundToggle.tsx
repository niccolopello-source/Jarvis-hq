import { Volume2, VolumeX } from "lucide-react";
import { useLang } from "@/lib/pivot/i18n";
import { setSoundOn, useSoundOn } from "./controller";

/** Strings live here (not in i18n.ts) so the intro sounds stay a self-contained feature. */
const COPY = {
  it: { text: "Suoni", label: "Suoni dell’intro", on: "Suoni attivi: tocca per disattivarli", off: "Suoni disattivati: tocca per attivarli" },
  en: { text: "Sounds", label: "Sounds of the intro", on: "Sounds on: tap to turn them off", off: "Sounds off: tap to turn them on" },
} as const;

export function soundCopy(lang: string) {
  return lang === "it" ? COPY.it : COPY.en;
}

/** Home chip that switches the intro sounds on and off; the choice is kept in localStorage. */
export function SoundToggle() {
  const lang = useLang();
  const on = useSoundOn();
  const copy = soundCopy(lang);
  const Icon = on ? Volume2 : VolumeX;
  return (
    <button
      type="button"
      className="sound-toggle"
      aria-pressed={on}
      aria-label={copy.label}
      title={on ? copy.on : copy.off}
      onClick={() => setSoundOn(!on)}
    >
      <Icon size={15} strokeWidth={2.2} aria-hidden />
      <span aria-hidden>{copy.text}</span>
    </button>
  );
}
