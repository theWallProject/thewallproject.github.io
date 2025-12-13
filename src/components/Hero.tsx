import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBrowserDetection } from "./BrowserDetector";
import styles from "./Hero.module.css";

const Hero: React.FC = () => {
  const { t } = useTranslation();
  const { recommendedDownload, name } = useBrowserDetection();
  const [isScrolled, setIsScrolled] = useState(false);

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

  const downloadLinks = {
    chrome: {
      id: "chrome",
      href: "https://chromewebstore.google.com/detail/the-wall-boycott-assistan/kocebhffdnlgdahkbfeopdokcoikipam",
      icon: "./files/common/icon-chrome.svg",
      displayName: "Chrome",
    },
    firefox: {
      id: "firefox",
      href: "https://addons.mozilla.org/en-US/firefox/addon/the-wall-boycott-assistant/",
      icon: "./files/common/icon-firefox.svg",
      displayName: "Firefox",
    },
    safari: {
      id: "safari",
      href: "https://apps.apple.com/us/app/the-wall-boycott-assistant/id6743708305",
      icon: "./files/common/icon-safari.svg",
      displayName: "Safari",
    },
  };

  // Determine which browser to show in the button
  const detectedBrowser = name !== "unknown" ? name : "chrome";
  const primaryDownload =
    downloadLinks[detectedBrowser as keyof typeof downloadLinks] ||
    downloadLinks.chrome;

  const getBrowserDisplayName = (browserId: string): string => {
    if (browserId === "chrome") return "Chrome";
    if (browserId === "firefox") return "Firefox";
    if (browserId === "safari") return "Safari";
    return "Chrome";
  };

  const browserDisplayName = getBrowserDisplayName(detectedBrowser);

  // Get the other browsers (not the primary one) to show inline
  const otherBrowsers = Object.values(downloadLinks).filter(
    (browser) => browser.id !== detectedBrowser
  );

  // Helper to render availability text with inline icons after browser names
  const renderAvailabilityText = () => {
    const text = t("downloads.alsoAvailable");

    // Browser name mappings (English and Arabic) - only for browsers that are not primary
    const browserNameMap: Array<{ name: string; id: string; icon: string }> =
      [];

    if (detectedBrowser !== "safari") {
      browserNameMap.push({
        name: "سفاري",
        id: "safari",
        icon: downloadLinks.safari.icon,
      });
      browserNameMap.push({
        name: "Safari",
        id: "safari",
        icon: downloadLinks.safari.icon,
      });
    }
    if (detectedBrowser !== "firefox") {
      browserNameMap.push({
        name: "فايرفوكس",
        id: "firefox",
        icon: downloadLinks.firefox.icon,
      });
      browserNameMap.push({
        name: "Firefox",
        id: "firefox",
        icon: downloadLinks.firefox.icon,
      });
    }
    if (detectedBrowser !== "chrome") {
      browserNameMap.push({
        name: "كروم",
        id: "chrome",
        icon: downloadLinks.chrome.icon,
      });
      browserNameMap.push({
        name: "Chrome",
        id: "chrome",
        icon: downloadLinks.chrome.icon,
      });
    }

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
                <a
                  href={primaryDownload.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.installButton}
                >
                  <img
                    src={primaryDownload.icon}
                    alt={`${primaryDownload.displayName} icon`}
                    className={styles.buttonIcon}
                  />
                  <span className={styles.buttonText}>
                    {t("downloads.installNow", { browser: browserDisplayName })}
                  </span>
                </a>

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
                  src="https://www.youtube-nocookie.com/embed/bEbK3Uy6fyo?si=7LlMjTM84Vwvb84G"
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
        </div>
      </div>
    </section>
  );
};

export default Hero;
