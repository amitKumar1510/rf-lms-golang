import api from './api';

// Authentication related API calls
export const authService = {
  login: async (email, password, role) => {
    const response = await api.post('/api/users/public/login', {
      email,
      password,
      role
    });
    return response.data;
  },

  logout: async () => {
    try {
      // Call backend to clear cookie
      await api.post('/api/users/public/logout');
    } catch (error) {
      // Even if backend call fails, clear local storage
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
};
