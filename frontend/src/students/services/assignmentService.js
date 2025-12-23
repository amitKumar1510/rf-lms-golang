import { apiClient } from "../../admin/services/apiClient";

export async function getStudentAssignments(params) {
  const res = await apiClient.get(`/api/assignment/student/get-all`, { params });
  return res.data;
}

export async function getStudentAssignment(assignmentId) {
  const res = await apiClient.get(`/api/assignment/student/get/${assignmentId}`);
  return res.data;
}

export async function getMySubmissions(params) {
  const res = await apiClient.get(`/api/assignment/student/submissions`, { params });
  return res.data;
}

export async function submitAssignmentFile(assignmentId, file) {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post(`/api/assignment/${assignmentId}/submit-file`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function submitAssignmentMcq(assignmentId, submitted_answers) {
  const res = await apiClient.post(`/api/assignment/${assignmentId}/submit-mcq`, submitted_answers);
  return res.data;
}


