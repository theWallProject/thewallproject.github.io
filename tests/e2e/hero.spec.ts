import { test, expect } from "@playwright/test";

test.describe("Hero Section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display hero section with intro text and video", async ({
    page,
  }) => {
    // Check for hero section (first section in the page)
    const heroSection = page.locator("section").first();
    await expect(heroSection).toBeVisible();

    // Check for intro text within hero section
    const introText = heroSection.locator("p");
    await expect(introText).toBeVisible();

    // Check that intro text has content
    const textContent = await introText.textContent();
    expect(textContent).toBeTruthy();
    expect(textContent!.trim().length).toBeGreaterThan(0);

    // Check for video iframe within hero section
    const video = heroSection.locator("iframe");
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute(
      "src",
      expect.stringContaining("youtube")
    );
  });

  test("should be responsive on different screen sizes", async ({ page }) => {
    const heroSection = page.locator("section").first();

    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(heroSection).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(heroSection).toBeVisible();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(heroSection).toBeVisible();
  });
});
