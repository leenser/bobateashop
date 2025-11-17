import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import EN from "./en";
import ES from "./es";

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
    react: {
      useSuspense: false,  // Disable suspense to avoid loading issues
    },
  });

export default i18n;
