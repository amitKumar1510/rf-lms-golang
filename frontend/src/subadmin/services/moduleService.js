import { apiClient } from "../../admin/services/apiClient";

export async function createModule(payload) {
  const res = await apiClient.post(`/api/module/create`, payload);
  return res.data;
}

export async function getAllModules(subjectId) {
  const res = await apiClient.get(`/api/module/get-all/${subjectId}`);
  return res.data;
}

export async function getModule(subjectId, moduleId) {
  const res = await apiClient.get(`/api/module/get/${subjectId}/${moduleId}`);
  return res.data;
}

export async function updateModule(subjectId, moduleId, payload) {
  const res = await apiClient.put(`/api/module/update/${subjectId}/${moduleId}`, payload);
  return res.data;
}

export async function deleteModule(subjectId, moduleId) {
  const res = await apiClient.delete(`/api/module/delete/${subjectId}/${moduleId}`);
  return res.data;
}

export async function deactivateModule(subjectId, moduleId) {
  const res = await apiClient.post(`/api/module/deactivate/${subjectId}/${moduleId}`);
  return res.data;
}

export async function activateModule(subjectId, moduleId) {
  const res = await apiClient.post(`/api/module/activate/${subjectId}/${moduleId}`);
  return res.data;
}

