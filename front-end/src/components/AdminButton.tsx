import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const AdminButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

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

  const handleViewSwitch = (view: 'customer' | 'cashier' | 'manager') => {
    navigate(view === 'customer' ? '/' : `/${view}`);
    setShowMenu(false);
  };

  const getCurrentViewName = () => {
    if (location.pathname === '/cashier') return 'Cashier';
    if (location.pathname === '/manager') return 'Manager';
    return 'Customer';
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 admin-menu-container">
      {!showMenu ? (
        <button
          onClick={() => setShowMenu(true)}
          className="bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-gray-700 transition-colors font-semibold flex items-center space-x-2"
          aria-label="Admin menu"
        >
          <span>Admin</span>
          <span className="text-sm opacity-75">({getCurrentViewName()})</span>
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-4 min-w-[220px]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800">Switch View</h3>
            <button
              onClick={() => setShowMenu(false)}
              className="text-gray-500 hover:text-gray-700 text-xl leading-none"
              aria-label="Close menu"
            >
              ×
            </button>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => handleViewSwitch('customer')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/customer' || location.pathname === '/'
                  ? 'bg-purple-100 text-purple-800 font-semibold border-2 border-purple-300'
                  : 'hover:bg-gray-100 text-gray-700 border-2 border-transparent'
              }`}
            >
              👤 Customer View (Kiosk)
            </button>
            <button
              onClick={() => handleViewSwitch('cashier')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/cashier'
                  ? 'bg-blue-100 text-blue-800 font-semibold border-2 border-blue-300'
                  : 'hover:bg-gray-100 text-gray-700 border-2 border-transparent'
              }`}
            >
              💳 Cashier View (POS)
            </button>
            <button
              onClick={() => handleViewSwitch('manager')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/manager'
                  ? 'bg-gray-100 text-gray-800 font-semibold border-2 border-gray-300'
                  : 'hover:bg-gray-100 text-gray-700 border-2 border-transparent'
              }`}
            >
              📊 Manager View (Dashboard)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

