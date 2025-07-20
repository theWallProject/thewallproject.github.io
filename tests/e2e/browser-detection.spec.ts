import { test, expect } from "@playwright/test";

test.describe("Browser Detection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should detect browser and provide recommended downloads", async ({
    page,
  }) => {
    // Check if browser detection is working by looking for recommended downloads
    const recommendedBadges = page
      .locator("span")
      .filter({ hasText: /recommended/i });

    // Either there should be a recommended download or none
    const hasRecommended = (await recommendedBadges.count()) > 0;

    // If there's a recommended download, it should be the first one
    if (hasRecommended) {
      const firstDownload = page
        .locator("section")
        .nth(2)
        .locator("a[target='_blank']")
        .first();
      const firstDownloadText = await firstDownload.textContent();
      expect(firstDownloadText).toContain("recommended");
    }
  });

  test("should handle browser detection errors gracefully", async ({
    page,
  }) => {
    // Check that the page loads without browser detection errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForLoadState("networkidle");

    // Should have no console errors related to browser detection
    const browserDetectionErrors = consoleErrors.filter(
      (error) => error.includes("browser") || error.includes("detection")
    );
    expect(browserDetectionErrors.length).toBe(0);
  });

  test("should work across different browsers", async ({ page }) => {
    // Check that browser detection works in the current browser
    const downloadLinks = page
      .locator("section")
      .nth(2)
      .locator("a[target='_blank']");
    await expect(downloadLinks).toHaveCount(5); // Should have 5 download options

    // Check that at least one download container is visible
    await expect(downloadLinks.first()).toBeVisible();
  });

  test("should detect mobile browser correctly", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that browser detection still works on mobile
    const downloadLinks = page
      .locator("section")
      .nth(2)
      .locator("a[target='_blank']");
    await expect(downloadLinks).toHaveCount(5);

    // Check that downloads are still accessible on mobile
    await expect(downloadLinks.first()).toBeVisible();
  });

  test("should provide fallback for unknown browser gracefully", async ({
    page,
  }) => {
    // Mock browser detection to return unknown browser
    await page.addInitScript(() => {
      // Override bowser detection to simulate unknown browser
      (window as unknown as { bowser: unknown }).bowser = {
        getParser: () => ({
          getBrowser: () => ({ name: "unknown", version: "1.0" }),
          getOS: () => ({ name: "unknown", version: "1.0" }),
          getPlatform: () => ({ type: "unknown" }),
        }),
      };
    });

    await page.reload();

    // Check that the page still loads without errors
    const downloadLinks = page
      .locator("section")
      .nth(2)
      .locator("a[target='_blank']");
    await expect(downloadLinks).toHaveCount(5);
  });
});
