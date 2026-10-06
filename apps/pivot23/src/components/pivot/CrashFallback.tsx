import { useEffect, useState } from "react";
import { t } from "@/lib/pivot/i18n";
import { hasLiveHint, holdLiveFlush, setAsideLive } from "@/lib/pivot/save";

/**
 * Error screen shared by the app-level and the career-view boundaries.
 *
 * "Reload" is the first answer. When a saved career exists it may itself be what breaks the screens
 * (a save that passes every check but that this build cannot draw), and reloading would reopen it and
 * crash again. The second button copies that save aside (CRASH_BACKUP_KEY) and opens a clean home;
 * it removes nothing it could not copy first.
 */
export function CrashFallback({ error }: { error: Error | null }) {
  const [asideFailed, setAsideFailed] = useState(false);
  const [canSetAside] = useState(() => hasLiveHint());
  useEffect(() => {
    holdLiveFlush();
  }, []);
  return (
    <main className="min-h-screen bg-bg text-wood grid place-items-center p-6">
      <section className="max-w-md rounded-xl border border-line bg-panel p-6 shadow-sm" role="alert">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">PIVOT 23</p>
        <h1 className="mt-2 text-2xl font-semibold">{t("crashTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("crashBody")}</p>
        {import.meta.env.DEV && error && (
          <pre className="mt-4 overflow-auto rounded-lg bg-panel-2 p-3 text-xs text-muted" role="note">
            {error.message}
          </pre>
        )}
        <button
          type="button"
          className="mt-5 min-h-11 min-w-11 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
          onClick={() => window.location.reload()}
        >
          {t("crashReload")}
        </button>
        {canSetAside ? (
          <button
            type="button"
            className="mt-3 block min-h-11 rounded-lg px-1 py-2 text-left text-sm font-semibold underline"
            onClick={() => {
              if (setAsideLive()) window.location.reload();
              else setAsideFailed(true);
            }}
          >
            {t("crashSetAside")}
            <span className="block font-normal text-muted no-underline">{t("crashSetAsideDetail")}</span>
          </button>
        ) : null}
        {asideFailed ? (
          <p className="mt-2 text-sm text-muted" role="status">
            {t("crashSetAsideFailed")}
          </p>
        ) : null}
      </section>
    </main>
  );
}
