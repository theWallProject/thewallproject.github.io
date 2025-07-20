import { useEffect, useState } from "react";
import Bowser from "bowser";

export interface BrowserInfo {
  name: "chrome" | "firefox" | "safari" | "edge" | "opera" | "unknown";
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  recommendedDownload: "chrome" | "firefox" | "safari" | "ios" | "telegram";
}

export const useBrowserDetection = (): BrowserInfo => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo>({
    name: "unknown",
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    recommendedDownload: "chrome",
  });

  useEffect(() => {
    const detectBrowser = (): BrowserInfo => {
      const browser = Bowser.getParser(window.navigator.userAgent);
      const browserData = browser.getBrowser();
      const platformData = browser.getPlatform();
      const osData = browser.getOS();

      const isMobile = platformData.type === "mobile";
      const isIOS = osData.name === "iOS";
      const isAndroid = osData.name === "Android";

      let browserName: BrowserInfo["name"] = "unknown";
      let recommendedDownload: BrowserInfo["recommendedDownload"] = "chrome";

      // Check if browser supports Chrome extensions/addons
      const supportsChromeExtensions = (): boolean => {
        const userAgent = window.navigator.userAgent.toLowerCase();

        // Browsers that support Chrome Web Store extensions
        const chromeCompatibleBrowsers = [
          "chrome",
          "chromium",
          "edge",
          "opera",
          "brave",
          "vivaldi",
          "kiwi",
          "samsung internet",
          "yandex",
          "maxthon",
          "360 browser",
          "qq browser",
          "uc browser",
        ];

        // Check if browser name matches any Chrome-compatible browser
        const browserNameLower = browserData.name?.toLowerCase() || "";
        if (
          chromeCompatibleBrowsers.some((name) =>
            browserNameLower.includes(name)
          )
        ) {
          return true;
        }

        // Additional checks for specific user agent patterns
        if (
          userAgent.includes("chrome") &&
          !userAgent.includes("firefox") &&
          !userAgent.includes("safari")
        ) {
          return true;
        }

        // Check for Chromium-based browsers
        if (userAgent.includes("chromium")) {
          return true;
        }

        return false;
      };

      // Determine browser and recommendation - only when we're certain
      if (isIOS) {
        // All iOS browsers should recommend the iOS app
        const browserNameLower = browserData.name?.toLowerCase() || "";
        if (browserNameLower === "firefox") {
          browserName = "firefox";
        } else if (browserNameLower === "chrome") {
          browserName = "chrome";
        } else if (browserNameLower === "safari") {
          browserName = "safari";
        } else {
          browserName = "unknown";
        }
        recommendedDownload = "ios";
      } else if (isAndroid) {
        // Android browsers - only recommend when we're certain
        const browserNameLower = browserData.name?.toLowerCase() || "";
        if (browserNameLower === "firefox") {
          browserName = "firefox";
          recommendedDownload = "firefox";
        } else if (supportsChromeExtensions()) {
          // Any browser that supports Chrome extensions is treated as Chrome
          browserName = "chrome";
          recommendedDownload = "chrome";
        } else {
          // If we can't determine with certainty, don't recommend anything
          browserName = "unknown";
          recommendedDownload = "chrome"; // Default fallback, but won't be highlighted
        }
      } else {
        // Desktop browsers - only recommend when we're certain
        const browserNameLower = browserData.name?.toLowerCase() || "";
        if (browserNameLower === "firefox") {
          browserName = "firefox";
          recommendedDownload = "firefox";
        } else if (browserNameLower === "safari") {
          browserName = "safari";
          recommendedDownload = "safari";
        } else if (supportsChromeExtensions()) {
          // Any browser that supports Chrome extensions is treated as Chrome
          browserName = "chrome";
          recommendedDownload = "chrome";
        } else {
          // If we can't determine with certainty, don't recommend anything
          browserName = "unknown";
          recommendedDownload = "chrome"; // Default fallback, but won't be highlighted
        }
      }

      return {
        name: browserName,
        isMobile,
        isIOS,
        isAndroid,
        recommendedDownload,
      };
    };

    setBrowserInfo(detectBrowser());
  }, []);

  return browserInfo;
};
