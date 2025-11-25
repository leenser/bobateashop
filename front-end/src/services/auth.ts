// OAuth authentication service with Google
const API_URL =
  import.meta.env.VITE_API_URL?.trim() ||
  "https://bobateashop.onrender.com"; // default backend URL

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
      throw new Error(data.message || "Failed to get auth URL");
    }

    // Store OAuth state for later verification
    localStorage.setItem("oauth_state", data.state);

    return data.auth_url;
  },

  // Handle OAuth callback
  handleCallback: async (code: string, state: string): Promise<User> => {
    const savedState = localStorage.getItem("oauth_state");

    if (!savedState) {
      localStorage.removeItem("oauth_state");
      throw new Error(
        "OAuth state not found. Please try logging in again."
      );
    }

    if (savedState !== state) {
      localStorage.removeItem("oauth_state");
      throw new Error(
        "Invalid OAuth state. Please try logging in again."
      );
    }

    const response = await fetch(`${API_URL}/api/auth/google/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code, state }),
    });

    const data = await response.json();

    if (!response.ok) {
      localStorage.removeItem("oauth_state");
      throw new Error(data.message || "Authentication failed");
    }

    // Store session info
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("user_role", data.user.role);
    localStorage.removeItem("oauth_state");

    return data.user;
  },

  // Get current user from API
  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem("auth_token");
    if (!token) return null;

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        authService.signOut();
        return null;
      }

      const user = await response.json();

      // Update local cache
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("user_role", user.role);

      return user;
    } catch (error) {
      console.error("Failed to get current user:", error);
      return null;
    }
  },

  // Get current user from localStorage instantly
  getCurrentUserSync: (): User | null => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  // Sign out user
  signOut: async () => {
    const token = localStorage.getItem("auth_token");

    if (token) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }

    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_role");
    window.location.href = "/login";
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("auth_token");
  },

  // Legacy login (always redirects to OAuth)
  legacyLogin: async () => {
    const authUrl = await authService.getGoogleAuthUrl();
    window.location.href = authUrl;
  },
};
