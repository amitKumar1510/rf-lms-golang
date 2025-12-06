import api from './api';

const teacherService = {
  // Get current teacher's profile
  getProfile: async () => {
    const response = await api.get('/api/teachers/profile');
    return response.data;
  },

  // Get current teacher's profile with class assignments
  getProfileWithAssignments: async () => {
    const response = await api.get('/api/teachers/profile-with-assignments');
    return response.data;
  },

  // Update teacher profile
  updateProfile: async (profileData) => {
    const response = await api.put('/api/teachers/profile', profileData);
    return response.data;
  },

  // Get teacher's class subjects for attendance
  getClassSubjects: async () => {
    const response = await api.get('/api/teachers/attendance/class-subjects');
    return response.data;
  },

  // Get students for a specific class subject
  getStudentsForClassSubject: async (classSubjectId) => {
    const response = await api.get(`/api/teachers/attendance/class-subjects/${classSubjectId}/students`);
    return response.data;
  },

  // Mark attendance
  markAttendance: async (attendanceData) => {
    const response = await api.post('/api/teachers/attendance/mark', attendanceData);
    return response.data;
  },

  // Get attendance for a specific date and class
  getAttendanceForDate: async (classSubjectId, attendanceDate) => {
    const response = await api.get(`/api/teachers/attendance/class-subjects/${classSubjectId}/date/${attendanceDate}`);
    return response.data;
  },

  // Update attendance record
  updateAttendance: async (attendanceId, updateData) => {
    const response = await api.put(`/api/teachers/attendance/${attendanceId}`, updateData);
    return response.data;
  },

  // Get attendance summary
  getAttendanceSummary: async (classSubjectId, startDate, endDate) => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    const response = await api.get(`/api/teachers/attendance/summary/class-subjects/${classSubjectId}?${params}`);
    return response.data;
  },

  // Get teacher workload information
  getWorkload: async () => {
    const response = await api.get('/api/teachers/workload');
    return response.data;
  },

  // Debug endpoint to check teacher data
  debugTeacherData: async () => {
    const response = await api.get('/api/teachers/attendance/debug');
    return response.data;
  },

  // Get class-wise attendance analytics
  getClassWiseAttendanceAnalytics: async (academicSession) => {
    const params = academicSession ? `?academic_session=${academicSession}` : '';
    const response = await api.get(`/api/teachers/analytics/class-wise${params}`);
    return response.data;
  },

  // Get subject-wise student attendance analytics
  getSubjectWiseStudentAttendance: async (academicSession) => {
    const params = academicSession ? `?academic_session=${academicSession}` : '';
    const response = await api.get(`/api/teachers/analytics/subject-wise${params}`);
    return response.data;
  }
};

export default teacherService;
