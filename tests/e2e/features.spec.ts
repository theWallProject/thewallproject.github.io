import { test, expect } from "@playwright/test";

test.describe("Features Section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display features section with all feature items", async ({
    page,
  }) => {
    // Check for features section (third section in the page)
    const featuresSection = page.locator("section").nth(2);
    await expect(featuresSection).toBeVisible();

    // Check for all feature titles (4 total features)
    const featureTitles = featuresSection.locator("h3");
    await expect(featureTitles).toHaveCount(4);

    // Check that all feature titles are visible
    for (let i = 0; i < 4; i++) {
      await expect(featureTitles.nth(i)).toBeVisible();
    }
  });

  test("should display feature titles and descriptions", async ({ page }) => {
    const featuresSection = page.locator("section").nth(2);

    // Check for feature titles and descriptions within features section
    const featureTitles = featuresSection.locator("h3");
    const featureDescriptions = featuresSection.locator("p");

    // Check that all features have titles and descriptions
    await expect(featureTitles).toHaveCount(4);
    await expect(featureDescriptions).toHaveCount(4);

    // Check that titles and descriptions have content
    for (let i = 0; i < 4; i++) {
      const title = featureTitles.nth(i);
      const description = featureDescriptions.nth(i);

      const titleText = await title.textContent();
      const descriptionText = await description.textContent();

      expect(titleText).toBeTruthy();
      expect(titleText!.trim().length).toBeGreaterThan(0);
      expect(descriptionText).toBeTruthy();
      expect(descriptionText!.trim().length).toBeGreaterThan(0);
    }
  });

  test("should display feature images", async ({ page }) => {
    const featuresSection = page.locator("section").nth(1);

    // Check for feature images within features section
    const featureImages = featuresSection.locator("img");

    // Check that all features have images
    await expect(featureImages).toHaveCount(4);

    // Check that images have src and alt attributes
    for (let i = 0; i < 4; i++) {
      const image = featureImages.nth(i);
      await expect(image).toHaveAttribute("src");
      await expect(image).toHaveAttribute("alt");
    }
  });

  test("should be responsive on different screen sizes", async ({ page }) => {
    const featuresSection = page.locator("section").nth(1);

    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(featuresSection).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(featuresSection).toBeVisible();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(featuresSection).toBeVisible();
  });
});
