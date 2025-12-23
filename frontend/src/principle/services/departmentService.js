import { apiClient } from "../../admin/services/apiClient";

export async function getAllDepartments() {
  const res = await apiClient.get(`/api/department/get-all`);
  return res.data;
}


