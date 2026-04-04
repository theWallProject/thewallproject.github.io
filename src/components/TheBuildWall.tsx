import React, { useRef, useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LogoLoop } from "./LogoLoop";
import { FlagShader } from "./FlagShader";

gsap.registerPlugin(ScrollTrigger);

const BRICK_ASSETS = [
  "/walls/wall1.png",
  "/walls/wall2.png",
  "/walls/wall3.png",
  "/walls/wall4.png",
  "/walls/wall5.png",
  "/walls/wall6.png",
  "/walls/wall7.png",
];

const LOGO_FILES = [
  "/logos/Adama_Logo.svg.png",
  "/logos/AI21-Labs-Logo.jpg",
  "/logos/Amdocs-2017-brand-mark.svg.png",
  "/logos/Ankori.svg.png",
  "/logos/Arava_Logo.svg.png",
  "/logos/Ayalon_Logo_Hebrew_RGB_Short_Dark.svg.png",
  "/logos/B144_logo.png",
  "/logos/Check_Point_logo_2022.svg.png",
  "/logos/Coca-Cola-logo.png",
  "/logos/Decart_Logo.svg.png",
  "/logos/fiverr-freelance-service-thumbnail.png",
  "/logos/Logo_of_NSO_Group.svg",
  "/logos/McDonalds-Logo-2003.png",
  "/logos/nestle_logo.png",
  "/logos/SimilarWeb-logo-8.png",
  "/logos/starbucks-logo-png-transparent.png",
  "/logos/Teva_Pharmaceuticals_logo.png",
  "/logos/unnamed (2).png",
  "/logos/viber-icon_578229-264.avif",
];

