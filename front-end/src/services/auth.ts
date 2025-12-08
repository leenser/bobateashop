// OAuth authentication service with Google
const API_URL = import.meta.env.VITE_API_URL || 'https://bobateashop.onrender.com';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role?: string;
}

export const authService = {
  // Get Google OAuth URL
  getGoogleAuthUrl: async (): Promise<string> => {
    const response = await fetch(`${API_URL}/api/auth/google/url`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get auth URL');
    }

    // Store state for verification
    console.log('[OAuth] Storing state:', data.state);
    localStorage.setItem('oauth_state', data.state);
    console.log('[OAuth] State stored, verification:', localStorage.getItem('oauth_state'));
    return data.auth_url;
  },

  // Handle OAuth callback
  handleCallback: async (code: string, state: string): Promise<User> => {
    console.log('[OAuth Callback] Received state:', state);
    console.log('[OAuth Callback] All localStorage keys:', Object.keys(localStorage));
    const savedState = localStorage.getItem('oauth_state');
    console.log('[OAuth Callback] Retrieved saved state:', savedState);

    // Enhanced state validation with better error messages
    if (!savedState) {
      // State was cleared or never set - clear any stale data and provide helpful message
      console.error('[OAuth Callback] No saved state found in localStorage');
      localStorage.removeItem('oauth_state');
      throw new Error('OAuth state not found. Please try logging in again.');
    }

    if (savedState !== state) {
      // State mismatch - possible CSRF attempt or stale state
      console.error('[OAuth Callback] State mismatch:', { savedState, receivedState: state });
      localStorage.removeItem('oauth_state');
      throw new Error('Invalid state parameter. This may happen if you navigated away during login. Please try again.');
    }

    const response = await fetch(`${API_URL}/api/auth/google/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Clean up state on error
      localStorage.removeItem('oauth_state');
      throw new Error(data.message || 'Authentication failed');
    }

    // Store token and user
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('user_role', data.user.role);
    localStorage.removeItem('oauth_state');

    return data.user;
  },

  // Get current user from API
  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token is invalid, clear storage
        authService.signOut();
        return null;
      }

      const user = await response.json();

      // Update local storage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('user_role', user.role);

      return user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  },

  // Get current user from localStorage (sync)
  getCurrentUserSync: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  // Sign out
  signOut: async () => {
    const token = localStorage.getItem('auth_token');

    if (token) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }

    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    window.location.href = '/login';
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },

  // Legacy login for backward compatibility (will redirect to OAuth)
  legacyLogin: async (_role: 'cashier' | 'manager') => {
    // For now, redirect to OAuth
    const authUrl = await authService.getGoogleAuthUrl();
    window.location.href = authUrl;
  },
};
