import React from "react";
import { useTranslation } from "react-i18next";
import { LogoLoop, type LogoItem } from "./LogoLoop";
import { useDownloadLinks } from "./useDownloadLinks";
import MorphingBackground from "./MorphingBackground";

const TestimonialCard: React.FC<{
  quote: string;
  author: string;
  role: string;
}> = ({ quote, author, role }) => {
  const { i18n } = useTranslation();
  return (
    <div
      className={`relative w-[280px] sm:w-[380px] p-6 sm:p-9 rounded-4xl border border-white/5 shadow-xl overflow-hidden group transition-all duration-700 hover:border-brand-orange/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${
        i18n.language === "ar" ? "text-right" : "text-left"
      }`}
      style={{
        background: "linear-gradient(165deg, rgba(30, 30, 30, 0.4) 0%, rgba(10, 10, 10, 0.9) 100%)",
        backdropFilter: "blur(25px)",
      }}
    >
      {/* Decorative Glow */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-brand-orange/5 rounded-full blur-[100px] group-hover:bg-brand-orange/10 transition-colors duration-1000" />

      {/* Quote Icon */}
      <div
        className={`text-5xl sm:text-6xl absolute top-2 font-serif text-brand-orange/15 leading-none mb-2 select-none ${i18n.language === "ar" ? "-mr-1" : "-ml-1"}`}
      >
        &ldquo;
      </div>

      <p
        className={`relative z-10 text-sm sm:text-base text-white/80 font-serif leading-relaxed mb-6 italic tracking-tight ${i18n.language === "ar" ? "font-arabic font-medium leading-[1.8]" : ""}`}
      >
        {quote}
      </p>

      <div className="flex items-center gap-3 mt-auto border-t border-white/5 pt-6">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-brand-orange/80 to-brand-red/80 flex items-center justify-center text-white/90 font-bold text-lg shadow-inner ring-1 ring-white/10">
          {author[0]}
        </div>
        <div>
          <h4
            className={`text-white/90 font-bold text-sm tracking-tight ${i18n.language === "ar" ? "font-arabic" : "font-sans"}`}
          >
            {author}
          </h4>
          <p
            className={`text-white/30 text-[10px] sm:text-xs tracking-widest uppercase font-bold ${i18n.language === "ar" ? "font-arabic" : "font-sans"}`}
          >
            {role}
          </p>
        </div>
      </div>
    </div>
  );
};

const Testimonials: React.FC = () => {
  const { t } = useTranslation();
  const { browserDisplayName } = useDownloadLinks();

  const testimonialList = [1, 2, 3, 4, 5, 6].map((idx) => {
    const quoteKey = idx === 1 ? "testimonial.quote" : `testimonial.${idx}.quote`;
    const authorKey = idx === 1 ? "testimonial.author" : `testimonial.${idx}.author`;
    const roleKey = idx === 1 ? "testimonial.role" : `testimonial.${idx}.role`;

    return {
      node: (
        <TestimonialCard quote={t(quoteKey)} author={t(authorKey)} role={t(roleKey, { browser: browserDisplayName })} />
      ),
    };
  });

  const row1 = testimonialList.slice(0, 3);
  const row2 = testimonialList.slice(3, 6);

  const renderTestimonial = (item: LogoItem, key: React.Key) => {
    if ("node" in item && item.node) {
      return <div key={key}>{item.node}</div>;
    }
    return null;
  };

  return (
    <section id="testimonials" className="relative w-full py-24 md:py-32 overflow-hidden">
      {/* Background with Fixed Image and Gradient Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-90"
          style={{
            backgroundImage: 'url("/palestine-flag-over-sunrise-75yqzvkpketv5cob.jpg")',
          }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-[#050505] via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-[#050505] via-transparent to-[#050505]" />
      </div>

      <div className="relative z-10 text-center mb-16 px-4">
        <span className="inline-block text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase mb-3 px-4 py-1 border border-white/5 rounded-full">
          {t("testimonials.community")}
        </span>
        <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
          {t("testimonials.title")}
        </h2>
        <div className="w-24 h-1 bg-linear-to-r from-transparent via-brand-orange to-transparent mx-auto opacity-30" />
      </div>

      <div dir="ltr" className="space-y-8">
        {/* Row 1 - Left */}
        <LogoLoop
          logos={row1}
          direction="left"
          speed={40}
          gap={window.innerWidth < 768 ? 20 : 60}
          logoHeight={0} // Not used with custom render
          renderItem={renderTestimonial}
          pauseOnHover={true}
        />
        {/* Row 2 - Right */}
        <LogoLoop
          logos={row2}
          speed={-25}
          gap={window.innerWidth < 768 ? 20 : 60}
          logoHeight={0} // Not used with custom render
          renderItem={renderTestimonial}
          direction="right"
          pauseOnHover={true}
        />
      </div>

      {/* Trust Seal */}
      <div className="mt-28 flex justify-center items-center gap-2 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="h-px w-16 bg-white/20" />
        <p className="text-white text-[10px] md:text-sm font-bold tracking-[0.2em] uppercase">
          Trusted by over 100k+ global users
        </p>
        <div className="h-px w-16 bg-white/20" />
      </div>

      {/* Transition Effect - Positioned at the TRUE bottom - Hidden on mobile */}
      {typeof window !== "undefined" && window.innerWidth >= 768 && (
        <div className="absolute bottom-[-15%] left-0 w-full h-[60%] z-0 pointer-events-none opacity-60">
          <MorphingBackground color="#050505" edgeSoftness={0.4} />
        </div>
      )}
    </section>
  );
};

export default Testimonials;
