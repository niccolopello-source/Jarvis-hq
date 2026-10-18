import { Analytics } from "@vercel/analytics/react";

/**
 * Vercel Web Analytics: anonymous, cookieless page views.
 * The script and beacon are same-origin (/_vercel/insights/*), so CSP 'self' covers them.
 * Rendered only in production builds served from a non-local host: nothing loads in
 * `vite dev` (which would pull the external debug script), in `vite preview`, or in e2e.
 * It never touches engine, RNG or saves; if the script fails, the game is unaffected.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1", ""]);

export function shouldLoadWebAnalytics(prod: boolean, hostname: string): boolean {
  return prod && !LOCAL_HOSTS.has(hostname) && !hostname.endsWith(".localhost");
}

export function WebAnalytics() {
  if (typeof window === "undefined") return null;
  if (!shouldLoadWebAnalytics(import.meta.env.PROD, window.location.hostname)) return null;
  return <Analytics />;
}
