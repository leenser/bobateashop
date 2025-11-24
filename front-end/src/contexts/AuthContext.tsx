import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  isAuthenticated: boolean;
  updateAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const updateAuth = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    const role = localStorage.getItem('user_role');

    if (token && userStr && role) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
        setUserRole(role);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        setUser(null);
        setUserRole(null);
        setIsAuthenticated(false);
      }
    } else {
      setUser(null);
      setUserRole(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    updateAuth();
  }, []);

  // Listen for storage changes (e.g., from other tabs or manual updates)
  useEffect(() => {
    const handleStorageChange = () => {
      updateAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, isAuthenticated, updateAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
