import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const AdminButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const { userRole } = useAuth();

  // Close menu when route changes
  useEffect(() => {
    setShowMenu(false);
  }, [location.pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    if (showMenu) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.admin-menu-container')) {
          setShowMenu(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // Don't show on login, auth callback, or view selection pages
  if (location.pathname === '/login' || location.pathname === '/auth/callback' || location.pathname === '/select-view') {
    return null;
  }

  // Only show for admin users
  if (userRole !== 'admin') {
    return null;
  }

  const handleViewSwitch = (view: 'customer' | 'cashier' | 'manager') => {
    navigate(`/${view}`);
    setShowMenu(false);
  };

  const getCurrentViewName = () => {
    if (location.pathname === '/cashier') return 'Cashier';
    if (location.pathname === '/manager') return 'Manager';
    if (location.pathname === '/customer') return 'Customer';
    return 'Customer';
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 admin-menu-container">
      {!showMenu ? (
        <button
          onClick={() => setShowMenu(true)}
          className="bg-gray-800 dark:bg-gray-700 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors font-semibold flex items-center space-x-2"
          aria-label="Admin menu"
        >
          <span>Admin</span>
          <span className="text-sm opacity-75">({getCurrentViewName()})</span>
        </button>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-200 dark:border-gray-700 p-4 min-w-[220px]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 dark:text-white">Switch View</h3>
            <button
              onClick={() => setShowMenu(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none"
              aria-label="Close menu"
            >
              ×
            </button>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => handleViewSwitch('customer')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/customer'
                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-semibold border-2 border-purple-300 dark:border-purple-600'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent'
              }`}
            >
              Customer View (Kiosk)
            </button>
            <button
              onClick={() => handleViewSwitch('cashier')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/cashier'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold border-2 border-blue-300 dark:border-blue-600'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent'
              }`}
            >
              Cashier View (POS)
            </button>
            <button
              onClick={() => handleViewSwitch('manager')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/manager'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold border-2 border-gray-300 dark:border-gray-600'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent'
              }`}
            >
              Manager View (Dashboard)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

