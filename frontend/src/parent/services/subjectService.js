import { apiClient } from "../../admin/services/apiClient";

export async function getAllClassSubjects(classId) {
  const res = await apiClient.get(`/api/subject/get-all-class-subjects/${classId}`);
  return res.data;
}

export async function getAllClassSubjectTeachers(classId, subjectId) {
  const res = await apiClient.get(`/api/subject/get-all-class-subject-teachers/${classId}/${subjectId}`);
  return res.data;
}


