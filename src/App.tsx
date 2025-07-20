import React from "react";
import { LanguageProvider } from "./contexts/LanguageContext";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Downloads from "./components/Downloads";
import Newsletter from "./components/Newsletter";
import Footer from "./components/Footer";
import "./App.css";

const AppContent: React.FC = () => {
  return (
    <div className="App">
      <Hero />
      <Features />
      <Downloads />
      <Newsletter />
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </I18nextProvider>
  );
};

export default App;
