import { apiClient } from "../../admin/services/apiClient";

export async function createPrinciple(payload) {
  const res = await apiClient.post(`/api/principle/create`, payload);
  return res.data;
}

export async function getPrincipleById(principleId) {
  const res = await apiClient.get(`/api/principle/get/${principleId}`);
  return res.data;
}

export async function getAllPrinciples() {
  const res = await apiClient.get(`/api/principle/get-all`);
  return res.data;
}

export async function updatePrinciple(principleId, payload) {
  const res = await apiClient.put(`/api/principle/update/${principleId}`, payload);
  return res.data;
}

export async function deletePrinciple(principleId) {
  const res = await apiClient.delete(`/api/principle/delete/${principleId}`);
  return res.data;
}

export async function deactivatePrinciple(principleId) {
  const res = await apiClient.post(`/api/principle/deactivate/${principleId}`);
  return res.data;
}

export async function activatePrinciple(principleId) {
  const res = await apiClient.post(`/api/principle/activate/${principleId}`);
  return res.data;
}


