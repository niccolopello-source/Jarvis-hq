import { Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { PivotApp } from "@/components/pivot/PivotApp";
import "./styles.css";

const themeMeta = document.querySelector('meta[name="theme-color"]');
if (themeMeta instanceof HTMLMetaElement) {
  themeMeta.content = window.matchMedia("(prefers-color-scheme: dark)").matches ? "#1c1c1e" : "#f5f5f7";
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("PIVOT 23 failed to render", error, info.componentStack);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen bg-bg text-wood grid place-items-center p-6">
          <section className="max-w-md rounded-xl border border-line bg-panel p-6 shadow-sm" role="alert">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">PIVOT 23</p>
            <h1 className="mt-2 text-2xl font-semibold">Si è verificato un problema</h1>
            <p className="mt-2 text-sm text-muted">
              Ricarica PIVOT 23 per riprovare. La carriera salvata nel browser resta disponibile.
            </p>
            {import.meta.env.DEV && (
              <pre className="mt-4 overflow-auto rounded-lg bg-panel-2 p-3 text-xs text-muted" role="note">
                {this.state.error?.message}
              </pre>
            )}
            <button
              className="mt-5 min-h-11 min-w-11 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
              onClick={() => window.location.reload()}
            >
              Ricarica PIVOT 23
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

const root = document.getElementById("app");

if (!root) {
  throw new Error("PIVOT 23 root element #app is missing.");
}

createRoot(root).render(
  <AppErrorBoundary>
    <PivotApp />
  </AppErrorBoundary>,
);
