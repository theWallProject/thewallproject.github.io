import { useEffect, useState } from "react";
import Bowser from "bowser";

export interface BrowserInfo {
  name: "chrome" | "firefox" | "safari" | "edge" | "opera" | "unknown";
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  recommendedDownload: "chrome" | "firefox" | "macos" | "ios" | "android" | "telegram";
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
      try {
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
          try {
            const userAgent = window.navigator.userAgent.toLowerCase();

            // Explicit Chromium-family markers. This catches Brave, Edge, Opera,
            // Vivaldi, Yandex, Samsung Internet, etc. even when Bowser reports
            // them under a different name — e.g. Brave on iPadOS presenting a
            // Safari-style WebKit UA (which would otherwise route to the macOS
            // App Store instead of the Chrome extension).
            if (
              /(chrome|crios|chromium|edg\/|opr\/|brave|vivaldi|yabrowser|samsungbrowser|ucbrowser|mxbrowser|googleweblight)/.test(
                userAgent
              )
            ) {
              return true;
            }

            // Bowser-derived name fallback for any other Chromium-compatible engine.
            const browserNameLower = browserData.name?.toLowerCase() || "";
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
            if (chromeCompatibleBrowsers.some((name) => browserNameLower.includes(name))) {
              return true;
            }

            return false;
          } catch (error) {
            console.warn("Error in supportsChromeExtensions:", error);
            return false;
          }
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
          // Android devices - recommend the Android app as primary
          const browserNameLower = browserData.name?.toLowerCase() || "";
          if (browserNameLower === "firefox") {
            browserName = "firefox";
          } else if (supportsChromeExtensions()) {
            browserName = "chrome";
          } else {
            browserName = "unknown";
          }
          // Always recommend the Android app for Android users
          recommendedDownload = "android";
        } else {
          // Desktop browsers - only recommend when we're certain
          const browserNameLower = browserData.name?.toLowerCase() || "";
          if (browserNameLower === "firefox") {
            browserName = "firefox";
            recommendedDownload = "firefox";
          } else if (supportsChromeExtensions()) {
            // Any Chromium-compatible engine (Chrome, Edge, Opera, Brave,
            // Vivaldi, …) is treated as Chrome — checked before Safari so
            // Brave's Safari-style iPadOS UA still resolves to Chrome.
            browserName = "chrome";
            recommendedDownload = "chrome";
          } else if (browserNameLower === "safari") {
            browserName = "safari";
            recommendedDownload = "macos";
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
      } catch (error) {
        console.warn("Error in browser detection:", error);
        return {
          name: "unknown",
          isMobile: false,
          isIOS: false,
          isAndroid: false,
          recommendedDownload: "chrome",
        };
      }
    };

    setBrowserInfo(detectBrowser());
  }, []);

  return browserInfo;
};
