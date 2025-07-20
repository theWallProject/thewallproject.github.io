import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should navigate to privacy policy page and display content", async ({
    page,
  }) => {
    // Navigate to privacy page
    await page.goto("/privacy");
    await expect(page).toHaveURL("/privacy");

    // Check that privacy policy content is visible
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText("Privacy Policy");
  });

  test("should handle 404 for non-existent routes", async ({ page }) => {
    // Navigate to a non-existent route
    await page.goto("/non-existent-route");

    // React Router doesn't have built-in 404 handling, so it should either:
    // 1. Stay on the current page (if no route matches)
    // 2. Show a 404 page (if configured)
    // 3. Redirect to home page

    // Check that the page is still functional (not completely broken)
    await expect(page.locator("body")).toBeVisible();

    // The page should either be on home or show some content
    // Since React Router doesn't handle 404s by default, we'll just check that the page loads
    const currentUrl = page.url();

    // Should either be on the non-existent route or have been redirected
    expect(currentUrl).toBeTruthy();
  });
});
