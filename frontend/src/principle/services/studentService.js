import { apiClient } from "../../admin/services/apiClient";

export async function getStudentsByClassId(classId) {
  const res = await apiClient.get(`/api/student/get-by-class-id/${classId}`);
  return res.data;
}


