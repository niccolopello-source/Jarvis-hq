
import { useEffect, useId, useRef } from "react";
import type { Team } from "@/lib/pivot/types";

type Mark = Pick<Team, "abbr" | "color" | "secondary">;
type Cut = "stripe" | "band" | "split" | "piping" | "yoke" | "side";

function hexLum(hex: string) {
  const h = hex.replace("#", "");
  if (h.length < 6) return 0.2;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function inkOn(hex: string) {
  return hexLum(hex) > 0.62 ? "#1d1d1f" : "#F4EFE4";
}

const JERSEY: Record<string, Cut> = {
  BOS: "band",
  LAL: "split",
  CHI: "stripe",
  NYK: "piping",
  GSW: "yoke",
  OKC: "side",
  MIA: "band",
  CLE: "yoke",
  SAS: "piping",
  HOU: "stripe",
  DAL: "split",
  MIL: "band",
  DEN: "yoke",
  MIN: "side",
  PHI: "stripe",
  TOR: "band",
  DET: "piping",
  ORL: "side",
  ATL: "yoke",
  CHA: "split",
  WAS: "piping",
  BKN: "stripe",
  IND: "band",
  POR: "side",
  UTA: "yoke",
  MEM: "split",
  NOP: "band",
  LAC: "piping",
  PHX: "yoke",
  SAC: "stripe",
  RMA: "piping",
  BAR: "stripe",
  OLY: "band",
  PAO: "yoke",
  FNB: "split",
  EFS: "piping",
  OLM: "stripe",
  VIR: "band",
  ASM: "yoke",
  ZAL: "side",
  PAR: "stripe",
  MTA: "yoke",
  BAS: "split",
  BAY: "band",
  CZV: "stripe",
  ALB: "piping",
};

function Motif({ abbr, ink }: { abbr: string; ink: string }) {
  switch (abbr) {
    case "BOS":
      return (
        <g fill={ink} opacity="0.92">
          <circle cx="40" cy="24" r="2.6" />
          <circle cx="35.2" cy="28.2" r="2.6" />
          <circle cx="44.8" cy="28.2" r="2.6" />
        </g>
      );
    case "LAL":
      return (
        <g stroke={ink} fill="none" strokeWidth="1.4">
          <circle cx="40" cy="27" r="4.2" />
          <path d="M40 21 v-2.6 M40 33 v2.6 M33.4 27 h-2.6 M46.6 27 h2.6" />
        </g>
      );
    case "CHI":
      return <path d="M32 30 L40 21 L48 30 L43.5 30 L40 26 L36.5 30 Z" fill={ink} />;
    case "NYK":
      return <path d="M40 21 L47 33 H33 Z" fill={ink} />;
    case "GSW":
      return <path d="M31 32 Q40 17 49 32" fill="none" stroke={ink} strokeWidth="1.8" />;
    case "OKC":
      return <path d="M35 21 L47 27.5 L38 29.5 L45 36 L33.5 28.5 L42.5 26.5 Z" fill={ink} />;
    case "MIA":
      return <path d="M40 21 C35.5 27.5 35.5 32 40 36.5 C44.5 32 44.5 27.5 40 21 Z" fill={ink} />;
    case "CLE":
      return <path d="M40 20 L42.2 27.2 H49.2 L43.8 31.4 L46.2 38.6 L40 34.2 L33.8 38.6 L36.2 31.4 L30.8 27.2 H37.8 Z" fill={ink} />;
    case "SAS":
      return <circle cx="40" cy="27" r="5.2" fill="none" stroke={ink} strokeWidth="1.5" />;
    case "HOU":
      return <path d="M33 34 L40 21 L47 34 Z" fill={ink} />;
    case "DAL":
      return <path d="M31 27 H49 M40 21 V33" stroke={ink} strokeWidth="1.6" fill="none" />;
    case "MIL":
      return <path d="M33 23 L40 34 L47 23" fill="none" stroke={ink} strokeWidth="1.6" />;
    case "DEN":
      return <path d="M31 32 L40 21 L49 32 Z" fill="none" stroke={ink} strokeWidth="1.5" />;
    case "MIN":
      return <path d="M33 34 Q40 19 47 34" fill="none" stroke={ink} strokeWidth="1.6" />;
    case "PHI":
      return (
        <g fill={ink}>
          <circle cx="35.5" cy="27" r="2.3" />
          <circle cx="44.5" cy="27" r="2.3" />
        </g>
      );
    case "TOR":
      return <path d="M33 30 Q40 19 47 30 Q40 26 33 30" fill={ink} />;
    case "DET":
      return <rect x="34" y="23" width="12" height="9" rx="1.2" fill="none" stroke={ink} strokeWidth="1.5" />;
    case "ORL":
      return <circle cx="40" cy="27" r="5.2" fill="none" stroke={ink} strokeWidth="1.35" strokeDasharray="2.2 2" />;
    case "ATL":
      return <path d="M31 32 L40 21 L49 32 L40 27.5 Z" fill={ink} />;
    case "CHA":
      return <path d="M33 27 Q40 20 47 27 Q40 34 33 27" fill="none" stroke={ink} strokeWidth="1.5" />;
    case "WAS":
      return <path d="M31 27 H49 M35.5 22.5 V31.5 M44.5 22.5 V31.5" stroke={ink} strokeWidth="1.4" fill="none" />;
    case "BKN":
      return <path d="M33 22.5 H47 V32.5 H33 Z" fill="none" stroke={ink} strokeWidth="1.5" />;
    case "IND":
      return <path d="M40 21.5 L42.2 27.4 L48.4 27.4 L43.4 31.2 L45.4 37.2 L40 33.4 L34.6 37.2 L36.6 31.2 L31.6 27.4 L37.8 27.4 Z" fill={ink} />;
    case "POR":
      return <path d="M31 30 L40 21 L49 30" fill="none" stroke={ink} strokeWidth="1.6" />;
    case "UTA":
      return <path d="M35 22.5 H45 V32.5 H35 Z" fill={ink} opacity="0.88" />;
    case "MEM":
      return <path d="M33 33 L40 21.5 L47 33" fill="none" stroke={ink} strokeWidth="1.6" />;
    case "NOP":
      return (
        <g fill={ink}>
          <circle cx="40" cy="24.5" r="2" />
          <circle cx="35.5" cy="30.5" r="2" />
          <circle cx="44.5" cy="30.5" r="2" />
        </g>
      );
    case "LAC":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.5">
          <circle cx="40" cy="27" r="5" />
          <path d="M40 22 V32" />
        </g>
      );
    case "PHX":
      return <path d="M40 20.5 L43.2 28 H51 L44.6 32.6 L47.2 40.2 L40 35.4 L32.8 40.2 L35.4 32.6 L29 28 H36.8 Z" fill={ink} />;
    case "SAC":
      return <path d="M40 21 L42.2 26.6 H47.6 L43.4 30 L45.2 35.6 L40 32.2 L34.8 35.6 L36.6 30 L32.4 26.6 H37.8 Z" fill={ink} />;
    case "RMA":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.45">
          <circle cx="40" cy="27" r="5.2" />
          <circle cx="40" cy="27" r="2.1" />
        </g>
      );
    case "BAR":
      return (
        <g fill={ink}>
          <rect x="33" y="22.5" width="3.1" height="11" />
          <rect x="38.4" y="22.5" width="3.1" height="11" />
          <rect x="43.8" y="22.5" width="3.1" height="11" />
        </g>
      );
    case "OLY":
      return <circle cx="40" cy="27" r="4.6" fill={ink} />;
    case "PAO":
      return <path d="M40 21 L47 34 H33 Z" fill={ink} />;
    case "FNB":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.5">
          <path d="M32 32 L40 21 L48 32" />
          <path d="M35 32 H45" />
        </g>
      );
    case "EFS":
      return <path d="M32 27 H48 M36 22.5 V31.5 M44 22.5 V31.5" stroke={ink} strokeWidth="1.45" fill="none" />;
    case "OLM":
      return <path d="M33 22.5 H47 L40 34 Z" fill={ink} />;
    case "VIR":
      return <path d="M33 22 H47 V33 H33 Z" fill={ink} opacity="0.9" />;
    case "ASM":
      return <path d="M32 33 L40 21 L48 33 L40 29 Z" fill={ink} />;
    case "ZAL":
      return (
        <g fill={ink}>
          <rect x="37.2" y="21.5" width="5.6" height="13" rx="0.6" />
        </g>
      );
    case "PAR":
      return <path d="M40 21 L43 27 H50 L44.5 31 L47 38 L40 33.5 L33 38 L35.5 31 L30 27 H37 Z" fill={ink} />;
    case "MTA":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.45">
          <path d="M32 30 L40 21 L48 30" />
          <circle cx="40" cy="31.5" r="2.2" />
        </g>
      );
    case "BAS":
      return <path d="M33 22.5 L47 22.5 L40 34 Z" fill="none" stroke={ink} strokeWidth="1.5" />;
    case "BAY":
      return (
        <g fill={ink}>
          <circle cx="40" cy="27" r="2.4" />
          <circle cx="33.5" cy="27" r="1.6" />
          <circle cx="46.5" cy="27" r="1.6" />
        </g>
      );
    case "CZV":
      return <path d="M40 20.8 L42.4 27.4 H49.2 L43.8 31.4 L46.2 38.2 L40 34 L33.8 38.2 L36.2 31.4 L30.8 27.4 H37.6 Z" fill={ink} />;
    case "ALB":
      return <path d="M32 27 H48 M40 21 V33" stroke={ink} strokeWidth="1.55" fill="none" />;
    default: {
      const n = (abbr.charCodeAt(0) + abbr.charCodeAt(abbr.length - 1)) % 3;
      if (n === 0) return <circle cx="40" cy="27" r="3.6" fill={ink} />;
      if (n === 1) return <rect x="35.5" y="23" width="9" height="9" fill={ink} />;
      return <path d="M35.5 32 L40 21.5 L44.5 32 Z" fill={ink} />;
    }
  }
}

