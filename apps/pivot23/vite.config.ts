import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";

/** Same security headers as production (vercel.json), so `vite preview` and the e2e run catch CSP breaks. */
function productionHeaders(): Record<string, string> {
  const config = JSON.parse(readFileSync(new URL("./vercel.json", import.meta.url), "utf8")) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  const global = config.headers.find((h) => h.source === "/(.*)");
  return Object.fromEntries((global?.headers ?? []).map((h) => [h.key, h.value]));
}

/**
 * `vite preview` serves plain http on 127.0.0.1. WebKit 2359+ honours `upgrade-insecure-requests`
 * for loopback too, upgrades every asset to https and the page never boots. Drop only that
 * directive, only here; vercel.json (production) keeps it, see security-headers.test.ts.
 */
export function localPreviewHeaders(): Record<string, string> {
  const headers = productionHeaders();
  const csp = headers["Content-Security-Policy"];
  if (csp) headers["Content-Security-Policy"] = csp.replace(/;\s*upgrade-insecure-requests\s*(?=;|$)/, "");
  return headers;
}

export default defineConfig(({ mode }) => {
  // Ads are OFF unless VITE_ADS_ENABLED=true at build time (see src/ads/config.ts).
  const env = { ...loadEnv(mode, process.cwd(), "VITE_"), ...process.env };
  return {
  define: {
    __PIVOT_ADS_ENABLED__: JSON.stringify(env.VITE_ADS_ENABLED === "true"),
    __PIVOT_ADSENSE_CLIENT__: JSON.stringify(env.VITE_ADSENSE_CLIENT ?? ""),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      // Flag OFF: "@/ads" resolves to a placeholder-only stub, so the ads code is not even emitted.
      ...(env.VITE_ADS_ENABLED === "true"
        ? []
        : [{ find: /^@\/ads$/, replacement: fileURLToPath(new URL("./src/ads/off.tsx", import.meta.url)) }]),
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
    ],
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
  preview: {
    headers: localPreviewHeaders(),
  },
  build: {
    rolldownOptions: {
      output: {
        // Stable vendor and narrative chunks: a UI-only deploy no longer invalidates React or the
        // story text in the browser cache, and the browser parses the chunks in parallel.
        // All chunks stay same-origin files, so the CSP (script-src 'self') is unchanged.
        codeSplitting: {
          groups: [
            { name: "react-vendor", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 30 },
            // Everything else from node_modules is the chart stack (recharts and its deps), which only the
            // lazy CareerChart reaches; lucide-react stays with the app code that uses it at start.
            {
              name: "chart-vendor",
              test: (id) => /[\\/]node_modules[\\/]/.test(id) && !/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id),
              priority: 20,
            },
            // Story text and its helpers; rolldown also pulls their pure dependencies (world, teams, rng)
            // into this chunk, so it has no import back into the app chunk.
            { name: "narrative", test: /src[\\/]lib[\\/]pivot[\\/](story-extra|story-feel|story-late|playoff-doors|summer|feel)\.ts$/, priority: 10 },
          ],
        },
      },
    },
  },
};
});
