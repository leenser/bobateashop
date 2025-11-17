import i18n from "./i18n";
import { preloadTranslations } from "./productTranslations";
import { productsApi } from "../services/api";

export async function translateToSpanish() {
  // Switch the language for UI elements
  i18n.changeLanguage("es");

  // Preload product translations
  try {
    const response = await productsApi.getAll();
    const products = response.data;

    // Extract all product names and descriptions
    const textsToTranslate: string[] = [];
    products.forEach((product: any) => {
      textsToTranslate.push(product.name);
      if (product.description) {
        textsToTranslate.push(product.description);
      }
    });

    // Preload all translations
    await preloadTranslations(textsToTranslate, "es");
  } catch (error) {
    console.error("Error preloading translations:", error);
  }
}
