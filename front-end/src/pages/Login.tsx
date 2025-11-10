import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const [role, setRole] = useState<'cashier' | 'manager'>('cashier');
  const navigate = useNavigate();

  const handleLogin = () => {
    // Simple login - just set role and navigate
    localStorage.setItem('user_role', role);
    localStorage.setItem('user', JSON.stringify({
      id: '1',
      email: `${role}@bubbletea.com`,
      name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
    }));
    localStorage.setItem('auth_token', 'simple-token');
    
    if (role === 'manager') {
      navigate('/manager');
    } else {
      navigate('/cashier');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Bubble Tea POS</h1>
          <p className="text-gray-600">Select your role to continue</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Login as:
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'cashier' | 'manager')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
            >
              <option value="cashier">Cashier (POS)</option>
              <option value="manager">Manager (Dashboard)</option>
            </select>
          </div>
          
          <button
            onClick={handleLogin}
            className="w-full bg-purple-600 text-white py-4 rounded-lg text-lg font-bold hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Login
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/customer')}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Continue as Customer (Kiosk)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
