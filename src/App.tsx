import React from "react";
import { useLanguage } from "./contexts/LanguageContext";
import LanguageSwitcher from "./components/LanguageSwitcher";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Downloads from "./components/Downloads";
import Features from "./components/Features";
import Footer from "./components/Footer";
import "./App.css";

const App: React.FC = () => {
  const { currentLanguage } = useLanguage();

  return (
    <div className="App" dir={currentLanguage === "ar" ? "rtl" : "ltr"}>
      <LanguageSwitcher />
      <main>
        <Header />
        <Hero />
        <Downloads />
        <Features />
        <Footer />
      </main>
    </div>
  );
};

export default App;
