import { Component, useEffect, useState, type ComponentType, type ReactNode } from "react";
import { t, useLang } from "@/lib/pivot/i18n";

/** How many times the player may retry a failed chunk before the fallback becomes final. */
export const CHUNK_RETRIES = 2;

type BoundaryProps = { children: ReactNode; onError: (error: unknown) => void; resetKey: number };

class ChunkCatcher extends Component<BoundaryProps, { failed: boolean; key: number }> {
  state = { failed: false, key: this.props.resetKey };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  static getDerivedStateFromProps(props: BoundaryProps, state: { failed: boolean; key: number }) {
    // A new attempt clears the error.
    return props.resetKey !== state.key ? { failed: false, key: props.resetKey } : null;
  }
  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Loads a component from a separate chunk, inside a local error boundary. If the chunk fails
 * (network, deploy swap, blocked request) or throws while rendering, only this box shows a
 * message; the rest of the screen and the career keep working. Retries are bounded by
 * CHUNK_RETRIES and only happen on a click: no loop.
 */
export function LazyChunk<P extends object, M>({
  load,
  pick,
  props,
  label,
  fallback,
}: {
  load: () => Promise<M>;
  /** Picks the component out of the loaded module. */
  pick: (mod: M) => ComponentType<P>;
  props: P;
  /** Short name of what failed, already localized ("il grafico" / "the chart"). */
  label: string;
  fallback: ReactNode;
}) {
  const lang = useLang();
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState<{ C: ComponentType<P> } | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    // Browsers cache a failed dynamic import per URL, so a retry of the same import() fails
    // again without a request. Retry the URL named in the error with a cache-busting query.
    const attemptLoad: () => Promise<M> =
      attempt > 0 && failedUrl ? () => import(/* @vite-ignore */ `${failedUrl}?retry=${attempt}`) as Promise<M> : load;
    attemptLoad().then(
      (m) => {
        if (alive) setLoaded({ C: pick(m) });
      },
      (error: unknown) => {
        if (!alive) return;
        report(label, attempt, error);
        setFailedUrl((prev) => prev ?? moduleUrlOf(error));
        setFailed(true);
      },
    );
    return () => {
      alive = false;
    };
    // failedUrl is read for the next attempt only; it must not trigger a load by itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, load, pick, label]);

  const canRetry = attempt < CHUNK_RETRIES;
  if (failed) {
    return (
      <div className="chunk-fallback" role="status">
        <p>{(canRetry ? t("chunkFailed", lang) : t("chunkFailedFinal", lang)).replace("{what}", label)}</p>
        {canRetry ? (
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              setFailed(false);
              setLoaded(null);
              setAttempt((n) => n + 1);
            }}
          >
            {t("chunkRetry", lang)}
          </button>
        ) : null}
      </div>
    );
  }
  if (!loaded) return <>{fallback}</>;
  const Loaded = loaded.C;
  return (
    <ChunkCatcher
      resetKey={attempt}
      onError={(error) => {
        report(label, attempt, error);
        setFailed(true);
      }}
    >
      <Loaded {...props} />
    </ChunkCatcher>
  );
}

/** Module URL named in a dynamic-import error (Chrome, Firefox). Safari does not name it. */
export function moduleUrlOf(error: unknown): string | null {
  const message = String((error as { message?: unknown })?.message ?? "");
  const match = /(https?:\/\/[^\s?#'"]+\.(?:js|mjs|tsx?|jsx))/.exec(message);
  if (!match) return null;
  try {
    const url = new URL(match[1]!);
    return typeof location !== "undefined" && url.origin !== location.origin ? null : url.href;
  } catch {
    return null;
  }
}

function report(label: string, attempt: number, error: unknown) {
  if (!import.meta.env.DEV) return;
  // Dev only, no player data: the error type and message are enough.
  const e = error as { name?: string; message?: string };
  console.warn(`PIVOT 23 chunk "${label}" failed (attempt ${attempt + 1})`, e?.name, e?.message);
}
