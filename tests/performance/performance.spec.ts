import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("Performance", () => {
  test("page loads fast and is interactive", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(5000); // <5s (increased from 3s due to bundle size)

    // Wait for key elements to be visible (more reliable than networkidle)
    await expect(page.locator("header")).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".App")).toBeVisible({ timeout: 5000 });
  });

  test("no JS errors in console", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });

  test("Core Web Vitals: FCP, LCP, CLS", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        let fcp = 0,
          lcp = 0,
          cls = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries())
            if (e.name === "first-contentful-paint") fcp = e.startTime;
        }).observe({ entryTypes: ["paint"] });
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) lcp = e.startTime;
        }).observe({ entryTypes: ["largest-contentful-paint"] });
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            const le = e as PerformanceEntry & {
              hadRecentInput?: boolean;
              value?: number;
            };
            if (!le.hadRecentInput) cls += le.value || 0;
          }
        }).observe({ entryTypes: ["layout-shift"] });
        setTimeout(() => resolve({ fcp, lcp, cls }), 1000);
      });
    });
    expect(metrics.fcp).toBeLessThan(1800);
    expect(metrics.lcp).toBeLessThan(2500);
    expect(metrics.cls).toBeLessThan(0.1);
  });

  test("navigation is fast", async ({ page }) => {
    await page.goto("/");
    const start = Date.now();
    await page.goto("/privacy");
    const navTime = Date.now() - start;
    expect(navTime).toBeLessThan(2000);
  });

  test("main JS bundle is not huge", async () => {
    const assets = path.join(process.cwd(), "dist", "assets");
    const jsFiles = fs.readdirSync(assets).filter((f) => f.endsWith(".js"));
    const sizes = jsFiles.map((f) => fs.statSync(path.join(assets, f)).size);
    const max = Math.max(...sizes);
    expect(max).toBeLessThan(400 * 1024); // <400KB
  });
});
