import { apiClient } from "../../admin/services/apiClient";

export async function getAllContents(submoduleId) {
  const res = await apiClient.get(`/api/content/get-all/${submoduleId}`);
  return res.data;
}

export async function getContent(submoduleId, contentId) {
  const res = await apiClient.get(`/api/content/get/${submoduleId}/${contentId}`);
  return res.data;
}


