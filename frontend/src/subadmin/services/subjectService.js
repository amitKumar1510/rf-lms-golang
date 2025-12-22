import { apiClient } from "../../admin/services/apiClient";

export async function createSubject(payload) {
  const res = await apiClient.post(`/api/subject/create`, payload);
  return res.data;
}

export async function getAllSubjects() {
  const res = await apiClient.get(`/api/subject/get-all`);
  return res.data;
}

export async function getSubjectById(subjectId) {
  const res = await apiClient.get(`/api/subject/get/${subjectId}`);
  return res.data;
}

export async function updateSubject(subjectId, payload) {
  const res = await apiClient.put(`/api/subject/update/${subjectId}`, payload);
  return res.data;
}

export async function deleteSubject(subjectId) {
  const res = await apiClient.delete(`/api/subject/delete/${subjectId}`);
  return res.data;
}

export async function deactivateSubject(subjectId) {
  const res = await apiClient.post(`/api/subject/deactivate/${subjectId}`);
  return res.data;
}

export async function activateSubject(subjectId) {
  const res = await apiClient.post(`/api/subject/activate/${subjectId}`);
  return res.data;
}

// Class Subject (assign subjects to classes)
export async function assignSubjectToClass(subjectId, classId, payload) {
  const res = await apiClient.post(`/api/subject/assign-subject-to-class/${subjectId}/${classId}`, payload);
  return res.data;
}

export async function getAllClassSubjects(classId) {
  const res = await apiClient.get(`/api/subject/get-all-class-subjects/${classId}`);
  return res.data;
}

export async function deleteClassSubject(classId, subjectId) {
  const res = await apiClient.delete(`/api/subject/delete-class-subject/${classId}/${subjectId}`);
  return res.data;
}

export async function deactivateClassSubject(classId, subjectId) {
  const res = await apiClient.post(`/api/subject/deactivate-class-subject/${classId}/${subjectId}`);
  return res.data;
}

export async function activateClassSubject(classId, subjectId) {
  const res = await apiClient.post(`/api/subject/activate-class-subject/${classId}/${subjectId}`);
  return res.data;
}

export async function updateClassSubject(classId, subjectId, payload) {
  const res = await apiClient.put(`/api/subject/update-class-subject/${classId}/${subjectId}`, payload);
  return res.data;
}


