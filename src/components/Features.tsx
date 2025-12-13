import React from "react";
import { useTranslation } from "react-i18next";
import styles from "./Features.module.css";

interface FeatureProps {
  icon: string;
  iconAlt: string;
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({
  icon,
  iconAlt,
  title,
  description,
}) => {
  return (
    <div className={styles.feature}>
      <div className={styles.iconContainer}>
        <img src={icon} alt={iconAlt} className={styles.featureIcon} />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );
};

const Features: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      id: "installOnce",
      icon: "./files/common/section-icon-install.svg",
      iconAlt: t("features.installOnce.title"),
      title: t("features.installOnce.title"),
      description: t("features.installOnce.description"),
    },
    {
      id: "worksEverywhere",
      icon: "./files/common/section-icon-works.svg",
      iconAlt: t("features.worksEverywhere.title"),
      title: t("features.worksEverywhere.title"),
      description: t("features.worksEverywhere.description"),
    },
    {
      id: "smartDetection",
      icon: "./files/common/section-icon-smart.svg",
      iconAlt: t("features.smartDetection.title"),
      title: t("features.smartDetection.title"),
      description: t("features.smartDetection.description"),
    },
    {
      id: "trustedData",
      icon: "./files/common/section-icon-data.svg",
      iconAlt: t("features.trustedData.title"),
      title: t("features.trustedData.title"),
      description: t("features.trustedData.description"),
    },
  ];

  return (
    <>
      <section className={styles.features}>
        <div className={styles.container}>
          <div className={styles.featuresContent}>
            {features.map((feature) => (
              <Feature
                key={feature.id}
                icon={feature.icon}
                iconAlt={feature.iconAlt}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.supportSection}>
        <div className={styles.supportContent}>
          <div className={styles.supportIconContainer}>
            <img
              src="./files/common/section-icon-support.svg"
              alt={t("alt.supportIcon")}
              className={styles.supportIcon}
            />
          </div>
          <div className={styles.supportText}>
            <h3 className={styles.supportTitle}>
              {t("features.donate.title")}
            </h3>
            <p className={styles.supportDescription}>
              {t("features.donate.description")}
            </p>
            <a
              href="https://ko-fi.com/thewalladdon"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.donateButton}
            >
              <img
                src="./files/common/kofi-logo.png"
                alt={t("footer.donate")}
                className={styles.kofiLogo}
              />
              <span className={styles.donateText}>
                {t("features.donate.button")}
              </span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default Features;