function jerseyCut(abbr: string): Cut {
  return JERSEY[abbr] ?? ((["stripe", "band", "split", "piping"] as const)[(abbr.charCodeAt(0) + abbr.charCodeAt(abbr.length - 1)) % 4]!);
}

/** Segno di marca: il 23 sul parquet. Foto ufficiale se è il marchio. */
export function CourtMark({
  number = 23,
  size = 72,
  className,
  brand = false,
  premiere = false,
}: {
  number?: number | string;
  size?: number;
  className?: string;
  brand?: boolean;
  premiere?: boolean;
}) {
  const label = String(number);
  const cls = ["court-mark", brand ? "is-brand" : "", premiere ? "is-premiere" : "", className].filter(Boolean).join(" ");
  const live = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = live.current;
    if (!el || premiere) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const play = () => {
      if (document.hidden) return;
      el.classList.remove("is-sweep");
      void el.getBoundingClientRect();
      el.classList.add("is-sweep");
    };
    const io = new IntersectionObserver((entries) => {
      const hit = entries.some((e) => e.isIntersecting);
      window.clearInterval(timer);
      if (!hit) return;
      play();
      timer = window.setInterval(play, 16000);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
  }, [brand, label, premiere]);
  if (brand && label === "23") {
    return (
      <svg
        ref={live}
        width={size}
        height={size}
        viewBox="0 0 80 80"
        aria-hidden
        className={`${cls} court-mark-live`}
      >
        <circle className="cine-ring" cx="40" cy="40" r="34.6" fill="none" stroke="currentColor" strokeWidth="5.4" />
        <g className="mark-arcs">
          <path d="M22.2 22.4 A22.2 22.2 0 0 1 57.8 22.4" fill="none" stroke="currentColor" strokeWidth="3.15" strokeLinecap="round" />
          <path d="M57.8 57.6 A22.2 22.2 0 0 1 22.2 57.6" fill="none" stroke="currentColor" strokeWidth="3.15" strokeLinecap="round" />
        </g>
        {premiere ? (
          <g className="mark-gleam" fill="none" stroke="currentColor" strokeWidth="3.15" strokeLinecap="round">
            <path d="M22.2 22.4 A22.2 22.2 0 0 1 57.8 22.4" />
            <path d="M57.8 57.6 A22.2 22.2 0 0 1 22.2 57.6" />
          </g>
        ) : null}
        <line x1="4.2" y1="40" x2="16.6" y2="40" stroke="currentColor" strokeWidth="4.4" strokeLinecap="square" />
        <line x1="63.4" y1="40" x2="75.8" y2="40" stroke="currentColor" strokeWidth="4.4" strokeLinecap="square" />
        <text
          className="court-mark-num"
          x="40"
          y="41.5"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="26"
          fontWeight="700"
          letterSpacing="-0.07em"
          fontFamily="Figtree, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
        >
          23
        </text>
      </svg>
    );
  }
  const fontSize = label.length > 2 ? 16 : label.length > 1 ? 22 : 26;
  const stroke = brand ? 2.55 : 1.85;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      aria-hidden
      className={cls}
    >
      <circle cx="40" cy="40" r="34.2" fill="none" stroke="currentColor" strokeWidth={stroke * 1.15} />
      <circle cx="40" cy="40" r="19.6" fill="none" stroke="currentColor" strokeWidth={stroke} />
      <line x1="16.5" y1="40" x2="63.5" y2="40" stroke="currentColor" strokeWidth={stroke * 1.05} />
      <text
        className="court-mark-num"
        x="40"
        y="40"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight="700"
        letterSpacing="-0.06em"
        fontFamily="Figtree, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
}

