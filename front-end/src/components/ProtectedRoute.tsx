import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('customer' | 'cashier' | 'manager' | 'admin')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, userRole } = useAuth();

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // No role restrictions - allow access
  if (!allowedRoles) {
    return <>{children}</>;
  }

  // Check if user's role is in allowed roles
  // Admin has access to everything
  const role = userRole as 'customer' | 'cashier' | 'manager' | 'admin';
  if (role === 'admin' || (role && allowedRoles.includes(role))) {
    return <>{children}</>;
  }

  // User doesn't have required role - redirect to their default view
  if (userRole === 'customer') {
    return <Navigate to="/customer" replace />;
  } else if (userRole === 'cashier') {
    return <Navigate to="/cashier" replace />;
  } else if (userRole === 'manager') {
    return <Navigate to="/manager" replace />;
  }

  // Fallback to login
  return <Navigate to="/login" replace />;
};

