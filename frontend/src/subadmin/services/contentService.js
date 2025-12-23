import { apiClient } from "../../admin/services/apiClient";

export async function getAllContents(submoduleId) {
  const res = await apiClient.get(`/api/content/get-all/${submoduleId}`);
  return res.data;
}

export async function getContent(submoduleId, contentId) {
  const res = await apiClient.get(`/api/content/get/${submoduleId}/${contentId}`);
  return res.data;
}

export async function createContent(submoduleId, payload) {
  // payload: { title, content_type, content_data?, order_index?, file? }
  const form = new FormData();
  form.append("title", payload.title);
  form.append("content_type", payload.content_type);
  if (payload.content_data != null) form.append("content_data", payload.content_data);
  if (payload.order_index != null) form.append("order_index", String(payload.order_index));
  if (payload.file) form.append("file", payload.file);

  const res = await apiClient.post(`/api/content/create/${submoduleId}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function updateContent(submoduleId, contentId, payload) {
  // payload: { title?, content_type?, content_data?, order_index?, file? }
  const form = new FormData();
  if (payload.title != null) form.append("title", payload.title);
  if (payload.content_type != null) form.append("content_type", payload.content_type);
  if (payload.content_data != null) form.append("content_data", payload.content_data);
  if (payload.order_index != null) form.append("order_index", String(payload.order_index));
  if (payload.file) form.append("file", payload.file);

  const res = await apiClient.put(`/api/content/update/${submoduleId}/${contentId}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteContent(submoduleId, contentId) {
  const res = await apiClient.delete(`/api/content/delete/${submoduleId}/${contentId}`);
  return res.data;
}

export async function deactivateContent(submoduleId, contentId) {
  const res = await apiClient.post(`/api/content/deactivate/${submoduleId}/${contentId}`);
  return res.data;
}

export async function activateContent(submoduleId, contentId) {
  const res = await apiClient.post(`/api/content/activate/${submoduleId}/${contentId}`);
  return res.data;
}
