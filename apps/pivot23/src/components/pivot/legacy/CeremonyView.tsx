import { useId } from "react";
import { useLang } from "@/lib/pivot/i18n";
import { fmtDec, fmtInt, legacyAwardLabel, lt, seasonsLabel } from "@/lib/pivot/legacy-i18n";
import { nationLabel, roleLabel } from "@/lib/pivot/labels";
import { nx } from "@/lib/pivot/narrative";
import type { CardFace } from "@/lib/pivot/legacy-report";

function lastNameOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[parts.length - 1] ?? name).toUpperCase();
}

function Jersey({ color, number, name }: { color: string; number: number | null; name: string }) {
  const uid = useId().replace(/:/g, "");
  const body = `url(#${uid}-body)`;
  const bar = `url(#${uid}-bar)`;
  const fold = `url(#${uid}-fold)`;
  const label = lastNameOf(name);
  return (
    <svg className="lc-jersey" viewBox="0 0 420 520" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-bar`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d8d8de" />
          <stop offset="0.45" stopColor="#8a8a90" />
          <stop offset="1" stopColor="#4a4a50" />
        </linearGradient>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={color} />
          <stop offset="1" stopColor="#1a0505" />
        </linearGradient>
        <linearGradient id={`${uid}-fold`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="40" y="14" width="340" height="10" rx="3" fill={bar} />
      <rect x="36" y="10" width="8" height="18" rx="2" fill="#c0c0c6" />
      <rect x="376" y="10" width="8" height="18" rx="2" fill="#c0c0c6" />
      <path d="M118 24c0 16 12 22 12 36" stroke="#c9c9ce" strokeWidth="4" fill="none" />
      <path d="M290 24c0 16-12 22-12 36" stroke="#c9c9ce" strokeWidth="4" fill="none" />
      <path d="M130 64 C130 64 122 86 86 96 C70 100 62 118 68 150 L88 228 L78 500 L210 512 L342 500 L332 228 L352 150 C358 118 350 100 334 96 C298 86 290 64 290 64 C270 78 240 92 210 92 C180 92 150 78 130 64 Z" fill={body} />
      <path d="M130 64 C130 64 122 86 86 96 C70 100 62 118 68 150 L88 228 L78 500 L210 512 L342 500 L332 228 L352 150 C358 118 350 100 334 96 C298 86 290 64 290 64 C270 78 240 92 210 92 C180 92 150 78 130 64 Z" fill={fold} opacity="0.55" />
      <path d="M130 64 C150 78 180 92 210 92 C240 92 270 78 290 64 C270 100 240 118 210 118 C180 118 150 100 130 64 Z" fill="#1a0505" opacity="0.45" />
      <path d="M168 92 C180 128 240 128 252 92" stroke="#f5f5f7" strokeWidth="7" fill="none" strokeLinecap="round" />
      <text x="210" y="250" textAnchor="middle" fontWeight="700" fontSize={label.length > 10 ? 24 : 32} letterSpacing="6" fill="#F5F5F7">{label}</text>
      {number !== null ? (
        <text x="210" y="410" textAnchor="middle" fontWeight="700" fontSize="168" letterSpacing="-6" fill="#F5F5F7">{number}</text>
      ) : null}
    </svg>
  );
}

export function CeremonyView({
  face,
  onContinue,
}: {
  face: CardFace;
  onContinue: () => void;
}) {
  const lang = useLang();
  const role = face.roleCode ? roleLabel(face.roleCode, lang) : roleLabel(face.roleLabel, lang);
  const nation = face.nationality ? nationLabel(face.nationality, lang) : "";
  const sub = [role, nation, face.span, face.seasons ? seasonsLabel(face.seasons, lang) : "", face.peak ? `${lt("peak", lang)} ${face.peak}` : ""]
    .filter(Boolean)
    .join(" · ");
  const stats: [string, string][] = face.averages
    ? [[fmtDec(face.averages.ppg, lang), "PPG"], [fmtDec(face.averages.rpg, lang), "RPG"], [fmtDec(face.averages.apg, lang), "APG"]]
    : [];
  if (face.titles > 0) stats.push([fmtInt(face.titles, lang), lt("titles", lang)]);
  const honors = face.honors.map(([id, n]) => {
    const name = legacyAwardLabel(id, lang);
    return n > 1 ? `${n}× ${name}` : name;
  });
  const year = face.span ? face.span.split("–")[1] ?? face.span : "";
  const team = face.teams[face.teams.length - 1];
  const color = team?.color || "#E10600";
  const title = face.number !== null
    ? lt("ceremonyTitleNumber", lang, { n: face.number })
    : lt("ceremonyTitle", lang);

  return (
    <section className="lc-ceremony" data-ceremony role="region" aria-label={lt("ceremonyKicker", lang)}>
      <div className="lc-arena" aria-hidden="true">
        <i className="lc-spot lc-spot-1" />
        <i className="lc-spot lc-spot-2" />
        <i className="lc-spot lc-spot-3" />
        <div className="lc-rafters">
          <i className="lc-banner" />
          <i className="lc-banner" />
          <i className="lc-banner" />
          <i className="lc-banner" />
        </div>
      </div>
      <div className="lc-ceremony-grid">
      <div className="lc-ceremony-left">
      <p className="lc-ceremony-kicker">{lt("ceremonyKicker", lang)}</p>
      <h3 className="lc-ceremony-title">{title}</h3>
      <div className="lc-jersey-wrap">
        <Jersey color={color} number={face.number} name={face.name} />
      </div>
      </div>
      <div className="lc-ceremony-right">
      <article className="lc-plaque" data-plaque>
        <i className="lc-rivet tl" aria-hidden="true" />
        <i className="lc-rivet tr" aria-hidden="true" />
        <i className="lc-rivet bl" aria-hidden="true" />
        <i className="lc-rivet br" aria-hidden="true" />
        <p className="lc-plaque-kicker">{lt("plaqueRetired", lang)}</p>
        <h4 className="lc-plaque-name">{face.name}</h4>
        {sub ? <p className="lc-plaque-sub">{sub}</p> : null}
        {stats.length > 0 ? (
          <dl className="lc-plaque-stats">
            {stats.map(([v, k]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {honors.length > 0 ? <p className="lc-plaque-honors">{honors.join(" · ")}</p> : null}
        {face.titles > 0 ? (
          <div className="lc-rings" aria-hidden="true">
            {Array.from({ length: Math.min(face.titles, 8) }, (_, i) => <i key={i} className="lc-ring" />)}
          </div>
        ) : null}
        <p className="lc-plaque-date">
          {[year ? lt("plaqueYear", lang, { year }) : "", nx(face.verdict, lang)].filter(Boolean).join(" · ")}
        </p>
      </article>
      <div className="lc-ceremony-actions">
        <button type="button" className="primary-btn" data-ceremony-continue onClick={onContinue}>
          {lt("ceremonyContinue", lang)}
        </button>
        <button type="button" className="ghost-btn" data-ceremony-skip onClick={onContinue}>
          {lt("ceremonySkip", lang)}
        </button>
      </div>
      </div>
      </div>
    </section>
  );
}
