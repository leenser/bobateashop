import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ordersApi, inventoryApi, reportsApi, employeesApi, productsApi } from '../services/api';
import { translateToSpanish } from '../i18n/translateToSpanish';
import { translateTextContent } from '../i18n/productTranslations';

interface Order {
  id: number;
  cashier_id: number | null;
  subtotal: number;
  tax: number;
  total: number;
  order_time: string;
  status: string;
  items: Array<{
    product_id: number;
    quantity: number;
    customizations?: string;
    line_price: number;
  }>;
  payments: Array<{
    method: string;
    amount: number;
  }>;
}

interface InventoryItem {
  id: number;
  item_name: string;
  current_stock: number;
  min_threshold: number;
  unit: string;
  last_restock_date?: string;
}

interface Cashier {
  id: number;
  name: string;
  employee_code: string;
  role: string;
  is_active: boolean;
  hire_date?: string;
}

interface XReportData {
  hour: number;
  sales: number;
  orders: number;
  cash: number;
  card: number;
  other: number;
}

interface ZReportData {
  period_start: string;
  period_end: string;
  gross_sales: number;
  tax_total: number;
  orders_total: number;
  cash_total: number;
  card_total: number;
  other_total: number;
}

interface WeeklyItem {
  name: string;
  value: number;
}

interface DailyTopEntry {
  day: string;
  item: string;
  value: number;
}

interface Product {
  id: number;
  name: string;
  category: string;
  base_price: number;
  is_popular: boolean;
  description: string;
}

const CASHIER_ROLE_OPTIONS = [
  { value: 'cashier', label: 'Cashier' },
  { value: 'shift_lead', label: 'Shift Lead' },
  { value: 'manager', label: 'Manager' },
];

