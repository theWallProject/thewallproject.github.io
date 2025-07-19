import React from "react";
import { useTranslation } from "react-i18next";
import styles from "./Hero.module.css";

const Hero: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.textSection}>
            <hr className={styles.divider} />
            <p className={styles.introText}>
              {t("intro.text", { count: 19000 })}
            </p>
          </div>

          <div className={styles.videoSection}>
            <iframe
              src="https://www.youtube-nocookie.com/embed/bEbK3Uy6fyo?si=7LlMjTM84Vwvb84G"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className={styles.video}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
