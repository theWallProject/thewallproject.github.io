import { test, expect } from "@playwright/test";

test.describe("Application", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load application successfully", async ({ page }) => {
    // Check that page loads without errors
    await expect(page).toHaveURL("/");

    // Check for console errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Wait for page to load completely
    await page.waitForLoadState("networkidle");

    // Should have no console errors
    expect(consoleErrors.length).toBe(0);
  });

  test("should display all main sections", async ({ page }) => {
    // Check for all main sections based on actual App.tsx structure
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("section").first()).toBeVisible(); // Hero section
    await expect(page.locator("section").nth(1)).toBeVisible(); // Features section
    await expect(page.locator("section").nth(2)).toBeVisible(); // Downloads section
    await expect(page.locator("section").nth(3)).toBeVisible(); // Newsletter section
    await expect(page.locator("footer")).toBeVisible();
  });

  test("should handle navigation between routes", async ({ page }) => {
    // Navigate to privacy page
    await page.goto("/privacy");
    await expect(page).toHaveURL("/privacy");

    // Navigate back to home
    await page.goto("/");
    await expect(page).toHaveURL("/");

    // All sections should still be visible
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("section").first()).toBeVisible(); // Hero section
    await expect(page.locator("section").nth(1)).toBeVisible(); // Features section
    await expect(page.locator("section").nth(2)).toBeVisible(); // Downloads section
    await expect(page.locator("section").nth(3)).toBeVisible(); // Newsletter section
    await expect(page.locator("footer")).toBeVisible();
  });

  test("should be responsive across different viewports", async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("section").first()).toBeVisible(); // Hero section
    await expect(page.locator("section").nth(1)).toBeVisible(); // Features section
    await expect(page.locator("section").nth(2)).toBeVisible(); // Downloads section
    await expect(page.locator("section").nth(3)).toBeVisible(); // Newsletter section

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("section").first()).toBeVisible(); // Hero section
    await expect(page.locator("section").nth(1)).toBeVisible(); // Features section
    await expect(page.locator("section").nth(2)).toBeVisible(); // Downloads section
    await expect(page.locator("section").nth(3)).toBeVisible(); // Newsletter section

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("section").first()).toBeVisible(); // Hero section
    await expect(page.locator("section").nth(1)).toBeVisible(); // Features section
    await expect(page.locator("section").nth(2)).toBeVisible(); // Downloads section
    await expect(page.locator("section").nth(3)).toBeVisible(); // Newsletter section
  });
});
