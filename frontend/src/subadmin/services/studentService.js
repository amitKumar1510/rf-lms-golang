import { apiClient } from "../../admin/services/apiClient";

export async function createStudent(payload) {
  const res = await apiClient.post(`/api/student/create`, payload);
  return res.data;
}

export async function getStudentById(studentId) {
  const res = await apiClient.get(`/api/student/get/${studentId}`);
  return res.data;
}

export async function getAllStudents() {
  const res = await apiClient.get(`/api/student/get-all`);
  return res.data;
}

export async function updateStudent(studentId, payload) {
  const res = await apiClient.put(`/api/student/update/${studentId}`, payload);
  return res.data;
}

export async function deleteStudent(studentId) {
  const res = await apiClient.delete(`/api/student/delete/${studentId}`);
  return res.data;
}

export async function deactivateStudent(studentId) {
  const res = await apiClient.put(`/api/student/deactivate/${studentId}`);
  return res.data;
}

export async function activateStudent(studentId) {
  const res = await apiClient.put(`/api/student/activate/${studentId}`);
  return res.data;
}

export async function getStudentsByClassId(classId) {
  const res = await apiClient.get(`/api/student/get-by-class-id/${classId}`);
  return res.data;
}


