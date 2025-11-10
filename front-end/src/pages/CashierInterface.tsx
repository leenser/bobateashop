import React, { useState, useEffect } from 'react';
import { productsApi, ordersApi, employeesApi } from '../services/api';
import { CustomizationModal } from '../components/CustomizationModal';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
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

  useEffect(() => {
    loadProducts();
    loadCashiers();
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
        cashier_id: selectedCashierId,
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
  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Cashier POS System</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Select Cashier</h2>
            <p className="text-sm text-gray-500">Orders will be assigned to the selected cashier.</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
            {cashiersLoading ? (
              <span className="text-sm text-gray-500">Loading cashiers...</span>
            ) : cashiers.length > 0 ? (
              <select
                value={selectedCashierId === '' ? '' : String(selectedCashierId)}
                onChange={handleCashierChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {cashiers.map(cashier => (
                  <option key={cashier.id} value={cashier.id}>
                    {cashier.name} ({cashier.employee_code})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-red-600">No active cashiers available.</span>
            )}
            <button
              type="button"
              onClick={loadCashiers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
        {cashierError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">
            {cashierError}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection - Larger touch-friendly buttons */}
        <div className="lg:col-span-2">
          {/* Category Filter */}
          <div className="mb-6 flex flex-wrap gap-3">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-8 py-4 rounded-lg font-semibold text-xl transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-blue-100 border-2 border-gray-300'
                }`}
                aria-pressed={selectedCategory === category}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Products Grid - Larger for touchscreen */}
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left border-2 border-transparent hover:border-blue-500"
                aria-label={`Customize ${product.name}`}
              >
                <h3 className="font-bold text-xl text-gray-800 mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                <p className="text-2xl font-bold text-blue-600">${product.base_price.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart and Checkout Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Current Order</h2>
            
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No items in cart</p>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                  {cart.map((item, index) => (
                    <div key={`${item.product.id}-${item.customizations}-${index}`} className="border-b border-gray-200 pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg">{item.product.name}</h3>
                          <p className="text-sm text-gray-600">${item.product.base_price.toFixed(2)} each</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.customizations)}
                          className="text-red-500 hover:text-red-700 text-2xl font-bold ml-2"
                          aria-label={`Remove ${item.product.name} from cart`}
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{item.customizations || 'Standard'}</p>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.customizations, item.quantity - 1)}
                          className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-xl"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="text-xl font-semibold w-12 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.customizations, item.quantity + 1)}
                          className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-xl"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                        <span className="ml-auto font-bold text-gray-800 text-lg">
                          ${(item.product.base_price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-lg">
                    <span>Subtotal:</span>
                    <span>${getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span>Tax (8.25%):</span>
                    <span>${getTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-bold border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span>${getTotal().toFixed(2)}</span>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                          paymentMethod === 'cash'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Cash
                      </button>
                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                          paymentMethod === 'card'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Card
                      </button>
                      <button
                        onClick={() => setPaymentMethod('other')}
                        className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                          paymentMethod === 'other'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Other
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={selectedCashierId === ''}
                    className="w-full bg-green-600 text-white py-5 rounded-lg text-xl font-bold hover:bg-green-700 transition-colors mt-4 disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed"
                  >
                    Complete Order
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>

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