export const ManagerInterface: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<'orders' | 'inventory' | 'cashiers' | 'reports' | 'products'>('orders');
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Editing states
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [editingInventory, setEditingInventory] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({});
  const [inventoryForm, setInventoryForm] = useState<Partial<InventoryItem>>({});
  
  // Add new product form state
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    category: '',
    base_price: 0,
    is_popular: false,
    description: '',
  });

  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [cashiersLoading, setCashiersLoading] = useState(false);
  const [cashierError, setCashierError] = useState<string | null>(null);
  const [cashierForm, setCashierForm] = useState({ name: '', employee_code: '', role: 'cashier' });
  const [cashierFormSubmitting, setCashierFormSubmitting] = useState(false);

  const [xReport, setXReport] = useState<XReportData[]>([]);
  const [zReport, setZReport] = useState<ZReportData | null>(null);
  const [weeklyItems, setWeeklyItems] = useState<WeeklyItem[]>([]);
  const [dailyTop, setDailyTop] = useState<DailyTopEntry[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [, setTranslationTrigger] = useState(0);

  useEffect(() => {
    if (selectedTab === 'orders') {
      loadOrders();
    } else if (selectedTab === 'inventory') {
      loadInventory();
    } else if (selectedTab === 'cashiers') {
      loadCashiers();
    } else if (selectedTab === 'reports') {
      loadChartsData();
    } else if (selectedTab === 'products') {
      loadProducts();
    }
  }, [selectedTab, dateRange]);

  useEffect(() => {
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

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await ordersApi.getAll({
        from: dateRange.from,
        to: dateRange.to,
        page_size: 50,
      });
      setOrders(response.data.orders || []);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    setLoading(true);
    try {
      const response = await inventoryApi.getAll();
      setInventory(response.data || []);
    } catch (error: any) {
      console.error('Error loading inventory:', error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productsApi.getAll();
      setProducts(response.data || []);
    } catch (error: any) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCashiers = async () => {
    setCashiersLoading(true);
    setCashierError(null);
    try {
      const response = await employeesApi.getAll();
      setCashiers(response.data || []);
    } catch (error) {
      console.error('Error loading cashiers:', error);
      setCashierError(t('failed_load_cashiers'));
    } finally {
      setCashiersLoading(false);
    }
  };

  const handleCashierFormChange = (field: 'name' | 'employee_code' | 'role') => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setCashierForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleAddCashier = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cashierForm.name.trim() || !cashierForm.employee_code.trim()) {
      setCashierError(t('cashier_form_required'));
      return;
    }
    setCashierError(null);
    setCashierFormSubmitting(true);
    try {
      await employeesApi.create({
        name: cashierForm.name.trim(),
        employee_code: cashierForm.employee_code.trim(),
        role: cashierForm.role,
      });
      setCashierForm({ name: '', employee_code: '', role: 'cashier' });
      await loadCashiers();
    } catch (error: any) {
      console.error('Error creating cashier:', error);
      const message = error.response?.data?.message || error.message || t('failed_create_cashier');
      setCashierError(message);
    } finally {
      setCashierFormSubmitting(false);
    }
  };

  const handleDeleteCashier = async (cashierId: number) => {
    const confirmed = window.confirm(t('confirm_remove_cashier'));
    if (!confirmed) return;
    try {
      await employeesApi.delete(cashierId);
      await loadCashiers();
    } catch (error) {
      console.error('Error deleting cashier:', error);
      alert(t('failed_delete_cashier'));
    }
  };

  // Product edit handlers
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product.id);
    setProductForm({ ...product });
  };

  const handleCancelEditProduct = () => {
    setEditingProduct(null);
    setProductForm({});
  };

  const handleSaveProduct = async (productId: number) => {
    try {
      await productsApi.update(productId, productForm);
      setEditingProduct(null);
      setProductForm({});
      await loadProducts();
      alert(t('product_updated_success'));
    } catch (error: any) {
      console.error('Error updating product:', error);
      alert(error.response?.data?.message || t('failed_update_product'));
    }
  };

  const handleAddProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Validate all required fields
    const name = newProductForm.name?.trim();
    const category = newProductForm.category?.trim();
    const basePrice = newProductForm.base_price;
    
    if (!name || !category || !basePrice || basePrice <= 0 || isNaN(basePrice)) {
      alert(t('product_form_required'));
      return;
    }
    
    try {
      // Ensure all fields are properly formatted and not null/undefined
      const productData = {
        name: name,
        category: category,
        base_price: parseFloat(String(basePrice)), // Ensure it's a valid float
        is_popular: newProductForm.is_popular === true, // Explicit boolean
        description: newProductForm.description?.trim() || '', // Empty string if null/undefined
      };
      
      // Double-check no null values
      if (productData.name === null || productData.category === null || productData.base_price === null || isNaN(productData.base_price)) {
        alert(t('product_form_required'));
        return;
      }
      
      console.log('Sending product data:', productData);
      await productsApi.create(productData);
      setNewProductForm({ name: '', category: '', base_price: 0, is_popular: false, description: '' });
      setShowAddProductForm(false);
      await loadProducts();
      alert(t('product_added_success'));
    } catch (error: any) {
      console.error('Error creating product:', error);
      const errorData = error.response?.data;
      let errorMessage = t('failed_create_product');
      
      if (errorData) {
        if (errorData.errors) {
          // Marshmallow validation errors
          const errorMessages = Object.entries(errorData.errors)
            .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          errorMessage = `Validation errors:\n${errorMessages}`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = `${errorMessage}\n${errorData.detail}`;
        }
      }
      alert(errorMessage);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    const confirmed = window.confirm(t('confirm_delete_product'));
    if (!confirmed) return;
    try {
      await productsApi.delete(productId);
      await loadProducts();
      alert(t('product_deleted_success'));
    } catch (error: any) {
      console.error('Error deleting product:', error);
      alert(error.response?.data?.message || t('failed_delete_product'));
    }
  };

  // Inventory edit handlers
  const handleEditInventory = (item: InventoryItem) => {
    setEditingInventory(item.id);
    setInventoryForm({ ...item });
  };

  const handleCancelEditInventory = () => {
    setEditingInventory(null);
    setInventoryForm({});
  };

  const handleSaveInventory = async (itemId: number) => {
    try {
      await inventoryApi.update(itemId, inventoryForm);
      setEditingInventory(null);
      setInventoryForm({});
      await loadInventory();
      alert(t('inventory_updated_success'));
    } catch (error: any) {
      console.error('Error updating inventory:', error);
      alert(error.response?.data?.message || t('failed_update_inventory'));
    }
  };

  const loadChartsData = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const [weeklyRes, dailyRes] = await Promise.all([
        reportsApi.getWeeklyItems(),
        reportsApi.getDailyTop(7),
      ]);
      setWeeklyItems(weeklyRes.data || []);
      setDailyTop(dailyRes.data || []);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setAnalyticsError(t('failed_load_charts'));
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadXReport = async () => {
    setReportLoading(true);
    try {
      const response = await reportsApi.getXReport();
      setXReport(response.data || []);
    } catch (error: any) {
      console.error('Error loading X report:', error);
      setXReport([]);
    } finally {
      setReportLoading(false);
    }
  };

  const loadZReport = async (reset: boolean = false) => {
    setReportLoading(true);
    try {
      const response = await reportsApi.getZReport(reset);
      setZReport(response.data);
    } catch (error: any) {
      console.error('Error loading Z report:', error);
      setZReport(null);
    } finally {
      setReportLoading(false);
    }
  };

  const totalSales = useMemo(() => (
    orders.filter((order) => order.status === 'Complete').reduce((sum, order) => sum + order.total, 0)
  ), [orders]);

  const totalOrders = useMemo(() => (
    orders.filter((order) => order.status === 'Complete').length
  ), [orders]);

  const averageOrder = totalOrders > 0 ? (totalSales / totalOrders) : 0;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'cashier':
        return t('cashier_label');
      case 'shift_lead':
        return t('shift_lead_label');
      case 'manager':
        return t('manager_label');
      default:
        return role;
    }
  };

  const getTabLabel = (tab: 'orders' | 'inventory' | 'cashiers' | 'reports' | 'products') => {
    switch (tab) {
      case 'orders':
        return t('orders_label');
      case 'inventory':
        return t('inventory_label');
      case 'cashiers':
        return t('cashiers_label');
      case 'reports':
        return t('reports_label');
      case 'products':
        return t('products_label');
      default:
        return tab;
    }
  };

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

  const cashierNameLookup = useMemo(() => {
    const map = new Map<number, string>();
    cashiers.forEach((cashier) => {
      map.set(cashier.id, cashier.name);
    });
    return map;
  }, [cashiers]);

  const maxWeekly = weeklyItems.length > 0 ? Math.max(...weeklyItems.map((item) => item.value)) : 0;
  const maxDaily = dailyTop.length > 0 ? Math.max(...dailyTop.map((entry) => entry.value)) : 0;

  const getOrderItemCount = (order: Order) => {
    return order.items.reduce((total, item) => total + (item.quantity ?? 1), 0);
  };

  const renderOrdersTab = () => (
    <div>
      {loading ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">{t('loading_orders')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('order_id_header')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('date_time_header')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('cashier_label')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('items_header')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('total_header')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('status_header')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">#{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(order.order_time).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {order.cashier_id ? cashierNameLookup.get(order.cashier_id) || t('cashier_number', { id: order.cashier_id }) : t('kiosk_order')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{t('item_count_label', { count: getOrderItemCount(order) })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">${order.total.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === 'Complete'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'Refunded'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('no_orders_in_range')}</div>
          )}
        </div>
      )}
    </div>
  );

  const renderInventoryTab = () => (
    <div>
      {loading ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">{t('loading_inventory')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('inventory_item_header')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('current_stock_header')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('threshold_header')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('unit_header')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('status_header')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('actions_header')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {inventory.map((item) => {
                const isLowStock = item.current_stock <= item.min_threshold;
                const isEditing = editingInventory === item.id;
                return (
                  <tr key={item.id} className={isLowStock ? 'bg-red-50 dark:bg-red-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}>
                    {isEditing ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={inventoryForm.item_name || ''}
                            onChange={(e) => setInventoryForm({ ...inventoryForm, item_name: e.target.value })}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded w-full"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={inventoryForm.current_stock ?? ''}
                            onChange={(e) => setInventoryForm({ ...inventoryForm, current_stock: parseFloat(e.target.value) || 0 })}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded w-24"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={inventoryForm.min_threshold ?? ''}
                            onChange={(e) => setInventoryForm({ ...inventoryForm, min_threshold: parseFloat(e.target.value) || 0 })}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded w-24"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={inventoryForm.unit || ''}
                            onChange={(e) => setInventoryForm({ ...inventoryForm, unit: e.target.value })}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded w-20"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            (inventoryForm.current_stock ?? 0) <= (inventoryForm.min_threshold ?? 0) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {(inventoryForm.current_stock ?? 0) <= (inventoryForm.min_threshold ?? 0) ? t('low_stock') : t('in_stock')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleSaveInventory(item.id)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mr-3"
                          >
                            {t('save')}
                          </button>
                          <button
                            onClick={handleCancelEditInventory}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                          >
                            {t('cancel')}
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                          {translateTextContent(item.item_name, i18n.language)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.current_stock.toFixed(2)} {item.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.min_threshold.toFixed(2)} {item.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {isLowStock ? t('low_stock') : t('in_stock')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditInventory(item)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            {t('edit')}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {inventory.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('inventory_empty')}</div>
          )}
        </div>
      )}
    </div>
  );

  const renderProductsTab = () => (
    <div className="space-y-6">
      {/* Add Product Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{t('add_product')}</h3>
          <button
            onClick={() => setShowAddProductForm(!showAddProductForm)}
            className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
          >
            {showAddProductForm ? t('cancel') : t('add_product')}
          </button>
        </div>
        {showAddProductForm && (
          <form className="grid grid-cols-1 md:grid-cols-5 gap-4" onSubmit={handleAddProduct}>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">{t('product_name_header')}</label>
              <input
                type="text"
                value={newProductForm.name}
                onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="e.g. Classic Milk Tea"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">{t('category_header')}</label>
              <input
                type="text"
                value={newProductForm.category}
                onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="e.g. Milk Tea"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">{t('price_header')}</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={newProductForm.base_price > 0 ? newProductForm.base_price : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setNewProductForm({ ...newProductForm, base_price: 0 });
                  } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue) && numValue > 0) {
                      setNewProductForm({ ...newProductForm, base_price: numValue });
                    }
                  }
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">{t('popular_header')}</label>
              <div className="flex items-center h-10">
                <input
                  type="checkbox"
                  checked={newProductForm.is_popular}
                  onChange={(e) => setNewProductForm({ ...newProductForm, is_popular: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">{t('description_header')}</label>
              <input
                type="text"
                value={newProductForm.description}
                onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="Product description"
              />
            </div>
            <div className="md:col-span-5 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
              >
                {t('add_product')}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{t('all_products')}</h3>
          <button
            type="button"
            onClick={loadProducts}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('refresh')}
          </button>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">{t('loading_products')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('product_name_header')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('category_header')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('price_header')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('popular_header')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('description_header')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('actions_header')}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product) => {
                  const isEditing = editingProduct === product.id;
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {isEditing ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={productForm.name || ''}
                              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded w-full"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={productForm.category || ''}
                              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded w-full"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={productForm.base_price ?? ''}
                              onChange={(e) => setProductForm({ ...productForm, base_price: parseFloat(e.target.value) || 0 })}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded w-24"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={productForm.is_popular || false}
                              onChange={(e) => setProductForm({ ...productForm, is_popular: e.target.checked })}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <textarea
                              value={productForm.description || ''}
                              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded w-full"
                              rows={2}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleSaveProduct(product.id)}
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mr-3"
                            >
                              {t('save')}
                            </button>
                            <button
                              onClick={handleCancelEditProduct}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            >
                              {t('cancel')}
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{product.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${product.base_price.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {product.is_popular ? (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                {t('popular')}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{product.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              >
                                {t('edit')}
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              >
                                {t('delete')}
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('no_products')}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderCashiersTab = () => (
    <div className="space-y-6">
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('add_cashier')}</h3>
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={handleAddCashier}>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">{t('name_label')}</label>
<input
              type="text"
              value={cashierForm.name}
              onChange={handleCashierFormChange('name')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="e.g. Alex Chen"
            />
          </div>
          <div className="flex flex-col">
<label className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">{t('employee_code_label')}</label>
<input
              type="text"
              value={cashierForm.employee_code}
              onChange={handleCashierFormChange('employee_code')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="e.g. CASH003"
            />
          </div>
          <div className="flex flex-col">
<label className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">{t('role_label')}</label>
<select
              value={cashierForm.role}
              onChange={handleCashierFormChange('role')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {CASHIER_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {getRoleLabel(option.value)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={cashierFormSubmitting}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-60"
            >
              {cashierFormSubmitting ? t('adding') : t('add_cashier')}
            </button>
          </div>
        </form>
        {cashierError && (
          <p className="mt-3 text-sm text-red-600">{cashierError}</p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">{t('active_cashiers')}</h3>
          <button
            type="button"
            onClick={loadCashiers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('refresh')}
          </button>
        </div>
        {cashiersLoading ? (
          <div className="text-center py-8 text-gray-600">{t('loading_cashiers')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('name_label')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('code_header')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('role_label')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('status_header')}</th>
<th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {cashiers.map((cashier) => (
                  <tr key={cashier.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cashier.name}</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{cashier.employee_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-capitalize">{getRoleLabel(cashier.role)}</td>
<td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        cashier.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {cashier.is_active ? t('status_active') : t('status_inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteCashier(cashier.id)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        {t('remove')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cashiers.length === 0 && (
              <div className="text-center py-8 text-gray-500">{t('no_cashiers_message')}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">{t('top_selling_items')}</h3>
            <button
              type="button"
              onClick={loadChartsData}
              className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
            >
              {t('refresh')}
            </button>
          </div>
          {analyticsLoading ? (
            <div className="text-center py-8 text-gray-600">{t('loading_charts')}</div>
          ) : weeklyItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{t('not_enough_data')}</div>
          ) : (
            <div className="space-y-3">
              {weeklyItems.map((item) => {
                const percentage = maxWeekly > 0 ? Math.round((item.value / maxWeekly) * 100) : 0;
                return (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm font-medium text-gray-700">
                      <span>{translateTextContent(item.name, i18n.language)}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="h-3 bg-purple-100 rounded-lg">
                      <div
                        className="h-3 bg-purple-600 rounded-lg"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {analyticsError && (
            <p className="mt-3 text-sm text-red-600">{analyticsError}</p>
          )}
        </div>
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('daily_top_items')}</h3>
{analyticsLoading ? (
            <div className="text-center py-8 text-gray-600">{t('loading_charts')}</div>
          ) : dailyTop.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{t('not_enough_data')}</div>
          ) : (
            <div className="flex items-end gap-4 h-56">
              {dailyTop.map((entry) => {
                const height = maxDaily > 0 ? Math.round((entry.value / maxDaily) * 100) : 0;
                return (
                  <div key={entry.day} className="flex flex-1 flex-col items-center">
                    <div className="relative flex-1 w-full flex items-end justify-center">
                      <div
                        className="w-12 bg-blue-200 rounded-t-lg flex items-end justify-center"
                        style={{ height: `${height}%` }}
                      >
                        <span className="mb-2 text-sm font-semibold text-blue-800">{entry.value}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-gray-700">{entry.day}</p>
                    <p className="text-xs text-gray-500 text-center">{translateTextContent(entry.item, i18n.language)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-600 rounded-lg shadow-md p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={loadXReport}
            disabled={reportLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {reportLoading ? t('loading') : t('generate_x_report')}
          </button>
          <button
            onClick={() => loadZReport(false)}
            disabled={reportLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            {reportLoading ? t('loading') : t('generate_z_report_no_reset')}
          </button>
          <button
            onClick={() => loadZReport(true)}
            disabled={reportLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {reportLoading ? t('processing') : t('generate_z_report_reset')}
          </button>
        </div>

        {xReport.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">{t('hourly_sales_snapshot')}</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('hour_header')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('orders_label')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('sales_header')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('cash')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('card')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">{t('other')}</th>
</tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {xReport.map((row) => (
                    <tr key={row.hour}>
                      <td className="px-4 py-2 text-sm text-gray-700">{row.hour}:00</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{row.orders}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">${row.sales.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">${row.cash.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">${row.card.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">${row.other.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {zReport && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div>
              <p className="text-sm text-gray-600">{t('period_start')}</p>
              <p className="font-semibold">{new Date(zReport.period_start).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('period_end')}</p>
              <p className="font-semibold">{new Date(zReport.period_end).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('gross_sales')}</p>
              <p className="font-bold text-lg">${zReport.gross_sales.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('tax_collected')}</p>
              <p className="font-semibold">${zReport.tax_total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('total_orders')}</p>
              <p className="font-semibold">{zReport.orders_total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('tender_breakdown')}</p>
              <p className="text-sm">{t('cash_line', { amount: zReport.cash_total.toFixed(2) })}</p>
              <p className="text-sm">{t('card_line', { amount: zReport.card_total.toFixed(2) })}</p>
              <p className="text-sm">{t('other_line', { amount: zReport.other_total.toFixed(2) })}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-gray-800 dark:bg-gray-950 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold">{t('manager_dashboard_title')}</h1>
          <button
            onClick={handleTranslateClick}
className="self-start md:self-auto inline-flex items-center justify-center px-4 py-2 bg-white/10 dark:bg-white/20 text-white border border-white/50 rounded-lg font-semibold hover:bg-white/20 dark:hover:bg-white/30 transition-colors"
            aria-label={i18n.language === 'en' ? 'Switch interface to Spanish' : 'Switch interface to English'}
>
            {i18n.language === 'en' ? 'Español' : 'English'}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-2">{t('total_sales')}</h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">${totalSales.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-2">{t('total_orders')}</h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">{totalOrders}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-2">{t('average_order')}</h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">${averageOrder.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:space-x-4">
            <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300" htmlFor="from-date">{t('from_label')}</label>
<input
                id="from-date"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300" htmlFor="to-date">{t('to_label')}</label>
<input
                id="to-date"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <button
              onClick={loadOrders}
              className="px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              {t('refresh')}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-600 rounded-lg shadow-md">
          <div className="border-b border-gray-200 dark:border-gray-500">
            <nav className="flex flex-wrap">
              {['orders', 'products', 'inventory', 'cashiers', 'reports'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab as typeof selectedTab)}
                  className={`py-4 px-4 border-b-2 font-semibold text-sm transition-colors ${
                    selectedTab === tab
                      ? 'border-gray-800 dark:border-white text-gray-800 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100'
                  }`}
                >
                  {getTabLabel(tab as typeof selectedTab)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {selectedTab === 'orders' && renderOrdersTab()}
            {selectedTab === 'products' && renderProductsTab()}
            {selectedTab === 'inventory' && renderInventoryTab()}
            {selectedTab === 'cashiers' && renderCashiersTab()}
            {selectedTab === 'reports' && renderReportsTab()}
          </div>
        </div>
      </div>
    </div>
  );
};
