import { chromium } from "@playwright/test";

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set up any global test environment
  await page.goto("http://localhost:4173");

  // Wait for the application to load
  await page.waitForLoadState("networkidle");

  // Verify the application is running
  await page.waitForSelector("header", { timeout: 10000 });

  await browser.close();
}

export default globalSetup;
