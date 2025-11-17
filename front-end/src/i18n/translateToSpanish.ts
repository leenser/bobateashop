import i18n from "./i18n";

export async function translateToSpanish() {
  // Spanish translations are already loaded in es.ts
  // Just switch the language
  i18n.changeLanguage("es");
}