const TheBuildWall: React.FC = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);

  const [rows, setRows] = useState(15);
  const [cols, setCols] = useState(6);
  const [flagProgress, setFlagProgress] = useState(0);
  const brickAspect = 360 / 154;

  const TEXT_PHASES = useMemo(
    () => [t("buildWall.phrase0"), t("buildWall.phrase1"), t("buildWall.phrase2"), t("buildWall.phrase3")],
    [t]
  );

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const currentCols = isMobile ? 4 : 6;
      setCols(currentCols);
      const bw = window.innerWidth / 2 / currentCols;
      const bh = bw / brickAspect;
      // Increased row limit to 60 to prioritize filling the bottom on tall screens
      const calculatedRows = Math.ceil(window.innerHeight / bh) + 1;
      setRows(Math.min(calculatedRows, 60));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const leftBricks = useMemo(
    () =>
      Array.from({ length: 450 }, (_, i) => ({
        id: `L${i}`,
        asset: BRICK_ASSETS[i % BRICK_ASSETS.length],
      })),
    []
  );
  const rightBricks = useMemo(
    () =>
      Array.from({ length: 450 }, (_, i) => ({
        id: `R${i}`,
        asset: BRICK_ASSETS[(i + 3) % BRICK_ASSETS.length],
      })),
    []
  );

  const logoNodes = useMemo(
    () =>
      LOGO_FILES.map((src, index) => ({
        node: (
          <img
            src={src}
            key={index}
            alt="Target"
            className="h-10 md:h-14 w-auto object-contain px-8"
            draggable="false"
          />
        ),
      })),
    []
  );

  const logoGroups = useMemo(() => {
    const groups: { node: React.ReactNode }[][] = [[], [], [], [], []];
    logoNodes.forEach((logo, i) => {
      groups[i % 5].push(logo);
    });
    return groups;
  }, [logoNodes]);

  useEffect(() => {
    if (rows === 0) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=3000",
          pin: true,
          scrub: 1.5,
          snap: {
            snapTo: "labels",
            duration: { min: 0.3, max: 0.8 },
            delay: 0.1,
            ease: "power2.inOut",
          },
          onUpdate: () => {
            // Debug progress removed
          },
        },
      });

      const bricksArr = [
        ...Array.from(leftRef.current!.querySelectorAll(".brick")),
        ...Array.from(rightRef.current!.querySelectorAll(".brick")),
      ];

      gsap.set(bricksArr, {
        opacity: 0,
        z: 1200,
        scale: 1.6,
        rotationX: () => Math.random() * 90 - 45,
        rotationY: () => Math.random() * 90 - 45,
      });
      gsap.set(leftRef.current, { xPercent: -100 });
      gsap.set(rightRef.current, { xPercent: 100 });
      gsap.set(".phase-text", { opacity: 0 });

      gsap.set(".phase-text span", {
        opacity: 0,
        scale: 1.8,
        z: 80,
        filter: "blur(8px)",
      });

      tl.addLabel("start", 0);
      tl.addLabel("phase1", 4);
      tl.addLabel("midway", 5);
      tl.addLabel("phase2", 9);
      tl.addLabel("wall-done", 10);
      tl.addLabel("phase3", 14);
      tl.addLabel("finale", 15);

      tl.to(marqueeRef.current, { filter: "grayscale(1) blur(4px)", opacity: 0.7, duration: 2 }, "start");
      tl.to([leftRef.current, rightRef.current], { xPercent: 0, duration: 2, ease: "power3.inOut" }, "start");

      tl.to(".phase-0", { opacity: 1, duration: 0.1 }, "start+=0.1");
      tl.to(
        ".phase-0 span",
        {
          opacity: 1,
          scale: 1,
          z: 0,
          filter: "blur(0px)",
          duration: 1.2,
          stagger: 0.08,
          ease: "power3.out",
        },
        "start+=0.2"
      );

      // ========================================================
      // THE NEW ALGORITHM: INVERSE RADIAL STAGGER
      // ========================================================
      const leftBricksArr = Array.from(leftRef.current!.querySelectorAll(".brick"));
      const rightBricksArr = Array.from(rightRef.current!.querySelectorAll(".brick"));

      tl.to(
        leftBricksArr,
        {
          opacity: 1,
          z: 0,
          scale: 1,
          rotationX: 0,
          rotationY: 0,
          duration: 10,
          ease: "back.out(1.2)", // نفس الإيفكت بتاعك ماتغيرش
          stagger: (index) => {
            const r = Math.floor(index / cols);
            const c = index % cols;
            // المركز هنا هو (نص الشاشة بالطول، والحافة اليمين للحيطة دي)
            const distY = Math.abs(r - rows / 2);
            const distX = Math.abs(c - cols);
            // بنحسب المسافة الكلية، وبنضرب X في 0.5 عشان الطوب يقفل صفوف أسرع من العواميد
            const distance = distY + distX * 0.5;
            const maxDistance = rows / 2 + cols * 0.5;
            // الخدعة هنا: بنعكس المسافة. الأبعد يأخد Delay صفر، والأقرب للنص يتأخر
            return (maxDistance - distance) * 0.15;
          },
        },
        2
      );

      // أنيميشن الحيطة اليمين
      tl.to(
        rightBricksArr,
        {
          opacity: 1,
          z: 0,
          scale: 1,
          rotationX: 0,
          rotationY: 0,
          duration: 10,
          ease: "back.out(1.2)",
          stagger: (index) => {
            const r = Math.floor(index / cols);
            const c = index % cols;
            // المركز هنا هو (نص الشاشة بالطول، والحافة الشمال للحيطة دي اللي هي -1)
            const distY = Math.abs(r - rows / 2);
            const distX = Math.abs(c - -1);
            const distance = distY + distX * 0.5;
            const maxDistance = rows / 2 + cols * 0.5;
            return (maxDistance - distance) * 0.15;
          },
        },
        2
      );

      const flagProxy = { val: 0 };
      tl.to(
        flagProxy,
        {
          val: 1,
          duration: 10,
          ease: "none",
          onUpdate: () => setFlagProgress(flagProxy.val),
        },
        "midway"
      );

      tl.to(marqueeRef.current, { opacity: 0, duration: 1.5, ease: "power2.inOut" }, "finale");

      tl.to(".phase-0", { opacity: 0, filter: "blur(15px)", duration: 0.6 }, "phase1");
      tl.to(".phase-1", { opacity: 1, duration: 0.1 }, "phase1+=0.1");
      tl.to(
        ".phase-1 span",
        {
          opacity: 1,
          scale: 1,
          z: 0,
          filter: "blur(0px)",
          duration: 1.2,
          stagger: 0.08,
          ease: "power3.out",
        },
        "phase1+=0.2"
      );

      tl.to(".phase-1", { opacity: 0, filter: "blur(15px)", duration: 0.6 }, "phase2");
      tl.to(".phase-2", { opacity: 1, duration: 0.1 }, "phase2+=0.1");
      tl.to(
        ".phase-2 span",
        {
          opacity: 1,
          scale: 1,
          z: 0,
          filter: "blur(0px)",
          duration: 1.2,
          stagger: 0.08,
          ease: "power3.out",
        },
        "phase2+=0.2"
      );

      tl.to(".phase-2", { opacity: 0, filter: "blur(15px)", duration: 0.6 }, "phase3");
      tl.to(".phase-3", { opacity: 1, duration: 0.1 }, "phase3+=0.1");
      tl.to(
        ".phase-3 span",
        {
          opacity: 1,
          scale: 1,
          z: 0,
          filter: "blur(0px)",
          duration: 1.2,
          stagger: 0.08,
          ease: "power3.out",
        },
        "phase3+=0.2"
      );

      tl.to({}, { duration: 1 }, "finale");
    });

    return () => ctx.revert();
  }, [rows, cols]);

  const brickStyle = {
    backgroundSize: "100% 100%",
    aspectRatio: `${brickAspect}`,
    width: `${100 / cols}%`,
    transformStyle: "preserve-3d" as const,
    willChange: "transform, opacity",
  };

  return (
    <section ref={sectionRef} id="build-section" className="relative w-full h-screen bg-[#010101] overflow-hidden">
      <div ref={containerRef} className="absolute inset-0 w-full h-full">
        {/* RADAR BG */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V0zm20-20h20v20H20V0z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* LOGOS */}
        <div
          dir="ltr"
          ref={marqueeRef}
          className="absolute inset-0 z-1 flex flex-col justify-center gap-10 md:gap-14 py-10 pointer-events-none"
          style={{
            maskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
          }}
        >
          {logoGroups.map((group, i) => (
            <LogoLoop
              key={i}
              logos={group}
              speed={[65, 45, 85, 55, 75][i]}
              direction={i % 2 === 0 ? "left" : "right"}
              logoHeight={cols === 4 ? 32 : 45}
              gap={160}
            />
          ))}
        </div>

        {/* BRICK WALLS */}
        <div className="absolute inset-0 z-2 flex" style={{ perspective: "1500px" }}>
          <div
            ref={leftRef}
            className="w-1/2 h-full flex flex-wrap content-start"
            style={{ transformStyle: "preserve-3d" }}
          >
            {leftBricks.slice(0, rows * cols).map((b) => (
              <div key={b.id} className="brick" style={{ ...brickStyle, backgroundImage: `url(${b.asset})` }} />
            ))}
          </div>
          <div
            ref={rightRef}
            className="w-1/2 h-full shrink-0 flex flex-wrap content-start"
            style={{ transformStyle: "preserve-3d" }}
          >
            {rightBricks.slice(0, rows * cols).map((b) => (
              <div key={b.id} className="brick" style={{ ...brickStyle, backgroundImage: `url(${b.asset})` }} />
            ))}
          </div>
        </div>

        {/* PALESTINE FLAG (Refactored Component) */}
        <FlagShader progress={flagProgress} />

        {/* TYPOGRAPHY PRE-RENDERED */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          {TEXT_PHASES.map((text, i) => (
            <div
              key={i}
              className={`phase-text phase-${i} absolute w-full max-w-4xl flex flex-wrap justify-center px-8 text-center ltr:font-sans font-black uppercase`}
              style={{
                fontSize: "clamp(1.2rem, 5vw, 2.5rem)",
                letterSpacing: "0.15em",
                color: "#fff",
                textShadow: "0 0 25px rgba(0,0,0,0.95)",
                perspective: "1000px",
              }}
            >
              {text.split(" ").map((word, wIdx) => (
                <span key={wIdx} className="inline-block mx-2">
                  {word}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* VIGNETTE */}
        <div
          className="absolute inset-0 z-50 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,1) 100%)",
          }}
        />
      </div>
    </section>
  );
};

export default TheBuildWall;
