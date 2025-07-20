import React from "react";
import { useTranslation } from "react-i18next";
import styles from "./PrivacyPolicy.module.css";

const PrivacyPolicy: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.privacyPolicy}>
      <div className={styles.container}>
        <h1>{t("privacy.title")}</h1>
        <hr />
        <p>{t("privacy.intro")}</p>
        <p>{t("privacy.noData")}</p>
        <p>{t("privacy.eventsTracked")}</p>
        <ol>
          <li>{t("privacy.event1")}</li>
          <li>{t("privacy.event2")}</li>
        </ol>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
