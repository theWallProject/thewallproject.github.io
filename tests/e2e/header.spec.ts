import { test, expect } from "@playwright/test";

test.describe("Header", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display header with logo and language switcher", async ({
    page,
  }) => {
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Check for logo image
    const logo = page.locator('img[alt="The Wall Logo"]');
    await expect(logo).toBeVisible();

    // Check for language switcher button
    const languageSwitcher = page.locator('button[aria-haspopup="listbox"]');
    await expect(languageSwitcher).toBeVisible();
  });

  test("should display correct logo image", async ({ page }) => {
    // Check for logo image
    const logo = page.locator('img[alt="The Wall Logo"]');

    await expect(logo).toBeVisible();

    // Check that logo has src attribute
    await expect(logo).toHaveAttribute(
      "src",
      expect.stringContaining("logo-red.svg")
    );
  });

  test("should have responsive header layout", async ({ page }) => {
    const header = page.locator("header");

    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(header).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(header).toBeVisible();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(header).toBeVisible();
  });
});
