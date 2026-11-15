import type { Lang } from "@/lib/pivot/i18n";
import { siteLinks, siteLinksName } from "@/lib/pivot/labels";

/**
 * Discreet links to the static site pages (guide, FAQ, about, contact, legal), home screen only.
 * Plain same-origin anchors to prebuilt HTML in public/: no JS, no modal, no banner, never on the
 * career screens, and nothing here touches engine, saves or ads.
 */
export function SiteLinks({ lang }: { lang: Lang }) {
  return (
    <nav className="site-links" aria-label={siteLinksName(lang)}>
      {siteLinks(lang).map(([href, text]) => (
        <a key={href} href={href} hrefLang={lang === "it" ? "it" : "en"}>
          {text}
        </a>
      ))}
    </nav>
  );
}
