import React from "react";
import { useTranslation } from "react-i18next";
import { useDownloadLinks } from "./useDownloadLinks";
import InstallButton from "./InstallButton";
import styles from "./DownloadSnippet.module.css";

const DownloadSnippet: React.FC = () => {
  const { t } = useTranslation();
  const { otherBrowsers, downloadLinks, isAndroid, isIOS } =
    useDownloadLinks();

  // Build dynamic "Also available for..." text based on otherBrowsers
  // This ensures the text matches the icons shown
  // Browser names are kept in English, only translate the connecting words
  const getAvailabilityText = (): string => {
    if (otherBrowsers.length === 0) {
      return t("downloads.alsoAvailable");
    }

    // Get browser names in order (keep in English)
    const browserNames = otherBrowsers.map((b) => b.displayName);
    const prefix = t("downloads.alsoAvailablePrefix");
    const andWord = t("downloads.and");
    const comma = t("downloads.comma");

    if (browserNames.length === 1) {
      return `${prefix} ${browserNames[0]}`;
    } else if (browserNames.length === 2) {
      return `${prefix} ${browserNames[0]} ${andWord} ${browserNames[1]}`;
    } else {
      const last = browserNames.pop();
      return `${prefix} ${browserNames.join(
        comma + " "
      )}${comma} ${andWord} ${last}`;
    }
  };

  return (
    <section className={styles.downloadSnippet}>
      <div className={styles.container}>
        <div className={styles.downloadsContent}>
          {/* Always show addon install button */}
          <InstallButton />

          <p className={styles.availabilityText}>{getAvailabilityText()}</p>

          <div className={styles.browserIcons}>
            {otherBrowsers.map((browser) => (
              <a
                key={browser.id}
                href={browser.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.browserIconLink}
              >
                <img
                  src={browser.icon}
                  alt={browser.displayName}
                  className={styles.browserIcon}
                />
              </a>
            ))}
          </div>

          {/* Show Play Store badge on Android or as secondary on desktop/iOS */}
          {(isAndroid || !isIOS) && (
            <div className={styles.playStoreRow}>
              <p className={styles.playStoreText}>
                {isAndroid
                  ? t("sections.androidApp.subtitle")
                  : t("sections.alsoGetApp")}
              </p>
              <a
                href={downloadLinks.android.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.playStoreBadgeLink}
                aria-label={t("sections.androidApp.getOnPlayStore")}
              >
                <img
                  src="./files/common/playstore/GetItOnGooglePlay_Badge_Web_color_English.svg"
                  alt={t("sections.androidApp.getOnPlayStore")}
                  className={styles.playStoreBadge}
                />
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DownloadSnippet;
