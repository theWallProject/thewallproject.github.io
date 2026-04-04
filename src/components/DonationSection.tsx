import React, { useRef, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import gsap from "gsap";

const BRICK_ASSETS = [
  "/walls/wall1.png",
  "/walls/wall2.png",
  "/walls/wall3.png",
  "/walls/wall4.png",
  "/walls/wall5.png",
  "/walls/wall6.png",
  "/walls/wall7.png",
];

const DonationSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);

  // نحتفظ بـ Reference لكل صف طوب منفصل
  const row1Ref = useRef<(HTMLDivElement | null)[]>([]);
  const row2Ref = useRef<(HTMLDivElement | null)[]>([]);
  const row3Ref = useRef<(HTMLDivElement | null)[]>([]);
  const row4Ref = useRef<(HTMLDivElement | null)[]>([]);

  // State عشان نتبع إحنا في أي صف مبني دلوقتي
  const [builtRows, setBuiltRows] = useState(0);

  // مقاسات الطوب الثابتة للتعشيق
  const BRICK_HEIGHT = 42;
  const GAP = 4;
  const DROP_DISTANCE = BRICK_HEIGHT + GAP;

  const handleMouseEnter = () => {
    // Disable building hover on mobile
    if (window.innerWidth < 768) return;

    // لو بنينا الـ 4 صفوف خلاص، ما تعملش حاجة
    if (builtRows >= 4) return;

    let targetRowRef;

    // تحديد أي صف هيتبني دلوقتي
    if (builtRows === 0) targetRowRef = row1Ref.current;
    else if (builtRows === 1) targetRowRef = row2Ref.current;
    else if (builtRows === 2) targetRowRef = row3Ref.current;
    else targetRowRef = row4Ref.current;

    // أنيميشن بناء الصف الحالي
    gsap.to(targetRowRef, {
      opacity: 1,
      y: 0, // بينزل لمكانه الطبيعي
      duration: 0.5,
      ease: "bounce.out", // حركة هبدة واقعية للطوب
      stagger: 0.05,
    });

    // زيادة العداد
    setBuiltRows((prev) => prev + 1);
  };

  return (
    <section
      ref={sectionRef}
      id="donate"
      className="relative w-full min-h-[60vh] bg-[#050505] overflow-hidden py-24 px-6 flex flex-col items-center justify-center border-t border-white/5"
    >
      {/* ── SIDE ATMOSPHERIC IMAGES (MD+) ── */}
      <div className="absolute inset-0 pointer-events-none hidden md:block select-none overflow-hidden">
        {/* Left Image */}
        <div className="absolute left-10 top-0 bottom-0 w-[350px] opacity-20">
          <img
            src="/5e82d90473d74e395f8a00f9ec540cb5.jpg"
            alt=""
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
            src="/5e82d90473d74e395f8a00f9ec540cb5.jpg"
            alt=""
            className="w-full h-full object-cover"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
            }}
          />
        </div>
      </div>
      {/* ── CONTENT ── */}
      <div className="relative z-10 text-center max-w-2xl flex flex-col items-center mb-16">
        <span
          className={`block text-[10px] font-bold tracking-[0.4em] uppercase text-white/40 mb-5 px-5 py-1.5 border border-white/10 rounded-full ${i18n.language === "ar" ? "font-arabic" : "font-sans"}`}
        >
          {t("donate.sectionLabel")}
        </span>
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

        {/* Ko-fi Button - Action Trigger */}
        <a
          href="https://ko-fi.com/thewalladdon"
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={handleMouseEnter}
          className="inline-flex items-center gap-3 mt-10 px-8 py-3.5 bg-white/5 border border-white/10 hover:border-[#b72b00]/50 hover:bg-[#b72b00]/10 text-white rounded-full backdrop-blur-md transition-all duration-300 group shadow-lg"
        >
          <img
            src="/files/common/kofi-logo.png"
            alt="Ko-fi"
            className="h-5 w-auto opacity-70 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110"
          />
          <span
            className={`text-[11px] font-bold uppercase tracking-widest mt-0.5 ${i18n.language === "ar" ? "font-arabic text-sm" : "font-sans"}`}
          >
            {t("donate.button")}
          </span>
        </a>
      </div>

      {/* ── THE PROGRESSIVE WALL ── */}
      <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-full flex justify-center pointer-events-none z-1 overflow-visible">
        {/* Scale للموبايل عشان ميبوظش التعشيق */}
        <div className="relative transform scale-[0.55] sm:scale-[0.7] md:scale-100 origin-bottom">
          {/* Foundation (الصف الثابت الباهت تحت خالص) - 7 طوبات */}
          <div className="flex justify-center gap-[4px] opacity-100">
            {[4, 1, 6, 2, 5, 0, 3].map((idx, i) => (
              <img
                key={`base-${i}`}
                src={BRICK_ASSETS[idx]}
                alt=""
                className="w-[100px] h-[42px] object-cover rounded-sm"
              />
            ))}
          </div>

          {/* ROW 1 (يُبنى مع أول Hover) - 6 طوبات */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-max flex justify-center gap-[4px]"
            style={{ bottom: `${DROP_DISTANCE}px` }}
          >
            {[0, 2, 4, 1, 3, 5].map((idx, i) => (
              <div
                key={`r1-${i}`}
                ref={(el) => {
                  row1Ref.current[i] = el;
                }}
                // الطوب بيبدأ من فوق شوية ومخفي (على الديسكتوب بس)
                className="w-[100px] h-[42px] md:opacity-0 md:translate-y-[-40px] opacity-100 translate-y-0"
              >
                <img src={BRICK_ASSETS[idx]} alt="" className="w-full h-full object-cover rounded-sm" />
              </div>
            ))}
          </div>

          {/* ROW 2 (يُبنى مع ثاني Hover) - 7 طوبات */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-max flex justify-center gap-[4px]"
            style={{ bottom: `${DROP_DISTANCE * 2}px` }}
          >
            {[6, 1, 5, 0, 3, 2, 4].map((idx, i) => (
              <div
                key={`r2-${i}`}
                ref={(el) => {
                  row2Ref.current[i] = el;
                }}
                className="w-[100px] h-[42px] md:opacity-0 md:translate-y-[-40px] opacity-100 translate-y-0"
              >
                <img src={BRICK_ASSETS[idx]} alt="" className="w-full h-full object-cover rounded-sm" />
              </div>
            ))}
          </div>

          {/* ROW 3 (يُبنى مع ثالث Hover) - 6 طوبات */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-max flex justify-center gap-[4px]"
            style={{ bottom: `${DROP_DISTANCE * 3}px` }}
          >
            {[2, 4, 0, 5, 1, 6].map((idx, i) => (
              <div
                key={`r3-${i}`}
                ref={(el) => {
                  row3Ref.current[i] = el;
                }}
                className="w-[100px] h-[42px] md:opacity-0 md:translate-y-[-40px] opacity-100 translate-y-0"
              >
                <img src={BRICK_ASSETS[idx]} alt="" className="w-full h-full object-cover rounded-sm" />
              </div>
            ))}
          </div>

          {/* ROW 4 (يُبنى مع رابع Hover - الماكس الجديد) - 7 طوبات */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-max flex justify-center gap-[4px]"
            style={{ bottom: `${DROP_DISTANCE * 4}px` }}
          >
            {[1, 3, 6, 2, 4, 0, 5].map((idx, i) => (
              <div
                key={`r4-${i}`}
                ref={(el) => {
                  row4Ref.current[i] = el;
                }}
                className="w-[100px] h-[42px] md:opacity-0 md:translate-y-[-40px] opacity-100 translate-y-0"
              >
                <img src={BRICK_ASSETS[idx]} alt="" className="w-full h-full object-cover rounded-sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DonationSection;
