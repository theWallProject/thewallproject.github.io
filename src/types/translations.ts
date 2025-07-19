export type SupportedLanguages = "en" | "ar" | "fr" | "es" | "de";

export interface LanguageConfig {
  code: SupportedLanguages;
  name: string;
  nativeName: string;
  isRTL: boolean;
  flag?: string;
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguages, LanguageConfig> = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    isRTL: false,
    flag: "🇺🇸",
  },
  ar: {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    isRTL: true,
    flag: "🇸🇦",
  },
  fr: {
    code: "fr",
    name: "French",
    nativeName: "Français",
    isRTL: false,
    flag: "🇫🇷",
  },
  es: {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    isRTL: false,
    flag: "🇪🇸",
  },
  de: {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    isRTL: false,
    flag: "🇩��",
  },
} as const;
