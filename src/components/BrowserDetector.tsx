import { useEffect, useState } from "react";

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
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
      const isIOS = /iphone|ipad|ipod/i.test(userAgent);
      const isAndroid = /android/i.test(userAgent);

      let browserName: BrowserInfo["name"] = "unknown";
      let recommendedDownload: BrowserInfo["recommendedDownload"] = "chrome";

      // Detect browser
      if (userAgent.includes("chrome") && !userAgent.includes("edg")) {
        browserName = "chrome";
        recommendedDownload = "chrome";
      } else if (userAgent.includes("firefox")) {
        browserName = "firefox";
        recommendedDownload = "firefox";
      } else if (
        userAgent.includes("safari") &&
        !userAgent.includes("chrome")
      ) {
        browserName = "safari";
        if (isIOS) {
          recommendedDownload = "ios";
        } else {
          recommendedDownload = "safari";
        }
      } else if (userAgent.includes("edg")) {
        browserName = "edge";
        recommendedDownload = "chrome"; // Edge users can use Chrome extension
      } else if (userAgent.includes("opera")) {
        browserName = "opera";
        recommendedDownload = "chrome"; // Opera users can use Chrome extension
      }

      // Override recommendations for mobile
      if (isMobile) {
        if (isIOS) {
          recommendedDownload = "ios";
        } else if (isAndroid) {
          recommendedDownload = "firefox"; // Firefox mobile is often preferred on Android
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
