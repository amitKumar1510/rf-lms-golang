import { apiClient } from "../admin/services/apiClient";

export async function getUnreadCount() {
  const res = await apiClient.get(`/api/notification/unread-count`);
  return res.data;
}

export async function getInbox(params) {
  const res = await apiClient.get(`/api/notification/inbox`, { params });
  return res.data;
}

export async function markRead(recipientRowId) {
  const res = await apiClient.post(`/api/notification/${recipientRowId}/read`);
  return res.data;
}

export async function sendNotification(payload) {
  // payload: { title, message, audience }
  const res = await apiClient.post(`/api/notification/send`, payload);
  return res.data;
}


