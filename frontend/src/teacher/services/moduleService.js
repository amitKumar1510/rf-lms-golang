import { apiClient } from "../../admin/services/apiClient";

export async function getAllModules(subjectId) {
  const res = await apiClient.get(`/api/module/get-all/${subjectId}`);
  return res.data;
}


