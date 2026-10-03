import { Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { CrashFallback } from "@/components/pivot/CrashFallback";
import { PivotApp } from "@/components/pivot/PivotApp";
import "./styles.css";
import { IntroCurtain, prepareIntro } from "./intro";

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
    if (this.state.error) return <CrashFallback error={this.state.error} />;

    return this.props.children;
  }
}

const root = document.getElementById("app");

if (!root) {
  throw new Error("PIVOT 23 root element #app is missing.");
}

try {
  prepareIntro();
} catch {
  // The intro is decoration: if it cannot set up, the app still mounts and replaces the boot screen.
}

createRoot(root).render(
  <>
    <AppErrorBoundary>
      <PivotApp />
    </AppErrorBoundary>
    <IntroCurtain />
  </>,
);
