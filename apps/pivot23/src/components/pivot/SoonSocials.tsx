import { t, type Lang } from "@/lib/pivot/i18n";

const NETWORKS = [
  { name: "X", key: "socialSoonX" },
  { name: "TikTok", key: "socialSoonTikTok" },
  { name: "YouTube", key: "socialSoonYouTube" },
] as const;

/** Footer placeholders for socials without an official URL. Not links, not focusable. */
export function SoonSocials({ lang }: { lang: Lang }) {
  return (
    <div className="social-soon" role="group" aria-label={t("socialSoonGroup", lang)}>
      {NETWORKS.map((n) => (
        <span key={n.name} className="social-soon-item" aria-label={t(n.key, lang)}>
          <span className="social-soon-name" aria-hidden="true">{n.name}</span>
          <span className="social-soon-tag" aria-hidden="true">{t("socialSoon", lang)}</span>
        </span>
      ))}
    </div>
  );
}
