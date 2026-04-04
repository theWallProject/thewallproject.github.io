import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import InstallButton from "./InstallButton";
import { useDownloadLinks } from "./useDownloadLinks";

gsap.registerPlugin(ScrollTrigger);

const PlatformShowcase: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { downloadLinks } = useDownloadLinks();
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const desktopImgRef = useRef<HTMLImageElement>(null);
  const mobileStackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── DESKTOP PARALLAX (Natural Scroll) ──
      if (desktopImgRef.current) {
        gsap.to(desktopImgRef.current, {
          yPercent: 8,
          ease: "none",
          scrollTrigger: {
            trigger: desktopRef.current,
            start: "top center",
            end: "bottom top",
            scrub: 1,
          },
        });
      }

      // ── MOBILE FAN-OUT (Restored Logic to Work with Multiple Images) ──
      const mobileImages = gsap.utils.toArray<HTMLElement>(".mobile-fan-img", mobileRef.current);
      if (mobileImages.length > 0) {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: mobileRef.current,
              start: "top 80%",
              end: "bottom 30%",
              scrub: 1,
            },
          })
          .to(mobileImages[0], { y: -8, rotation: -3, ease: "power1.inOut" }, 0)
          .to(mobileImages[1], { x: -50, y: 15, rotation: -8, ease: "power1.inOut" }, 0)
          .to(mobileImages[2], { x: 50, y: 10, rotation: 6, ease: "power1.inOut" }, 0)
          .to(mobileImages[3], { x: 100, y: 25, rotation: 12, ease: "power1.inOut" }, 0);
      }
    }, desktopRef);

    return () => ctx.revert();
  }, [i18n.language]);

  return (
    <div className="relative w-full bg-brand-orange overflow-hidden pt-8 md:pt-12 pb-12">
      <div className="max-w-[1600px] mx-auto">
        {/* SECTION TITLE */}
        <div className="text-center mb-6 md:mb-10 px-4">
          <h2
            className={`text-xl md:text-2xl font-black text-white uppercase tracking-widest opacity-40 ${i18n.language === "ar" ? "font-arabic" : "font-sans"}`}
          >
            -- {t("platform.sectionTitle")} --
          </h2>
        </div>

        {/* BLOCK 1: BROWSER ADD-ON (DESKTOP) */}
        <section ref={desktopRef} className="relative ">
          <div className="max-w-[1600px] lg:px-0 px-5 mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
            <div className="flex-1 w-full max-w-xl order-2 md:order-1">
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-black/10 border border-white/5">
                <img
                  ref={desktopImgRef}
                  src="/files/common/install.gif"
                  alt="Desktop Extension"
                  className="w-full h-full object-cover opacity-95 transition-opacity duration-1000 scale-105"
                />
              </div>
            </div>

            <div
              className={`flex-1 max-w-xl z-10 text-center md:text-left md:rtl:text-right order-1 md:order-2 ${i18n.language === "ar" ? "font-arabic" : "font-sans"}`}
            >
              <span className="flex items-center justify-center md:justify-start md:rtl:justify-end gap-3 text-[10px] font-bold tracking-[0.4em] text-white uppercase mb-4 opacity-80">
                {t("platform.desktop.subtitle")}
                <span className="w-4 h-4 rounded-full border border-white/40 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                </span>
              </span>
              <h3
                className={`text-xl md:text-4xl font-black text-white leading-tight mb-2 ${i18n.language === "ar" ? "font-arabic" : "font-serif"}`}
              >
                {t("platform.desktop.title")}
              </h3>
              <p className="text-sm md:text-lg text-white/70 leading-relaxed mb-4 font-medium">
                {t("platform.desktop.description")}
              </p>
              <div className="flex justify-center md:justify-start md:rtl:justify-end">
                <InstallButton />
              </div>
            </div>
          </div>
        </section>

        {/* BLOCK 2: ANDROID APP (MOBILE) */}
        <section ref={mobileRef} className="relative mt-8 md:mt-16">
          <div className="max-w-[1600px] lg:px-0 px-5 mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
            <div
              className={`flex-1 max-w-xl z-10 text-center md:text-left md:rtl:text-right ${i18n.language === "ar" ? "font-arabic" : "font-sans"}`}
            >
              <span className="flex items-center justify-center md:justify-start md:rtl:justify-end gap-3 text-[10px] font-bold tracking-[0.4em] text-white uppercase mb-4 opacity-80">
                {t("platform.mobile.subtitle")}
                <span className="w-4 h-4 rounded-full border border-white/40 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                </span>
              </span>
              <h3
                className={`text-xl md:text-4xl font-black text-white leading-tight mb-2 ${i18n.language === "ar" ? "font-arabic" : "font-serif"}`}
              >
                {t("platform.mobile.title")}
              </h3>
              <p className="text-sm md:text-lg text-white/70 leading-relaxed mb-4 font-medium">
                {t("platform.mobile.description")}
              </p>
              <div className="flex justify-center md:justify-start md:rtl:justify-end">
                <a
                  href={downloadLinks.android.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-transform duration-300 hover:scale-105 active:scale-95 text-center sm:text-left sm:rtl:text-right"
                  aria-label={t("sections.androidApp.getOnPlayStore")}
                >
                  <img
                    src="./files/common/playstore/GetItOnGooglePlay_Badge_Web_color_English.svg"
                    alt={t("sections.androidApp.getOnPlayStore")}
                    className="h-10 w-auto drop-shadow-lg"
                  />
                </a>
              </div>
            </div>

            <div className="flex-1 w-full h-[220px] flex items-center justify-center pt-8 md:pt-4">
              <div ref={mobileStackRef} className="relative w-full h-[220px] md:h-[480px]">
                <img
                  src="/files/common/android_featured.png"
                  className="mobile-fan-img absolute inset-0 w-full h-full object-contain rounded-3xl md:rounded-[2.5rem]"
                  style={{
                    transformOrigin: "bottom center",
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PlatformShowcase;
