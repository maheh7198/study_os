import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { preview } from "vite";
import { pool } from "../../backend/src/config/database.js";

const viteBin = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));
const email = `studyos-browser-${randomUUID()}@example.test`;
const password = `StudyOS-${randomUUID().slice(0, 12)}!a9`;
const pages = ["Dashboard", "Subjects", "Tasks", "Notes", "Goals", "Study Plan", "Pomodoro", "Habit Tracker", "Analytics", "Placement Hub", "Leaderboard", "AI Mentor", "Settings", "Help & Feedback"];
const errors = [];
const children = [];

function start(args, label) {
  const child = spawn(process.execPath, [viteBin, ...args], { cwd: process.cwd(), stdio: "ignore", windowsHide: true });
  children.push(child);
  child.on("error", (error) => errors.push(`${label} server failed: ${error.message}`));
  return child;
}

async function waitFor(url, child) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child && child.exitCode !== null) throw new Error(`Server exited before ${url} became ready.`);
    try { const response = await fetch(url); if (response.ok) return; } catch { /* Wait for Vite to start. */ }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Timed out waiting for ${url}.`);
}

let browser;
let previewServer;
try {
  const devServer = start(["--host", "localhost", "--port", "5173", "--strictPort"], "Vite dev");
  await waitFor("http://localhost:5173", devServer);
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  let expectedAuth401 = 0;
  page.on("console", (message) => {
    if (!["error", "warning"].includes(message.type())) return;
    if (message.type() === "error" && message.text().includes("Failed to load resource") && expectedAuth401 > 0) { expectedAuth401 -= 1; return; }
    errors.push(`console.${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => errors.push(`requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText || ""}`));
  page.on("response", (response) => {
    if (response.status() === 401 && response.url().includes("/auth/me")) expectedAuth401 += 1;
    if (response.status() >= 400 && !(response.status() === 401 && response.url().includes("/auth/me"))) {
      let record = "";
      if (response.status() === 409 && response.request().method() === "POST") {
        try { const body = response.request().postDataJSON(); record = ` (${body.section || ""} / ${body.name || body.title || ""} / ${body.id || ""})`; } catch { /* Request body is not JSON. */ }
      }
      errors.push(`HTTP ${response.status()}: ${response.url()}${record}`);
    }
  });

  await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Register" }).click();
  await page.getByLabel("Display name").fill("Browser Check");
  await page.getByLabel("Email address").fill(email);
  await page.locator("#auth-password").fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.locator(".studyos").waitFor({ timeout: 15_000 });

  for (const mode of ["desktop light", "desktop night", "mobile light"]) {
    const mobile = mode.startsWith("mobile");
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
    const isNight = mode.endsWith("night");
    const currentlyNight = await page.locator(".studyos").evaluate((node) => node.classList.contains("night"));
    if (currentlyNight !== isNight) await page.locator(".theme-switch").click();

    for (const name of pages) {
      if (mobile) await page.getByRole("button", { name: "Open menu" }).click();
      const link = page.locator(".side-link").filter({ hasText: name }).first();
      if (await link.count()) await link.click();
      await page.waitForTimeout(100);
      if (name === "AI Mentor" && mode === "desktop light") {
        const mockAnswer = "## Streamed mock answer\n\n- Markdown list\n\n| Item | Value |\n| --- | --- |\n| Code | `Java` |\n\n```java\nclass Main {\n    public static void main(String[] args) {\n        System.out.println(\"StudyOS\");\n    }\n}\n```";
        const mockStream = [
          { type: "token", text: mockAnswer },
          { type: "done", response: { message: mockAnswer, truncated: false } },
        ].map((event) => `data: ${JSON.stringify(event)}\n\n`).join("");
        const routeMock = (route) => route.fulfill({ status: 200, contentType: "text/event-stream", body: mockStream });
        await page.route("**/api/ai/chat/stream", routeMock);
        const composer = page.locator(".ai-composer textarea");
        await composer.fill("Show a Markdown example");
        await page.locator(".ai-send").click();
        await page.locator(".ai-message-bubble .markdown-message h2", { hasText: "Streamed mock answer" }).waitFor();
        await page.locator(".ai-message-bubble .markdown-code-block code").waitFor();
        await page.unroute("**/api/ai/chat/stream", routeMock);
        console.log("AI Mentor mocked stream pass: Markdown heading, list, table, inline code, and Java block.");
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (overflow) errors.push(`horizontal overflow at ${mode}, ${name}`);
    }

    await page.getByRole("button", { name: "Notifications" }).click();
    await page.getByRole("button", { name: "Notifications" }).click();
    await page.getByRole("button", { name: "Open profile" }).click();
    await page.getByRole("button", { name: "Open profile" }).click();
    await page.getByRole("button", { name: /Open StudyOS AI/ }).click();
    const closeAi = page.getByRole("button", { name: "Close AI" });
    await closeAi.waitFor({ state: "visible" });
    await closeAi.click();
    await closeAi.waitFor({ state: "hidden" });
    console.log(`Browser pass: ${mode}, ${pages.length} pages, main controls, overflow check.`);
  }
  await context.close();

  previewServer = await preview({ preview: { host: "localhost", port: 4174, strictPort: true } });
  await waitFor("http://localhost:4174", null);
  const productionPage = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  let expectedPreviewAuth401 = 0;
  productionPage.on("console", (message) => {
    if (!["error", "warning"].includes(message.type())) return;
    if (message.type() === "error" && message.text().includes("Failed to load resource") && expectedPreviewAuth401 > 0) { expectedPreviewAuth401 -= 1; return; }
    errors.push(`production console.${message.type()}: ${message.text()}`);
  });
  productionPage.on("pageerror", (error) => errors.push(`production pageerror: ${error.message}`));
  await productionPage.route("**/api/auth/me", (route) => { expectedPreviewAuth401 += 1; return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ success: false, message: "Please sign in.", code: "AUTH_REQUIRED" }) }); });
  await productionPage.goto("http://localhost:4174", { waitUntil: "networkidle" });
  await productionPage.getByRole("tab", { name: "Login" }).waitFor();
  console.log("Production preview pass: login page loaded without browser console errors.");
  await productionPage.close();

  if (errors.length) {
    console.error(`Browser check found ${errors.length} issue(s):\n${errors.join("\n")}`);
    process.exitCode = 1;
  } else {
    console.log("Browser console check passed: no console errors/warnings, uncaught page errors, failed network requests, unexpected HTTP errors, or horizontal overflow.");
  }
} finally {
  await browser?.close();
  if (previewServer) await new Promise((resolve) => previewServer.httpServer.close(resolve));
  for (const child of children) child.kill();
  try {
    await pool.execute("DELETE FROM users WHERE email = ?", [email]);
  } catch (error) {
    console.error("Could not remove temporary browser-check account:", error.code || error.name);
    process.exitCode = 1;
  }
  await pool.end();
}
