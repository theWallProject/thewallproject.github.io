import { useBrowserDetection } from "./BrowserDetector";

export interface DownloadLink {
  id: "chrome" | "firefox" | "safari";
  href: string;
  icon: string;
  displayName: string;
}

export interface DownloadLinksData {
  downloadLinks: {
    chrome: DownloadLink;
    firefox: DownloadLink;
    safari: DownloadLink;
  };
  detectedBrowser: "chrome" | "firefox" | "safari";
  primaryDownload: DownloadLink;
  browserDisplayName: string;
  otherBrowsers: DownloadLink[];
}

export const useDownloadLinks = (): DownloadLinksData => {
  const { name } = useBrowserDetection();

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
    safari: {
      id: "safari" as const,
      href: "https://apps.apple.com/us/app/the-wall-boycott-assistant/id6743708305",
      icon: "./files/common/icon-safari.svg",
      displayName: "Safari",
    },
  };

  // Determine which browser to show in the button
  // Only accept chrome, firefox, or safari - default to chrome for anything else
  let detectedBrowser: "chrome" | "firefox" | "safari";
  if (name === "chrome" || name === "firefox" || name === "safari") {
    detectedBrowser = name;
  } else {
    detectedBrowser = "chrome";
  }

  // Primary download is the detected browser
  const primaryDownload = downloadLinks[detectedBrowser];

  // Get browser name for button text
  const getBrowserDisplayName = (
    browserId: "chrome" | "firefox" | "safari"
  ): string => {
    if (browserId === "chrome") return "Chrome";
    if (browserId === "firefox") return "Firefox";
    if (browserId === "safari") return "Safari";
    return "Chrome";
  };

  const browserDisplayName = getBrowserDisplayName(detectedBrowser);

  // Get other browsers (exclude the primary/detected one)
  // When Firefox detected: show Chrome and Safari (NOT Firefox)
  // When Chrome detected: show Firefox and Safari (NOT Chrome)
  // When Safari detected: show Chrome and Firefox (NOT Safari)
  const otherBrowsers: DownloadLink[] = [];

  // Explicitly exclude the detected browser
  if (detectedBrowser === "chrome") {
    // Chrome detected: show Firefox and Safari
    otherBrowsers.push(downloadLinks.firefox);
    otherBrowsers.push(downloadLinks.safari);
  } else if (detectedBrowser === "firefox") {
    // Firefox detected: show Chrome and Safari (NOT Firefox)
    otherBrowsers.push(downloadLinks.chrome);
    otherBrowsers.push(downloadLinks.safari);
  } else {
    // Safari detected: show Chrome and Firefox
    otherBrowsers.push(downloadLinks.chrome);
    otherBrowsers.push(downloadLinks.firefox);
  }

  // Double-check: ensure detected browser is NOT in otherBrowsers
  const filteredOtherBrowsers = otherBrowsers.filter(
    (browser) => browser.id !== detectedBrowser
  );

  return {
    downloadLinks,
    detectedBrowser,
    primaryDownload,
    browserDisplayName,
    otherBrowsers: filteredOtherBrowsers,
  };
};
