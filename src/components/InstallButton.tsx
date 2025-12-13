import React from "react";
import { useTranslation } from "react-i18next";
import { useDownloadLinks } from "./useDownloadLinks";
import styles from "./InstallButton.module.css";

interface InstallButtonProps {
  className?: string;
}

const InstallButton: React.FC<InstallButtonProps> = ({ className = "" }) => {
  const { t } = useTranslation();
  const { primaryDownload, browserDisplayName } = useDownloadLinks();

  return (
    <a
      href={primaryDownload.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.installButton} ${className}`}
    >
      <img
        src="./files/common/install-now-button.svg"
        alt={`${t("downloads.installNow")} (${t(
          "downloads.for"
        )} ${browserDisplayName})`}
        className={styles.installButtonImage}
      />
    </a>
  );
};

export default InstallButton;
