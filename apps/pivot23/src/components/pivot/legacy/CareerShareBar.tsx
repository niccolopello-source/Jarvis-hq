import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
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
import { pngFileName, renderCardPngBlob, triggerBlobDownload, type ExportOutcome, type PngLabels, type PngVariant } from "./exportPng";

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

function subscribeShareMq(cb: () => void) {
  const mq = window.matchMedia("(max-width: 767px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const shareMqSnapshot = () => window.matchMedia("(max-width: 767px)").matches;

function ChannelButton({
  label, hint, onClick, disabled, href, testId, ariaLabel,
}: {
  label: string;
  hint: string;
  onClick?: () => void;
  disabled?: boolean;
  href?: string;
  testId: string;
  ariaLabel: string;
}) {
  const inner: ReactNode = (
    <>
      <span className="lc-share-item-name">{label}</span>
      <span className="lc-share-item-hint">{hint}</span>
    </>
  );
  if (href) {
    return (
      <a className="ghost-btn lc-share-item" href={href} target="_blank" rel="noopener noreferrer" data-share={testId} aria-label={ariaLabel}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className="ghost-btn lc-share-item" onClick={onClick} disabled={disabled} data-share={testId} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}

/** Share controls next to the Career Card, never drawn on the PNG itself. */
export function CareerShareBar({ face, theme }: { face: CardFace; theme: CardTheme }) {
  const lang = useLang();
  const labels = cardLabels(face, lang);
  const text = buildCareerShareText(shareInputFromFace(face, labels.verdict, lang));
  const feedName = pngFileName(face.name, "feed");
  const storyName = pngFileName(face.name, "story");
  const [status, setStatus] = useState<Status>(null);
  const [open, setOpen] = useState(false);
  const mobile = useSyncExternalStore(subscribeShareMq, shareMqSnapshot, () => false);
  const hasShare = typeof navigator !== "undefined" && nativeShareLevel(navigator) !== "none";
  const titleId = useId();
  const pickerId = useId();
  const busy = status === "busy";

  async function pngBlob(variant: PngVariant = "feed") {
    setStatus("busy");
    const rendered = await renderCardPngBlob(face, theme, labels, variant);
    if (!rendered.ok) {
      setStatus(rendered.outcome);
      return null;
    }
    return rendered.blob;
  }

  async function onDownload(variant: PngVariant = "feed") {
    const blob = await pngBlob(variant);
    if (!blob) return;
    try {
      triggerBlobDownload(blob, variant === "story" ? storyName : feedName);
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

  async function onInstagram(variant: PngVariant) {
    const blob = await pngBlob(variant);
    if (!blob) return;
    const file = shareFileFromBlob(blob, variant === "story" ? storyName : feedName);
    const result = await tryNativeShare({ text, file });
    if (result === "aborted") {
      setStatus(null);
      return;
    }
    if (result !== "shared") {
      try {
        triggerBlobDownload(blob, variant === "story" ? storyName : feedName);
      } catch {
        setStatus("failed");
        return;
      }
    }
    setStatus("ig-hint");
  }

  async function onWhatsAppApp() {
    if (!hasShare) {
      window.open(whatsAppShareUrl(text, "app"), "_blank", "noopener,noreferrer");
      return;
    }
    const blob = await pngBlob("feed");
    if (!blob) return;
    const file = shareFileFromBlob(blob, feedName);
    const result = await tryNativeShare({ text, file });
    if (result === "aborted" || result === "shared") setStatus(null);
    else setStatus("failed");
  }

  async function onMore() {
    const blob = await pngBlob("feed");
    if (!blob) return;
    const file = shareFileFromBlob(blob, feedName);
    const result = await tryNativeShare({ text, file });
    if (result === "shared" || result === "aborted") setStatus(null);
    else if (result === "unavailable") {
      triggerBlobDownload(blob, feedName);
      const ok = await copyText(text);
      setStatus(ok ? "copied" : "done");
    } else setStatus("failed");
  }

  return (
    <div className="lc-share" data-career-share data-share-layout={mobile ? "mobile" : "desktop"} role="region" aria-label={lt("shareRegion", lang)}>
      <p className="lc-share-title" id={titleId}>{lt("shareTitle", lang)}</p>
      <div className="lc-share-default" role="group" aria-labelledby={titleId}>
        <button
          type="button"
          className="primary-btn"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={pickerId}
          data-share-open
          aria-label={lt("shareNativeAria", lang)}
        >
          {lt("shareNative", lang)}
        </button>
        <button type="button" className="ghost-btn" onClick={() => onDownload("feed")} disabled={busy} data-export-png>
          {lt("exportPng", lang)}
        </button>
      </div>
      <p className="lc-share-channels">{lt(mobile ? "shareChannelsMobile" : "shareChannelsDesktop", lang)}</p>
      {open ? (
        <div className="lc-share-picker" id={pickerId} data-share-picker role="group" aria-labelledby={titleId}>
          <p className="lc-share-intro">{lt(mobile ? "shareIntroMobile" : "shareIntroDesktop", lang)}</p>
          {mobile ? (
            <>
              <ChannelButton label={lt("shareStory", lang)} hint={lt("shareStoryHint", lang)} onClick={() => onInstagram("story")} disabled={busy} testId="story" ariaLabel={lt("shareStory", lang)} />
              <ChannelButton label={lt("shareFeed", lang)} hint={lt("shareFeedHint", lang)} onClick={() => onInstagram("feed")} disabled={busy} testId="feed" ariaLabel={lt("shareFeed", lang)} />
              <ChannelButton label={lt("shareWhatsApp", lang)} hint={lt("shareWhatsAppHint", lang)} onClick={onWhatsAppApp} disabled={busy} testId="whatsapp" ariaLabel={lt("shareWhatsAppAria", lang)} />
              <ChannelButton label={lt("shareCopy", lang)} hint={lt("shareCopyHint", lang)} onClick={onCopy} disabled={busy} testId="copy" ariaLabel={lt("shareCopyAria", lang)} />
              <ChannelButton label={lt("shareMore", lang)} hint={lt("shareMoreAria", lang)} onClick={onMore} disabled={busy} testId="more" ariaLabel={lt("shareMoreAria", lang)} />
            </>
          ) : (
            <>
              <ChannelButton label={lt("shareCopy", lang)} hint={lt("shareCopyHint", lang)} onClick={onCopy} disabled={busy} testId="copy" ariaLabel={lt("shareCopyAria", lang)} />
              <ChannelButton label={lt("shareDownload45", lang)} hint={lt("shareDownload45Hint", lang)} onClick={() => onDownload("feed")} disabled={busy} testId="download-45" ariaLabel={lt("shareDownload45", lang)} />
              <ChannelButton label={lt("shareDownload916", lang)} hint={lt("shareDownload916Hint", lang)} onClick={() => onDownload("story")} disabled={busy} testId="download-916" ariaLabel={lt("shareDownload916", lang)} />
              <ChannelButton label={lt("shareWhatsAppWeb", lang)} hint={lt("shareWhatsAppWebAria", lang)} href={whatsAppShareUrl(text, "web")} testId="whatsapp-web" ariaLabel={lt("shareWhatsAppWebAria", lang)} />
            </>
          )}
          <pre className="lc-share-preview" data-share-preview tabIndex={0}>{text}</pre>
        </div>
      ) : null}
      <p className="lc-status" role="status" aria-live="polite" data-share-status>
        {statusText(status, lang)}
      </p>
    </div>
  );
}
