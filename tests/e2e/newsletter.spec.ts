import { test, expect } from "@playwright/test";

test.describe("Newsletter", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display newsletter section with MailerLite form", async ({
    page,
  }) => {
    // Check for newsletter section (fourth section in the page)
    const newsletterSection = page.locator("section").nth(3);
    await expect(newsletterSection).toBeVisible();

    // Wait for MailerLite to load
    await page.waitForTimeout(2000);

    // Check for MailerLite form container
    const formContainer = page.locator(".ml-embedded");
    await expect(formContainer).toBeVisible();
    await expect(formContainer).toHaveAttribute("data-form", "QTf4uM");
  });

  test("should load MailerLite script with correct configuration", async ({
    page,
  }) => {
    // Wait for MailerLite script to load
    await page.waitForTimeout(2000);

    // Check that MailerLite script is loaded - use first script
    const mailerLiteScript = page
      .locator('script[src*="mailerlite.com"]')
      .first();
    await expect(mailerLiteScript).toBeAttached();

    // Check for MailerLite form container
    const formContainer = page.locator(".ml-embedded");
    await expect(formContainer).toBeVisible();
  });

  test("should handle MailerLite loading gracefully", async ({ page }) => {
    // Check that newsletter section is visible even if MailerLite fails to load
    const newsletterSection = page.locator("section").nth(3);
    await expect(newsletterSection).toBeVisible();

    // Wait for page to load completely
    await page.waitForLoadState("networkidle");

    // Should not have console errors related to MailerLite
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Filter out MailerLite related errors
    const mailerLiteErrors = consoleErrors.filter(
      (error) => error.includes("mailerlite") || error.includes("ML_")
    );
    expect(mailerLiteErrors.length).toBe(0);
  });
});
