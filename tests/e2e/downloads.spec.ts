import { test, expect } from "@playwright/test";

test.describe("Downloads", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display downloads section with all download options", async ({
    page,
  }) => {
    // Check for downloads section (third section in the page)
    const downloadsSection = page.locator("section").nth(2);
    await expect(downloadsSection).toBeVisible();

    // Check for all download containers (5 total: Chrome, Firefox, Safari, iOS, Telegram)
    // Use more specific selector to target only download links, not social links
    const downloadContainers = page
      .locator("section")
      .nth(2)
      .locator("a[target='_blank']");
    await expect(downloadContainers).toHaveCount(5);

    // Check for specific download options by their href attributes
    const chromeDownload = page.locator('a[href*="chromewebstore.google.com"]');
    const firefoxDownload = page.locator('a[href*="addons.mozilla.org"]');
    const safariDownload = page.locator('a[href*="apps.apple.com"]').first();
    const iosDownload = page.locator('a[href*="apps.apple.com"]').nth(1);
    const telegramDownload = page.locator('a[href*="t.me"]');

    await expect(chromeDownload).toBeVisible();
    await expect(firefoxDownload).toBeVisible();
    await expect(safariDownload).toBeVisible();
    await expect(iosDownload).toBeVisible();
    await expect(telegramDownload).toBeVisible();
  });

  test("should display download icons and titles", async ({ page }) => {
    // Check for download icons and descriptions within the downloads section
    const downloadIcons = page
      .locator("section")
      .nth(2)
      .locator("img[alt*='icon']");
    const downloadLinks = page
      .locator("section")
      .nth(2)
      .locator("a[target='_blank']");

    await expect(downloadIcons).toHaveCount(5);
    await expect(downloadLinks).toHaveCount(5);

    // Check that icons have src attributes
    for (let i = 0; i < 5; i++) {
      const icon = downloadIcons.nth(i);
      await expect(icon).toHaveAttribute("src");
      await expect(icon).toHaveAttribute("alt");
    }

    // Check that download links have text content
    for (let i = 0; i < 5; i++) {
      const link = downloadLinks.nth(i);
      const textContent = await link.textContent();
      expect(textContent).toBeTruthy();
      expect(textContent!.trim().length).toBeGreaterThan(0);
    }
  });

  test("should highlight recommended download when browser is detected", async ({
    page,
  }) => {
    // Check for recommended badge (may or may not be present depending on browser)
    const recommendedBadges = page
      .locator("span")
      .filter({ hasText: /recommended/i });

    // Either there should be a recommended download or none
    const hasRecommended = (await recommendedBadges.count()) > 0;

    if (hasRecommended) {
      // If there's a recommended download, it should be the first one
      const firstDownload = page
        .locator("section")
        .nth(2)
        .locator("a[target='_blank']")
        .first();
      const firstDownloadText = await firstDownload.textContent();
      expect(firstDownloadText).toContain("recommended");
    }
  });

  test("should have correct download URLs", async ({ page }) => {
    const downloadLinks = page
      .locator("section")
      .nth(2)
      .locator("a[target='_blank']");

    // Check that all download links have valid URLs
    for (let i = 0; i < 5; i++) {
      const link = downloadLinks.nth(i);
      const href = await link.getAttribute("href");
      expect(href).toBeTruthy();
      expect(href!.length).toBeGreaterThan(0);
    }

    // Check specific URLs
    const chromeDownload = page.locator('a[href*="chromewebstore.google.com"]');
    const firefoxDownload = page.locator('a[href*="addons.mozilla.org"]');
    const telegramDownload = page.locator('a[href*="t.me"]');

    await expect(chromeDownload).toHaveAttribute(
      "href",
      expect.stringContaining("chromewebstore.google.com")
    );
    await expect(firefoxDownload).toHaveAttribute(
      "href",
      expect.stringContaining("addons.mozilla.org")
    );
    await expect(telegramDownload).toHaveAttribute(
      "href",
      expect.stringContaining("t.me")
    );
  });

  test("should open download links in new tab", async ({ page }) => {
    const downloadLinks = page
      .locator("section")
      .nth(2)
      .locator("a[target='_blank']");

    // Check that all download links open in new tab
    for (let i = 0; i < 5; i++) {
      const link = downloadLinks.nth(i);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  test("should be responsive on different screen sizes", async ({ page }) => {
    const downloadsSection = page.locator("section").nth(2);

    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(downloadsSection).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(downloadsSection).toBeVisible();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(downloadsSection).toBeVisible();
  });
});
