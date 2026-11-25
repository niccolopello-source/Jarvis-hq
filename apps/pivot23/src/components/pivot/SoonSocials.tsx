import { t, type Lang } from "@/lib/pivot/i18n";

const NETWORKS = ["X", "TikTok", "YouTube"] as const;

/** Footer placeholders for socials without an official URL. Not links, not focusable. */
export function SoonSocials({ lang }: { lang: Lang }) {
  return (
    <div className="social-soon" role="group" aria-label={t("socialSoonGroup", lang)}>
      {NETWORKS.map((name) => (
        <span key={name} className="social-soon-item">
          <span className="social-soon-name">{name}</span>
          {" "}
          <span className="social-soon-tag">{t("socialSoon", lang)}</span>
        </span>
      ))}
    </div>
  );
}
