import { apiClient } from "../../admin/services/apiClient";

export async function getTeacherById(teacherId) {
  const res = await apiClient.get(`/api/teacher/get/${teacherId}`);
  return res.data;
}


