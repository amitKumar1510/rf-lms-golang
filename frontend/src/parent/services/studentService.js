import { apiClient } from "../../admin/services/apiClient";

export async function getStudentById(studentId) {
  const res = await apiClient.get(`/api/student/get/${studentId}`);
  return res.data;
}


