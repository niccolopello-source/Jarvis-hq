import { defineConfig, devices } from "@playwright/test";
export default defineConfig({ testDir: "./e2e", reporter: "list", retries: 0, use: { baseURL: process.env.G1X_BASE || "https://www.pivot23.com", ...devices["Desktop Chrome"] } });
