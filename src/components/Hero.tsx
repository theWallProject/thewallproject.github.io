import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDownloadLinks } from "./useDownloadLinks";
import DownloadSnippet from "./DownloadSnippet";
import InstallButton from "./InstallButton";
import styles from "./Hero.module.css";

const Hero: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { downloadLinks, detectedBrowser, otherBrowsers, browserDisplayName } =
    useDownloadLinks();
  const [isScrolled, setIsScrolled] = useState(false);

  // Get video URL based on language
  const getVideoUrl = (): string => {
    const currentLanguage = i18n.language;
    if (currentLanguage === "ar") {
      // Arabic video
      return "https://www.youtube-nocookie.com/embed/8ksFYucC6u0";
    }
    // Default video
    return "https://www.youtube-nocookie.com/embed/bEbK3Uy6fyo?si=7LlMjTM84Vwvb84G";
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener("scroll", handleScroll);
    // Check initial scroll position
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Helper to render availability text with inline icons after browser names
  const renderAvailabilityText = () => {
    // Generate dynamic text based on otherBrowsers using translations
    // Browser names are kept in English, only translate the connecting words
    let text: string;
    if (otherBrowsers.length === 0) {
      text = t("downloads.alsoAvailable");
    } else {
      const browserNames = otherBrowsers.map((b) => b.displayName);
      const prefix = t("downloads.alsoAvailablePrefix");
      const andWord = t("downloads.and");
      const comma = t("downloads.comma");

      if (browserNames.length === 1) {
        text = `${prefix} ${browserNames[0]}`;
      } else if (browserNames.length === 2) {
        text = `${prefix} ${browserNames[0]} ${andWord} ${browserNames[1]}`;
      } else {
        const last = browserNames.pop();
        text = `${prefix} ${browserNames.join(
          comma + " "
        )}${comma} ${andWord} ${last}`;
      }
    }

    // Browser name mappings - only English names since we keep browser names in English
    // Only for browsers that are in otherBrowsers (not the primary/detected one)
    const browserNameMap: Array<{ name: string; id: string; icon: string }> =
      [];

    // Only add browsers that are in otherBrowsers (not the primary/detected one)
    // Browser names are kept in English
    otherBrowsers.forEach((browser) => {
      browserNameMap.push({
        name: browser.displayName, // English name only
        id: browser.id,
        icon: browser.icon,
      });
    });

    // Find all browser name occurrences with their positions
    const matches: Array<{
      index: number;
      length: number;
      id: string;
      icon: string;
    }> = [];

    browserNameMap.forEach(({ name, id, icon }) => {
      let searchIndex = 0;
      while (true) {
        const index = text.indexOf(name, searchIndex);
        if (index === -1) break;
        matches.push({ index, length: name.length, id, icon });
        searchIndex = index + 1;
      }
    });

    // Sort matches by position in text
    matches.sort((a, b) => a.index - b.index);

    // Build the result with icons inserted after browser names
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let iconKey = 0;

    matches.forEach((match) => {
      // Add text before the browser name
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      // Get the browser link
      const browserLink = downloadLinks[match.id as keyof typeof downloadLinks];
      // Add browser name and icon wrapped in a link
      parts.push(
        <a
          key={`${match.id}-link-${iconKey}`}
          href={browserLink.href}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.browserLink}
        >
          {text.substring(match.index, match.index + match.length)}
          <img
            src={match.icon}
            alt={match.id}
            className={styles.inlineBrowserIcon}
          />
        </a>
      );
      iconKey++;
      lastIndex = match.index + match.length;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    // If no matches found, return original text
    if (parts.length === 0) {
      return text;
    }

    return <>{parts}</>;
  };

  return (
    <section className={`${styles.hero} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Hero Banner Section - Text Left, Image Right */}
          <div className={styles.heroBanner}>
            <div className={styles.heroTextSection}>
              <p className={styles.heroText}>
                {t("intro.text", { count: 19000 })}
              </p>

              {/* Download Buttons Below Text */}
              <div className={styles.downloadSection}>
                <InstallButton />

                <p className={styles.availabilityText}>
                  {renderAvailabilityText()}
                </p>
              </div>
            </div>

            <div className={styles.heroImageContainer}>
              <img
                src="./files/common/hero.png"
                alt={t("alt.browserExtension")}
                className={styles.heroImage}
              />
            </div>
          </div>

          {/* Testimonial Section */}
          <div className={styles.testimonialSection}>
            <div className={styles.testimonialCard}>
              <div className={styles.testimonialIconContainer}>
                <img
                  src="./files/common/testimonial-icon.svg"
                  alt={t("alt.testimonialIcon")}
                  className={styles.testimonialIcon}
                />
              </div>
              <div className={styles.testimonialContent}>
                <p className={styles.testimonialQuote}>
                  {t("testimonial.quote")}
                </p>
                <p className={styles.testimonialAuthor}>
                  {t("testimonial.author")}
                </p>
                <p className={styles.testimonialRole}>
                  {t("testimonial.role", { browser: browserDisplayName })}
                </p>
              </div>
            </div>
            <div className={styles.testimonialArrow}>
              <svg
                className={styles.arrowIcon}
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label={t("aria.nextTestimonial")}
              >
                <path
                  d="M12 8L20 16L12 24"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Video Section */}
          <div className={styles.videoSection}>
            <div className={styles.videoContainer}>
              <div className={styles.video}>
                <iframe
                  src={getVideoUrl()}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
            <div className={styles.videoCTA}>
              <div className={styles.videoCTAIconContainer}>
                <img
                  src="./files/common/section-icon-how-it-works.svg"
                  alt={t("video.watchHowItWorks")}
                  className={styles.videoCTAIcon}
                />
              </div>
              <h3 className={styles.videoCTAText}>
                {t("video.watchHowItWorks")}
              </h3>
            </div>
          </div>

          {/* Download Snippet Section */}
          <DownloadSnippet />
        </div>
      </div>
    </section>
  );
};

export default Hero;
