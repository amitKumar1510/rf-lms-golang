import { apiClient } from "../../admin/services/apiClient";

export async function createTeacher(payload) {
  const res = await apiClient.post(`/api/teacher/create`, payload);
  return res.data;
}

export async function getAllTeachers() {
  const res = await apiClient.get(`/api/teacher/get-all`);
  return res.data;
}

export async function getTeacherById(teacherId) {
  const res = await apiClient.get(`/api/teacher/get/${teacherId}`);
  return res.data;
}

export async function updateTeacher(teacherId, payload) {
  const res = await apiClient.put(`/api/teacher/update/${teacherId}`, payload);
  return res.data;
}

export async function deleteTeacher(teacherId) {
  const res = await apiClient.delete(`/api/teacher/delete/${teacherId}`);
  return res.data;
}

export async function deactivateTeacher(teacherId) {
  const res = await apiClient.post(`/api/teacher/deactivate/${teacherId}`);
  return res.data;
}

export async function activateTeacher(teacherId) {
  const res = await apiClient.post(`/api/teacher/activate/${teacherId}`);
  return res.data;
}

export async function getTeachersByClassId(classId) {
  const res = await apiClient.get(`/api/teacher/get-by-class/${classId}`);
  return res.data;
}

export async function getTeachersBySubjectId(subjectId) {
  const res = await apiClient.get(`/api/teacher/get-by-subject/${subjectId}`);
  return res.data;
}

export async function getTeachersByDepartmentId(departmentId) {
  const res = await apiClient.get(`/api/teacher/get-by-department/${departmentId}`);
  return res.data;
}


