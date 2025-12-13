import React from "react";
import { useTranslation } from "react-i18next";
import { useBrowserDetection } from "./BrowserDetector";
import styles from "./Downloads.module.css";

const Downloads: React.FC = () => {
  const { t } = useTranslation();
  const { recommendedDownload, name } = useBrowserDetection();

  const downloadLinks = {
    chrome: {
      id: "chrome",
      href: "https://chromewebstore.google.com/detail/the-wall-boycott-assistan/kocebhffdnlgdahkbfeopdokcoikipam",
      icon: "./files/common/icon-chrome.svg",
      displayName: "Chrome",
    },
    firefox: {
      id: "firefox",
      href: "https://addons.mozilla.org/en-US/firefox/addon/the-wall-boycott-assistant/",
      icon: "./files/common/icon-firefox.svg",
      displayName: "Firefox",
    },
    safari: {
      id: "safari",
      href: "https://apps.apple.com/us/app/the-wall-boycott-assistant/id6743708305",
      icon: "./files/common/icon-safari.svg",
      displayName: "Safari",
    },
  };

  // Determine which browser to show in the button
  // Default to Chrome if browser is unknown
  const detectedBrowser = name !== "unknown" ? name : "chrome";
  const primaryDownload =
    downloadLinks[detectedBrowser as keyof typeof downloadLinks] ||
    downloadLinks.chrome;

  // Get browser name for button text
  const getBrowserDisplayName = (browserId: string): string => {
    if (browserId === "chrome") return "Chrome";
    if (browserId === "firefox") return "Firefox";
    if (browserId === "safari") return "Safari";
    return "Chrome";
  };

  const browserDisplayName = getBrowserDisplayName(detectedBrowser);

  return (
    <section className={styles.downloads}>
      <div className={styles.container}>
        <div className={styles.downloadsContent}>
          <a
            href={primaryDownload.href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.installButton}
          >
            <img
              src={primaryDownload.icon}
              alt={`${primaryDownload.displayName} icon`}
              className={styles.buttonIcon}
            />
            <span className={styles.buttonText}>
              {t("downloads.installNow", { browser: browserDisplayName })}
            </span>
          </a>

          <p className={styles.availabilityText}>
            {t("downloads.alsoAvailable")}
          </p>

          <div className={styles.browserIcons}>
            <img
              src={downloadLinks.chrome.icon}
              alt="Chrome"
              className={styles.browserIcon}
            />
            <img
              src={downloadLinks.safari.icon}
              alt="Safari"
              className={styles.browserIcon}
            />
            <img
              src={downloadLinks.firefox.icon}
              alt="Firefox"
              className={styles.browserIcon}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Downloads;
