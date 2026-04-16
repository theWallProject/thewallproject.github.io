import { useBrowserDetection } from "./BrowserDetector";

export interface DownloadLink {
  id: "chrome" | "firefox" | "macos" | "ios" | "android";
  href: string;
  icon: string;
  badgeIcon?: string;
  displayName: string;
}

export interface DownloadLinksData {
  downloadLinks: {
    chrome: DownloadLink;
    firefox: DownloadLink;
    macos: DownloadLink;
    ios: DownloadLink;
    android: DownloadLink;
  };
  detectedBrowser: "chrome" | "firefox" | "safari";
  primaryDownload: DownloadLink;
  browserDisplayName: string;
  otherBrowsers: DownloadLink[];
  isMobile: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  recommendedDownload: string;
}

export const useDownloadLinks = (): DownloadLinksData => {
  const { name, isMobile, isAndroid, isIOS, recommendedDownload } = useBrowserDetection();

  const downloadLinks = {
    chrome: {
      id: "chrome" as const,
      href: "https://chromewebstore.google.com/detail/the-wall-boycott-assistan/kocebhffdnlgdahkbfeopdokcoikipam",
      icon: "./files/common/icon-chrome.svg",
      displayName: "Chrome",
    },
    firefox: {
      id: "firefox" as const,
      href: "https://addons.mozilla.org/en-US/firefox/addon/the-wall-boycott-assistant/",
      icon: "./files/common/icon-firefox.svg",
      displayName: "Firefox",
    },
    macos: {
      id: "macos" as const,
      href: "https://apps.apple.com/us/app/the-wall-boycott-assistant/id6743708305",
      icon: "./files/common/icon-safari.svg",
      displayName: "Safari (macOS)",
    },
    ios: {
      id: "ios" as const,
      href: "https://apps.apple.com/us/app/the-wall-boycott-helper/id6744613506",
      icon: "./files/common/icon-safari.svg",
      displayName: "Safari (iOS)",
    },
    android: {
      id: "android" as const,
      href: "https://play.google.com/store/apps/details?id=com.thewallboycott.android",
      icon: "./files/common/google-play-store-icon.svg",
      badgeIcon: "./files/common/playstore/GetItOnGooglePlay_Badge_Web_color_English.svg",
      displayName: "Android",
    },
  };

  let detectedBrowser: "chrome" | "firefox" | "safari";
  if (name === "chrome" || name === "firefox" || name === "safari") {
    detectedBrowser = name;
  } else {
    detectedBrowser = "chrome";
  }

  let primaryDownload: DownloadLink;
  let browserDisplayName: string;

  if (isIOS) {
    primaryDownload = downloadLinks.ios;
    browserDisplayName = "Safari (iOS)";
  } else if (isAndroid) {
    primaryDownload = downloadLinks.android;
    browserDisplayName = "Android";
  } else if (detectedBrowser === "safari") {
    primaryDownload = downloadLinks.macos;
    browserDisplayName = "Safari (macOS)";
  } else {
    primaryDownload = downloadLinks[detectedBrowser];
    browserDisplayName = detectedBrowser.charAt(0).toUpperCase() + detectedBrowser.slice(1);
  }

  const otherBrowsers: DownloadLink[] = [];

  if (isIOS) {
    otherBrowsers.push(downloadLinks.chrome);
    otherBrowsers.push(downloadLinks.firefox);
    otherBrowsers.push(downloadLinks.macos);
    otherBrowsers.push(downloadLinks.android);
  } else if (isAndroid) {
    otherBrowsers.push(downloadLinks.chrome);
    otherBrowsers.push(downloadLinks.firefox);
  } else if (detectedBrowser === "safari") {
    otherBrowsers.push(downloadLinks.chrome);
    otherBrowsers.push(downloadLinks.firefox);
    otherBrowsers.push(downloadLinks.ios);
    otherBrowsers.push(downloadLinks.android);
  } else if (detectedBrowser === "chrome") {
    otherBrowsers.push(downloadLinks.firefox);
    otherBrowsers.push(downloadLinks.macos);
    otherBrowsers.push(downloadLinks.ios);
    otherBrowsers.push(downloadLinks.android);
  } else if (detectedBrowser === "firefox") {
    otherBrowsers.push(downloadLinks.chrome);
    otherBrowsers.push(downloadLinks.macos);
    otherBrowsers.push(downloadLinks.ios);
    otherBrowsers.push(downloadLinks.android);
  }

  const primaryIds = [primaryDownload.id];
  const filteredOtherBrowsers = otherBrowsers.filter((browser) => !primaryIds.includes(browser.id));

  return {
    downloadLinks,
    detectedBrowser,
    primaryDownload,
    browserDisplayName,
    otherBrowsers: filteredOtherBrowsers,
    isMobile,
    isAndroid,
    isIOS,
    recommendedDownload,
  };
};
