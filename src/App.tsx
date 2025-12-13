import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import DownloadSnippet from "./components/DownloadSnippet";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Footer from "./components/Footer";
import PrivacyPolicy from "./components/PrivacyPolicy";
import "./App.css";

const HomePage: React.FC = () => {
  return (
    <div className="App">
      <Header />
      <Hero />
      <Features />
      <DownloadSnippet />
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
