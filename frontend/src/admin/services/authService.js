import { apiClient } from "./apiClient";

export async function login({ email, password }) {
  const res = await apiClient.post("/api/users/public/login", { email, password });
  return res.data; // { access_token, token_type, message }
}

export async function me() {
  const res = await apiClient.get("/api/users/me");
  return res.data; // { user_id, email, role, ... }
}

export async function logout() {
  const res = await apiClient.post("/api/users/logout");
  return res.data;
}


