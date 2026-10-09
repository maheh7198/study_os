import { test, expect } from "@playwright/test";
import { createServer } from "vite";

let server;
test.beforeAll(async () => {
  server = await createServer({ configFile: "vite.config.js", server: { host: "localhost", port: 5175, strictPort: true } });
  await server.listen();
});
test.afterAll(async () => { await server?.close(); });

test("MarkdownMessage renders rich Markdown and preserves code formatting", async ({ page }) => {
  await page.goto("http://localhost:5175/markdown-check.html");
  await expect(page.getByRole("heading", { name: "Example" })).toBeVisible();
  await expect(page.locator(".markdown-message")).not.toContainText("###");
  await expect(page.locator(".markdown-code-header")).toContainText("java");
  await expect(page.locator(".markdown-code-header").getByRole("button", { name: "Copy" })).toBeVisible();
  await expect(page.locator(".markdown-code-block code")).toContainText("    System.out.println");
  await expect(page.locator(".markdown-table-scroll table")).toBeVisible();
  await expect(page.locator(".ai-message-avatar span")).toHaveCount(0);
  await expect(page.locator(".ai-message.user .ai-message-avatar")).toHaveCount(0);
});
