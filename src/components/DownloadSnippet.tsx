import React from "react";
import { useTranslation } from "react-i18next";
import { useDownloadLinks } from "./useDownloadLinks";
import InstallButton from "./InstallButton";
import styles from "./DownloadSnippet.module.css";

const DownloadSnippet: React.FC = () => {
  const { t } = useTranslation();
  const { otherBrowsers } = useDownloadLinks();

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
      // When Firefox detected: "Also available for Chrome and Safari"
      // When Chrome detected: "Also available for Firefox and Safari"
      // When Safari detected: "Also available for Chrome and Firefox"
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
        </div>
      </div>
    </section>
  );
};

export default DownloadSnippet;
