import axios from "axios";
import EN from "./en";
import ES from "./es";
import type { TranslationKey } from "./es";
import i18n from "./i18n";

export async function translateToSpanish() {
  const keys = Object.keys(EN) as TranslationKey[];

  for (const key of keys) {
    const text = EN[key];

    const res = await axios.post(
      import.meta.env.VITE_API_BASE_URL + "/translate",
      {
        text,
        target: "es",
      }
    );

    ES[key] = res.data.translated;
  }

  // Save to cache
  localStorage.setItem("translations_es", JSON.stringify(ES));

  // Switch UI
  i18n.changeLanguage("es");
}
