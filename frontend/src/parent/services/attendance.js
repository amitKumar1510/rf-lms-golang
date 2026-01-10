import { apiClient } from "@/admin/services/apiClient";

const attendanceService = {
  // Get attendance history for a specific student
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

  // Get attendance summary for a student's subjects
  getStudentAttendanceSummary: async (studentId, startDate, endDate) => {
    const params = new URLSearchParams({
      student_id: studentId,
      start_date: startDate,
      end_date: endDate
    });
    const response = await apiClient.get(`/api/attendance/student/summary?${params}`);
    return response.data;
  }
};

export default attendanceService;