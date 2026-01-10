import { apiClient } from "../../admin/services/apiClient";

const attendanceService = {
  getStudentAttendanceHistory: async (studentId, classSubjectId, startDate, endDate) => {
    const params = new URLSearchParams({
      student_id: studentId,
      class_subject_id: classSubjectId,
      start_date: startDate,
      end_date: endDate
    });
    const response = await apiClient.get(`/attendance/student/history?${params}`);
    return response.data;
  },

  getStudentAttendanceSummary: async (studentId, startDate, endDate) => {
    const params = new URLSearchParams({
      student_id: studentId,
      start_date: startDate,
      end_date: endDate
    });
    const response = await apiClient.get(`/attendance/student/summary?${params}`);
    return response.data;
  }
};

export default attendanceService;
