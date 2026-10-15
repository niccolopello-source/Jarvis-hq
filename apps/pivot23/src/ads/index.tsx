import { lazy, Suspense } from "react";
import { ADS_ENABLED } from "./config";

const LazyRail = ADS_ENABLED ? lazy(() => import("./AdRail")) : null;

/** Flag OFF: exactly today's placeholder (no ads module in the bundle). */
export function SideRail({ side, lang, placeholder }: { side: "left" | "right"; lang: string; placeholder: string }) {
  const fallback = (
    <aside className="ad-rail" aria-hidden="true">
      <span>{placeholder}</span>
    </aside>
  );
  if (!LazyRail) return fallback;
  return (
    <Suspense fallback={fallback}>
      <LazyRail side={side} lang={lang} placeholder={placeholder} />
    </Suspense>
  );
}
export { adBreakAtSeasonEnd } from "./adBreak";
