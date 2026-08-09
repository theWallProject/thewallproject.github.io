import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import styles from "./PrivacyPolicy.module.css";

const PrivacyPolicy: React.FC = () => {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = "The Wall Project - Privacy Policy";
  }, []);

  return (
    <>
      <Header />
      <div className={styles.privacyPolicy}>
        <div className={styles.container} data-testid="privacy-content">
          <Link to="/" className={styles.backLink}>
            &larr; {t("privacy.backToHome")}
          </Link>
          <h1>{t("privacy.title")}</h1>
          <hr />
          <p>{t("privacy.intro")}</p>
          <p>{t("privacy.noData")}</p>
          <p>{t("privacy.eventsTracked")}</p>
          <ol>
            <li>{t("privacy.event1")}</li>
            <li>{t("privacy.event2")}</li>
          </ol>

          <hr />

          <h2>{t("privacy.websiteAppendix.title")}</h2>
          <p>{t("privacy.websiteAppendix.scope")}</p>
          <p>{t("privacy.websiteAppendix.body")}</p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PrivacyPolicy;
