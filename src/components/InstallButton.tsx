import React from "react";
import { useTranslation } from "react-i18next";
import { useDownloadLinks } from "./useDownloadLinks";
import { getBadgePath } from "./badgeAssets";
import { trackEvent, MatomoEvent } from "../lib/matomo";
import styles from "./InstallButton.module.css";

interface InstallButtonProps {
  className?: string;
}

const InstallButton: React.FC<InstallButtonProps> = ({ className = "" }) => {
  const { t, i18n } = useTranslation();
  const { primaryDownload, browserDisplayName, isAndroid, isIOS } = useDownloadLinks();

  const badgePath = getBadgePath(i18n.language, isIOS, isAndroid);

  const buttonText =
    i18n.language === "ar"
      ? `${t("downloads.installNow")} (${t("downloads.for")} ${browserDisplayName})`
      : `${t("downloads.installNow")} (${t("downloads.for")} ${browserDisplayName})`;

  const renderText =
    i18n.language === "ar"
      ? `${t("downloads.installNow")} (\u200E${browserDisplayName} \u200F${t("downloads.for")})`
      : buttonText;

  const handleDownloadClick = () => {
    trackEvent(MatomoEvent.category.engagement, MatomoEvent.action.downloadClick, `download.${primaryDownload.id}`);
  };

  if (badgePath) {
    const ariaLabel = isIOS ? t("downloads.ios.title") : t("sections.androidApp.getOnPlayStore");

    return (
      <a
        href={primaryDownload.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles.installButton} ${className}`}
        aria-label={ariaLabel}
        onClick={handleDownloadClick}
      >
        <img src={badgePath} alt={ariaLabel} className={styles.storeBadge} />
      </a>
    );
  }

  return (
    <a
      href={primaryDownload.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.installButton} ${className}`}
      aria-label={buttonText}
      onClick={handleDownloadClick}
    >
      <span className={styles.installButtonBody}>
        <img
          src={primaryDownload.icon.replace(/^\.\//, "/")}
          alt=""
          aria-hidden
          loading="lazy"
          className={styles.installButtonIcon}
        />
        <span
          className={styles.installButtonText}
          style={{ fontFamily: i18n.language === "ar" ? "Jimmy Collins, sans-serif" : "Arial, sans-serif" }}
        >
          {renderText}
        </span>
      </span>
    </a>
  );
};

export default InstallButton;