export function TeamMark({
  team,
  size = 40,
  number,
}: {
  team: Mark;
  size?: number;
  number?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const id = `jm-${uid}`;
  const cut = jerseyCut(team.abbr);
  const ink = inkOn(team.color);
  return (
    <svg
      width={size}
      height={Math.round(size * 1.15)}
      viewBox="0 0 80 92"
      aria-hidden
      className="shrink-0 jersey-mark"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={team.color} />
          <stop offset="100%" stopColor={team.secondary} />
        </linearGradient>
      </defs>
      <path
        d="M18 18 L28 8 H52 L62 18 L70 22 V84 C70 88 66 90 40 90 C14 90 10 88 10 84 V22 Z"
        fill={`url(#${id})`}
        stroke={team.secondary}
        strokeWidth="2"
      />
      <path d="M28 8 L32 22 H48 L52 8" fill="none" stroke={team.secondary} strokeWidth="2" />
      {cut === "stripe" && <path d="M14 26 L22 26 L22 80 L14 80 Z" fill={team.secondary} opacity="0.5" />}
      {cut === "band" && <path d="M18 48 H62" stroke={team.secondary} strokeWidth="6.5" opacity="0.5" />}
      {cut === "split" && <path d="M40 22 V84" stroke={team.secondary} strokeWidth="9" opacity="0.32" />}
      {cut === "piping" && (
        <path d="M20 24 V80 M60 24 V80" fill="none" stroke={team.secondary} strokeWidth="2.5" opacity="0.75" />
      )}
      {cut === "yoke" && <path d="M18 26 H62 L58 36 H22 Z" fill={team.secondary} opacity="0.42" />}
      {cut === "side" && (
        <>
          <path d="M12 30 L20 28 L20 78 L12 80 Z" fill={team.secondary} opacity="0.5" />
          <path d="M68 30 L60 28 L60 78 L68 80 Z" fill={team.secondary} opacity="0.5" />
        </>
      )}
      <Motif abbr={team.abbr} ink={ink} />
      <text
        x="40"
        y={number != null ? 58 : 62}
        textAnchor="middle"
        fill={ink}
        fontFamily="Barlow Condensed, sans-serif"
        fontWeight="700"
        fontSize={number != null ? 14 : 15}
      >
        {team.abbr}
      </text>
      {number != null && (
        <text
          x="40"
          y="76"
          textAnchor="middle"
          fill={ink}
          fontFamily="Barlow Condensed, sans-serif"
          fontWeight="700"
          fontSize="18"
          opacity="0.92"
        >
          {number}
        </text>
      )}
    </svg>
  );
}

/** Stemma geometrico della società — accanto al nome, non logo NBA. */
export function TeamCrest({
  team,
  size = 28,
}: {
  team: Mark;
  size?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const ink = inkOn(team.color);
  const gid = `cg-${uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      className="team-crest-svg"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={team.color} />
          <stop offset="100%" stopColor={team.secondary} />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill={`url(#${gid})`} />
      <rect
        x="1.4"
        y="1.4"
        width="29.2"
        height="29.2"
        rx="7.4"
        fill="none"
        stroke={team.secondary}
        strokeWidth="1.2"
        opacity="0.55"
      />
      <g transform="translate(16 15.2) scale(0.52) translate(-40 -27)">
        <Motif abbr={team.abbr} ink={ink} />
      </g>
    </svg>
  );
}

/** Stemma + nome, da usare ovunque ci sia una società. */
export function TeamLabel({
  team,
  name,
  size = 22,
}: {
  team: Mark;
  name?: string;
  size?: number;
}) {
  return (
    <span className="team-label">
      <TeamCrest team={team} size={size} />
      <span className="team-label-name">{name ?? team.abbr}</span>
    </span>
  );
}

/** Bandiera geometrica della nazione scelta. Non emoji, non etichetta di difficoltà. */
export function FlagMark({ nation, size = 22 }: { nation: string; size?: number }) {
  const uid = useId().replace(/:/g, "");
  const w = size * 1.5;
  const h = size;
  const r = Math.max(2, size * 0.16);
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 24 16"
      className="flag-mark"
      role="img"
      aria-label={nation}
    >
      <title>{nation}</title>
      <clipPath id={`fg-${uid}`}>
        <rect x="0.35" y="0.35" width="23.3" height="15.3" rx={r} />
      </clipPath>
      <g clipPath={`url(#fg-${uid})`}>{flagArt(nation)}</g>
      <rect
        x="0.35"
        y="0.35"
        width="23.3"
        height="15.3"
        rx={r}
        fill="none"
        stroke="color-mix(in oklab, var(--color-chalk) 18%, transparent)"
        strokeWidth="0.7"
      />
    </svg>
  );
}

function flagArt(nation: string) {
  switch (nation) {
    case "Italia":
      return (
        <>
          <rect width="8" height="16" fill="#009246" />
          <rect x="8" width="8" height="16" fill="#F4F5F0" />
          <rect x="16" width="8" height="16" fill="#CE2B37" />
        </>
      );
    case "Spagna":
      return (
        <>
          <rect width="24" height="16" fill="#AA151B" />
          <rect y="4.2" width="24" height="7.6" fill="#F1BF00" />
        </>
      );
    case "Francia":
      return (
        <>
          <rect width="8" height="16" fill="#0055A4" />
          <rect x="8" width="8" height="16" fill="#F4F5F0" />
          <rect x="16" width="8" height="16" fill="#EF4135" />
        </>
      );
    case "Serbia":
      return (
        <>
          <rect width="24" height="5.4" fill="#C6363C" />
          <rect y="5.4" width="24" height="5.3" fill="#0C4076" />
          <rect y="10.7" width="24" height="5.3" fill="#F4F5F0" />
        </>
      );
    case "Grecia":
      return (
        <>
          <rect width="24" height="16" fill="#0D5EAF" />
          <rect y="2.3" width="24" height="2.1" fill="#F4F5F0" />
          <rect y="6.7" width="24" height="2.1" fill="#F4F5F0" />
          <rect y="11.1" width="24" height="2.1" fill="#F4F5F0" />
          <rect width="9" height="8.8" fill="#0D5EAF" />
          <rect x="3.5" width="2" height="8.8" fill="#F4F5F0" />
          <rect y="3.4" width="9" height="2" fill="#F4F5F0" />
        </>
      );
    case "Lituania":
      return (
        <>
          <rect width="24" height="5.4" fill="#F9B90F" />
          <rect y="5.4" width="24" height="5.3" fill="#006A44" />
          <rect y="10.7" width="24" height="5.3" fill="#C1272D" />
        </>
      );
    case "Germania":
      return (
        <>
          <rect width="24" height="5.4" fill="#1D1D1F" />
          <rect y="5.4" width="24" height="5.3" fill="#DD0000" />
          <rect y="10.7" width="24" height="5.3" fill="#FFCE00" />
        </>
      );
    case "Slovenia":
      return (
        <>
          <rect width="24" height="5.4" fill="#F4F5F0" />
          <rect y="5.4" width="24" height="5.3" fill="#005DA4" />
          <rect y="10.7" width="24" height="5.3" fill="#ED1C24" />
        </>
      );
    case "Croazia":
      return (
        <>
          <rect width="24" height="5.4" fill="#FF0000" />
          <rect y="5.4" width="24" height="5.3" fill="#F4F5F0" />
          <rect y="10.7" width="24" height="5.3" fill="#171796" />
        </>
      );
    case "Turchia":
      return (
        <>
          <rect width="24" height="16" fill="#E30A17" />
          <circle cx="10" cy="8" r="3.4" fill="#F4F5F0" />
          <circle cx="11.2" cy="8" r="2.7" fill="#E30A17" />
        </>
      );
    case "Lettonia":
      return (
        <>
          <rect width="24" height="16" fill="#9E3039" />
          <rect y="6.4" width="24" height="3.2" fill="#F4F5F0" />
        </>
      );
    case "Georgia":
      return (
        <>
          <rect width="24" height="16" fill="#F4F5F0" />
          <rect x="10.4" width="3.2" height="16" fill="#FF0000" />
          <rect y="6.4" width="24" height="3.2" fill="#FF0000" />
        </>
      );
    case "USA":
      return (
        <>
          <rect width="24" height="16" fill="#BF0A30" />
          <rect y="2" width="24" height="2" fill="#F4F5F0" />
          <rect y="6" width="24" height="2" fill="#F4F5F0" />
          <rect y="10" width="24" height="2" fill="#F4F5F0" />
          <rect y="14" width="24" height="2" fill="#F4F5F0" />
          <rect width="10" height="8.6" fill="#002868" />
        </>
      );
    case "Canada":
      return (
        <>
          <rect width="24" height="16" fill="#FF0000" />
          <rect x="6.5" width="11" height="16" fill="#F4F5F0" />
          <path d="M12 4 L13.4 7.2 L16.6 7 L14 9.2 L15 12.4 L12 10.6 L9 12.4 L10 9.2 L7.4 7 L10.6 7.2 Z" fill="#FF0000" />
        </>
      );
    case "Brasile":
      return (
        <>
          <rect width="24" height="16" fill="#009C3B" />
          <path d="M12 2.2 L21.4 8 L12 13.8 L2.6 8 Z" fill="#FFDF00" />
          <circle cx="12" cy="8" r="2.6" fill="#002776" />
        </>
      );
    case "Argentina":
      return (
        <>
          <rect width="24" height="5.4" fill="#74ACDF" />
          <rect y="5.4" width="24" height="5.2" fill="#F4F5F0" />
          <rect y="10.6" width="24" height="5.4" fill="#74ACDF" />
          <circle cx="12" cy="8" r="1.7" fill="#F6B40E" />
        </>
      );
    case "Australia":
      return (
        <>
          <rect width="24" height="16" fill="#012169" />
          <rect width="10" height="8" fill="#E4002B" />
          <rect x="4" width="2" height="8" fill="#F4F5F0" />
          <rect y="3" width="10" height="2" fill="#F4F5F0" />
        </>
      );
    case "Nigeria":
      return (
        <>
          <rect width="8" height="16" fill="#008751" />
          <rect x="8" width="8" height="16" fill="#F4F5F0" />
          <rect x="16" width="8" height="16" fill="#008751" />
        </>
      );
    default:
      return (
        <>
          <rect width="24" height="16" fill="#1d1d1f" />
          <rect y="5.4" width="24" height="5.2" fill="#F4F5F0" />
        </>
      );
  }
}
