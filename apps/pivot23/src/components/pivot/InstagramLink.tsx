import { INSTAGRAM_URL } from "@/config/social";
import { t, type Lang } from "@/lib/pivot/i18n";

/** Monochrome inline Instagram glyph (no external assets), 44x44 hit area. */
export function InstagramLink({ lang }: { lang: Lang }) {
  return (
    <a className="ig-link" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label={t("instagramLabel", lang)}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    </a>
  );
}
