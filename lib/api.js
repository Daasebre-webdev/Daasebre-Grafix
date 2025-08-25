const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const apiClient = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}/${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // For cookies if needed
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  },

  // Google OAuth login
  getGoogleAuthUrl() {
    return `${API_BASE_URL}/auth/google`;
  },

  // User methods
  getUserProfile() {
    return this.request('api/user.php');
  },

  updateUserProfile(data) {
    return this.request('api/user.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};