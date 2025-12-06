import api from './api';

const studentService = {
  // Get student dashboard data
  getDashboardData: async () => {
    const response = await api.get('/api/students/dashboard');
    return response.data;
  },

  // Get student grades
  getGrades: async (academicYear = null) => {
    const params = academicYear ? { academic_year: academicYear } : {};
    const response = await api.get('/api/students/grades', { params });
    return response.data;
  },

  // Get student attendance
  getAttendance: async (academicYear = null) => {
    const params = academicYear ? { academic_year: academicYear } : {};
    const response = await api.get('/api/students/attendance', { params });
    return response.data;
  },

  // Get student profile
  getProfile: async () => {
    const response = await api.get('/api/students/profile');
    return response.data;
  },

  // Update student profile
  updateProfile: async (profileData) => {
    const response = await api.put('/api/students/profile', profileData);
    return response.data;
  },

  // Get subject details with modules and content
  getSubjectDetails: async (subjectId) => {
    // For now, this will be implemented later when the backend API is ready
    // const response = await api.get(`/api/students/subjects/${subjectId}`);
    // return response.data;

    // Mock data for now
    return {
      id: subjectId,
      name: 'Sample Subject',
      modules: []
    };
  }
};

export default studentService;
