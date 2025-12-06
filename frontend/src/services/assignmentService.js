import api from './api';

const assignmentService = {
  // Teacher methods
  createAssignment: async (assignmentData) => {
    const response = await api.post('/api/teachers/assignments', assignmentData);
    return response.data;
  },

  updateAssignment: async (assignmentId, assignmentData) => {
    const response = await api.put(`/api/teachers/assignments/${assignmentId}`, assignmentData);
    return response.data;
  },

  getTeacherAssignments: async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.classSubjectId && filters.classSubjectId !== 'all') {
      params.append('class_subject_id', filters.classSubjectId);
    }

    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    const queryString = params.toString();
    const url = queryString ? `/api/teachers/assignments?${queryString}` : '/api/teachers/assignments';

    const response = await api.get(url);
    return response.data;
  },

  getAssignmentDetails: async (assignmentId) => {
    const response = await api.get(`/api/teachers/assignments/${assignmentId}`);
    return response.data;
  },

  getAssignmentSubmissions: async (assignmentId) => {
    const response = await api.get(`/api/teachers/assignments/${assignmentId}/submissions`);
    return response.data;
  },

  gradeSubmission: async (submissionId, gradingData) => {
    const response = await api.put(`/api/teachers/assignments/submissions/${submissionId}`, gradingData);
    return response.data;
  },

  // Student methods
  getStudentAssignments: async (classSubjectId) => {
    const params = classSubjectId ? `?class_subject_id=${classSubjectId}` : '';
    const response = await api.get(`/api/students/assignments${params}`);
    return response.data;
  },

  getStudentAssignmentDetails: async (assignmentId) => {
    const response = await api.get(`/api/students/assignments/${assignmentId}`);
    return response.data;
  },

  submitAssignment: async (assignmentId, submissionData) => {
    const response = await api.post(`/api/students/assignments/${assignmentId}/submit`, submissionData);
    return response.data;
  },

  getStudentAssignmentStats: async () => {
    const response = await api.get('/api/students/assignments/stats');
    return response.data;
  },

  // File upload helper
  uploadAssignmentFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/upload/assignment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export default assignmentService;
