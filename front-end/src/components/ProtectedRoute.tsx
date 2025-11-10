import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'customer' | 'cashier' | 'manager';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const token = localStorage.getItem('auth_token');
  const userRole = localStorage.getItem('user_role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

