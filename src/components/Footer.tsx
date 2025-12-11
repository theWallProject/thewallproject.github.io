import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

const Footer: React.FC = () => {
  const { t } = useTranslation();

  const socialLinks = [
    {
      id: "github",
      href: "https://github.com/theWallProject/mono",
      icon: (
        <svg viewBox="0 0 40 40" aria-labelledby="github-icon">
          <title id="github-icon">GitHub</title>
          <path d="M36,20.3c0,3.5-1,6.6-3.1,9.4c-2,2.8-4.7,4.7-7.9,5.8c-0.4,0.1-0.6,0-0.8-0.1c-0.2-0.2-0.3-0.4-0.3-0.6v-4.4 c0-1.3-0.4-2.3-1.1-3c0.8-0.1,1.5-0.2,2.1-0.4c0.6-0.2,1.3-0.4,2-0.8c0.7-0.4,1.2-0.8,1.7-1.4c0.5-0.5,0.8-1.3,1.1-2.2 s0.4-2,0.4-3.1c0-1.7-0.5-3.1-1.6-4.3c0.5-1.3,0.5-2.7-0.2-4.2c-0.4-0.1-1,0-1.7,0.2c-0.7,0.3-1.4,0.6-1.9,0.9L24,12.5 c-1.3-0.4-2.6-0.5-4-0.5s-2.7,0.2-4,0.5c-0.2-0.2-0.5-0.3-0.9-0.6c-0.4-0.2-0.9-0.5-1.7-0.8c-0.8-0.3-1.4-0.4-1.8-0.3 c-0.6,1.6-0.7,3-0.1,4.2c-1.1,1.2-1.6,2.6-1.6,4.3c0,1.2,0.1,2.2,0.4,3.1s0.6,1.6,1.1,2.2s1,1,1.7,1.4c0.7,0.4,1.3,0.6,2,0.8 c0.6,0.2,1.3,0.3,2.1,0.4c-0.6,0.5-0.9,1.2-1,2.1c-0.3,0.1-0.6,0.2-0.9,0.3c-0.3,0.1-0.7,0.1-1.2,0.1c-0.5,0-0.9-0.1-1.4-0.4 c-0.5-0.3-0.8-0.7-1.2-1.3c-0.3-0.4-0.6-0.8-1-1.1c-0.4-0.3-0.8-0.4-1-0.5L9,26.5c-0.3,0-0.5,0-0.6,0.1c-0.1,0.1-0.1,0.1-0.1,0.2 c0,0.1,0.1,0.2,0.2,0.3c0.1,0.1,0.2,0.2,0.3,0.2l0.1,0.1c0.3,0.1,0.6,0.4,0.9,0.8s0.5,0.7,0.7,1.1l0.2,0.5c0.2,0.5,0.5,1,0.9,1.3 c0.4,0.3,0.9,0.5,1.4,0.6c0.5,0.1,1,0.1,1.4,0.1c0.5,0,0.9,0,1.2-0.1l0.5-0.1c0,0.5,0,1.1,0,1.9c0,0.7,0,1.1,0,1.1 c0,0.2-0.1,0.5-0.3,0.6c-0.2,0.2-0.5,0.2-0.8,0.1c-3.2-1.1-5.8-3-7.9-5.8S4,23.8,4,20.3c0-2.9,0.7-5.6,2.1-8S9.5,7.8,12,6.4 s5.1-2.1,8-2.1s5.6,0.7,8,2.1s4.4,3.4,5.8,5.8S36,17.4,36,20.3L36,20.3z" />
        </svg>
      ),
      label: t("footer.github"),
    },
    {
      id: "email",
      href: "mailto:the.wall.addon@proton.me",
      icon: (
        <svg viewBox="0 0 40 40" aria-labelledby="email-icon">
          <title id="email-icon">Email</title>
          <path d="M37.3,15.3v15.3c0,0.8-0.3,1.6-0.9,2.2c-0.6,0.6-1.4,0.9-2.2,0.9H5.8c-0.8,0-1.6-0.3-2.2-0.9s-0.9-1.4-0.9-2.2V15.3 c0.5,0.6,1.2,1.1,2,1.7c4.7,3.1,7.9,5.4,9.6,6.7c0.7,0.5,1.4,0.9,1.8,1.2c0.4,0.3,1,0.6,1.9,0.9c0.7,0.3,1.5,0.5,2.1,0.5l0,0 c0.6,0,1.4-0.2,2.1-0.5c0.7-0.3,1.4-0.6,1.9-0.9c0.4-0.3,1-0.7,1.8-1.2c2.2-1.6,5.4-3.8,9.6-6.7C36.1,16.5,36.7,15.9,37.3,15.3 L37.3,15.3z M37.3,9.6c0,1-0.3,2-0.9,2.9c-0.6,0.9-1.5,1.8-2.4,2.4c-4.9,3.3-7.9,5.5-9,6.2c-0.1,0.1-0.4,0.3-0.8,0.6 c-0.4,0.3-0.7,0.5-1,0.7c-0.3,0.2-0.6,0.4-1,0.6c-0.4,0.2-0.7,0.4-1.1,0.5c-0.4,0.1-0.6,0.2-0.9,0.2l0,0c-0.3,0-0.6-0.1-0.9-0.2 c-0.3-0.1-0.7-0.3-1.1-0.5c-0.4-0.2-0.7-0.4-1-0.6c-0.3-0.2-0.6-0.4-1-0.7c-0.4-0.3-0.7-0.5-0.8-0.6c-1.1-0.8-2.8-2-5.1-3.5 c-2.3-1.6-3.3-2.4-3.7-2.7c-0.8-0.5-1.6-1.2-2.3-2.2s-1-1.9-1-2.6c0-1,0.3-1.9,0.8-2.5c0.5-0.6,1.2-1,2.3-1h28.4 c0.8,0,1.6,0.3,2.2,0.9C37.1,8.1,37.3,8.8,37.3,9.6L37.3,9.6z" />
        </svg>
      ),
      label: t("footer.email"),
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
        <ul className={styles.socialLinks}>
          {socialLinks.map((link) => (
            <li key={link.id}>
              <a
                className={styles.socialLink}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
              >
                {link.icon}
                <span className={styles.label}>{link.label}</span>
              </a>
            </li>
          ))}
        </ul>
        <ul className={styles.footerLinks}>
          {footerLinks.map((link) => (
            <li key={link.id}>
              <Link
                className={styles.footerLink}
                to={link.href}
                aria-label={link.label}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
