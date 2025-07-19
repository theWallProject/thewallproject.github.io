import React from "react";
import { useTranslation } from "react-i18next";
import styles from "./Downloads.module.css";

const Downloads: React.FC = () => {
  const { t } = useTranslation();

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

  return (
    <section className={styles.downloads}>
      <div className={styles.container}>
        <div className={styles.downloadsContent}>
          <hr className={styles.divider} />
          <div className={styles.wrapper}>
            {downloadLinks.map((link) => (
              <a
                key={link.id}
                className={styles.downloadContainer}
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
                  <span className={styles.downloadDesc}>{link.title}</span>
                  {link.subtitle && (
                    <span className={styles.downloadSubtitle}>
                      {link.subtitle}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Downloads;
