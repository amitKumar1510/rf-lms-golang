import { apiClient } from "../../admin/services/apiClient";

export async function createAssignment(payload) {
  const res = await apiClient.post(`/api/assignment/create`, payload);
  return res.data;
}

export async function getAllAssignments(params) {
  const res = await apiClient.get(`/api/assignment/get-all`, { params });
  return res.data;
}

export async function updateAssignment(assignmentId, payload) {
  const res = await apiClient.put(`/api/assignment/update/${assignmentId}`, payload);
  return res.data;
}

export async function deleteAssignment(assignmentId) {
  const res = await apiClient.delete(`/api/assignment/delete/${assignmentId}`);
  return res.data;
}

export async function activateAssignment(assignmentId) {
  const res = await apiClient.post(`/api/assignment/activate/${assignmentId}`);
  return res.data;
}

export async function deactivateAssignment(assignmentId) {
  const res = await apiClient.post(`/api/assignment/deactivate/${assignmentId}`);
  return res.data;
}

export async function getAssignmentSubmissions(assignmentId) {
  const res = await apiClient.get(`/api/assignment/${assignmentId}/submissions`);
  return res.data;
}

export async function gradeSubmission(assignmentId, submissionId, payload) {
  const res = await apiClient.put(`/api/assignment/${assignmentId}/submissions/${submissionId}/grade`, payload);
  return res.data;
}

export async function getAssignment(assignmentId) {
  const res = await apiClient.get(`/api/assignment/get/${assignmentId}`);
  return res.data;
}

export async function addAssignmentQuestion(assignmentId, payload) {
  const res = await apiClient.post(`/api/assignment/${assignmentId}/questions`, payload);
  return res.data;
}

export async function updateAssignmentQuestion(assignmentId, questionId, payload) {
  const res = await apiClient.put(`/api/assignment/${assignmentId}/questions/${questionId}`, payload);
  return res.data;
}

export async function deleteAssignmentQuestion(assignmentId, questionId) {
  const res = await apiClient.delete(`/api/assignment/${assignmentId}/questions/${questionId}`);
  return res.data;
}

export async function uploadAssignmentQuestionFile(assignmentId, file) {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post(`/api/assignment/${assignmentId}/question-file`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteAssignmentQuestionFile(assignmentId) {
  const res = await apiClient.delete(`/api/assignment/${assignmentId}/question-file`);
  return res.data;
}


