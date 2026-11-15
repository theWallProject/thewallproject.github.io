import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { reportUninstall } from "../lib/uninstallPixel";
import { trackEvent, MatomoEvent } from "../lib/matomo";
import styles from "./NooooooPage.module.css";

/**
 * Shown by the addon's uninstall URL.
 *
 * One job: get the reason. Not a feature list, not a sales pitch — the person
 * has already decided, and the only thing of value they can still give us is
 * why. Everything here exists to lower the effort of saying it:
 *
 *  - a single question, answered in the embedded form;
 *  - a Telegram group and an email address, for people who would rather
 *    complain to a human than fill in a field;
 *  - the Palestine angle, because it is the actual reason this project exists
 *    and the honest argument for spending thirty seconds on it.
 *
 * There is deliberately NO reinstall button. A page that asks for feedback and
 * then pushes a reinstall is asking two questions at once, and the second one
 * makes the first look like a trick.
 *
 * The survey is the existing Tally form, embedded unchanged, so answers stay
 * comparable with every response collected before this page existed. Tally
 * sends no X-Frame-Options and no frame-ancestors, so it renders inline.
 */
const TALLY_EMBED_URL = "https://tally.so/embed/Np0Jpl?alignLeft=1&hideTitle=1";

const TELEGRAM_URL = "https://t.me/theWallAddon";
const EMAIL = "the.wall.addon@proton.me";

const NooooooPage: React.FC = () => {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = "The Wall Project - Tell us why";
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    reportUninstall(params.get("u") ?? "", params.get("v") ?? "");
  }, []);

  const handleTelegram = () => {
    trackEvent(MatomoEvent.category.engagement, MatomoEvent.action.socialClick, "uninstall_telegram");
  };

  const handleEmail = () => {
    trackEvent(MatomoEvent.category.engagement, MatomoEvent.action.socialClick, "uninstall_email");
  };

  return (
    <>
      <Header />
      <div className={styles.noooooo}>
        <div className={styles.container}>
          <Link to="/" className={styles.backLink}>
            &larr; The Wall Project
          </Link>

          <h1 className={styles.title}>{t("noooooo.title")}</h1>
          <p className={styles.subtitle}>{t("noooooo.subtitle")}</p>

          <p className={styles.cause}>{t("noooooo.cause")}</p>

          <h2 className={styles.reasonTitle}>{t("noooooo.reasonTitle")}</h2>

          <iframe
            className={styles.embed}
            src={TALLY_EMBED_URL}
            title={t("noooooo.reasonTitle")}
            loading="eager"
            frameBorder={0}
          />

          <p className={styles.privacyNote}>{t("noooooo.privacyNote")}</p>

          <hr />

          <p className={styles.telegramLine}>{t("noooooo.telegram")}</p>

          <div className={styles.actions}>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.primaryAction}
              onClick={handleTelegram}
            >
              {t("noooooo.telegramBtn")}
            </a>
          </div>

          <p className={styles.emailLine}>{t("noooooo.email")}</p>

          <div className={styles.actions}>
            <a href={`mailto:${EMAIL}`} className={styles.secondaryAction} onClick={handleEmail}>
              {t("noooooo.emailBtn")}
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NooooooPage;
