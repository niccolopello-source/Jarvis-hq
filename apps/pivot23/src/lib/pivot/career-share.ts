/** Share text and helpers for the Career Card. Display only: never rewrites stored career data. */
import { INSTAGRAM_HANDLE } from "@/config/social";
import { fmtDec, lt, seasonsLabel } from "./legacy-i18n";
import type { CardFace } from "./legacy-report";
import type { Lang } from "./i18n";

/** Public site to include in every share. Not the preview host. */
export const CAREER_SHARE_URL = "https://www.pivot23.com";

export const CAREER_SHARE_TITLE = "PIVOT 23";

export function instagramHandle(): string {
  return INSTAGRAM_HANDLE;
}

export function instagramMention(): string {
  return `@${INSTAGRAM_HANDLE}`;
}

export type CareerShareInput = {
  name: string;
  role: string;
  span: string | null;
  ages: string | null;
  seasons: number;
  peak: number | null;
  titles: number;
  /** Already localized honor labels, including a "n× " prefix when needed. */
  honors: string[];
  averages: { ppg: number; rpg: number; apg: number } | null;
  /** Already unique team abbreviations, in career order. */
  teams: string[];
  lang: Lang;
};

export function shareInputFromFace(face: CardFace, role: string, honors: string[], lang: Lang): CareerShareInput {
  return {
    name: face.name,
    role,
    span: face.span,
    ages: face.ages,
    seasons: face.seasons,
    peak: face.peak,
    titles: face.titles,
    honors,
    averages: face.averages,
    teams: face.teams.map((t) => t.abbr),
    lang,
  };
}

function line(...parts: Array<string | null | undefined | false>): string | null {
  const kept = parts.map((p) => (typeof p === "string" ? p.trim() : "")).filter(Boolean);
  return kept.length ? kept.join(" · ") : null;
}

/** Short, spoiler-free career summary. Stats and honors only: no story, no opponents, no diary. */
export function buildCareerShareText(input: CareerShareInput): string {
  const lang = input.lang;
  const identity = line(input.name, input.role);
  const span = line(
    input.span,
    input.ages,
    input.seasons > 0 ? seasonsLabel(input.seasons, lang) : null,
  );
  const headline = line(
    input.peak != null && Number.isFinite(input.peak) ? `📈 ${lt("sharePeakLine", lang, { n: input.peak })}` : null,
    input.titles > 0
      ? `🏆 ${input.titles === 1 ? lt("shareTitlesOne", lang) : lt("shareTitlesMany", lang, { n: input.titles })}`
      : null,
  );
  const honors = input.honors.map((h) => h.trim()).filter(Boolean).join(" · ") || null;
  const averages = input.averages
    ? [fmtDec(input.averages.ppg, lang) + " PPG", fmtDec(input.averages.rpg, lang) + " RPG", fmtDec(input.averages.apg, lang) + " APG"].join(" · ")
    : null;
  const teams = input.teams.map((t) => t.trim()).filter(Boolean).join(" · ") || null;
  const lines = [
    `🏀 ${CAREER_SHARE_TITLE}`,
    identity,
    span,
    headline,
    honors,
    averages,
    teams,
    CAREER_SHARE_URL,
    instagramMention(),
  ].filter((x): x is string => Boolean(x && x.trim()));
  return lines.join("\n");
}

export function whatsAppShareUrl(text: string): string {
  const u = new URL("https://wa.me/");
  u.search = ["text", encodeURIComponent(text)].join("=");
  return u.toString();
}

export type ShareNavigator = {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
};

export type NativeShareLevel = "files" | "text" | "none";

export function nativeShareLevel(nav: ShareNavigator | undefined | null, file?: File): NativeShareLevel {
  if (!nav || typeof nav.share !== "function") return "none";
  const base: ShareData = { title: CAREER_SHARE_TITLE, text: "PIVOT 23", url: CAREER_SHARE_URL };
  const probe = (data: ShareData): boolean => {
    if (typeof nav.canShare !== "function") return true;
    try {
      return nav.canShare(data);
    } catch {
      return false;
    }
  };
  if (file && probe({ ...base, files: [file] })) return "files";
  if (probe(base)) return "text";
  return "none";
}

export type NativeShareResult = "shared" | "aborted" | "unavailable" | "failed";

export async function tryNativeShare(opts: {
  text: string;
  url?: string;
  file?: File;
  nav?: ShareNavigator | null;
}): Promise<NativeShareResult> {
  const nav = opts.nav ?? (typeof navigator === "undefined" ? null : navigator);
  const file = opts.file;
  const level = nativeShareLevel(nav, file);
  if (level === "none" || !nav?.share) return "unavailable";
  const data: ShareData = {
    title: CAREER_SHARE_TITLE,
    text: opts.text,
    url: opts.url ?? CAREER_SHARE_URL,
  };
  if (level === "files" && file) data.files = [file];
  try {
    await nav.share(data);
    return "shared";
  } catch (err) {
    const name = err && typeof err === "object" && "name" in err ? String((err as { name: unknown }).name) : "";
    if (name === "AbortError") return "aborted";
    return "failed";
  }
}

export async function copyText(text: string, clipboard?: Pick<Clipboard, "writeText"> | null): Promise<boolean> {
  const api = clipboard !== undefined ? clipboard : typeof navigator !== "undefined" ? navigator.clipboard : undefined;
  if (api && typeof api.writeText === "function") {
    try {
      await api.writeText(text);
      return true;
    } catch {
      /* fall through to the textarea fallback */
    }
  }
  if (typeof document === "undefined") return false;
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.setAttribute("aria-hidden", "true");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

export function shareFileFromBlob(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type || "image/png" });
}
