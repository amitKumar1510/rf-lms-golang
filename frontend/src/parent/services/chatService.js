import { apiClient } from "../../admin/services/apiClient";

export async function listConversations() {
  const res = await apiClient.get(`/api/chat/conversations`);
  return res.data;
}

export async function createConversation(payload) {
  // payload: { teacher_id, class_subject_id? }
  const res = await apiClient.post(`/api/chat/conversations`, payload);
  return res.data;
}

export async function listMessages(conversationId, params) {
  const res = await apiClient.get(`/api/chat/conversations/${conversationId}/messages`, { params });
  return res.data;
}

export async function sendMessage(conversationId, text) {
  const res = await apiClient.post(`/api/chat/conversations/${conversationId}/messages`, { text });
  return res.data;
}

export async function updateMessage(conversationId, messageId, text) {
  const res = await apiClient.patch(`/api/chat/conversations/${conversationId}/messages/${messageId}`, { text });
  return res.data;
}


