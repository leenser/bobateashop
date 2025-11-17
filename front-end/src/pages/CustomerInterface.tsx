import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { productsApi, ordersApi } from '../services/api';
import { CustomizationModal } from '../components/CustomizationModal';
import { translateToSpanish } from '../i18n/translateToSpanish';
import { translateProduct, translateCategory } from '../i18n/productTranslations';

interface Product {
  id: number;
  name: string;
  category: string;
  base_price: number;
  is_popular: boolean;
  description: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  customizations: string;
}

export const CustomerInterface: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [customizationModal, setCustomizationModal] = useState<{ product: Product | null; isOpen: boolean }>({
    product: null,
    isOpen: false,
  });
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      console.log('Loading products from API...');
      const response = await productsApi.getAll();
      console.log('Products loaded:', response.data);
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Failed to load products. Please check if the backend is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };


  const addToCart = (product: Product, customizations: string = 'Standard') => {
    const existingItem = cart.find(
      item => item.product.id === product.id && item.customizations === customizations
    );
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id && item.customizations === customizations
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, customizations }]);
    }
  };

  const handleProductClick = (product: Product) => {
    console.log('Product clicked:', product.name);
    setPendingProduct(product);
    setCustomizationModal({ product, isOpen: true });
    console.log('Customization modal should be open now');
  };

  const handleCustomizationConfirm = (customizations: string) => {
    if (pendingProduct) {
      addToCart(pendingProduct, customizations);
      setPendingProduct(null);
    }
    setCustomizationModal({ product: null, isOpen: false });
  };

  const removeFromCart = (productId: number, customizations: string) => {
    setCart(cart.filter(item => 
      !(item.product.id === productId && item.customizations === customizations)
    ));
  };

  const updateQuantity = (productId: number, customizations: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, customizations);
      return;
    }
    setCart(cart.map(item =>
      item.product.id === productId && item.customizations === customizations
        ? { ...item, quantity }
        : item
    ));
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.base_price * item.quantity), 0);
  };

  const getTax = () => {
    return getSubtotal() * 0.0825;
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
  };

  const handleTranslateClick = async () => {
    const currentLang = i18n.language;

    if (currentLang === 'en') {
      // Switch to Spanish
      try {
        await translateToSpanish();
      } catch (error) {
        console.error('Error translating to Spanish:', error);
      }
    } else {
      // Switch back to English
      i18n.changeLanguage('en');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Please add items before checking out.');
      return;
    }

    setCheckingOut(true);
    try {
      const orderData = {
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          customizations: item.customizations,
          line_price: item.product.base_price * item.quantity,
        })),
        payment: {
          method: 'card', // Kiosk default payment method
          amount: getTotal(),
        },
      };

      const response = await ordersApi.create(orderData);
      setOrderNumber(response.data.order_id);
      setOrderComplete(true);
      setCart([]);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  const startNewOrder = () => {
    setOrderComplete(false);
    setOrderNumber(null);
  };

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const popularProducts = products.filter(p => p.is_popular);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-2xl text-gray-600" role="status" aria-live="polite">{t('loading')}</div>
      </div>
    );
  }

  if (orderComplete && orderNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl text-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Order Complete!</h2>
            <p className="text-xl text-gray-600 mb-4">Your order number is</p>
            <p className="text-4xl font-bold text-purple-600 mb-6">{orderNumber}</p>
            <p className="text-gray-600 mb-8">Please proceed to the counter to pay and receive your order.</p>
            <button
              onClick={startNewOrder}
              className="px-8 py-4 bg-purple-600 text-white rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-label="Start a new order"
            >
              Start New Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        Skip to main content
      </a>
      
      {/* Header */}
      <header className="bg-white shadow-md p-4" role="banner">
        <div className="max-w-7xl mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold text-purple-600">{t('customer_title')}</h1>
          <button
            onClick={handleTranslateClick}
            className="self-start md:self-auto inline-flex items-center justify-center px-4 py-2 border border-purple-600 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors"
            aria-label={i18n.language === 'en' ? 'Switch interface to Spanish' : 'Switch interface to English'}
          >
            {i18n.language === 'en' ? 'Español' : 'English'}
          </button>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6" role="main">
        {/* Product Selection */}
        <div className="lg:col-span-2">
          {/* Category Filter */}
          <div className="mb-6 flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full font-semibold text-lg transition-all ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-purple-100'
                }`}
                aria-pressed={selectedCategory === category}
              >
                {translateCategory(category, i18n.language)}
              </button>
            ))}
          </div>

          {/* Popular Products */}
          {selectedCategory === 'All' && popularProducts.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('popular_items')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {popularProducts.map(product => {
                  const translated = translateProduct(product.name, product.description, i18n.language);
                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleProductClick(product)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleProductClick(product);
                        }
                      }}
                      aria-label={`Customize ${translated.name}`}
                    >
                      <h3 className="font-bold text-lg text-gray-800 mb-2">{translated.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{translated.description}</p>
                      <p className="text-xl font-bold text-purple-600">${product.base_price.toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {selectedCategory === 'All' ? t('all_products') : translateCategory(selectedCategory, i18n.language)}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map(product => {
                  const translated = translateProduct(product.name, product.description, i18n.language);
                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleProductClick(product)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleProductClick(product);
                        }
                      }}
                      aria-label={`Customize ${translated.name}`}
                    >
                      <h3 className="font-bold text-lg text-gray-800 mb-2">{translated.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{translated.description}</p>
                      <p className="text-xl font-bold text-purple-600">${product.base_price.toFixed(2)}</p>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('your_order')}</h2>
            
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t('cart_empty_message')}</p>
            ) : (
              <>
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {cart.map((item, index) => {
                    const translated = translateProduct(item.product.name, item.product.description, i18n.language);
                    return (
                      <div key={`${item.product.id}-${item.customizations}-${index}`} className="border-b border-gray-200 pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{translated.name}</h3>
                            <p className="text-sm text-gray-600">${item.product.base_price.toFixed(2)} {t('price_each_suffix')}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product.id, item.customizations)}
                            className="text-red-500 hover:text-red-700 text-xl font-bold"
                            aria-label={`Remove ${translated.name} from cart`}
                          >
                            ×
                          </button>
                        </div>
                      <p className="text-xs text-gray-500 mb-2">{item.customizations || 'Standard'}</p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.customizations, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="text-lg font-semibold w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.customizations, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                        <span className="ml-auto font-bold text-gray-800">
                          ${(item.product.base_price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    );
                  })}
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-lg">
                      <span>{t('subtotal_label')}</span>
                      <span>${getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span>{t('tax_label')}</span>
                      <span>${getTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold border-t border-gray-200 pt-2">
                      <span>{t('total_label')}</span>
                      <span>${getTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    className="w-full bg-purple-600 text-white py-4 rounded-lg text-lg font-bold hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || checkingOut}
                    aria-label="Checkout and complete order"
                  >
                    {checkingOut ? t('processing') : t('checkout')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Customization Modal */}
      {customizationModal.isOpen && customizationModal.product && (
        <CustomizationModal
          productName={customizationModal.product.name}
          isOpen={customizationModal.isOpen}
          onClose={() => setCustomizationModal({ product: null, isOpen: false })}
          onConfirm={handleCustomizationConfirm}
        />
      )}
    </div>
  );
};

