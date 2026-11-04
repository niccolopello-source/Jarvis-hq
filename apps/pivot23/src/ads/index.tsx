import { lazy, Suspense } from "react";
import { ADS_ENABLED } from "./config";

const LazyRail = ADS_ENABLED ? lazy(() => import("./AdRail")) : null;

/** Flag OFF: an empty rail column (no ads module in the bundle). */
export function SideRail({ side, lang, placeholder }: { side: "left" | "right"; lang: string; placeholder: string }) {
  const fallback = <aside className="ad-rail ad-rail-off" aria-hidden="true" />;
  if (!LazyRail) return fallback;
  return (
    <Suspense fallback={fallback}>
      <LazyRail side={side} lang={lang} placeholder={placeholder} />
    </Suspense>
  );
}
export { adBreakAtSeasonEnd } from "./adBreak";
