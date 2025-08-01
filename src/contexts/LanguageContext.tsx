import React, { createContext, useState, useEffect, useCallback } from "react";
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
  detectedLanguage: SupportedLanguages | null;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

interface LanguageProviderProps {
  children: ReactNode;
}

// Function to detect browser language
const detectBrowserLanguage = (): SupportedLanguages | null => {
  try {
    // Get browser language
    const browserLang = navigator.language.toLowerCase();

    // Check for exact matches first
    const exactMatch = Object.keys(SUPPORTED_LANGUAGES).find(
      (lang) => lang.toLowerCase() === browserLang
    ) as SupportedLanguages | undefined;

    if (exactMatch) {
      return exactMatch;
    }

    // Check for language code matches (e.g., "en-us" -> "en")
    const langCode = browserLang.split("-")[0];
    const langMatch = Object.keys(SUPPORTED_LANGUAGES).find(
      (lang) => lang.toLowerCase() === langCode
    ) as SupportedLanguages | undefined;

    if (langMatch) {
      return langMatch;
    }

    // Check for RTL languages
    const rtlLanguages = ["ar", "he", "fa", "ur"];
    if (rtlLanguages.includes(langCode)) {
      return "ar"; // Default to Arabic for RTL languages
    }

    // If no match found, return null
    return null;
  } catch (error) {
    console.warn("Could not detect browser language:", error);
    return null;
  }
};

// Function to get stored language preference
const getStoredLanguage = (): SupportedLanguages | null => {
  try {
    const stored = localStorage.getItem("preferred-language");
    if (stored && stored in SUPPORTED_LANGUAGES) {
      return stored as SupportedLanguages;
    }
  } catch (error) {
    console.warn(
      "Could not read language preference from localStorage:",
      error
    );
  }
  return null;
};

// Function to store language preference
const storeLanguage = (lang: SupportedLanguages) => {
  try {
    localStorage.setItem("preferred-language", lang);
  } catch (error) {
    console.warn("Could not store language preference in localStorage:", error);
  }
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const { i18n } = useTranslation();

  // Detect browser language
  const [detectedLanguage] = useState<SupportedLanguages | null>(
    detectBrowserLanguage()
  );

  // Initialize language with priority order:
  // 1. User manually changed (stored in localStorage) - highest priority
  // 2. Browser language (if detected and available)
  // 3. English (fallback)
  const getInitialLanguage = useCallback((): SupportedLanguages => {
    // First priority: Check if user manually changed language
    const stored = getStoredLanguage();
    if (stored) {
      console.log("Language: Using stored preference:", stored);
      return stored;
    }

    // Second priority: Use detected browser language if available
    if (detectedLanguage) {
      console.log(
        "Language: Using detected browser language:",
        detectedLanguage
      );
      return detectedLanguage;
    }

    // Third priority: Fallback to English
    console.log("Language: Using fallback to English");
    return "en";
  }, [detectedLanguage]);

  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguages>(
    getInitialLanguage()
  );
  const [isRTL, setIsRTL] = useState(
    SUPPORTED_LANGUAGES[currentLanguage]?.isRTL || false
  );

  const changeLanguage = (lang: SupportedLanguages) => {
    const languageConfig = SUPPORTED_LANGUAGES[lang];
    if (!languageConfig) return;

    console.log("Language: User manually changed to:", lang);

    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    setIsRTL(languageConfig.isRTL);
    storeLanguage(lang);

    // Update document direction and language
    document.documentElement.dir = languageConfig.isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    // Set initial direction based on current language
    const lang = getInitialLanguage();
    const languageConfig = SUPPORTED_LANGUAGES[lang];

    if (languageConfig) {
      document.documentElement.dir = languageConfig.isRTL ? "rtl" : "ltr";
      document.documentElement.lang = lang;
      setIsRTL(languageConfig.isRTL);

      // Update i18n language if it's different
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang);
      }
    }
  }, [i18n, getInitialLanguage]);

  const value: LanguageContextType = {
    currentLanguage,
    isRTL,
    changeLanguage,
    availableLanguages: SUPPORTED_LANGUAGES,
    detectedLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Export the context for the hook
export { LanguageContext };
