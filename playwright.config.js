import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src/components",
  testMatch: "MarkdownMessage.test.jsx",
  use: { baseURL: "http://localhost:5173", browserName: "chromium" },
  webServer: { command: "npm run dev -- --host localhost", port: 5173, reuseExistingServer: true },
});
