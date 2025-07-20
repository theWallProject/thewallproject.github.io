import { test, expect } from "@playwright/test";

test.describe("Privacy Policy Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/privacy");
  });

  test("should display privacy policy page with content", async ({ page }) => {
    await expect(page).toHaveURL("/privacy");

    // Check for title
    const title = page.locator("h1");
    await expect(title).toBeVisible();
    await expect(title).toContainText("Privacy Policy");

    // Check for content paragraphs
    const paragraphs = page.locator("p");
    await expect(paragraphs).toHaveCount(3);

    // Check that paragraphs have content
    for (let i = 0; i < 3; i++) {
      const paragraph = paragraphs.nth(i);
      const textContent = await paragraph.textContent();
      expect(textContent).toBeTruthy();
      expect(textContent!.trim().length).toBeGreaterThan(0);
    }
  });

  test("should display privacy policy list items", async ({ page }) => {
    // Check for ordered list
    const orderedList = page.locator("ol");
    await expect(orderedList).toBeVisible();

    // Check for list items
    const listItems = page.locator("li");
    await expect(listItems).toHaveCount(2);

    // Check that list items have content
    for (let i = 0; i < 2; i++) {
      const listItem = listItems.nth(i);
      const textContent = await listItem.textContent();
      expect(textContent).toBeTruthy();
      expect(textContent!.trim().length).toBeGreaterThan(0);
    }
  });

  test("should be responsive on different screen sizes", async ({ page }) => {
    const title = page.locator("h1");

    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(title).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(title).toBeVisible();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(title).toBeVisible();
  });
});
