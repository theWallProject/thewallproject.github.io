export type SupportedLanguages = "en" | "ar" | "fr" | "es" | "de";

export interface LanguageConfig {
  code: SupportedLanguages;
  name: string;
  nativeName: string;
  isRTL: boolean;
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguages, LanguageConfig> = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    isRTL: false,
  },
  ar: {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    isRTL: true,
  },
  fr: {
    code: "fr",
    name: "French",
    nativeName: "Français",
    isRTL: false,
  },
  es: {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    isRTL: false,
  },
  de: {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    isRTL: false,
  },
} as const;
