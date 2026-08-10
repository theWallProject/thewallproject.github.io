import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const REVIEWS_URL =
  "https://chromewebstore.google.com/detail/the-wall-boycott-assistan/kocebhffdnlgdahkbfeopdokcoikipam/reviews";

const AUTO_ADVANCE_MS = 6000;

// GPU-friendly easing: snappy ease-out-quint. Position is driven by `left` and
// `width`, which are transitioned in lockstep so the card stays centred; the
// visual growth and depth use transform + opacity only.
const SNAP_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

interface CardDims {
  cardW: number;
  centerW: number;
  step: number;
}

const getDims = (): CardDims => {
  if (typeof window === "undefined") return { cardW: 340, centerW: 680, step: 530 };
  const w = window.innerWidth;
  if (w >= 1024) return { cardW: 340, centerW: 680, step: 530 };
  if (w >= 640) return { cardW: 240, centerW: 480, step: 374 };
  return { cardW: 170, centerW: 340, step: 267 };
};

// Maps a raw index delta to the nearest slot in a wrap-around loop so only the
// middle slot (0) and its neighbours (-1, +1) are ever on screen.
const normalizeOffset = (delta: number, count: number): number => {
  const half = count / 2;
  return ((((delta + half) % count) + count) % count) - half;
};

const Star: React.FC<{ small?: boolean }> = ({ small }) => (
  <svg viewBox="0 0 20 20" className={small ? "h-3.5 w-3.5" : "h-5 w-5 md:h-6 md:w-6"} aria-hidden>
    <path fill="#f6b500" d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.03l-4.94 2.6.94-5.5-4-3.9 5.53-.8z" />
  </svg>
);

