import { apiClient } from "../../admin/services/apiClient";

export async function getAllClasses() {
  const res = await apiClient.get(`/api/class/get-all`);
  return res.data;
}

export async function getCurrentSession() {
  const res = await apiClient.get(`/api/class/get-current-session`);
  return res.data;
}


