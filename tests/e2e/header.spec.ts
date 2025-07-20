import { test, expect } from "@playwright/test";

test.describe("Header", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display header with logos, title and language switcher", async ({
    page,
  }) => {
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Check for logo images
    const logos = page.locator('img[alt="The Wall Logo"], img[alt="The Wall"]');
    await expect(logos).toHaveCount(2);

    // Check for title
    const title = page.locator("h1");
    await expect(title).toBeVisible();

    // Check for language switcher button
    const languageSwitcher = page.locator('button[aria-haspopup="listbox"]');
    await expect(languageSwitcher).toBeVisible();
  });

  test("should display correct logo images", async ({ page }) => {
    // Check for both logo images
    const logoRed = page.locator('img[alt="The Wall Logo"]');
    const logoBlack = page.locator('img[alt="The Wall"]');

    await expect(logoRed).toBeVisible();
    await expect(logoBlack).toBeVisible();

    // Check that logos have src attributes
    await expect(logoRed).toHaveAttribute(
      "src",
      expect.stringContaining("logo-red.svg")
    );
    await expect(logoBlack).toHaveAttribute(
      "src",
      expect.stringContaining("the-wall-black.png")
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
