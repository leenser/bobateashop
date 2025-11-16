import React, { useEffect, useMemo, useState } from 'react';
import { ordersApi, inventoryApi, reportsApi, employeesApi } from '../services/api';
import { translateToSpanish } from '../i18n/translateToSpanish';

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

const CASHIER_ROLE_OPTIONS = [
  { value: 'cashier', label: 'Cashier' },
  { value: 'shift_lead', label: 'Shift Lead' },
  { value: 'manager', label: 'Manager' },
];

export const ManagerInterface: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'orders' | 'inventory' | 'cashiers' | 'reports'>('orders');
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

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

  useEffect(() => {
    if (selectedTab === 'orders') {
      loadOrders();
    } else if (selectedTab === 'inventory') {
      loadInventory();
    } else if (selectedTab === 'cashiers') {
      loadCashiers();
    } else if (selectedTab === 'reports') {
      loadChartsData();
    }
  }, [selectedTab, dateRange]);

  useEffect(() => {
    loadCashiers();
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

  const loadCashiers = async () => {
    setCashiersLoading(true);
    setCashierError(null);
    try {
      const response = await employeesApi.getAll();
      setCashiers(response.data || []);
    } catch (error) {
      console.error('Error loading cashiers:', error);
      setCashierError('Failed to load cashiers.');
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
      setCashierError('Name and employee code are required.');
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
      const message = error.response?.data?.message || error.message || 'Failed to create cashier.';
      setCashierError(message);
    } finally {
      setCashierFormSubmitting(false);
    }
  };

  const handleDeleteCashier = async (cashierId: number) => {
    const confirmed = window.confirm('Remove this cashier? Past orders will remain recorded.');
    if (!confirmed) return;
    try {
      await employeesApi.delete(cashierId);
      await loadCashiers();
    } catch (error) {
      console.error('Error deleting cashier:', error);
      alert('Failed to delete cashier.');
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
      setAnalyticsError('Failed to load chart data.');
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

  const handleTranslateClick = () => {
    translateToSpanish().catch(error => {
      console.error('Error translating to Spanish:', error);
    });
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

  const renderOrdersTab = () => (
    <div>
      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading orders...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cashier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.order_time).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.cashier_id ? cashierNameLookup.get(order.cashier_id) || `Cashier #${order.cashier_id}` : 'Kiosk Order'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.items.length} item(s)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order.total.toFixed(2)}</td>
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
            <div className="text-center py-8 text-gray-500">No orders found for the selected date range.</div>
          )}
        </div>
      )}
    </div>
  );

  const renderInventoryTab = () => (
    <div>
      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading inventory...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item) => {
                const isLowStock = item.current_stock <= item.min_threshold;
                return (
                  <tr key={item.id} className={isLowStock ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.item_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.current_stock.toFixed(2)} {item.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.min_threshold.toFixed(2)} {item.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {isLowStock ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {inventory.length === 0 && (
            <div className="text-center py-8 text-gray-500">Inventory is empty.</div>
          )}
        </div>
      )}
    </div>
  );

  const renderCashiersTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Add Cashier</h3>
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={handleAddCashier}>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-600 mb-1">Name</label>
            <input
              type="text"
              value={cashierForm.name}
              onChange={handleCashierFormChange('name')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="e.g. Alex Chen"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-600 mb-1">Employee Code</label>
            <input
              type="text"
              value={cashierForm.employee_code}
              onChange={handleCashierFormChange('employee_code')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="e.g. CASH003"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-600 mb-1">Role</label>
            <select
              value={cashierForm.role}
              onChange={handleCashierFormChange('role')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {CASHIER_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
              {cashierFormSubmitting ? 'Adding...' : 'Add Cashier'}
            </button>
          </div>
        </form>
        {cashierError && (
          <p className="mt-3 text-sm text-red-600">{cashierError}</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Active Cashiers</h3>
          <button
            type="button"
            onClick={loadCashiers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
        {cashiersLoading ? (
          <div className="text-center py-8 text-gray-600">Loading cashiers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cashiers.map((cashier) => (
                  <tr key={cashier.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cashier.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cashier.employee_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-capitalize">{cashier.role.replace('_', ' ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        cashier.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {cashier.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteCashier(cashier.id)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cashiers.length === 0 && (
              <div className="text-center py-8 text-gray-500">No cashiers yet. Add your first cashier above.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Top Selling Items (7 days)</h3>
            <button
              type="button"
              onClick={loadChartsData}
              className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
            >
              Refresh
            </button>
          </div>
          {analyticsLoading ? (
            <div className="text-center py-8 text-gray-600">Loading charts...</div>
          ) : weeklyItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Not enough data yet.</div>
          ) : (
            <div className="space-y-3">
              {weeklyItems.map((item) => {
                const percentage = maxWeekly > 0 ? Math.round((item.value / maxWeekly) * 100) : 0;
                return (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm font-medium text-gray-700">
                      <span>{item.name}</span>
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

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Daily Top Items</h3>
          {analyticsLoading ? (
            <div className="text-center py-8 text-gray-600">Loading charts...</div>
          ) : dailyTop.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Not enough data yet.</div>
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
                    <p className="text-xs text-gray-500 text-center">{entry.item}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={loadXReport}
            disabled={reportLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {reportLoading ? 'Loading...' : 'Generate X Report'}
          </button>
          <button
            onClick={() => loadZReport(false)}
            disabled={reportLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            {reportLoading ? 'Loading...' : 'Generate Z Report (No Reset)'}
          </button>
          <button
            onClick={() => loadZReport(true)}
            disabled={reportLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {reportLoading ? 'Processing...' : 'Generate Z Report & Reset'}
          </button>
        </div>

        {xReport.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Hourly Sales Snapshot</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hour</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Other</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
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
              <p className="text-sm text-gray-600">Period Start</p>
              <p className="font-semibold">{new Date(zReport.period_start).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Period End</p>
              <p className="font-semibold">{new Date(zReport.period_end).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gross Sales</p>
              <p className="font-bold text-lg">${zReport.gross_sales.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tax Collected</p>
              <p className="font-semibold">${zReport.tax_total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Orders</p>
              <p className="font-semibold">{zReport.orders_total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tender Breakdown</p>
              <p className="text-sm">Cash: ${zReport.cash_total.toFixed(2)}</p>
              <p className="text-sm">Card: ${zReport.card_total.toFixed(2)}</p>
              <p className="text-sm">Other: ${zReport.other_total.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <button
            onClick={handleTranslateClick}
            className="self-start md:self-auto inline-flex items-center justify-center px-4 py-2 bg-white/10 text-white border border-white/50 rounded-lg font-semibold hover:bg-white/20 transition-colors"
            aria-label="Switch interface to Spanish"
          >
            Español
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Sales</h3>
            <p className="text-3xl font-bold text-gray-800">${totalSales.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-800">{totalOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Average Order</h3>
            <p className="text-3xl font-bold text-gray-800">${averageOrder.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:space-x-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700" htmlFor="from-date">From:</label>
              <input
                id="from-date"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700" htmlFor="to-date">To:</label>
              <input
                id="to-date"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <button
              onClick={loadOrders}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap">
              {['orders', 'inventory', 'cashiers', 'reports'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab as typeof selectedTab)}
                  className={`py-4 px-4 border-b-2 font-semibold text-sm transition-colors ${
                    selectedTab === tab
                      ? 'border-gray-800 text-gray-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {selectedTab === 'orders' && renderOrdersTab()}
            {selectedTab === 'inventory' && renderInventoryTab()}
            {selectedTab === 'cashiers' && renderCashiersTab()}
            {selectedTab === 'reports' && renderReportsTab()}
          </div>
        </div>
      </div>
    </div>
  );
};
