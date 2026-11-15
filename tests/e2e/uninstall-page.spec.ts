import { test, expect } from "@playwright/test";

/**
 * /noooooo is the addon's uninstall landing page. Its single job is to collect
 * the reason someone left, so these tests pin the things that make that
 * possible: the form loads, the human channels exist, and the uninstall is
 * reported exactly once — and never from a local run.
 *
 * No route interception here on purpose. The suite runs on localhost, and the
 * shared `isTrackingEnabled()` gate must be what keeps test traffic out of the
 * production numbers. If these pass only because a route was stubbed, the real
 * gate is unproven — and that gate is the thing protecting the data.
 */
test.describe("Uninstall page", () => {
  test("asks for the reason and offers human channels", async ({ page }) => {
    await page.goto("/noooooo");

    await expect(page.locator("h1")).toContainText("Don't leave without a word");

    // The survey is the existing Tally form, embedded.
    await expect(page.locator('iframe[src*="tally.so"]')).toBeVisible();

    // A person, not just a form: Telegram and a real mailbox. Scoped by the
    // button labels, because the shared footer also links both channels.
    const telegram = page.getByRole("link", { name: "Join the Telegram group" });
    await expect(telegram).toBeVisible();
    await expect(telegram).toHaveAttribute("href", "https://t.me/theWallAddon");

    const email = page.getByRole("link", { name: "Send an email" });
    await expect(email).toBeVisible();
    await expect(email).toHaveAttribute("href", "mailto:the.wall.addon@proton.me");

    // No reinstall pitch: asking for feedback and selling at once reads as a
    // trick, so the page must not push the store.
    await expect(page.locator('a[href*="chromewebstore"]')).toHaveCount(0);
  });

  test("never reports an uninstall from a local run", async ({ page }) => {
    const pixelRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("bg.gif")) {
        pixelRequests.push(request.url());
      }
    });

    await page.goto("/noooooo?u=11111111-2222-3333-4444-555555555555&v=1.16.0");
    await expect(page.locator("h1")).toBeVisible();
    await page.waitForTimeout(600);

    // isTrackingEnabled() is false on localhost, so nothing may reach the pixel.
    expect(pixelRequests).toHaveLength(0);
  });

  test("survives a reload without side effects", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("/noooooo?u=99999999-8888-7777-6666-555555555555&v=1.16.0");
    await expect(page.locator("h1")).toBeVisible();

    await page.reload();
    await expect(page.locator("h1")).toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });
});
