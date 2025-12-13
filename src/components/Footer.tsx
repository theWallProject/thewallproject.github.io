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
      id: "telegram",
      href: "https://t.me/theWallAddon",
      icon: "./files/common/icon-telegram-white.svg",
      label: "Telegram",
    },
    {
      id: "youtube",
      href: "https://www.youtube.com/@theWallAddon",
      icon: "./files/common/icon-youtube.svg",
      label: "YouTube",
    },
    {
      id: "twitter",
      href: "https://twitter.com/theWallAddon",
      icon: "./files/common/icon-twitter.svg",
      label: "Twitter",
    },
    {
      id: "github",
      href: "https://github.com/theWallProject/mono",
      icon: "./files/common/icon-github.svg",
      label: t("footer.github"),
    },
    {
      id: "email",
      href: "mailto:the.wall.addon@proton.me",
      icon: "./files/common/icon-email.svg",
      label: t("footer.emailUs"),
    },
  ];

  const footerLinks = [
    {
      id: "privacy",
      href: "/privacy",
      label: t("privacy.title"),
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
                src="./files/common/logo-light.svg"
                alt={t("alt.theWallLogo")}
                className={styles.logo}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/230x78/C24233/FFFFFF?text=THE+WALL";
                }}
              />
            </div>
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
