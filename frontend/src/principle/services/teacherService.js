import { apiClient } from "../../admin/services/apiClient";

export async function getAllTeachers() {
  const res = await apiClient.get(`/api/teacher/get-all`);
  return res.data;
}

export async function getTeacherById(teacherId) {
  const res = await apiClient.get(`/api/teacher/get/${teacherId}`);
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


