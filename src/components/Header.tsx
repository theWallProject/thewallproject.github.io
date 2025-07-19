import React from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import styles from "./Header.module.css";

const Header: React.FC = () => {
  const { t } = useTranslation();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.headerContent}>
          <div className={styles.logoContainer}>
            <h1 className={styles.title}>{t("header.title")}</h1>
            <div className={styles.logos}>
              <img
                src="./files/common/logo-red.svg"
                alt="The Wall Logo"
                className={styles.logo}
              />
              <img
                src="./files/common/the-wall-black.png"
                alt="The Wall"
                className={styles.logo}
              />
            </div>
          </div>
          <div className={styles.languageSwitcherContainer}>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
