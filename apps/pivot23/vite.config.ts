import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

/** Same security headers as production (vercel.json), so `vite preview` and the e2e run catch CSP breaks. */
function productionHeaders(): Record<string, string> {
  const config = JSON.parse(readFileSync(new URL("./vercel.json", import.meta.url), "utf8")) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  const global = config.headers.find((h) => h.source === "/(.*)");
  return Object.fromEntries((global?.headers ?? []).map((h) => [h.key, h.value]));
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
  preview: {
    headers: productionHeaders(),
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
});
