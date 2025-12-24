import { apiClient } from "../../admin/services/apiClient";

export async function login({ email, password }) {
  const res = await apiClient.post(`/api/parent/public/login`, { email, password });
  return res.data;
}

export async function me() {
  const res = await apiClient.get(`/api/parent/me`);
  return res.data;
}

export async function logout() {
  const res = await apiClient.post(`/api/parent/logout`);
  return res.data;
}


