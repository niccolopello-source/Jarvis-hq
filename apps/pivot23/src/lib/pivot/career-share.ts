/** Share text and helpers for the Career Card. Display only: never rewrites stored career data. */
import { INSTAGRAM_HANDLE } from "@/config/social";
import { lt, seasonsLabel } from "./legacy-i18n";
import type { CardFace } from "./legacy-report";
import type { Lang } from "./i18n";

/** Public site to include in every share. Not the preview host. Full URL so the link is tappable. */
export const CAREER_SHARE_URL = "https://www.pivot23.com";

export const CAREER_SHARE_TITLE = "PIVOT 23";

export function instagramHandle(): string {
  return INSTAGRAM_HANDLE;
}

export function instagramMention(): string {
  return "@" + INSTAGRAM_HANDLE;
}

export type CareerShareInput = {
  name: string;
  seasons: number;
  titles: number;
  /** Already localized verdict, or empty if the career has none. */
  verdict: string;
  lang: Lang;
};

export function shareInputFromFace(face: CardFace, verdict: string, lang: Lang): CareerShareInput {
  return { name: face.name, seasons: face.seasons, titles: face.titles, verdict, lang };
}

function detailsOf(input: CareerShareInput): string {
  const parts: string[] = [];
  if (input.seasons > 0) parts.push(seasonsLabel(input.seasons, input.lang));
  if (input.titles > 0) {
    parts.push(input.titles === 1 ? lt("shareTitlesOne", input.lang) : lt("shareTitlesMany", input.lang, { n: input.titles }));
  }
  return parts.join(input.lang === "zh" ? "，" : ", ");
}

/**
 * Short career summary in Lucille's format: one sentence of facts, the official handle,
 * the site link, and at most three hashtags. No story, no opponents, no diary.
 * Empty facts are omitted instead of inventing zeros.
 */
export function buildCareerShareText(input: CareerShareInput): string {
  const details = detailsOf(input);
  const verdict = input.verdict.trim();
  const vars = { name: input.name, details, verdict };
  let lead: string;
  if (details && verdict) lead = lt("shareLine", input.lang, vars);
  else if (details) lead = lt("shareLineNoVerdict", input.lang, vars);
  else if (verdict) lead = lt("shareLineNoDetails", input.lang, vars);
  else lead = lt("shareLineBare", input.lang, vars);
  const tags = lt("shareTags", input.lang).trim();
  return [lead, instagramMention(), CAREER_SHARE_URL, tags].filter((x) => x.length > 0).join("\n");
}

export type WhatsAppTarget = "app" | "web";

export function whatsAppShareUrl(text: string, target: WhatsAppTarget = "app"): string {
  const base = target === "web" ? "https://web.whatsapp.com/send" : "https://wa.me/";
  const u = new URL(base);
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
