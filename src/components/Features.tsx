import React, { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface FeatureData {
  id: string;
  icon: string;
  iconAlt: string;
  title: string;
  description: string;
  number: string;
  gradient: string;
}

const Features: React.FC = () => {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  const features: FeatureData[] = [
    {
      id: "installOnce",
      icon: "./files/common/section-icon-install.svg",
      iconAlt: t("features.installOnce.title"),
      title: t("features.installOnce.title"),
      description: t("features.installOnce.description"),
      number: "01",
      gradient: "linear-gradient(135deg, #111111 0%, #331700 100%)",
    },
    {
      id: "worksEverywhere",
      icon: "./files/common/section-icon-works.svg",
      iconAlt: t("features.worksEverywhere.title"),
      title: t("features.worksEverywhere.title"),
      description: t("features.worksEverywhere.description"),
      number: "02",
      gradient: "linear-gradient(135deg, #111111 0%, #003317 100%)",
    },
    {
      id: "smartDetection",
      icon: "./files/common/section-icon-smart.svg",
      iconAlt: t("features.smartDetection.title"),
      title: t("features.smartDetection.title"),
      description: t("features.smartDetection.description"),
      number: "03",
      gradient: "linear-gradient(135deg, #111111 0%, #170033 100%)",
    },
    {
      id: "trustedData",
      icon: "./files/common/section-icon-data.svg",
      iconAlt: t("features.trustedData.title"),
      title: t("features.trustedData.title"),
      description: t("features.trustedData.description"),
      number: "04",
      gradient: "linear-gradient(135deg, #111111 0%, #2a2a2a 100%)",
    },
  ];

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = gsap.utils.toArray<HTMLElement>(".feature-stack-card", containerRef.current);
    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 768px)",
        isMobile: "(max-width: 767px)",
      },
      (context) => {
        const { isDesktop } = context.conditions || {};

        if (isDesktop) {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top top",
              end: "+=2000",
              pin: true,
              scrub: 1.5,
              anticipatePin: 1,
            },
          });

          cards.forEach((card, index) => {
            if (index === 0) return;
            tl.to(
              cards[index - 1],
              {
                scale: 0.94,
                y: -40,
                opacity: 0.5,
                filter: "blur(4px)",
                duration: 1,
                ease: "power2.inOut",
              },
              index - 1
            );

            tl.fromTo(
              card,
              {
                yPercent: 120,
                rotationX: -5,
              },
              {
                yPercent: 0,
                rotationX: 0,
                duration: 1.2,
                ease: "power3.out",
              },
              index - 1
            );
          });
        } else {
          // MOBILE LOGIC: Simple Reveal
          cards.forEach((card) => {
            gsap.fromTo(
              card,
              { opacity: 0, y: 50, scale: 0.95 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: card,
                  start: "top 85%",
                  end: "top 60%",
                },
              }
            );
          });
        }
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="features"
      className="relative w-full min-h-screen overflow-hidden flex flex-col items-center pt-16 pb-20 px-4 md:px-12"
      style={{ background: "var(--color-brand-orange, #b72b00)" }}
    >
      {/* ATMOSPHERIC LAYERS */}
      <div
        className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* FIXED HEADING */}
      <div className="features-main-heading relative z-10 w-full text-center mb-10">
        <span
          className={`block text-[10px] md:text-[11px] font-bold tracking-[0.4em] uppercase text-white/60 mb-4 ${i18n.language === "ar" ? "font-arabic" : "font-sans"}`}
        >
          {t("features.sectionLabel")}
        </span>
        <h2
          className={`text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight ${i18n.language === "ar" ? "font-arabic" : "font-sans"}`}
          style={{ textShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
        >
          {t("features.building")}{" "}
          <span className="text-white/40 block md:inline italic">{t("features.theFuture")}</span>
        </h2>
      </div>

      {/* CARDS CONTAINER */}
      <div
        className="relative w-full max-w-5xl flex flex-col gap-8 md:gap-0 md:flex-1 h-auto md:h-full"
        style={{ perspective: "2000px" }}
      >
        {features.map((feature, i) => (
          <div
            key={feature.id}
            className="feature-stack-card relative md:absolute md:inset-0 h-auto md:h-full rounded-3xl md:rounded-4xl border-t border-white/10 flex flex-col gap-6 md:gap-10 p-8 md:p-14 shadow-2xl min-h-[450px] md:min-h-[600px]"
            style={{
              zIndex: i + 1,
              transformStyle: "preserve-3d",
              background: feature.gradient,
            }}
          >
            {/* Icon + Title Row */}
            <div className="relative z-10 w-full flex flex-col items-start md:flex-row md:items-center gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/[0.08] border border-white/[0.15] flex items-center justify-center backdrop-blur-xl flex-shrink-0">
                <img
                  src={feature.icon}
                  alt={feature.iconAlt}
                  loading="lazy"
                  className="w-6 h-6 md:w-8 md:h-8 opacity-95 brightness-0 invert"
                />
              </div>

              <h3
                className={`text-2xl md:text-5xl font-bold text-white leading-tight ${i18n.language === "ar" ? "font-arabic" : "font-sans"}`}
              >
                {feature.title}
              </h3>

              {feature.id === "worksEverywhere" && (
                <div className="ml-auto flex items-center gap-2 md:gap-4 bg-white/[0.08] px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/[0.15] backdrop-blur-sm">
                  <img
                    src="./files/common/icon-chrome.svg"
                    alt="Chrome"
                    loading="lazy"
                    className="w-4 h-4 md:w-5 md:h-5 opacity-80"
                  />
                  <img
                    src="./files/common/icon-firefox.svg"
                    alt="Firefox"
                    loading="lazy"
                    className="w-4 h-4 md:w-5 md:h-5 opacity-80"
                  />
                  <img
                    src="./files/common/icon-safari.svg"
                    alt="Safari"
                    loading="lazy"
                    className="w-4 h-4 md:w-5 md:h-5 opacity-80"
                  />
                </div>
              )}

              {/* GHOST NUMBER */}
              <div className="absolute top-[-10px] right-[-10px] md:top-[-20px] md:right-[-20px] text-6xl md:text-[14rem] font-black leading-none text-white opacity-[0.06] select-none pointer-events-none">
                {feature.number}
              </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl relative z-10">
              <p
                className={`text-sm md:text-[1.2rem] text-gray-400 md:text-gray-300 leading-relaxed font-light opacity-90 ${i18n.language === "ar" ? "font-arabic" : "font-sans"}`}
              >
                {feature.description}
              </p>
            </div>

            <div
              className="absolute top-0 left-0 w-full h-1/2 pointer-events-none rounded-t-[2rem] mix-blend-overlay"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)",
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