const TestimonialCard = React.memo<{ quote: string; author: string; isCenter: boolean }>(
  ({ quote, author, isCenter }) => {
    const { t } = useTranslation();
    return (
      <a
        href={REVIEWS_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${author} — ${t("testimonials.openStore")}`}
        className={`group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-black/5 bg-white text-left shadow-[0_18px_50px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_26px_64px_rgba(0,0,0,0.14)] ${
          isCenter ? "p-6 md:p-10" : "p-4 md:p-5"
        }`}
      >
        {/* Brand accent bar */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-brand-orange via-brand-red to-brand-orange"
        />

        {/* Corner arrow (visible on hover) */}
        <span className="absolute right-3 top-3 text-sm text-brand-orange opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:right-4 md:top-4 md:text-lg">
          ↗
        </span>

        {/* Star rating — every store review is 5.0 */}
        <div className={`mt-3 mb-3 flex justify-center gap-1 ${isCenter ? "mb-4 md:mb-5" : ""}`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} small={!isCenter} />
          ))}
        </div>

        <p
          className={`flex-1 overflow-hidden font-serif italic leading-relaxed text-[#1a1a1a] ${
            isCenter ? "line-clamp-4 text-[16px] md:text-[18px]" : "line-clamp-3 text-[12px] md:text-[13px]"
          }`}
        >
          &ldquo;{quote}&rdquo;
        </p>

        <p
          className={`mt-4 font-sans font-bold tracking-wide text-[#333] ${
            isCenter ? "text-[14px] md:text-[16px]" : "text-[12px] md:text-[13px]"
          }`}
        >
          {author}
        </p>
      </a>
    );
  }
);
TestimonialCard.displayName = "TestimonialCard";

const Testimonials: React.FC = () => {
  const { t, i18n } = useTranslation();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<CardDims>(getDims);
  const [reduced, setReduced] = useState(false);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const reviews = useMemo(
    () =>
      [1, 2, 3, 4, 5, 6].map((idx) => ({
        quote: t(idx === 1 ? "testimonial.quote" : `testimonial.${idx}.quote`),
        author: t(idx === 1 ? "testimonial.author" : `testimonial.${idx}.author`),
      })),
    [t]
  );

  // Respect prefers-reduced-motion and keep dims in sync with the viewport
  // (resize is throttled through rAF so it never causes jank).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onMotionChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onMotionChange);

    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setDims(getDims()));
    };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      mq.removeEventListener("change", onMotionChange);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Snappy auto-advance; stops for reduced-motion, hover or focus.
  useEffect(() => {
    if (paused || reduced) return;
    const id = setInterval(() => setActive((a) => (a + 1) % reviews.length), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [paused, reduced, reviews.length]);

  const goPrev = useCallback(() => setActive((a) => (a - 1 + reviews.length) % reviews.length), [reviews.length]);
  const goNext = useCallback(() => setActive((a) => (a + 1) % reviews.length), [reviews.length]);

  const arrowBtn =
    "flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-xl leading-none text-[#333] transition-all duration-300 hover:border-brand-orange hover:bg-brand-orange hover:text-white disabled:pointer-events-none disabled:opacity-40 md:h-12 md:w-12";

  const transition = reduced
    ? "none"
    : `left 500ms ${SNAP_EASE}, width 500ms ${SNAP_EASE}, transform 500ms ${SNAP_EASE}, opacity 420ms ease`;

  return (
    <section
      id="testimonials"
      className="relative w-full overflow-hidden py-24 text-[#333] md:py-32"
      style={{
        background:
          "radial-gradient(70% 60% at 50% 0%, rgba(183,43,0,0.10), transparent 65%), linear-gradient(180deg, #fdf8f3 0%, #f6ede2 100%)",
      }}
    >
      {/* Faint flag watermark for identity */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04] bg-cover bg-center"
        style={{
          backgroundImage: 'url("/files/common/palestine-flag-over-sunrise-75yqzvkpketv5cob.webp")',
        }}
      />

      {/* Heading */}
      <div className="relative z-10 mb-14 px-4 text-center">
        <span className="inline-block rounded-full border border-brand-orange/25 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-orange">
          {t("testimonials.community")}
        </span>
        <h2
          className={`mb-4 text-3xl font-black uppercase tracking-tighter text-[#1a1a1a] md:text-5xl ${i18n.language === "ar" ? "font-arabic" : "font-sans"}`}
        >
          {t("testimonials.title")}
        </h2>
        {/* Real-reviews tagline doubles as the CTA to leave a review */}
        <a
          href={REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`mx-auto inline-block max-w-xl text-sm font-semibold text-brand-orange underline-offset-4 transition-colors hover:text-[#8f2000] hover:underline md:text-base ${
            i18n.language === "ar" ? "font-arabic" : "font-sans"
          }`}
        >
          {t("testimonials.onlyRealReviews")} ↗
        </a>
        <div className="mx-auto mt-5 h-1 w-24 bg-linear-to-r from-transparent via-brand-orange to-transparent" />
      </div>

      {/* Coverflow carousel — fixed-height stage; absolute cards positioned by
          left/width in lockstep so the 2x-wide centre stays perfectly centred. */}
      <div
        ref={viewportRef}
        role="group"
        aria-roledescription="carousel"
        aria-label={t("testimonials.title")}
        className="relative z-10 mx-auto h-[380px] w-full max-w-[1440px] sm:h-[440px] lg:h-[500px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {reviews.map((review, i) => {
          const offset = normalizeOffset(i - active, reviews.length);
          const hidden = Math.abs(offset) > 1;
          const isCenter = offset === 0;
          const w = isCenter ? dims.centerW : dims.cardW;
          const tx = hidden ? (offset > 0 ? 2 : -2) * dims.step : offset * dims.step;
          const y = isCenter ? 0 : 14;
          const scale = isCenter ? 1 : 0.9;
          const opacity = hidden ? 0 : isCenter ? 1 : 0.55;

          return (
            <div
              key={i}
              aria-hidden={hidden}
              className="absolute"
              style={{
                top: 28,
                left: `calc(50% + ${tx - w / 2}px)`,
                width: w,
                height: "calc(100% - 56px)",
                zIndex: isCenter ? 20 : 10,
                opacity,
                pointerEvents: hidden ? "none" : "auto",
                transform: `translateY(${y}px) scale(${scale})`,
                transformOrigin: "center center",
                transition,
                willChange: "transform, opacity",
              }}
            >
              <TestimonialCard quote={review.quote} author={review.author} isCenter={isCenter} />
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="relative z-10 mt-8 flex items-center justify-center gap-6">
        <button type="button" onClick={goPrev} aria-label={t("testimonials.previous")} className={arrowBtn}>
          ‹
        </button>
        <div className="flex items-center gap-2" role="tablist" aria-label={t("testimonials.title")}>
          {reviews.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`${t("testimonials.reviewNumber", { n: i + 1 })} — ${reviews[i].author}`}
              onClick={() => setActive(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === active ? "w-7 bg-brand-orange" : "w-2.5 bg-black/15 hover:bg-black/30"
              }`}
            />
          ))}
        </div>
        <button type="button" onClick={goNext} aria-label={t("testimonials.next")} className={arrowBtn}>
          ›
        </button>
      </div>

      {/* Trust seal */}
      <div className="relative z-10 mt-16 flex flex-col items-center gap-4 px-4">
        <div className="flex items-center justify-center gap-2 opacity-70">
          <div className="h-px w-16 bg-black/15" />
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.2em] text-[#333] md:text-sm ${i18n.language === "ar" ? "font-arabic" : "font-sans"}`}
          >
            {t("testimonials.trustedBy")}
          </p>
          <div className="h-px w-16 bg-black/15" />
        </div>
        <a
          href={REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-sm font-bold text-brand-orange underline-offset-4 transition-colors hover:text-[#8f2000] hover:underline ${
            i18n.language === "ar" ? "font-arabic" : "font-sans"
          }`}
        >
          {t("testimonials.viewAll")} ↗
        </a>
      </div>
    </section>
  );
};

export default Testimonials;
