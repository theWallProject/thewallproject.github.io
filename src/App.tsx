import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import Header from "./components/Header";
import Hero from "./components/Hero";
import TheBuildWall from "./components/TheBuildWall";
import Features from "./components/Features";
import Testimonials from "./components/Testimonials";
import PlatformShowcase from "./components/PlatformShowcase";
import Footer from "./components/Footer";
import PrivacyPolicy from "./components/PrivacyPolicy";
import Stats from "./components/Stats";
import DonationsPage from "./components/DonationsPage";
import ErrorBoundary from "./components/ErrorBoundary";

import "./App.css";
import ReactLenis from "lenis/react";
import { useLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import DonationSection from "./components/DonationSection";
import { useScrollDebugger } from "./hooks/useScrollDebugger";
import { useBrowserDetection } from "./components/BrowserDetector";
import { useMatomoTracking } from "./hooks/useMatomoTracking";
import { useSectionTracking } from "./hooks/useSectionTracking";

const TRACKED_SECTIONS = ["hero", "platform", "features", "donate", "build-section", "testimonials", "footer"];

// Must be rendered inside <Router> so useLocation() works.
const MatomoTrackingBoundary: React.FC = () => {
  useMatomoTracking();
  return null;
};

const HomePage: React.FC = () => {
  const { isMobile } = useBrowserDetection();
  useScrollDebugger();
  useSectionTracking(TRACKED_SECTIONS);

  useEffect(() => {
    document.title = "The Wall Project";
  }, []);

  // Keep GSAP ScrollTrigger in sync with Lenis's smoothed scroll position.
  // Without this, pinned scrub timelines (TheBuildWall, Features) lag or feel
  // jerky. lagSmoothing(0) is the documented companion setting for Lenis.
  useEffect(() => {
    gsap.ticker.lagSmoothing(0);
  }, []);

  useLenis((lenis) => {
    if (isMobile) return;
    ScrollTrigger.update();
    console.warn(
      "[Lenis] scroll:",
      Math.round(lenis.scroll),
      "velocity:",
      lenis.velocity.toFixed(2),
      "dir:",
      lenis.direction,
      "isSmooth:",
      lenis.isSmooth
    );
  });
  return (
    <div className="App   ">
      {!isMobile && <ReactLenis root />}
      <Header />
      <Hero />
      <PlatformShowcase />
      <Features />
      <TheBuildWall />
      <Testimonials />
      <DonationSection />
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <Router>
          <ErrorBoundary>
            <MatomoTrackingBoundary />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/donate" element={<DonationsPage />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/stats" element={<Stats />} />
            </Routes>
          </ErrorBoundary>
        </Router>
      </LanguageProvider>
    </I18nextProvider>
  );
};

export default App;
