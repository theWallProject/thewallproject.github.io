export type SupportedLanguages =
  | "en"
  | "ar"
  | "fr"
  | "es"
  | "de"
  | "id"
  | "nl"
  | "zh_CN"
  | "zh_TW";

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
  id: {
    code: "id",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    isRTL: false,
  },
  nl: {
    code: "nl",
    name: "Dutch",
    nativeName: "Nederlands",
    isRTL: false,
  },
  zh_CN: {
    code: "zh_CN",
    name: "Chinese (Simplified)",
    nativeName: "简体中文",
    isRTL: false,
  },
  zh_TW: {
    code: "zh_TW",
    name: "Chinese (Traditional)",
    nativeName: "繁體中文",
    isRTL: false,
  },
} as const;
