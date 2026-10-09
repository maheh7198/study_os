import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "@playwright/test";

const port = 4178;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { stdio: "ignore", windowsHide: true });
const sizes = [[1920, 1080, "1920x1080"], [1366, 768, "1366x768"], [1024, 768, "1024x768"], [768, 1024, "768x1024"], [390, 844, "390x844"], [320, 640, "320x640"]];
const failures = [];
let browser;

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { const response = await fetch(baseUrl); if (response.ok) return; } catch { /* Vite is still starting. */ }
    await delay(200);
  }
  throw new Error("Vite did not start on port " + port);
}

try {
  await mkdir("screenshots", { recursive: true });
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  for (const [width, height, label] of sizes) {
    for (const theme of ["light", "night"]) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      const browserMessages = [];
      page.on("console", (message) => { if (["error", "warning"].includes(message.type())) browserMessages.push(`${message.type()}: ${message.text()}`); });
      page.on("pageerror", (error) => browserMessages.push(`pageerror: ${error.message}`));
      await page.addInitScript((selectedTheme) => {
        localStorage.setItem("studyos-theme", selectedTheme === "night" ? "night" : "light");
        localStorage.setItem("studyos-settings", JSON.stringify({ theme: selectedTheme === "night" ? "dark" : "light" }));
        const originalFetch = window.fetch.bind(window);
        window.fetch = (input, init) => {
          const url = typeof input === "string" ? input : input.url;
          if (url.endsWith("/api/auth/me")) return Promise.resolve(new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: "Please sign in." }), { status: 401, headers: { "Content-Type": "application/json" } }));
          return originalFetch(input, init);
        };
      }, theme);
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.getByRole("heading", { name: "Welcome back" }).waitFor();
      await page.screenshot({ path: `screenshots/login-${label}-${theme}.png`, fullPage: true });
      const layout = await page.evaluate(() => {
        const textNodes = [...document.querySelectorAll("h1,h2,h3,p,label,small,button,li,[role='tab']")]
          .filter((element) => element.getClientRects().length && (element.innerText || "").trim())
          .filter((element) => ![...element.children].some((child) => (child.innerText || "").trim()));
        const boxes = textNodes.map((element) => {
          const rect = element.getBoundingClientRect();
          return { text: element.innerText.trim().replace(/\s+/g, " "), x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom };
        });
        const overlaps = [];
        for (let i = 0; i < boxes.length; i += 1) for (let j = i + 1; j < boxes.length; j += 1) {
          const a = boxes[i]; const b = boxes[j];
          if (Math.min(a.right, b.right) - Math.max(a.x, b.x) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) > 1) overlaps.push(`${a.text} / ${b.text}`);
        }
        return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, height: innerHeight, scrollHeight: document.documentElement.scrollHeight, overlaps, night: Boolean(document.querySelector(".studyos.night")) };
      });
      if (layout.scrollWidth > layout.width) failures.push(`${label} ${theme}: horizontal overflow (${layout.scrollWidth} > ${layout.width})`);
      if (width >= 1024 && layout.scrollHeight > layout.height) failures.push(`${label} ${theme}: desktop vertical scroll (${layout.scrollHeight} > ${layout.height})`);
      if (layout.overlaps.length) failures.push(`${label} ${theme}: text overlaps: ${layout.overlaps.join("; ")}`);
      if (layout.night !== (theme === "night")) failures.push(`${label} ${theme}: expected theme was not applied`);
      const quoteDots = await page.locator(".auth-quote-dots button").count();
      const quoteVisible = await page.locator(".auth-quote").isVisible();
      if (quoteDots !== 5 || quoteVisible !== (width >= 1024)) failures.push(`${label} ${theme}: quote panel visibility or quote controls are incorrect`);
      if (width >= 1024) {
        await page.getByRole("button", { name: "Show quote 2" }).click();
        if (!(await page.getByText("Focus on the next useful thing.", { exact: true }).count())) failures.push(`${label} ${theme}: quote control did not change the quote`);
      }
      await page.locator(".auth-theme-toggle").click();
      const toggledTheme = await page.evaluate(() => ({ night: Boolean(document.querySelector(".studyos.night")), stored: localStorage.getItem("studyos-theme") }));
      if (toggledTheme.night !== (theme !== "night") || toggledTheme.stored !== (theme === "night" ? "light" : "night")) failures.push(`${label} ${theme}: theme toggle did not persist the selected theme`);
      await page.locator(".auth-theme-toggle").click();
      await page.getByRole("tab", { name: "Register" }).click();
      await page.getByRole("heading", { name: "Create your account" }).waitFor();
      const registerLayout = await page.evaluate(() => {
        const textNodes = [...document.querySelectorAll("h1,h2,h3,p,label,small,button,li,[role='tab']")]
          .filter((element) => element.getClientRects().length && (element.innerText || "").trim())
          .filter((element) => ![...element.children].some((child) => (child.innerText || "").trim()));
        const boxes = textNodes.map((element) => { const rect = element.getBoundingClientRect(); return { text: element.innerText.trim().replace(/\s+/g, " "), x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom }; });
        const overlaps = [];
        for (let i = 0; i < boxes.length; i += 1) for (let j = i + 1; j < boxes.length; j += 1) {
          const a = boxes[i]; const b = boxes[j];
          if (Math.min(a.right, b.right) - Math.max(a.x, b.x) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) > 1) overlaps.push(`${a.text} / ${b.text}`);
        }
        return { height: innerHeight, scrollHeight: document.documentElement.scrollHeight, width: innerWidth, scrollWidth: document.documentElement.scrollWidth, overlaps };
      });
      if (width >= 1024 && registerLayout.scrollHeight > registerLayout.height) failures.push(`${label} ${theme} register: desktop vertical scroll (${registerLayout.scrollHeight} > ${registerLayout.height})`);
      if (registerLayout.scrollWidth > registerLayout.width) failures.push(`${label} ${theme} register: horizontal overflow (${registerLayout.scrollWidth} > ${registerLayout.width})`);
      if (registerLayout.overlaps.length) failures.push(`${label} ${theme} register: text overlaps: ${registerLayout.overlaps.join("; ")}`);
      if (label === "1920x1080" && theme === "light") {
        await page.getByRole("button", { name: "Create account" }).click();
        for (const message of ["Enter your name.", "Enter a valid email address.", "Use at least 12 characters."]) {
          if (!(await page.getByText(message, { exact: true }).count())) failures.push(`register validation did not show: ${message}`);
        }
        await page.locator("#auth-password").fill("Abcdefgh1234!");
        await page.locator("#auth-confirm-password").fill("Different1234!");
        await page.getByRole("button", { name: "Create account" }).click();
        if (!(await page.getByText("Passwords do not match.", { exact: true }).count())) failures.push("register validation did not show: Passwords do not match.");
      }
      if (browserMessages.length) failures.push(`${label} ${theme}: ${browserMessages.join(" | ")}`);
      await page.getByRole("tab", { name: "Login" }).click();
      await page.close();
      console.log(`PASS ${label} ${theme}`);
    }
  }
} catch (error) {
  failures.push(error.stack || error.message);
} finally {
  await browser?.close();
  vite.kill();
}

if (failures.length) {
  console.error("LOGIN CHECK FAILED\n" + failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`All ${sizes.length * 2} viewport and theme checks passed. Screenshots: ./screenshots/login-<size>-<theme>.png`);
}
