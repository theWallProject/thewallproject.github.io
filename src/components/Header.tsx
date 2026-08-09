import React, { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[1000] py-4 transition-all duration-500 ${isScrolled ? "py-2" : ""}`}
    >
      {/* Persistent gradient scrim — keeps the white logo/nav readable on dark
          pages (privacy, stats) and fades naturally into the scroll state. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/35 to-transparent"
      />

      {/* Solid blurred overlay that fades in on scroll (opacity is animatable,
          unlike background-image, so there's no background snap/flash). */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 border-b border-white/5 bg-[#000]/80 backdrop-blur-xl transition-opacity duration-500 ${
          isScrolled ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="relative z-10 max-w-[1600px] mx-auto px-10 flex justify-between items-center w-full">
        {/* Logo Section - Small */}
        <div className="flex-shrink-0">
          <Link to="/" aria-label="The Wall Project - Home">
            <img
              src="/files/common/logo-white.svg"
              alt="The Wall Logo"
              loading="eager"
              className={`${isScrolled ? "w-20" : "w-24"} h-auto transition-all duration-500 opacity-90 hover:opacity-100`}
            />
          </Link>
        </div>

        {/* Global Navigation - Minimal and Ultra-Compact */}
        <div className="flex items-center gap-10">
          <nav className="hidden sm:flex items-center gap-10">
            <a
              href="/stats"
              className={`text-white text-[0.9rem] font-semibold hover:text-brand-orange transition-all uppercase tracking-[0.15em] drop-shadow-sm ${i18n.language === "ar" ? "font-arabic" : "font-sans"}`}
            >
              {t("header.stats")}
            </a>
            <Link
              to="/donate"
              className={`text-white text-[0.9rem] font-semibold hover:text-brand-orange transition-all uppercase tracking-[0.15em] drop-shadow-sm ${i18n.language === "ar" ? "font-arabic" : "font-sans"}`}
            >
              {t("header.donate")}
            </Link>
          </nav>

          <div className="flex items-center gap-8 border-l border-white/10 pl-8 h-4">
            <LanguageSwitcher isScrolled={isScrolled} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
