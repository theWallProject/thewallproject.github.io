import { test, expect } from "@playwright/test";

test.describe("Footer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display footer with social links and footer links", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Check for social links (Telegram, YouTube, Twitter/X, GitHub, Email) plus
    // the designer-credit link, all of which open in a new tab
    const socialLinks = footer.locator("a[target='_blank']");
    await expect(socialLinks).toHaveCount(6);

    // Check for footer links (Privacy) - only in footer
    const footerLinks = footer.locator("a[href='/privacy']");
    await expect(footerLinks).toHaveCount(1);

    // Check that all links are visible
    for (let i = 0; i < 2; i++) {
      await expect(socialLinks.nth(i)).toBeVisible();
    }
    await expect(footerLinks.first()).toBeVisible();
  });

  test("should have correct social link URLs", async ({ page }) => {
    const footer = page.locator("footer");

    // Social icons contain only an <img> (no text), so select by href.
    const githubLink = footer.locator('a[href="https://github.com/theWallProject/mono"]');
    await expect(githubLink).toHaveAttribute("href", "https://github.com/theWallProject/mono");

    const emailLink = footer.locator('a[href="mailto:the.wall.addon@proton.me"]');
    await expect(emailLink).toHaveAttribute("href", "mailto:the.wall.addon@proton.me");
  });

  test("should have correct footer link navigation", async ({ page }) => {
    const footer = page.locator("footer");
    const footerLink = footer.locator("a[href='/privacy']");

    // Check Privacy link
    await expect(footerLink).toHaveAttribute("href", "/privacy");

    // Click on privacy link and verify navigation
    await footerLink.click();
    await expect(page).toHaveURL("/privacy");
  });
});
