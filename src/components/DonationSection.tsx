import React from "react";
import { useTranslation, Trans } from "react-i18next";
import styles from "./DonationSection.module.css";

const DonationSection: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <section
      id="donate"
      className="relative w-full min-h-[60vh] bg-[#050505] overflow-hidden py-24 px-6 flex flex-col items-center justify-center border-t border-white/5"
    >
      {/* ── SIDE ATMOSPHERIC IMAGES (MD+) ── */}
      <div className="absolute inset-0 pointer-events-none hidden md:block select-none overflow-hidden">
        {/* Left Image */}
        <div className="absolute left-10 top-0 bottom-0 w-[350px] opacity-20">
          <img
            src="/files/common/flag.jpg"
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
            }}
          />
        </div>
        {/* Right Image */}
        <div className="absolute right-10 top-0 bottom-0 w-[350px] opacity-20 transform scale-x-[-1]">
          <img
            src="/files/common/flag.jpg"
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
            }}
          />
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="relative z-10 text-center max-w-2xl flex flex-col items-center mb-6 md:mb-10">
        <h2
          className={`text-3xl md:text-5xl font-black text-white uppercase leading-tight mb-6 tracking-tight ${i18n.language === "ar" ? "font-arabic leading-[1.3]" : "font-sans"}`}
        >
          <Trans i18nKey="donate.title" components={{ span: <span className="text-[#b72b00]" /> }} />
        </h2>
        <p
          className={`text-sm md:text-lg text-gray-400 leading-relaxed max-w-xl font-light ${i18n.language === "ar" ? "font-arabic text-xl text-center" : "font-sans"}`}
        >
          {t("donate.description")}
        </p>

        {/* Ko-fi Button */}
        <a
          href="https://ko-fi.com/thewalladdon"
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.kofiBtn} inline-flex items-center gap-3 mt-10 px-8 py-3.5 bg-white/5 border border-white/10 hover:border-[#b72b00]/50 hover:bg-[#b72b00]/10 text-white rounded-full backdrop-blur-md transition-all duration-500 ease-out group`}
        >
          <img
            src="/files/common/kofi-logo.png"
            alt="Ko-fi"
            loading="lazy"
            className="h-5 w-auto opacity-70 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110"
          />
          <span
            className={`text-[11px] font-bold uppercase tracking-widest mt-0.5 ${i18n.language === "ar" ? "font-arabic text-sm" : "font-sans"}`}
          >
            {t("donate.button")}
          </span>
        </a>
      </div>

      {/* ── DONATION PROGRESS IMAGE ── */}
      <a
        href="https://ko-fi.com/thewalladdon"
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-10 max-w-2xl w-full"
      >
        <picture>
          <source media="(min-width: 1024px)" srcSet="https://the-wall.win/dynamic/donations.png?maxRowBricks=15" />
          <source media="(min-width: 640px)" srcSet="https://the-wall.win/dynamic/donations.png?maxRowBricks=11" />
          <img
            src="https://the-wall.win/dynamic/donations.png?maxRowBricks=7"
            alt="Donation progress wall"
            className={`${styles.brickImage} w-full cursor-pointer transition-all duration-500 ease-out`}
          />
        </picture>
      </a>
    </section>
  );
};

export default DonationSection;
