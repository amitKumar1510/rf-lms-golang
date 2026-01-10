import { apiClient } from "@/admin/services/apiClient";

const attendanceService = {
  // Get attendance records for a specific class subject and date
  getAttendanceByClassSubjectAndDate: async (classSubjectId, date) => {
    const response = await apiClient.get(`/api/attendance/class-subject/${classSubjectId}/date/${date}`);
    return response.data;
  },

  // Get students for attendance marking
  getStudentsForAttendance: async (classSubjectId) => {
    const response = await apiClient.get(`/api/attendance/students/${classSubjectId}`);
    return response.data;
  },

  // Mark attendance for multiple students
  markAttendance: async (attendanceData) => {
    const response = await apiClient.post('/api/attendance/mark', attendanceData);
    return response.data;
  },

  // Update individual attendance record
  updateAttendance: async (attendanceId, updateData) => {
    const response = await apiClient.put(`/api/attendance/${attendanceId}`, updateData);
    return response.data;
  },

  // Get attendance history for a student
  getStudentAttendanceHistory: async (studentId, classSubjectId, startDate, endDate) => {
    const params = new URLSearchParams({
      student_id: studentId,
      class_subject_id: classSubjectId,
      start_date: startDate,
      end_date: endDate
    });
    const response = await apiClient.get(`/api/attendance/student/history?${params}`);
    return response.data;
  },

  // Get attendance summary for a class subject
  getAttendanceSummary: async (classSubjectId, startDate, endDate) => {
    const params = new URLSearchParams({
      class_subject_id: classSubjectId,
      start_date: startDate,
      end_date: endDate
    });
    const response = await apiClient.get(`/api/attendance/summary?${params}`);
    return response.data;
  }
};

export default attendanceService;