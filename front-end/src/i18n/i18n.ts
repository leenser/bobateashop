import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import EN from "./en";
import ES from "./es";

// Load cached Spanish translations if they exist
const cached = localStorage.getItem("translations_es");
if (cached) {
  const parsed = JSON.parse(cached);
  Object.assign(ES, parsed);
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: EN },
      es: { translation: ES },
    },
    lng: "en",          // default language
    fallbackLng: "en",  // if something is missing, use English
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
