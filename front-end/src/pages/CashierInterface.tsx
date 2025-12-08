import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { productsApi, ordersApi, employeesApi } from '../services/api';
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

interface Cashier {
  id: number;
  name: string;
  employee_code: string;
  is_active: boolean;
}

export const CashierInterface: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [query, setQuery] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('card');
  const [loading, setLoading] = useState(true);
  const [customizationModal, setCustomizationModal] = useState<{ product: Product | null; isOpen: boolean }>({
    product: null,
    isOpen: false,
  });
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);

  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [selectedCashierId, setSelectedCashierId] = useState<number | ''>('');
  const [cashiersLoading, setCashiersLoading] = useState(false);
  const [cashierError, setCashierError] = useState<string | null>(null);
  const [, setTranslationTrigger] = useState(0);

  useEffect(() => {
    loadProducts();
    loadCashiers();
  }, []);

  useEffect(() => {
    const handleTranslationUpdate = () => {
      setTranslationTrigger(prev => prev + 1);
    };

    window.addEventListener('translationUpdate', handleTranslationUpdate);
    return () => {
      window.removeEventListener('translationUpdate', handleTranslationUpdate);
    };
  }, []);

  const loadCashiers = async () => {
    setCashiersLoading(true);
    setCashierError(null);
    try {
      const response = await employeesApi.getAll();
      const data: Cashier[] = (response.data || []).filter((c: Cashier) => c.is_active !== false);
      setCashiers(data);
      if (data.length > 0 && selectedCashierId === '') {
        setSelectedCashierId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading cashiers:', error);
      setCashierError('Failed to load cashiers');
    } finally {
      setCashiersLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productsApi.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCashierChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedCashierId(value === '' ? '' : Number(value));
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
    setPendingProduct(product);
    setCustomizationModal({ product, isOpen: true });
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

  const scrollToCart = () => {
    const el = document.getElementById('cashier-cart-panel');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    if (selectedCashierId === '') {
      alert('Please select a cashier before completing the order.');
      return;
    }

    try {
      const orderData = {
        cashier_id: typeof selectedCashierId === 'number' ? selectedCashierId : null,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          customizations: item.customizations || '',
          line_price: item.product.base_price * item.quantity,
        })),
        payment: {
          method: paymentMethod,
          amount: getTotal(),
        },
      };

      const response = await ordersApi.create(orderData);
      alert(`Order #${response.data.order_id} created successfully! Total: $${getTotal().toFixed(2)}`);
      setCart([]);
    } catch (error: any) {
      console.error('Error creating order:', error);
      const errorMessage = error.response?.data?.errors || error.message || 'Failed to create order';
      alert(`Failed to create order: ${errorMessage}`);
    }
  };


  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = (() => {
    const base = selectedCategory === 'All'
      ? products
      : products.filter(p => p.category === selectedCategory);
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  })();

  const handleTranslateClick = async () => {
    if (i18n.language === 'en') {
      try {
        await translateToSpanish();
      } catch (error) {
        console.error('Error translating to Spanish:', error);
      }
    } else {
      i18n.changeLanguage('en');
    }
  };

  const handleAddRandomDrink = () => {
    if (!products.length) {
      alert(t('random_drink_unavailable'));
      return;
    }

    const randomProduct = products[Math.floor(Math.random() * products.length)];
    addToCart(randomProduct, 'Standard');

    const translated = translateProduct(randomProduct.name, randomProduct.description, i18n.language);
    alert(t('random_drink_added', { name: translated.name }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-2xl text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Header - Compact */}
      <header className="bg-blue-600 dark:bg-blue-800 text-white shadow-lg p-3">
        <div className="max-w-7xl mx-auto flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold">Cashier POS System</h1>
          <button
            onClick={handleTranslateClick}
            className="self-start md:self-auto inline-flex items-center justify-center px-3 py-1.5 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 font-semibold rounded-lg shadow hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors text-sm"
            aria-label={i18n.language === 'en' ? 'Switch interface to Spanish' : 'Switch interface to English'}
          >
            {i18n.language === 'en' ? 'Español' : 'English'}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 pb-24 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Select Cashier</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Orders will be assigned to the selected cashier.</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-2 w-full md:w-auto">
            {cashiersLoading ? (
              <span className="text-xs text-gray-500 dark:text-gray-400">Loading cashiers...</span>
            ) : cashiers.length > 0 ? (
              <select
                value={selectedCashierId === '' ? '' : String(selectedCashierId)}
                onChange={handleCashierChange}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {cashiers.map(cashier => (
                  <option key={cashier.id} value={cashier.id}>
                    {cashier.name} ({cashier.employee_code})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-red-600 dark:text-red-400">No active cashiers available.</span>
            )}
            <button
              type="button"
              onClick={loadCashiers}
              className="px-3 py-1.5 text-sm bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
        {cashierError && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg">
            {cashierError}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection - Larger touch-friendly buttons */}
        <div className="lg:col-span-2">
          {/* Search - Compact */}
          <div className="mb-3 flex flex-col md:flex-row md:items-center gap-2">
            <div className="flex-1">
              <label htmlFor="cashier-search-products" className="sr-only">Search products</label>
              <input
                id="cashier-search-products"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                className="w-full h-9 px-3 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 text-sm"
              />
            </div>
            <button
              onClick={handleAddRandomDrink}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-green-500 text-white font-semibold rounded-lg shadow hover:from-blue-700 hover:to-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              aria-label={t('random_drink')}
            >
              {t('random_drink')}
            </button>
          </div>
          {/* Category Filter - Compact */}
          <div className="mb-4 flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 border-2 border-gray-300 dark:border-gray-600'
                }`}
                aria-pressed={selectedCategory === category}
              >
                {translateCategory(category, i18n.language)}
              </button>
            ))}
          </div>

          {/* Products Grid - Compact for efficiency */}
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredProducts.map(product => {
              const translated = translateProduct(product.name, product.description, i18n.language);
              return (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-3 hover:shadow-lg transition-shadow text-left border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400 flex flex-col justify-between min-h-[100px]"
                aria-label={`Add ${translated.name} to cart`}
              >
                <h3 className="font-bold text-base text-gray-800 dark:text-gray-200 mb-1 line-clamp-2 leading-tight">{translated.name}</h3>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-auto">${product.base_price.toFixed(2)}</p>
              </button>
            );
            })}
          </div>
        </div>

        {/* Cart and Checkout Panel */}
        <div className="lg:col-span-1" id="cashier-cart-panel">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sticky top-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">Current Order</h2>
            
            {cart.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No items in cart</p>
            ) : (
              <>
                <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                  {cart.map((item, index) => {
                    const translated = translateProduct(item.product.name, item.product.description, i18n.language);
                    return (
                    <div key={`${item.product.id}-${item.customizations}-${index}`} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{translated.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.customizations || 'Standard'}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.customizations)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-lg font-bold ml-2 flex-shrink-0"
                          aria-label={`Remove ${translated.name} from cart`}
                        >
                          ×
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.customizations, item.quantity - 1)}
                            className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center font-bold text-sm"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="text-base font-semibold w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.customizations, item.quantity + 1)}
                            className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center font-bold text-sm"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                          ${(item.product.base_price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                  })}
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="font-semibold">${getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tax (8.25%):</span>
                    <span className="font-semibold">${getTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                    <span>Total:</span>
                    <span>${getTotal().toFixed(2)}</span>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                          paymentMethod === 'cash'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        Cash
                      </button>
                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                          paymentMethod === 'card'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        Card
                      </button>
                      <button
                        onClick={() => setPaymentMethod('other')}
                        className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                          paymentMethod === 'other'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        Other
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={selectedCashierId === ''}
                    className="w-full bg-green-600 text-white py-3 rounded-lg text-lg font-bold hover:bg-green-700 transition-colors mt-3 disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed"
                  >
                    Complete Order
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Floating mobile cart button to access cart anywhere */}
      {cart.length > 0 && (
        <div className="md:hidden fixed bottom-4 right-4 z-50">
          <button
            onClick={scrollToCart}
            className="rounded-full bg-green-600 text-white h-12 px-5 shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            aria-label="View cart"
          >
            Cart ({cart.length}) • ${getTotal().toFixed(2)}
          </button>
        </div>
      )}
    </div>

      {/* Customization Modal */}
      {customizationModal.isOpen && customizationModal.product && (
        <CustomizationModal
          productName={translateProduct(
            customizationModal.product.name,
            customizationModal.product.description,
            i18n.language
          ).name}
          isOpen={customizationModal.isOpen}
          onClose={() => setCustomizationModal({ product: null, isOpen: false })}
          onConfirm={handleCustomizationConfirm}
        />
      )}
    </div>
  );
};
