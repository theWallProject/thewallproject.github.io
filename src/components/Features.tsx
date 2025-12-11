import React from "react";
import { useTranslation } from "react-i18next";
import styles from "./Features.module.css";

interface FeatureProps {
  image: string;
  title: string;
  description: string;
  imageAlt: string;
  donateLink?: string;
}

const Feature: React.FC<FeatureProps> = ({
  image,
  title,
  description,
  imageAlt,
  donateLink,
}) => {
  const { t } = useTranslation();

  return (
    <div className={styles.feature}>
      <div className={styles.imageContainer}>
        <div className={styles.imageWrapper}>
          <img src={image} alt={imageAlt} className={styles.featureImage} />
        </div>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <hr className={styles.divider} />
        <p className={styles.description}>{description}</p>
        {donateLink && (
          <a
            href={donateLink}
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
        )}
      </div>
    </div>
  );
};

const Features: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      id: "installOnce",
      image: "./files/common/imgScreenshot.png",
      title: t("features.installOnce.title"),
      description: t("features.installOnce.description"),
      imageAlt: "Screenshot of The Wall addon in action",
    },
    {
      id: "worksEverywhere",
      image: "./files/common/imgBrowsers.jpg",
      title: t("features.worksEverywhere.title"),
      description: t("features.worksEverywhere.description"),
      imageAlt: "Supported browsers",
    },
    {
      id: "smartDetection",
      image: "./files/common/imgSocialNetworks.jpg",
      title: t("features.smartDetection.title"),
      description: t("features.smartDetection.description"),
      imageAlt: "Social media detection",
    },
    {
      id: "trustedData",
      image: "./files/common/image02.jpg",
      title: t("features.trustedData.title"),
      description: t("features.trustedData.description"),
      imageAlt: "Trusted data sources",
    },
    {
      id: "donate",
      image: "./files/common/wall-building.jpg",
      title: t("features.donate.title"),
      description: t("features.donate.description"),
      imageAlt: "Support The Wall",
      donateLink: "https://ko-fi.com/thewalladdon",
    },
  ];

  return (
    <section className={styles.features}>
      <div className={styles.container}>
        <div className={styles.featuresContent}>
          {features.map((feature) => (
            <Feature
              key={feature.id}
              image={feature.image}
              title={feature.title}
              description={feature.description}
              imageAlt={feature.imageAlt}
              donateLink={feature.donateLink}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
