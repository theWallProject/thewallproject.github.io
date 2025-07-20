import React, { useEffect } from "react";
import styles from "./Newsletter.module.css";

const Newsletter: React.FC = () => {
  useEffect(() => {
    // Load MailerLite script exactly like the old version
    const script = document.createElement("script");
    script.innerHTML = `
      (function (w, d, e, u, f, l, n) {
        (w[f] =
          w[f] ||
          function () {
            (w[f].q = w[f].q || []).push(arguments);
          }),
          (l = d.createElement(e)),
          (l.async = 1),
          (l.src = u),
          (n = d.getElementsByTagName(e)[0]),
          n.parentNode.insertBefore(l, n);
      })(
        window,
        document,
        "script",
        "https://assets.mailerlite.com/js/universal.js",
        "ml"
      );
      ml("account", "1459988");
    `;
    document.head.appendChild(script);

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
