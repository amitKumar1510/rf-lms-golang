import { apiClient } from "../../admin/services/apiClient";

export async function getAllSubjects() {
  const res = await apiClient.get(`/api/subject/get-all`);
  return res.data;
}

export async function getAllClassSubjects(classId) {
  const res = await apiClient.get(`/api/subject/get-all-class-subjects/${classId}`);
  return res.data;
}


