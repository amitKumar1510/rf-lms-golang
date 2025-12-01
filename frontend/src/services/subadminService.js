import api from './api';

// Subadmin Services
export const subadminService = {
  // Subject Management
  createSubject: async (schoolId, subjectData) => {
    const response = await api.post(`/api/users/schools/${schoolId}/subjects`, subjectData);
    return response.data;
  },

  getSubjects: async (schoolId) => {
    const response = await api.get(`/api/users/schools/${schoolId}/subjects`);
    return response.data;
  },

  updateSubject: async (schoolId, subjectId, subjectData) => {
    const response = await api.put(`/api/users/schools/${schoolId}/subjects/${subjectId}`, subjectData);
    return response.data;
  },

  deleteSubject: async (schoolId, subjectId) => {
    const response = await api.delete(`/api/users/schools/${schoolId}/subjects/${subjectId}`);
    return response.data;
  },

  // Class Management
  createClass: async (schoolId, classData) => {
    const response = await api.post(`/api/users/schools/${schoolId}/classes`, classData);
    return response.data;
  },

  getClasses: async (schoolId, includeStudentCount = false) => {
    const response = await api.get(`/api/users/schools/${schoolId}/classes`, {
      params: { include_student_count: includeStudentCount }
    });
    return response.data;
  },

  updateClass: async (schoolId, classId, classData) => {
    const response = await api.put(`/api/users/schools/${schoolId}/classes/${classId}`, classData);
    return response.data;
  },

  deleteClass: async (schoolId, classId) => {
    const response = await api.delete(`/api/users/schools/${schoolId}/classes/${classId}`);
    return response.data;
  },

  // Class Subject Management
  addSubjectToClass: async (classId, subjectData) => {
    const response = await api.post(`/api/users/classes/${classId}/subjects`, subjectData);
    return response.data;
  },

  getClassSubjects: async (classId) => {
    const response = await api.get(`/api/users/classes/${classId}/subjects`);
    return response.data;
  },

  removeSubjectFromClass: async (classSubjectId) => {
    const response = await api.delete(`/api/users/classes/subjects/${classSubjectId}`);
    return response.data;
  },

  updateClassSubject: async (classSubjectId, updateData) => {
    const response = await api.put(`/api/users/classes/subjects/${classSubjectId}`, updateData);
    return response.data;
  },

  // Teacher Assignment
  assignTeacherToSubject: async (classSubjectId, teacherData) => {
    const response = await api.post(`/api/users/class-subjects/${classSubjectId}/teachers`, teacherData);
    return response.data;
  },

  updateTeacherAssignment: async (assignmentId, updateData) => {
    const response = await api.put(`/api/users/class-subject-teachers/${assignmentId}`, updateData);
    return response.data;
  },

  removeTeacherFromSubject: async (assignmentId) => {
    const response = await api.delete(`/api/users/class-subject-teachers/${assignmentId}`);
    return response.data;
  },

  // Class Teacher (Homeroom)
  assignClassTeacher: async (classId, teacherData) => {
    const response = await api.post(`/api/users/classes/${classId}/class-teacher`, teacherData);
    return response.data;
  },

  // Academic Session Management
  createSession: async (schoolId, sessionData) => {
    const response = await api.post(`/api/users/schools/${schoolId}/sessions`, sessionData);
    return response.data;
  },

  getSessions: async (schoolId) => {
    const response = await api.get(`/api/users/schools/${schoolId}/sessions`);
    return response.data;
  },

  setCurrentSession: async (schoolId, sessionId) => {
    const response = await api.put(`/api/users/schools/${schoolId}/sessions/${sessionId}/current`);
    return response.data;
  },

  // Student Promotion
  promoteStudents: async (promotionData) => {
    const response = await api.post('/api/users/classes/promote', promotionData);
    return response.data;
  },

  // Account Management
  activateDeactivateUser: async (userId, isActive) => {
    const response = await api.put(`/api/users/users/${userId}/status`, { is_active: isActive });
    return response.data;
  },

  // Class Overview
  getClassOverview: async (classId) => {
    const response = await api.get(`/api/users/classes/${classId}/overview`);
    return response.data;
  },

  // School Info
  getSchool: async (schoolId) => {
    const response = await api.get(`/api/users/schools/${schoolId}`);
    return response.data;
  },

  // Teacher Management
  createTeacher: async (schoolId, teacherData) => {
    const response = await api.post(`/api/users/schools/${schoolId}/teachers`, teacherData);
    return response.data;
  },

  getTeachers: async (schoolId) => {
    const response = await api.get(`/api/teachers/school/${schoolId}`);
    return response.data;
  },

  updateTeacher: async (teacherId, teacherData) => {
    const response = await api.put(`/api/teachers/${teacherId}`, teacherData);
    return response.data;
  },

  deleteTeacher: async (teacherId) => {
    const response = await api.delete(`/api/teachers/${teacherId}`);
    return response.data;
  },

  // Student Management
  createStudent: async (schoolId, studentData) => {
    const response = await api.post(`/api/users/schools/${schoolId}/students`, studentData);
    return response.data;
  },

  getStudents: async (schoolId) => {
    const response = await api.get(`/api/students/school/${schoolId}`);
    return response.data;
  },

  getClassStudents: async (classId) => {
    const response = await api.get(`/api/students/class/${classId}`);
    return response.data;
  },

  updateStudent: async (studentId, studentData) => {
    const response = await api.put(`/api/students/${studentId}`, studentData);
    return response.data;
  },

  deleteStudent: async (studentId) => {
    const response = await api.delete(`/api/students/${studentId}`);
    return response.data;
  },

  // Principle Management
  createPrinciple: async (schoolId, principleData) => {
    const response = await api.post(`/api/users/schools/${schoolId}/principles`, principleData);
    return response.data;
  },

  getPrinciples: async (schoolId) => {
    const response = await api.get(`/api/principles/school/${schoolId}`);
    return response.data;
  },

  updatePrinciple: async (principleId, principleData) => {
    const response = await api.put(`/api/principles/${principleId}`, principleData);
    return response.data;
  },

  deletePrinciple: async (principleId) => {
    const response = await api.delete(`/api/principles/${principleId}`);
    return response.data;
  }
};
