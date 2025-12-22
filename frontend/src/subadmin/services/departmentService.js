import { apiClient } from "../../admin/services/apiClient";

export async function createDepartment(payload) {
  const res = await apiClient.post(`/api/department/create`, payload);
  return res.data;
}

export async function getAllDepartments() {
  const res = await apiClient.get(`/api/department/get-all`);
  return res.data;
}

export async function getDepartmentById(departmentId) {
  const res = await apiClient.get(`/api/department/get/${departmentId}`);
  return res.data;
}

export async function updateDepartment(departmentId, payload) {
  const res = await apiClient.put(`/api/department/update/${departmentId}`, payload);
  return res.data;
}

export async function deleteDepartment(departmentId) {
  const res = await apiClient.delete(`/api/department/delete/${departmentId}`);
  return res.data;
}

export async function deactivateDepartment(departmentId) {
  const res = await apiClient.post(`/api/department/deactivate/${departmentId}`);
  return res.data;
}

export async function activateDepartment(departmentId) {
  const res = await apiClient.post(`/api/department/activate/${departmentId}`);
  return res.data;
}


