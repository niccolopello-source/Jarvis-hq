import { SpeedInsights as VercelSpeedInsights } from "@vercel/speed-insights/react";
import { shouldLoadWebAnalytics } from "./WebAnalytics";

/**
 * Vercel Speed Insights (free tier, approved by Pello on 2026-11-10): Core Web Vitals from real devices.
 * Same gate as Web Analytics: production build on a real host only (never in dev, preview or e2e).
 * The script is pinned to the same-origin path, so CSP 'self' covers it and no third-party host
 * (va.vercel-scripts.com) is ever contacted. It is a deferred, fire-and-forget script: if it is
 * blocked or fails to load (content blockers, networks in China), the game is unaffected.
 * It never touches engine, RNG, saves or language.
 */
export const SPEED_INSIGHTS_SRC = "/_vercel/speed-insights/script.js";

export function SpeedInsights() {
  if (typeof window === "undefined") return null;
  if (!shouldLoadWebAnalytics(import.meta.env.PROD, window.location.hostname)) return null;
  return <VercelSpeedInsights scriptSrc={SPEED_INSIGHTS_SRC} />;
}
