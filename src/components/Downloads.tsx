import React from "react";
import { useTranslation } from "react-i18next";
import { useDownloadLinks } from "./useDownloadLinks";
import InstallButton from "./InstallButton";
import styles from "./Downloads.module.css";

const Downloads: React.FC = () => {
  const { t } = useTranslation();
  const { downloadLinks } = useDownloadLinks();

  return (
    <section className={styles.downloads}>
      <div className={styles.container}>
        <div className={styles.downloadsContent}>
          <InstallButton />

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
