import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerInterface } from './pages/CustomerInterface';
import { CashierInterface } from './pages/CashierInterface';
import { ManagerInterface } from './pages/ManagerInterface';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminButton } from './components/AdminButton';
import { UserProfile } from './components/UserProfile';
import { AccessibilitySettings } from './components/AccessibilitySettings';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default route - redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected routes with role-based access */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['customer', 'cashier', 'manager', 'admin']}>
                <CustomerInterface />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cashier"
            element={
              <ProtectedRoute allowedRoles={['cashier', 'manager', 'admin']}>
                <CashierInterface />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['manager', 'admin']}>
                <ManagerInterface />
              </ProtectedRoute>
            }
          />
        </Routes>

        {/* Admin button with view switcher (bottom-left, only for admins) */}
        <AdminButton />

        {/* User profile with account info and logout (bottom-right, all users) */}
        <UserProfile />

        {/* Accessibility settings button */}
        <AccessibilitySettings />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
