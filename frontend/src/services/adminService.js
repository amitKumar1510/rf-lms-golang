import api from './api';

// Admin Services
export const adminService = {
  // School Management
  createSchool: async (schoolData) => {
    const response = await api.post('/api/users/schools', schoolData);
    return response.data;
  },

  getSchools: async () => {
    const response = await api.get('/api/users/schools');
    return response.data;
  },

  // Subadmin Management
  createSubadmin: async (subadminData) => {
    const response = await api.post('/api/users/subadmins', subadminData);
    return response.data;
  },

  getSchoolSubadmins: async (schoolId) => {
    const response = await api.get(`/api/users/schools/${schoolId}/subadmins`);
    return response.data;
  },

  updateSubadmin: async (subadminId, subadminData) => {
    const response = await api.put(`/api/users/subadmins/${subadminId}`, subadminData);
    return response.data;
  },

  toggleSchoolStatus: async (schoolId, isActive) => {
    const response = await api.put(`/api/users/schools/${schoolId}/status`, { is_active: isActive });
    return response.data;
  }
};
