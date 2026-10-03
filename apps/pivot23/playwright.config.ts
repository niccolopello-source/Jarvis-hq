import { defineConfig, devices } from "@playwright/test";

/**
 * Default: Vite dev server on :8080 (fast local loop).
 * E2E_PREVIEW=1: production build served by `vite preview` on :4173 with the same security
 * headers as vercel.json (see vite.config.ts), which is what CI runs.
 */
const preview = Boolean(process.env.E2E_PREVIEW);
const port = preview ? 4173 : 8080;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    ...devices["Desktop Chrome"],
    trace: process.env.CI ? "retain-on-failure" : "off",
  },
  webServer: {
    command: preview ? `pnpm build && pnpm exec vite preview --host 127.0.0.1 --port ${port} --strictPort` : "pnpm dev",
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: preview ? 180_000 : 30_000,
  },
});
