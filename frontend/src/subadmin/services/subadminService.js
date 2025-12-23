import { apiClient } from "../../admin/services/apiClient";

export async function getById(subadminId) {
  const res = await apiClient.get(`/api/subadmin/id/${subadminId}`);
  return res.data;
}

export async function getSubadminsBySchoolId(schoolId) {
  const res = await apiClient.get(`/api/subadmin/subadmins/${schoolId}`);
  return res.data;
}

export async function createSubadmin(payload) {
  const res = await apiClient.post(`/api/subadmin/create`, payload);
  return res.data;
}

export async function updateSubadmin(subadminId, payload) {
  const res = await apiClient.put(`/api/subadmin/update/${subadminId}`, payload);
  return res.data;
}

export async function deactivateSubadmin(subadminId) {
  const res = await apiClient.post(`/api/subadmin/deactivate/${subadminId}`);
  return res.data;
}

export async function activateSubadmin(subadminId) {
  const res = await apiClient.post(`/api/subadmin/activate/${subadminId}`);
  return res.data;
}

export async function deleteSubadmin(subadminId) {
  const res = await apiClient.delete(`/api/subadmin/delete/${subadminId}`);
  return res.data;
}

export async function updatePassword(newPassword) {
  const res = await apiClient.post(`/api/users/public/update-password`, { new_password: newPassword });
  return res.data;
}

export async function getOverview() {
  const res = await apiClient.get(`/api/subadmin/overview`);
  return res.data;
}



