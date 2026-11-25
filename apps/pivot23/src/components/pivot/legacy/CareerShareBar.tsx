import { useId, useState } from "react";
import { useLang, type Lang } from "@/lib/pivot/i18n";
import { nationLabel, roleLabel } from "@/lib/pivot/labels";
import { nx } from "@/lib/pivot/narrative";
import {
  buildCareerShareText,
  copyText,
  instagramHandle,
  nativeShareLevel,
  shareFileFromBlob,
  shareInputFromFace,
  tryNativeShare,
  whatsAppShareUrl,
} from "@/lib/pivot/career-share";
import { fmtDec, fmtInt, legacyAwardLabel, lt, seasonsLabel } from "@/lib/pivot/legacy-i18n";
import type { CardTheme } from "@/lib/pivot/cosmetics";
import type { CardFace } from "@/lib/pivot/legacy-report";
import { pngFileName, renderCardPngBlob, triggerBlobDownload, type ExportOutcome, type PngLabels } from "./exportPng";

export function cardLabels(face: CardFace, lang: Lang): PngLabels {
  const role = face.roleCode ? roleLabel(face.roleCode, lang) : roleLabel(face.roleLabel, lang);
  const stats: [string, string][] = face.averages
    ? [[fmtDec(face.averages.ppg, lang), "PPG"], [fmtDec(face.averages.rpg, lang), "RPG"], [fmtDec(face.averages.apg, lang), "APG"]]
    : [];
  if (face.titles > 0) stats.push([fmtInt(face.titles, lang), lt("titles", lang)]);
  return {
    role,
    nation: face.nationality ? nationLabel(face.nationality, lang) : null,
    ages: face.ages ? `${lt("age", lang)} ${face.ages}` : "",
    seasons: face.seasons ? seasonsLabel(face.seasons, lang) : "",
    stats,
    honors: face.honors.map(([id, n]) => {
      const name = legacyAwardLabel(id, lang);
      return n > 1 ? `${n}× ${name}` : name;
    }),
    verdict: nx(face.verdict, lang),
    footer: lt("footer", lang),
    peak: `${lt("peak", lang)} ${face.peak}`,
  };
}

function honorsOf(face: CardFace, lang: Lang): string[] {
  return face.honors.map(([id, n]) => {
    const name = legacyAwardLabel(id, lang);
    return n > 1 ? `${n}× ${name}` : name;
  });
}

type Status = ExportOutcome | "busy" | "copied" | "copy-fail" | "ig-hint" | null;

function statusText(status: Status, lang: Lang): string {
  if (status === "busy") return lt("exporting", lang);
  if (status === "done") return lt("exportDone", lang);
  if (status === "failed") return lt("exportFail", lang);
  if (status === "unsupported") return lt("exportUnsupported", lang);
  if (status === "copied") return lt("shareCopied", lang);
  if (status === "copy-fail") return lt("shareCopyFail", lang);
  if (status === "ig-hint") return lt("shareInstagramHint", lang, { handle: instagramHandle() });
  return "";
}

/** Share controls next to the Career Card, never drawn on the PNG itself. */
export function CareerShareBar({ face, theme }: { face: CardFace; theme: CardTheme }) {
  const lang = useLang();
  const labels = cardLabels(face, lang);
  const text = buildCareerShareText(shareInputFromFace(face, labels.role, honorsOf(face, lang), lang));
  const fileName = pngFileName(face.name);
  const [status, setStatus] = useState<Status>(null);
  const hasShare = typeof navigator !== "undefined" && nativeShareLevel(navigator) !== "none";

  async function pngBlob() {
    setStatus("busy");
    const rendered = await renderCardPngBlob(face, theme, labels);
    if (!rendered.ok) {
      setStatus(rendered.outcome);
      return null;
    }
    return rendered.blob;
  }

  async function onNativeShare() {
    const blob = await pngBlob();
    if (!blob) return;
    const file = shareFileFromBlob(blob, fileName);
    const result = await tryNativeShare({ text, file });
    if (result === "shared") setStatus(null);
    else if (result === "aborted") setStatus(null);
    else if (result === "unavailable") {
      triggerBlobDownload(blob, fileName);
      const ok = await copyText(text);
      setStatus(ok ? "copied" : "done");
    } else setStatus("failed");
  }

  async function onDownload() {
    const blob = await pngBlob();
    if (!blob) return;
    try {
      triggerBlobDownload(blob, fileName);
      setStatus("done");
    } catch {
      setStatus("failed");
    }
  }

  async function onCopy() {
    setStatus("busy");
    const ok = await copyText(text);
    setStatus(ok ? "copied" : "copy-fail");
  }

  async function onInstagram() {
    const blob = await pngBlob();
    if (!blob) return;
    const file = shareFileFromBlob(blob, fileName);
    const result = await tryNativeShare({ text, file });
    if (result === "aborted") {
      setStatus(null);
      return;
    }
    if (result !== "shared") {
      try {
        triggerBlobDownload(blob, fileName);
      } catch {
        setStatus("failed");
        return;
      }
    }
    setStatus("ig-hint");
  }

  const titleId = useId();
  const busy = status === "busy";

  return (
    <div className="lc-share" data-career-share role="region" aria-label={lt("shareRegion", lang)}>
      <p className="lc-share-title" id={titleId}>{lt("shareTitle", lang)}</p>
      <div className="lc-share-row" role="group" aria-labelledby={titleId}>
        {hasShare ? (
          <button type="button" className="primary-btn lc-share-native" onClick={onNativeShare} disabled={busy} data-share-native aria-label={lt("shareNativeAria", lang)}>
            {lt("shareNative", lang)}
          </button>
        ) : null}
        <a
          className="ghost-btn lc-share-btn"
          href={whatsAppShareUrl(text)}
          target="_blank"
          rel="noopener noreferrer"
          data-share-whatsapp
          aria-label={lt("shareWhatsAppAria", lang)}
        >
          {lt("shareWhatsApp", lang)}
        </a>
        <button type="button" className="ghost-btn lc-share-btn" onClick={onInstagram} disabled={busy} data-share-instagram aria-label={lt("shareInstagramAria", lang)}>
          {lt("shareInstagram", lang)}
        </button>
        <button type="button" className="ghost-btn lc-share-btn" onClick={onCopy} disabled={busy} data-share-copy aria-label={lt("shareCopyAria", lang)}>
          {lt("shareCopy", lang)}
        </button>
        <button type="button" className="ghost-btn lc-share-btn" onClick={onDownload} disabled={busy} data-export-png>
          {lt("exportPng", lang)}
        </button>
      </div>
      <p className="lc-status" role="status" aria-live="polite" data-share-status>
        {statusText(status, lang)}
      </p>
    </div>
  );
}

