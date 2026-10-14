/**
 * Flag OFF build (default): vite.config.ts aliases "@/ads" here, so no ads module, chunk or
 * third-party URL ends up in the bundle. Renders exactly today's placeholder.
 */
export function SideRail({ placeholder }: { side: "left" | "right"; lang: string; placeholder: string }) {
  return (
    <aside className="ad-rail" aria-hidden="true">
      <span>{placeholder}</span>
    </aside>
  );
}

export function adBreakAtSeasonEnd(proceed: () => void): void {
  proceed();
}
