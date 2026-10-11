import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

/**
 * Optional local run of the suite in Playwright's WebKit build (desktop Safari profile).
 * This is the WebKit engine on Linux, not Safari on macOS/iOS: it catches engine differences
 * (layout, CSS, storage) but is not a real-device test.
 *   npx playwright install webkit && sudo npx playwright install-deps webkit
 *   E2E_PORT=4193 pnpm exec playwright test -c playwright.webkit.config.ts e2e/readiness.spec.ts
 * Use the dev server (no E2E_PREVIEW): the preview server sends the production CSP, whose
 * upgrade-insecure-requests makes WebKit fetch http://127.0.0.1 assets over https and fail.
 */
export default defineConfig({
  ...base,
  use: { ...base.use, ...devices["Desktop Safari"] },
});
