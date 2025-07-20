import { test, expect } from "@playwright/test";

test.describe("Internationalization", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display language switcher with available languages", async ({
    page,
  }) => {
    const languageSwitcher = page.locator('button[aria-haspopup="listbox"]');
    await expect(languageSwitcher).toBeVisible();

    // Open dropdown
    await languageSwitcher.click();

    // Check for language options - use more specific selector
    const languageOptions = page
      .locator('button[role="option"]')
      .filter({ hasText: /English|العربية/ });
    await expect(languageOptions).toHaveCount(2); // English and Arabic

    // Check that current language is selected
    const selectedOption = page.locator(
      'button[role="option"][aria-selected="true"]'
    );
    await expect(selectedOption).toBeVisible();
  });

  test("should switch language and update content", async ({ page }) => {
    const languageSwitcher = page.locator('button[aria-haspopup="listbox"]');

    // Open dropdown
    await languageSwitcher.click();

    // Click on the second language option (Arabic)
    const languageOptions = page
      .locator('button[role="option"]')
      .filter({ hasText: /English|العربية/ });
    await languageOptions.nth(1).click();

    // Wait for language change
    await page.waitForTimeout(500);

    // Check that the language switcher shows the new language
    const switcherText = await languageSwitcher.textContent();
    expect(switcherText).toContain("العربية");
  });

  test("should persist language selection", async ({ page }) => {
    const languageSwitcher = page.locator('button[aria-haspopup="listbox"]');

    // Open dropdown and switch to Arabic
    await languageSwitcher.click();
    const languageOptions = page
      .locator('button[role="option"]')
      .filter({ hasText: /English|العربية/ });
    await languageOptions.nth(1).click();
    await page.waitForTimeout(500);

    // Reload the page
    await page.reload();

    // Check that the language selection is persisted
    const switcherText = await languageSwitcher.textContent();
    expect(switcherText).toContain("العربية");
  });

  test("should support RTL language layout", async ({ page }) => {
    const languageSwitcher = page.locator('button[aria-haspopup="listbox"]');

    // Switch to Arabic (RTL language)
    await languageSwitcher.click();
    const languageOptions = page
      .locator('button[role="option"]')
      .filter({ hasText: /English|العربية/ });
    await languageOptions.nth(1).click();
    await page.waitForTimeout(500);

    // Check that the page has RTL direction
    const htmlElement = page.locator("html");
    await expect(htmlElement).toHaveAttribute("dir", "rtl");
  });
});
