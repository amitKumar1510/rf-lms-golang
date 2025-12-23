import { apiClient } from "../../admin/services/apiClient";

export async function getSchoolPerformance(params) {
  const res = await apiClient.get(`/api/assignment/principle/performance`, { params });
  return res.data;
}


