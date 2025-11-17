// Product translations for Spanish
export const productTranslations: Record<string, { name: string; description: string }> = {
  // Milk Tea products
  "Brown Sugar Milk Tea": {
    name: "Té con Leche de Azúcar Morena",
    description: "Bebida clásica de boba con azúcar morena",
  },

  // Fruit Tea products
  "Strawberry Fruit Tea": {
    name: "Té de Frutas de Fresa",
    description: "Fresa + té verde de jazmín",
  },

  // Add more products as needed
  // You can expand this as your product catalog grows
};

// Category translations
export const categoryTranslations: Record<string, string> = {
  "All": "Todos",
  "Milk Tea": "Té con Leche",
  "Fruit Tea": "Té de Frutas",
  "Smoothie": "Batido",
  "Special": "Especial",
  // Add more categories as needed
};

// Helper function to get translated product
export function translateProduct(
  productName: string,
  productDescription: string,
  language: string
): { name: string; description: string } {
  if (language === 'es' && productTranslations[productName]) {
    return productTranslations[productName];
  }
  return { name: productName, description: productDescription };
}

// Helper function to get translated category
export function translateCategory(category: string, language: string): string {
  if (language === 'es' && categoryTranslations[category]) {
    return categoryTranslations[category];
  }
  return category;
}
