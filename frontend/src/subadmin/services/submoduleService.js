import { apiClient } from "../../admin/services/apiClient";

export async function createSubmodule(payload) {
  const res = await apiClient.post(`/api/submodule/create`, payload);
  return res.data;
}

export async function getAllSubmodules(moduleId) {
  const res = await apiClient.get(`/api/submodule/get-all/${moduleId}`);
  return res.data;
}

export async function getSubmodule(moduleId, submoduleId) {
  const res = await apiClient.get(`/api/submodule/get/${moduleId}/${submoduleId}`);
  return res.data;
}

export async function updateSubmodule(moduleId, submoduleId, payload) {
  const res = await apiClient.put(`/api/submodule/update/${moduleId}/${submoduleId}`, payload);
  return res.data;
}

export async function deleteSubmodule(moduleId, submoduleId) {
  const res = await apiClient.delete(`/api/submodule/delete/${moduleId}/${submoduleId}`);
  return res.data;
}

export async function deactivateSubmodule(moduleId, submoduleId) {
  const res = await apiClient.post(`/api/submodule/deactivate/${moduleId}/${submoduleId}`);
  return res.data;
}

export async function activateSubmodule(moduleId, submoduleId) {
  const res = await apiClient.post(`/api/submodule/activate/${moduleId}/${submoduleId}`);
  return res.data;
}

