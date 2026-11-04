/**
 * Flag OFF build (default): vite.config.ts aliases "@/ads" here, so no ads module, chunk or
 * third-party URL ends up in the bundle. Renders an empty, borderless rail column.
 */
export function SideRail(_props: { side: "left" | "right"; lang: string; placeholder: string }) {
  // Ads OFF: keep the grid column, show nothing (no "Riservato" label, no border).
  return <aside className="ad-rail ad-rail-off" aria-hidden="true" />;
}

export function adBreakAtSeasonEnd(proceed: () => void): void {
  proceed();
}
