import EN from "./en";

export type TranslationKey = keyof typeof EN;

const ES: Partial<Record<TranslationKey, string>> = {
  all: "Todos",
  standard_option: "Estándar",
  loading: "Cargando...",
  processing: "Procesando...",
  subtotal_label: "Subtotal:",
  tax_label: "Impuesto (8.25%):",
  total_label: "Total:",
  payment_method: "Método de pago",
  cash: "Efectivo",
  card: "Tarjeta",
  other: "Otro",
  price_each_suffix: "cada uno",
  checkout: "Pagar",
  checkout_aria: "Pagar y completar pedido",
  complete_order: "Completar pedido",
  add_to_cart: "Agregar al carrito",
  cancel: "Cancelar",
  customer_title: "Tienda de Té de Burbujas - Kiosco de Autoservicio",
  popular_items: "Artículos Populares",
  all_products: "Todos los Productos",
  your_order: "Tu Pedido",
  cart_empty_message: "Tu carrito está vacío",
  cart_empty_short: "Carrito vacío",
  no_items_in_cart: "No hay artículos en el carrito",
  current_order: "Pedido Actual",
  failed_load_products: "Error al cargar productos. Verifique que el backend esté ejecutándose en el puerto 5001.",
  empty_cart_alert: "Tu carrito está vacío. Por favor agrega artículos antes de pagar.",
  ice_level: "Nivel de Hielo",
  sweetness: "Dulzura",
  base_label: "Base",
  toppings: "Complementos",
  flavor_shots_optional: "Saborizantes (Opcional)",
};

export default ES;
