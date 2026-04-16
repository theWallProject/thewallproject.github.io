import type { SupportedLanguages } from "../types/translations";

const APPSTORE_BADGE_PATHS: Record<SupportedLanguages, string> = {
  en: "/files/common/appstore/appstore-badge-en.svg",
  ar: "/files/common/appstore/appstore-badge-ar.svg",
  fr: "/files/common/appstore/appstore-badge-fr.svg",
  es: "/files/common/appstore/appstore-badge-es.svg",
  de: "/files/common/appstore/appstore-badge-de.svg",
  id: "/files/common/appstore/appstore-badge-id.svg",
  nl: "/files/common/appstore/appstore-badge-nl.svg",
  zh_CN: "/files/common/appstore/appstore-badge-zh_CN.svg",
  zh_TW: "/files/common/appstore/appstore-badge-zh_TW.svg",
};

const PLAYSTORE_BADGE_PATH = "/files/common/playstore/GetItOnGooglePlay_Badge_Web_color_English.svg";

export const getBadgePath = (language: string, isIOS: boolean, isAndroid: boolean): string | null => {
  if (isIOS && language in APPSTORE_BADGE_PATHS) {
    return APPSTORE_BADGE_PATHS[language as SupportedLanguages];
  }
  if (isAndroid) {
    return PLAYSTORE_BADGE_PATH;
  }
  return null;
};
