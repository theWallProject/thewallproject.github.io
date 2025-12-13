import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

const Footer: React.FC = () => {
  const { t } = useTranslation();

  useEffect(() => {
    // Load MailerLite script for newsletter
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

  const socialLinks = [
    {
      id: "linkedin",
      href: "https://www.linkedin.com/company/the-wall-addon",
      icon: "https://via.placeholder.com/48x48/C24233/FFFFFF?text=in",
      label: "LinkedIn",
    },
    {
      id: "facebook",
      href: "https://www.facebook.com/theWallAddon",
      icon: "https://via.placeholder.com/48x48/C24233/FFFFFF?text=f",
      label: "Facebook",
    },
    {
      id: "instagram",
      href: "https://www.instagram.com/theWallAddon",
      icon: "https://via.placeholder.com/48x48/C24233/FFFFFF?text=IG",
      label: "Instagram",
    },
    {
      id: "youtube",
      href: "https://www.youtube.com/@theWallAddon",
      icon: "https://via.placeholder.com/48x48/C24233/FFFFFF?text=YT",
      label: "YouTube",
    },
  ];

  const footerLinks = [
    {
      id: "privacy",
      href: "/privacy",
      label: t("privacy.title"),
    },
    {
      id: "github",
      href: "https://github.com/theWallProject/mono",
      label: t("footer.github"),
      external: true,
    },
    {
      id: "email",
      href: "mailto:the.wall.addon@proton.me",
      label: t("footer.emailUs"),
      external: true,
    },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerMain}>
          {/* Left Column - Branding and Social */}
          <div className={styles.brandingSection}>
            <div className={styles.logoContainer}>
              <img
                src="./files/common/logo-red.svg"
                alt={t("alt.theWallLogo")}
                className={styles.logo}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/120x60/C24233/FFFFFF?text=THE+WALL";
                }}
              />
              <h2 className={styles.logoText}>THE WALL</h2>
            </div>
            <p className={styles.tagline}>{t("footer.tagline")}</p>
            <div className={styles.socialLinks}>
              {socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialIcon}
                  aria-label={link.label}
                >
                  <img src={link.icon} alt={link.label} />
                </a>
              ))}
            </div>
          </div>

          {/* Right Column - Newsletter */}
          <div className={styles.newsletterSection}>
            <h3 className={styles.newsletterTitle}>
              {t("newsletter.subscribeTitle")}
            </h3>
            <p className={styles.newsletterDescription}>
              {t("newsletter.subscribeDescription")}
            </p>
            <div className={styles.newsletterForm}>
              <div className="ml-embedded" data-form="QTf4uM"></div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Copyright and Links */}
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>{t("footer.copyright")}</p>
          <div className={styles.footerLinks}>
            {footerLinks.map((link) => {
              const LinkComponent = link.external ? "a" : Link;
              const linkProps = link.external
                ? {
                    href: link.href,
                    target: "_blank",
                    rel: "noopener noreferrer",
                  }
                : { to: link.href };

              return (
                <LinkComponent
                  key={link.id}
                  {...linkProps}
                  className={styles.footerLink}
                >
                  {link.label}
                </LinkComponent>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
