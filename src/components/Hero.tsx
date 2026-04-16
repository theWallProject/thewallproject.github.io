import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
import { useTranslation, Trans } from "react-i18next";
import InstallButton from "./InstallButton";
import { useDownloadLinks } from "./useDownloadLinks";
import SplitText from "./SplitText";
import MorphingBackground from "./MorphingBackground";
import gsap from "gsap";

const Hero: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { downloadLinks } = useDownloadLinks();
  const lineRef = useRef<SVGPathElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Get video URL based on language
  const getVideoUrl = (): string => {
    const currentLanguage = i18n.language;
    if (currentLanguage === "ar") {
      return "https://www.youtube-nocookie.com/embed/8ksFYucC6u0";
    }
    return "https://www.youtube-nocookie.com/embed/bEbK3Uy6fyo?si=7LlMjTM84Vwvb84G";
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Counter Animation for '20,000'
      const obj = { value: 0 };
      gsap.to(obj, {
        value: 20000,
        duration: 3,
        ease: "power2.out",
        delay: 0.8, // Wait for assemble to start
        onUpdate: () => {
          if (countRef.current) {
            countRef.current.innerText = Math.floor(obj.value).toLocaleString();
          }
        },
      });

      // 2. Underline draw animation
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { strokeDasharray: 200, strokeDashoffset: 200 },
          {
            strokeDashoffset: 0,
            duration: 1.5,
            ease: "power3.out",
            delay: 2.5,
          }
        );
      }

      // 3. Entrance sequence for bottom content
      gsap.from(".hero-bottom-anim", {
        y: 20,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        ease: "power3.out",
        delay: 1.5,
      });
    }, textContainerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      className={`relative min-h-screen h-auto md:h-screen w-full flex flex-col justify-between items-center bg-brand-orange bg-center bg-no-repeat overflow-hidden px-6 sm:px-10 pt-20 pb-24 md:pb-16 text-[#f5f5f3] ${i18n.language === "ar" ? "font-arabic" : ""}`}
      style={{ backgroundImage: 'url("/files/common/bg.png")', backgroundSize: "cover" }}
    >
      {/* 1. Seamless Shader Background Bridge (Bottom transition only) */}
      <div className="absolute  bottom-[-43vh] lg:bottom-0 left-0 w-full h-[100%] z-0 pointer-events-none">
        <MorphingBackground color="#b72b00" edgeSoftness={0.2} />
      </div>

      {/* 2. Hero Content */}
      <div
        ref={textContainerRef}
        className="relative z-10 w-full flex flex-col justify-between h-full items-center gap-12"
      >
        {/* Top Section: Identity */}
        <div className="w-full text-center flex flex-col gap-0 md:gap-8">
          <h2
            className={`text-[0.55rem] md:text-[0.9rem] tracking-[0.4em] md:tracking-[0.8em] font-medium uppercase opacity-50 border-b border-white/5 pb-1 max-w-fit mx-auto hero-bottom-anim ${i18n.language === "ar" ? "font-arabic" : "font-sans"}`}
          >
            {t("header.title")}
          </h2>

          <div
            style={{ perspective: "1500px" }}
            className={`text-[1.3rem] sm:text-[2.3rem] md:text-[3rem] lg:text-[2.8rem] 
              leading-[1.25] md:leading-[1.15] font-bold tracking-tight max-w-full mx-auto drop-shadow-2xl text-center px-4 flex flex-wrap justify-center items-center ${i18n.language === "ar" ? "font-arabic font-black leading-tight" : "font-serif"}`}
          >
            {/* LINE 1 */}
            <div className="basis-full h-0 hidden md:block" />
            <SplitText
              text={t("hero.detectAndBlock")}
              splitType="words"
              animationType="assemble"
              delay={30}
              className="inline-block"
            />
            <div className="basis-full h-0 hidden md:block" />

            {/* LINE 2 - Flexible cluster */}
            <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2 flex-row">
              <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                <span className="relative inline-block px-1 shrink-0">
                  <span
                    ref={countRef}
                    className="text-brand-red italic pb-1 md:pb-2 inline-block w-[95px] sm:w-[240px] text-center tabular-nums hero-bottom-anim shrink-0 overflow-visible"
                  >
                    0
                  </span>
                  <svg
                    className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-auto"
                    viewBox="0 0 100 20"
                    preserveAspectRatio="none"
                  >
                    <path
                      ref={lineRef}
                      d="M5,15 C25,10 45,5 95,15"
                      stroke="#ff3e1a"
                      strokeWidth="4"
                      fill="transparent"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{" "}
                <SplitText
                  text={t(i18n.language === "ar" ? "hero.relatedWebsites" : "hero.israeli")}
                  splitType="words"
                  animationType="assemble"
                  className={i18n.language === "ar" ? "inline-block mx-1" : "text-brand-red inline-block"}
                  delay={50}
                />
              </div>

              <SplitText
                text={t(i18n.language === "ar" ? "hero.israeli" : "hero.relatedWebsites")}
                splitType="words"
                animationType="assemble"
                className={i18n.language === "ar" ? "text-brand-red inline-block" : "inline-block mx-1"}
                delay={70}
              />
            </div>
            <div className="basis-full h-0 hidden md:block" />

            {/* LINE 3 */}
            <SplitText
              text={t("hero.andSocialAccounts")}
              splitType="words"
              animationType="assemble"
              className="inline-block mx-1"
              delay={90}
            />
            <div className="basis-full h-0 hidden md:block" />
          </div>
        </div>

        {/* Bottom Section: Details & Play/Action */}
        <div className="w-full max-w-[1600px] flex flex-col lg:flex-row justify-between items-end gap-10 md:gap-12 md:py-4 pb-12 hero-bottom-anim text-center md:text-left">
          <div className="w-full lg:flex-1 max-w-[700px] flex flex-col gap-8 md:gap-10 items-center lg:items-start mx-auto lg:mx-0">
            <p
              className={`text-[1.3rem] md:text-[2.2rem] lg:text-[1.6rem] leading-[1.3] font-medium opacity-95 tracking-tight px-2 sm:px-0 ${i18n.language === "ar" ? "font-arabic" : "font-sans"}`}
            >
              <Trans
                i18nKey={isMobile ? "hero.availableAsMobile" : "hero.availableAsDesktop"}
                components={{
                  span: <span className="text-white border-b border-white/20 pb-1" />,
                }}
              />
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-8 md:gap-10">
              <InstallButton />
              <div
                className={`flex flex-col gap-2 items-center sm:items-start ${i18n.language === "ar" ? "font-arabic" : "font-sans"}`}
              >
                <p className="text-[0.65rem] md:text-[0.75rem] text-white/40 leading-tight uppercase tracking-[0.2em] font-bold">
                  {t("downloads.alsoAvailablePrefix")}
                </p>
                <div className="flex items-center gap-6 md:gap-8">
                  <a
                    href={downloadLinks.firefox.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 transition-all hover:opacity-100 opacity-80"
                  >
                    <img
                      src="/files/common/icon-firefox.svg"
                      alt="Firefox"
                      loading="lazy"
                      className="w-4 md:w-5 h-4 md:h-5"
                    />
                    <span className="text-[0.9rem] md:text-[1rem] border-b border-white/10 group-hover:border-white/40 transition-colors">
                      Firefox
                    </span>
                  </a>
                  <a
                    href={downloadLinks.safari.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 transition-all hover:opacity-100 opacity-80"
                  >
                    <img
                      src="/files/common/icon-safari.svg"
                      alt="Safari"
                      loading="lazy"
                      className="w-4 md:w-5 h-4 md:h-5"
                    />
                    <span className="text-[0.9rem] md:text-[1rem] border-b border-white/10 group-hover:border-white/40 transition-colors">
                      Safari
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="relative w-full lg:w-auto mt-6 lg:mt-0 flex justify-center">
            <div className="w-full max-w-[480px] lg:w-[480px] aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.8)] relative translate-y-4">
              <iframe
                className="w-full h-full opacity-90"
                src={getVideoUrl()}
                title="How it works"
                frameBorder="0"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
