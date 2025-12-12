import React, { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import styles from "./Header.module.css";

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={styles.container}>
        <div className={styles.headerContent}>
          <div className={styles.logoContainer}>
            <div className={styles.logos}>
              <img
                src="./files/common/logo-red.svg"
                alt="The Wall Logo"
                className={styles.logo}
              />
              {/* <img
                src="./files/common/the-wall-black.png"
                alt="The Wall"
                className={styles.logo}
              /> */}
            </div>
            {/* <h1 className={styles.title}>{t("header.title")}</h1> */}
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
