import base from "/workspace/pivot23-future-guard/apps/pivot23/playwright.config";
export default { ...base, testDir: "/workspace/review155-bfcache-tests", outputDir: "/workspace/review155-bfcache-commit-results", use: { ...base.use, channel: "chromium" }, webServer: { ...base.webServer, cwd: "/workspace/pivot23-future-guard/apps/pivot23" } };
