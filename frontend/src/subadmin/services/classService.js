import { apiClient } from "../../admin/services/apiClient";

// Classes
export async function createClass(payload) {
  const res = await apiClient.post(`/api/class/create`, payload);
  return res.data;
}

export async function getAllClasses() {
  const res = await apiClient.get(`/api/class/get-all`);
  return res.data;
}

export async function getClassById(classId) {
  const res = await apiClient.get(`/api/class/get/${classId}`);
  return res.data;
}

export async function updateClass(classId, payload) {
  const res = await apiClient.put(`/api/class/update/${classId}`, payload);
  return res.data;
}

export async function deleteClass(classId) {
  const res = await apiClient.delete(`/api/class/delete/${classId}`);
  return res.data;
}

// Sessions
export async function createSession(payload) {
  const res = await apiClient.post(`/api/class/create-session`, payload);
  return res.data;
}

export async function getAllSessions() {
  const res = await apiClient.get(`/api/class/get-all-sessions`);
  return res.data;
}

export async function getSessionById(sessionId) {
  const res = await apiClient.get(`/api/class/get-session/${sessionId}`);
  return res.data;
}

export async function updateSession(sessionId, payload) {
  const res = await apiClient.put(`/api/class/update-session/${sessionId}`, payload);
  return res.data;
}

export async function deleteSession(sessionId) {
  const res = await apiClient.delete(`/api/class/delete-session/${sessionId}`);
  return res.data;
}

export async function setCurrentSession(sessionId) {
  const res = await apiClient.post(`/api/class/set-current-session/${sessionId}`);
  return res.data;
}

export async function unsetCurrentSession(sessionId) {
  const res = await apiClient.post(`/api/class/unset-current-session/${sessionId}`);
  return res.data;
}

export async function getCurrentSession() {
  const res = await apiClient.get(`/api/class/get-current-session`);
  return res.data;
}


