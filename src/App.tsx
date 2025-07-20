import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useLanguage } from "./contexts/LanguageContext";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Downloads from "./components/Downloads";
import Features from "./components/Features";
import Newsletter from "./components/Newsletter";
import Footer from "./components/Footer";
import PrivacyPolicy from "./components/PrivacyPolicy";
import "./App.css";

const HomePage: React.FC = () => {
  return (
    <>
      <Hero />
      <Downloads />
      <Features />
      <Newsletter />
    </>
  );
};

const App: React.FC = () => {
  const { currentLanguage } = useLanguage();

  return (
    <Router>
      <div className="App">
        <Header />
        <main dir={currentLanguage === "ar" ? "rtl" : "ltr"}>
          <div className="main-content-wrapper">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
