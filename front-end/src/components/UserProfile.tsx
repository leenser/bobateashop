import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { authService } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';

export const UserProfile: React.FC = () => {
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const { user, userRole, isAuthenticated, updateAuth } = useAuth();

  // Close menu when clicking outside
  useEffect(() => {
    if (showMenu) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-profile-container')) {
          setShowMenu(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // Don't show on login or auth callback pages
  if (location.pathname === '/login' || location.pathname === '/auth/callback') {
    return null;
  }

  // Don't show if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = async () => {
    setShowMenu(false);
    if (window.confirm('Are you sure you want to logout?')) {
      await authService.signOut();
      updateAuth(); // Update auth state after logout
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 user-profile-container">
      {!showMenu ? (
        <button
          onClick={() => setShowMenu(true)}
          className="bg-white dark:bg-gray-800 rounded-full shadow-lg border-2 border-gray-200 dark:border-gray-700 p-2 hover:shadow-xl transition-shadow"
          aria-label="User profile menu"
        >
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xl">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </button>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-200 dark:border-gray-700 p-4 min-w-[280px]">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-gray-800 dark:text-white">Account</h3>
            <button
              onClick={() => setShowMenu(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none"
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-14 h-14 rounded-full"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 dark:text-white text-base truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
              {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'Guest'}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg transition-colors font-semibold text-sm flex items-center justify-center gap-2"
          >
            <span>Logout</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
