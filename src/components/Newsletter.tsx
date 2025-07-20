import React, { useEffect } from "react";
import styles from "./Newsletter.module.css";

const Newsletter: React.FC = () => {
  useEffect(() => {
    // Load MailerLite script if not already loaded
    if (!window.ml) {
      const script = document.createElement("script");
      script.src = "https://assets.mailerlite.com/js/universal.js";
      script.async = true;
      script.onload = () => {
        if (window.ml) {
          window.ml("account", "1459988");
        }
      };
      document.head.appendChild(script);
    } else {
      // If script is already loaded, just initialize
      window.ml("account", "1459988");
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <section className={styles.newsletterSection}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h2 className={styles.title}>Stay Updated</h2>
          <p className={styles.description}>
            Get the latest updates about The Wall Addon, new features, and
            important announcements.
          </p>
          <div className={styles.formContainer}>
            <div className="ml-embedded" data-form="QTf4uM"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
