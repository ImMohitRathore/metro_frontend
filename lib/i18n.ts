import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translation files
import enTranslations from "../locales/en/common.json";
import hiTranslations from "../locales/hi/common.json";

// Get language from localStorage or default to 'en'
const getInitialLanguage = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("language") || "en";
  }
  return "en";
};

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslations,
    },
    hi: {
      translation: hiTranslations,
    },
  },
  lng: getInitialLanguage(), // default language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  react: {
    useSuspense: false, // Disable suspense for Next.js
  },
});

export default i18n;
