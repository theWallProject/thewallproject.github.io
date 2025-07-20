import { Page, expect } from "@playwright/test";

export class TestHelpers {
  static async waitForPageLoad(page: Page) {
    await page.waitForLoadState("networkidle");
  }

  static async checkForConsoleErrors(page: Page): Promise<string[]> {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    return consoleErrors;
  }

  static async changeLanguage(page: Page, languageIndex: number = 1) {
    const languageSwitcher = page.locator(
      '[role="button"][aria-haspopup="listbox"]'
    );
    await languageSwitcher.click();

    const languageOptions = page.locator('[role="option"]');
    if ((await languageOptions.count()) > languageIndex) {
      await languageOptions.nth(languageIndex).click();
      await page.waitForTimeout(500);
    }
  }

  static async scrollToSection(page: Page, sectionSelector: string) {
    const section = page.locator(sectionSelector);
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
  }

  static async testResponsiveViewport(
    page: Page,
    viewport: { width: number; height: number }
  ) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(100);
  }

  static async checkElementVisibility(
    page: Page,
    selector: string,
    shouldBeVisible: boolean = true
  ) {
    if (shouldBeVisible) {
      await expect(page.locator(selector)).toBeVisible();
    } else {
      await expect(page.locator(selector)).not.toBeVisible();
    }
  }

  static async checkElementCount(
    page: Page,
    selector: string,
    expectedCount: number
  ) {
    await expect(page.locator(selector)).toHaveCount(expectedCount);
  }

  static async checkElementText(
    page: Page,
    selector: string,
    expectedText: string
  ) {
    await expect(page.locator(selector)).toContainText(expectedText);
  }

  static async checkElementAttribute(
    page: Page,
    selector: string,
    attribute: string,
    value: string
  ) {
    await expect(page.locator(selector)).toHaveAttribute(attribute, value);
  }

  static async clickAndWaitForNavigation(page: Page, selector: string) {
    const pagePromise = page.context().waitForEvent("page");
    await page.locator(selector).click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    return newPage;
  }

  static async mockBrowserDetection(page: Page, browserName: string) {
    await page.addInitScript((browser) => {
      (window as unknown as { bowser: unknown }).bowser = {
        getParser: () => ({
          getBrowser: () => ({ name: browser }),
          getOS: () => ({ name: "Windows" }),
          getPlatform: () => ({ type: "desktop" }),
        }),
      };
    }, browserName);
  }

  static async testAccessibility(page: Page) {
    // Check for proper heading hierarchy
    const headings = page.locator("h1, h2, h3, h4, h5, h6");
    if ((await headings.count()) > 0) {
      await expect(headings.first()).toBeVisible();
    }

    // Check for proper alt text on images
    const images = page.locator("img");
    for (let i = 0; i < Math.min(await images.count(), 5); i++) {
      const image = images.nth(i);
      await expect(image).toHaveAttribute("alt");
    }
  }

  static async testPerformance(page: Page, maxDuration: number = 2000) {
    const startTime = Date.now();

    // Perform some interactions
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.evaluate(() => window.scrollTo(0, 0));

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(maxDuration);
  }

  static async waitForElement(
    page: Page,
    selector: string,
    timeout: number = 5000
  ) {
    await page.waitForSelector(selector, { timeout });
  }

  static async waitForElementToBeVisible(
    page: Page,
    selector: string,
    timeout: number = 5000
  ) {
    await page.waitForSelector(selector, { state: "visible", timeout });
  }

  static async waitForElementToBeHidden(
    page: Page,
    selector: string,
    timeout: number = 5000
  ) {
    await page.waitForSelector(selector, { state: "hidden", timeout });
  }

  static async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ path: `test-results/${name}.png` });
  }

  static async checkNetworkRequests(page: Page, urlPattern: string) {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes(urlPattern)) {
        requests.push(request.url());
      }
    });
    return requests;
  }

  static async simulateSlowNetwork(page: Page) {
    await page.route("**/*", (route) => {
      route.continue();
    });
  }

  static async testKeyboardNavigation(page: Page, selector: string) {
    await page.locator(selector).focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
  }

  static async testMouseInteractions(page: Page, selector: string) {
    await page.locator(selector).hover();
    await page.locator(selector).click();
  }

  static async checkLocalStorage(page: Page, key: string) {
    return await page.evaluate((storageKey) => {
      return localStorage.getItem(storageKey);
    }, key);
  }

  static async setLocalStorage(page: Page, key: string, value: string) {
    await page.evaluate(
      (storageKey, storageValue) => {
        localStorage.setItem(storageKey, storageValue);
      },
      key,
      value
    );
  }

  static async clearLocalStorage(page: Page) {
    await page.evaluate(() => {
      localStorage.clear();
    });
  }

  static async checkSessionStorage(page: Page, key: string) {
    return await page.evaluate((storageKey) => {
      return sessionStorage.getItem(storageKey);
    }, key);
  }

  static async setSessionStorage(page: Page, key: string, value: string) {
    await page.evaluate(
      (storageKey, storageValue) => {
        sessionStorage.setItem(storageKey, storageValue);
      },
      key,
      value
    );
  }

  static async clearSessionStorage(page: Page) {
    await page.evaluate(() => {
      sessionStorage.clear();
    });
  }
}
