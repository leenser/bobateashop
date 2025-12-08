import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ViewSelection: React.FC = () => {
  const navigate = useNavigate();
  const { userRole, user } = useAuth();

  // Determine which views are accessible based on role
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager' || isAdmin;
  const isCashier = userRole === 'cashier' || isManager;
  const isCustomer = userRole === 'customer' || isCashier;

  const handleViewSelection = (view: 'customer' | 'cashier' | 'manager') => {
    navigate(`/${view}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome, {user?.name || 'User'}!
          </h1>
          <p className="text-gray-600 text-lg">
            Select a view to continue
          </p>
          {isAdmin && (
            <div className="mt-2 inline-block bg-blue-50 text-blue-700 px-4 py-1 rounded-full text-sm font-semibold border border-blue-200">
              Admin Access - All Views Available
            </div>
          )}
        </div>

        {/* View Selection Buttons */}
        <div className="space-y-4">
          {/* Customer View - Always accessible */}
          {isCustomer && (
            <button
              onClick={() => handleViewSelection('customer')}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 p-6 rounded-lg shadow-md hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-between group"
            >
              <div className="text-left">
                <h3 className="text-xl font-semibold mb-1 text-gray-800">Customer View</h3>
                <p className="text-gray-600 text-sm">
                  Browse menu and place orders (Kiosk Mode)
                </p>
              </div>
              <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Cashier View - Accessible to cashier, manager, admin */}
          {isCashier && (
            <button
              onClick={() => handleViewSelection('cashier')}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 p-6 rounded-lg shadow-md hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-between group"
              disabled={!isCashier}
            >
              <div className="text-left">
                <h3 className="text-xl font-semibold mb-1 text-gray-800">Cashier View</h3>
                <p className="text-gray-600 text-sm">
                  Process orders and manage transactions (POS)
                </p>
              </div>
              <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Manager View - Accessible to manager, admin */}
          {isManager && (
            <button
              onClick={() => handleViewSelection('manager')}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 p-6 rounded-lg shadow-md hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-between group"
              disabled={!isManager}
            >
              <div className="text-left">
                <h3 className="text-xl font-semibold mb-1 text-gray-800">Manager View</h3>
                <p className="text-gray-600 text-sm">
                  Analytics, inventory, and staff management (Dashboard)
                </p>
              </div>
              <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* User Info Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Logged in as <span className="font-semibold">{user?.email}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Role: <span className="font-semibold capitalize">{userRole}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
