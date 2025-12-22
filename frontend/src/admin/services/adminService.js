import { apiClient } from "./apiClient";

export async function getMe() {
  const res = await apiClient.get("/api/admin/get");
  return res.data;
}

export async function getAllSchools() {
  const res = await apiClient.get("/api/admin/get-all-schools");
  return res.data;
}

export async function addSchool(payload) {
  const res = await apiClient.post("/api/admin/add-school", payload);
  return res.data;
}

export async function createSubadmin(payload) {
  const res = await apiClient.post("/api/admin/subadmin/create", payload);
  return res.data;
}

export async function getSubadminsBySchoolId(schoolId) {
  const res = await apiClient.get(`/api/admin/subadmins/${schoolId}`);
  return res.data;
}


