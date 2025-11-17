import { apiClient } from '../services/api';

// Cache for translations to avoid redundant API calls
const translationCache: Record<string, string> = {};

// Queue for pending translations
const translationQueue: Map<string, Promise<string>> = new Map();

/**
 * Translate text using the backend translation API
 * Returns cached value synchronously if available, otherwise queues for async translation
 */
function translateText(text: string | undefined | null, targetLang: string): string {
  if (!text) {
    return '';
  }
  // Return original if English
  if (targetLang === 'en') {
    return text;
  }

  // Check cache first
  const cacheKey = `${text}_${targetLang}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  // If not in cache, queue the translation and return original for now
  if (!translationQueue.has(cacheKey)) {
    const promise = apiClient.post('/translate', {
      text,
      target: targetLang,
      source: 'en'
    })
      .then(response => {
        const translated = response.data.translated;
        translationCache[cacheKey] = translated;
        translationQueue.delete(cacheKey);
        // Trigger a re-render by dispatching a custom event
        window.dispatchEvent(new CustomEvent('translationUpdate'));
        return translated;
      })
      .catch(error => {
        console.error('Translation error:', error);
        translationQueue.delete(cacheKey);
        return text;
      });

    translationQueue.set(cacheKey, promise);
  }

  // Return original text while translation is in progress
  return text;
}

/**
 * Preload translations for products
 * Call this when language changes to prefetch all translations
 */
export async function preloadTranslations(
  texts: string[],
  targetLang: string
): Promise<void> {
  if (targetLang === 'en') {
    return;
  }

  // Batch translate all texts
  const promises = texts.map(async (text) => {
    const cacheKey = `${text}_${targetLang}`;
    if (!translationCache[cacheKey] && !translationQueue.has(cacheKey)) {
      try {
        const response = await apiClient.post('/translate', {
          text,
          target: targetLang,
          source: 'en'
        });
        translationCache[cacheKey] = response.data.translated;
      } catch (error) {
        console.error(`Translation error for "${text}":`, error);
      }
    }
  });

  await Promise.all(promises);
  // Trigger re-render after all translations loaded
  window.dispatchEvent(new CustomEvent('translationUpdate'));
}

/**
 * Category translations (synchronous fallback)
 */
export const categoryTranslations: Record<string, string> = {
  "All": "Todos",
  "Milk Tea": "Té con Leche",
  "Fruit Tea": "Té de Frutas",
  "Smoothie": "Batido",
  "Special": "Especial",
  "Seasonal": "Temporada",
};

/**
 * Helper function to get translated product (synchronous)
 * Uses cached translations or returns original while fetching
 */
export function translateProduct(
  productName: string,
  productDescription: string | undefined | null,
  language: string
): { name: string; description: string } {
  if (language !== 'es') {
    return { name: productName, description: productDescription ?? '' };
  }

  return {
    name: translateText(productName, language),
    description: translateText(productDescription, language)
  };
}

/**
 * Synchronous helper function to get translated category
 */
export function translateCategory(category: string, language: string): string {
  if (language === 'es' && categoryTranslations[category]) {
    return categoryTranslations[category];
  }
  return category;
}

/**
 * General text translation helper for arbitrary strings
 */
export function translateTextContent(
  text: string | undefined | null,
  language: string
): string {
  if (!text) {
    return '';
  }
  if (language !== 'es') {
    return text;
  }
  return translateText(text, language);
}
