import { initLang, useLang, t } from "@/lib/pivot/i18n";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import {
  acquireLiveWriter,
  exportLiveRaw,
  hasLiveWriter,
  inspectLiveProtection,
  livePersistenceAllowed,
  subscribeLiveProtection,
} from "@/lib/pivot/live-protection";
import { signalBootAttention } from "@/boot-signal";
/** Read-only recovery: PivotApp is never mounted while any protected slot/lease is unsafe. */
export function LivePersistenceBoundary({ children }: { children: ReactNode }) {
  const lang = useLang();
  const [protection, setProtection] = useState(inspectLiveProtection);
  const [ready, setReady] = useState(false),
    [exportError, setExportError] = useState(false);
  const retry = useRef<() => void>(() => {});
  useEffect(() => {
    initLang();
    let alive = true,
      stop: () => void = () => {};
    const refresh = () => {
      if (alive) {
        setProtection(inspectLiveProtection());
        setReady(true);
      }
    };
    const acquire = () => {
      stop();
      stop = acquireLiveWriter(refresh);
    };
    retry.current = acquire;
    const wake = () => {
      if (!hasLiveWriter()) acquire();
      else refresh();
    };
    // Keep the lease through the synchronous pagehide flush, then release for BFCache/other tabs.
    const hide = () => {
      queueMicrotask(() => {
        if (alive) {
          stop();
          refresh();
        }
      });
    };
    const unsub = subscribeLiveProtection(refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", wake);
    window.addEventListener("pageshow", wake);
    window.addEventListener("pagehide", hide);
    acquire();
    return () => {
      alive = false;
      stop();
      unsub();
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", wake);
      window.removeEventListener("pageshow", wake);
      window.removeEventListener("pagehide", hide);
    };
  }, []);
  useEffect(() => {
    if (ready && protection.blocked) {
      document.documentElement.classList.remove("pivot-live", "pivot-ready");
      signalBootAttention("recovery");
    }
  }, [ready, protection.blocked]);
  function capture(e: SyntheticEvent) {
    if (!livePersistenceAllowed()) {
      e.preventDefault();
      e.stopPropagation();
      setProtection(inspectLiveProtection());
    }
  }
  function download(id: string, hash: string) {
    let url: string | undefined;
    try {
      const bytes = exportLiveRaw(id, hash);
      url = URL.createObjectURL(
        new Blob([bytes], { type: "application/octet-stream" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "pivot23-" + id.replaceAll("/", "-") + ".utf16le";
      a.click();
      setExportError(false);
      const done = url;
      window.setTimeout(() => URL.revokeObjectURL(done), 1000);
    } catch {
      if (url) URL.revokeObjectURL(url);
      setExportError(true);
    }
  }
  if (!ready || protection.blocked)
    return (
      <main className="min-h-screen bg-paper px-6 py-12 text-ink">
        <section
          className="mx-auto max-w-xl"
          data-testid="live-protection"
          data-reason={protection.reason}
          data-ready={ready}
          role="alert"
          aria-live="polite"
        >
          <h1 className="text-2xl font-bold">{t("protectedTitle", lang)}</h1>
          <p className="mt-4">
            {!ready
              ? t("protectedChecking", lang)
              : protection.reason === "writer"
                ? t("protectedWriter", lang)
                : t("protectedData", lang)}
          </p>
          <p className="mt-4">{t("protectedExportInfo", lang)}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {protection.slots
              .filter((s) => s.hash)
              .map((s) => (
                <button
                  key={s.id}
                  className="rounded border px-3 py-2"
                  onClick={() => download(s.id, s.hash!)}
                >
                  {t("protectedExport", lang)} {s.id}
                </button>
              ))}
            <button
              className="rounded border px-3 py-2"
              onClick={() => retry.current()}
            >
              {t("protectedRetry", lang)}
            </button>
          </div>
          {exportError && (
            <p className="mt-4" role="alert">
              {t("protectedExportError", lang)}
            </p>
          )}
        </section>
      </main>
    );
  return (
    <div onClickCapture={capture} onKeyDownCapture={capture}>
      {children}
    </div>
  );
}
