import React from "react";
import { useTranslation } from "react-i18next";
import { useBrowserDetection } from "./BrowserDetector";
import styles from "./Downloads.module.css";

const Downloads: React.FC = () => {
  const { t } = useTranslation();
  const { recommendedDownload } = useBrowserDetection();

  const downloadLinks = [
    {
      id: "chrome",
      href: "https://chromewebstore.google.com/detail/the-wall-boycott-assistan/kocebhffdnlgdahkbfeopdokcoikipam",
      icon: "./files/common/icon-chrome.svg",
      title: t("downloads.chrome.title"),
      subtitle: t("downloads.chrome.subtitle"),
    },
    {
      id: "firefox",
      href: "https://addons.mozilla.org/en-US/firefox/addon/the-wall-boycott-assistant/",
      icon: "./files/common/icon-firefox.svg",
      title: t("downloads.firefox.title"),
      subtitle: t("downloads.firefox.subtitle"),
    },
    {
      id: "safari",
      href: "https://apps.apple.com/us/app/the-wall-boycott-assistant/id6743708305",
      icon: "./files/common/icon-safari.svg",
      title: t("downloads.safari.title"),
      subtitle: "",
    },
    {
      id: "ios",
      href: "https://apps.apple.com/us/app/the-wall-boycott-helper/id6744613506",
      icon: "./files/common/icon-safari.svg",
      title: t("downloads.ios.title"),
      subtitle: t("downloads.ios.subtitle"),
    },
    {
      id: "telegram",
      href: "https://t.me/theWallAddon",
      icon: "./files/common/icon-telegram.svg",
      title: t("downloads.telegram.title"),
      subtitle: "",
    },
  ];

  // Reorder downloads to put recommended first
  const reorderedDownloads = [...downloadLinks].sort((a, b) => {
    if (a.id === recommendedDownload) return -1;
    if (b.id === recommendedDownload) return 1;
    return 0;
  });

  return (
    <section className={styles.downloads}>
      <div className={styles.container}>
        <div className={styles.downloadsContent}>
          <hr className={styles.divider} />
          <div className={styles.wrapper}>
            {reorderedDownloads.map((link) => {
              const isRecommended = link.id === recommendedDownload;
              return (
                <a
                  key={link.id}
                  className={`${styles.downloadContainer} ${
                    isRecommended ? styles.recommended : ""
                  }`}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className={styles.iconContainer}>
                    <img
                      className={styles.downloadIcon}
                      src={link.icon}
                      alt={`${link.id} icon`}
                    />
                  </span>
                  <div className={styles.downloadText}>
                    <span className={styles.downloadDesc}>
                      {link.title}
                      {isRecommended && (
                        <span className={styles.recommendedBadge}>
                          {t("downloads.recommended")}
                        </span>
                      )}
                    </span>
                    {link.subtitle && (
                      <span className={styles.downloadSubtitle}>
                        {link.subtitle}
                      </span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Downloads;
