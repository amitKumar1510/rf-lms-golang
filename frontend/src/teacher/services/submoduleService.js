import { apiClient } from "../../admin/services/apiClient";

export async function getAllSubmodules(moduleId) {
  const res = await apiClient.get(`/api/submodule/get-all/${moduleId}`);
  return res.data;
}


