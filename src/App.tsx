import React from "react";
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
import CustomCursor from "./components/CustomCursor";
import "./App.css";
import ReactLenis from "lenis/react";
import { useLenis } from "lenis/react";
import DonationSection from "./components/DonationSection";
import { useScrollDebugger } from "./hooks/useScrollDebugger";

const HomePage: React.FC = () => {
  useScrollDebugger();
  useLenis((lenis) => {
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
      <ReactLenis root />
      <CustomCursor />
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
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </I18nextProvider>
  );
};

export default App;
