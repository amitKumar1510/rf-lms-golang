import { apiClient } from "../../admin/services/apiClient";

export async function getParentSubmissions(params) {
  const res = await apiClient.get(`/api/assignment/parent/submissions`, { params });
  return res.data;
}


