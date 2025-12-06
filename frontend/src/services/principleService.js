import api from './api';

const principleService = {
  // Get principle dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await api.get('/api/principle/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching principle dashboard stats:', error);
      throw error;
    }
  },

  // Get principle profile
  getProfile: async () => {
    try {
      const response = await api.get('/api/principle/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching principle profile:', error);
      throw error;
    }
  },

  // Create principle profile
  createProfile: async (profileData) => {
    try {
      const response = await api.post('/api/principle/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error creating principle profile:', error);
      throw error;
    }
  },

  // Update principle profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/principle/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating principle profile:', error);
      throw error;
    }
  }
};

export default principleService;
