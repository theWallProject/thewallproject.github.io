import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguages,
} from "../types/translations";

interface LanguageContextType {
  currentLanguage: SupportedLanguages;
  isRTL: boolean;
  changeLanguage: (lang: SupportedLanguages) => void;
  availableLanguages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguages>(
    (i18n.language as SupportedLanguages) || "en"
  );
  const [isRTL, setIsRTL] = useState(
    SUPPORTED_LANGUAGES[currentLanguage]?.isRTL || false
  );

  const changeLanguage = (lang: SupportedLanguages) => {
    const languageConfig = SUPPORTED_LANGUAGES[lang];
    if (!languageConfig) return;

    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    setIsRTL(languageConfig.isRTL);

    // Update document direction and language
    document.documentElement.dir = languageConfig.isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    // Set initial direction based on current language
    const lang = (i18n.language as SupportedLanguages) || "en";
    const languageConfig = SUPPORTED_LANGUAGES[lang];

    if (languageConfig) {
      document.documentElement.dir = languageConfig.isRTL ? "rtl" : "ltr";
      document.documentElement.lang = lang;
      setIsRTL(languageConfig.isRTL);
    }
  }, [i18n.language]);

  const value: LanguageContextType = {
    currentLanguage,
    isRTL,
    changeLanguage,
    availableLanguages: SUPPORTED_LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
