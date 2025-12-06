import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import assignmentService from '../../services/assignmentService';

const TeacherAssignmentsTab = ({ classSubjects }) => {
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSubmissionsDialog, setShowSubmissionsDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [viewingQuestions, setViewingQuestions] = useState(null);
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false);

  // Filter states
  const [filterType, setFilterType] = useState('ongoing'); // 'ongoing', 'closed', 'all'
  const [filterClassSubject, setFilterClassSubject] = useState('all'); // 'all' or class_subject_id

  // Load assignments when component mounts or filters change
  useEffect(() => {
    loadAssignments();
  }, [filterType, filterClassSubject]);

  const loadAssignments = async () => {
    try {
      setAssignmentsLoading(true);
      const filters = {
        status: filterType,
        classSubjectId: filterClassSubject
      };
      const data = await assignmentService.getTeacherAssignments(filters);
      setAssignments(data);
      setAssignmentsError('');
    } catch (error) {
      console.error('Error loading assignments:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      setAssignmentsError(`Failed to load assignments: ${error.message || 'Please try again.'}`);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const handleCreateAssignment = async (assignmentData) => {
    try {
      await assignmentService.createAssignment(assignmentData);
      setShowCreateDialog(false);
      loadAssignments(); // Refresh list
      alert('Assignment created successfully!');
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Failed to create assignment. Please try again.');
    }
  };

  const handleEditAssignment = async (assignment) => {
    try {
      // Fetch detailed assignment data including questions
      const detailedAssignment = await assignmentService.getAssignmentDetails(assignment.id);
      setEditingAssignment(detailedAssignment);
      setShowCreateDialog(true);
    } catch (error) {
      console.error('Error fetching assignment details:', error);
      alert('Failed to load assignment details for editing.');
    }
  };

  const handleViewQuestions = async (assignment) => {
    try {
      // Fetch detailed assignment data including questions
      const detailedAssignment = await assignmentService.getAssignmentDetails(assignment.id);
      setViewingQuestions(detailedAssignment);
      setShowQuestionsDialog(true);
    } catch (error) {
      console.error('Error fetching assignment questions:', error);
      alert('Failed to load assignment questions.');
    }
  };

  const handleUpdateAssignment = async (assignmentData) => {
    try {
      await assignmentService.updateAssignment(editingAssignment.id, assignmentData);
      setShowCreateDialog(false);
      setEditingAssignment(null);
      loadAssignments(); // Refresh list
      alert('Assignment updated successfully!');
    } catch (error) {
      console.error('Error updating assignment:', error);
      alert('Failed to update assignment. Please try again.');
    }
  };

  const handleViewSubmissions = (assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionsDialog(true);
  };

  if (assignmentsLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (assignmentsError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {assignmentsError}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Assignment Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateDialog(true)}
        >
          Create Assignment
        </Button>
      </Box>

      {/* Filter Controls */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterType}
            label="Status"
            onChange={(e) => setFilterType(e.target.value)}
          >
            <MenuItem value="ongoing">Ongoing Assignments</MenuItem>
            <MenuItem value="closed">Closed Assignments</MenuItem>
            <MenuItem value="all">All Assignments</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Class & Subject</InputLabel>
          <Select
            value={filterClassSubject}
            label="Class & Subject"
            onChange={(e) => setFilterClassSubject(e.target.value)}
          >
            <MenuItem value="all">All Classes & Subjects</MenuItem>
            {classSubjects.map((cs) => (
              <MenuItem key={cs.id} value={cs.id}>
                {cs.class_name} - {cs.subject_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {assignments.length === 0 ? (
        <Alert severity="info">
          {filterType === 'ongoing' && filterClassSubject === 'all'
            ? 'No ongoing assignments found. Click "Create Assignment" to get started.'
            : `No assignments found matching the current filters (${filterType === 'ongoing' ? 'Ongoing' : filterType === 'closed' ? 'Closed' : 'All'} assignments${filterClassSubject !== 'all' ? ' for selected class' : ''}).`
          }
        </Alert>
      ) : (
          <Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Showing {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} •
                Status: {filterType === 'ongoing' ? 'Ongoing' : filterType === 'closed' ? 'Closed' : 'All'} •
                Class: {filterClassSubject === 'all' ? 'All Classes' : classSubjects.find(cs => cs.id === filterClassSubject)?.class_name + ' - ' + classSubjects.find(cs => cs.id === filterClassSubject)?.subject_name}
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {assignments.map((assignment) => {
                const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date();
                const isClosed = isOverdue;

                return (
                  <Grid item xs={12} md={6} lg={4} key={assignment.id}>
                    <Card sx={{ border: isClosed ? '2px solid #ff9800' : '1px solid #e0e0e0' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                            {assignment.title}
                          </Typography>
                          {isClosed && (
                            <Chip label="Closed" size="small" color="warning" />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {assignment.subject_name} - {assignment.class_name}
                        </Typography>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Chip
                            label={assignment.assignment_type === 'mcq_quiz' ? 'MCQ Quiz' : 'File Upload'}
                            size="small"
                            color={assignment.assignment_type === 'mcq_quiz' ? 'primary' : 'secondary'}
                          />
                        </Box>
                        <Typography variant="body2" gutterBottom>
                          Total Marks: {assignment.total_marks}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          Submissions: {assignment.submission_count}
                        </Typography>
                        {assignment.due_date && (
                          <Typography
                            variant="body2"
                            color={isOverdue ? 'error' : 'text.secondary'}
                          >
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                            {isOverdue && ' (Overdue)'}
                          </Typography>
                        )}
                        <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleEditAssignment(assignment)}
                      >
                        Edit
                      </Button>
                      {assignment.assignment_type === 'mcq_quiz' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="info"
                          onClick={() => handleViewQuestions(assignment)}
                        >
                          View Questions
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewSubmissions(assignment)}
                      >
                        View Submissions ({assignment.submission_count})
                      </Button>
                    </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* Create Assignment Dialog */}
        <CreateAssignmentDialog
          open={showCreateDialog}
          onClose={() => {
            setShowCreateDialog(false);
            setEditingAssignment(null);
          }}
          onSubmit={editingAssignment ? handleUpdateAssignment : handleCreateAssignment}
          classSubjects={classSubjects}
          editingAssignment={editingAssignment}
        />

        {/* Questions Dialog */}
        <QuestionsDialog
          open={showQuestionsDialog}
          onClose={() => {
            setShowQuestionsDialog(false);
            setViewingQuestions(null);
          }}
          assignment={viewingQuestions}
        />

        {/* Submissions Dialog */}
        <AssignmentSubmissionsDialog
          open={showSubmissionsDialog}
          onClose={() => setShowSubmissionsDialog(false)}
          assignment={selectedAssignment}
        />
    </Box>
  );
};

// Create Assignment Dialog Component
const CreateAssignmentDialog = ({ open, onClose, onSubmit, classSubjects, editingAssignment }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignment_type: 'file_upload',
    subject_id: '',
    class_subject_id: '',
    total_marks: 100,
    passing_marks: 40,
    due_date: '',
    questions: []
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    marks: 1
  });

  // Populate form when editing assignment
  React.useEffect(() => {
    if (editingAssignment) {
      // Find the class subject to get subject_id
      const classSubject = classSubjects.find(cs => cs.id === editingAssignment.class_subject_id);

      setFormData({
        title: editingAssignment.title || '',
        description: editingAssignment.description || '',
        assignment_type: editingAssignment.assignment_type || 'file_upload',
        subject_id: classSubject?.subject_id || '',
        class_subject_id: editingAssignment.class_subject_id || '',
        total_marks: editingAssignment.total_marks || 100,
        passing_marks: editingAssignment.passing_marks || 40,
        due_date: editingAssignment.due_date ? new Date(editingAssignment.due_date).toISOString().slice(0, 16) : '',
        questions: editingAssignment.questions || []
      });
    } else {
      // Reset form for new assignment
      setFormData({
        title: '',
        description: '',
        assignment_type: 'file_upload',
        subject_id: '',
        class_subject_id: '',
        total_marks: 100,
        passing_marks: 40,
        due_date: '',
        questions: []
      });
    }
  }, [editingAssignment, classSubjects]);

  const handleAddQuestion = () => {
    if (!currentQuestion.question_text.trim()) return;

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, {
        ...currentQuestion,
        order: prev.questions.length
      }]
    }));

    setCurrentQuestion({
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      marks: 1
    });
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.class_subject_id) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.assignment_type === 'mcq_quiz' && formData.questions.length === 0) {
      alert('Please add at least one question for MCQ quiz');
      return;
    }

    // Find the subject_id from the selected class_subject_id
    const selectedClassSubject = classSubjects.find(cs => cs.id === formData.class_subject_id);
    if (!selectedClassSubject || !selectedClassSubject.subject_id) {
      alert('Unable to determine subject. Please try again.');
      return;
    }

    // Include subject_id and ensure proper datetime format
    const submissionData = {
      ...formData,
      subject_id: selectedClassSubject.subject_id,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
    };

    onSubmit(submissionData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Assignment Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Assignment Type</InputLabel>
              <Select
                value={formData.assignment_type}
                label="Assignment Type"
                onChange={(e) => setFormData(prev => ({ ...prev, assignment_type: e.target.value }))}
              >
                <MenuItem value="file_upload">File Upload Assignment</MenuItem>
                <MenuItem value="mcq_quiz">MCQ Quiz</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Class & Subject</InputLabel>
                <Select
                  value={formData.class_subject_id}
                  label="Class & Subject"
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selectedClassSubject = classSubjects.find(cs => cs.id === selectedId);
                    setFormData(prev => ({
                      ...prev,
                      class_subject_id: selectedId,
                      subject_id: selectedClassSubject?.subject_id || ''
                    }));
                  }}
                  required
                >
                  {classSubjects.map((cs) => (
                    <MenuItem key={cs.id} value={cs.id}>
                      {cs.class_name} - {cs.subject_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="datetime-local"
              label="Due Date (Optional)"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="text"
              label="Total Marks"
              value={formData.total_marks}
              onChange={(e) => setFormData(prev => ({ ...prev, total_marks: parseFloat(e.target.value) || 0 }))}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="text"
              label="Passing Marks"
              value={formData.passing_marks}
              onChange={(e) => setFormData(prev => ({ ...prev, passing_marks: parseFloat(e.target.value) || 0 }))}
            />
          </Grid>

          {formData.assignment_type === 'mcq_quiz' && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Questions ({formData.questions.length} added)
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Add Question
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Question Text"
                        value={currentQuestion.question_text}
                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Question Type</InputLabel>
                        <Select
                          value={currentQuestion.question_type}
                          label="Question Type"
                          onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question_type: e.target.value }))}
                        >
                          <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                          <MenuItem value="true_false">True/False</MenuItem>
                          <MenuItem value="short_answer">Short Answer</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Marks"
                        value={currentQuestion.marks}
                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, marks: parseFloat(e.target.value) || 1 }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleAddQuestion}
                        disabled={!currentQuestion.question_text.trim()}
                      >
                        Add Question
                      </Button>
                    </Grid>

                    {currentQuestion.question_type === 'multiple_choice' && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Options:
                        </Typography>
                        {currentQuestion.options.map((option, index) => (
                          <TextField
                            key={index}
                            fullWidth
                            size="small"
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...currentQuestion.options];
                              newOptions[index] = e.target.value;
                              setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                            }}
                            sx={{ mb: 1 }}
                          />
                        ))}
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel>Correct Answer</InputLabel>
                          <Select
                            value={currentQuestion.correct_answer}
                            label="Correct Answer"
                            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, correct_answer: e.target.value }))}
                          >
                            {currentQuestion.options.map((option, index) => (
                              <MenuItem key={index} value={option} disabled={!option.trim()}>
                                {option || `Option ${index + 1}`}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}

                    {currentQuestion.question_type === 'true_false' && (
                      <Grid item xs={12}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Correct Answer</InputLabel>
                          <Select
                            value={currentQuestion.correct_answer}
                            label="Correct Answer"
                            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, correct_answer: e.target.value }))}
                          >
                            <MenuItem value="true">True</MenuItem>
                            <MenuItem value="false">False</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                  </Grid>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
          </Button>
        </DialogActions>
    </Dialog>
  );
};

// Assignment Submissions Dialog Component
const AssignmentSubmissionsDialog = ({ open, onClose, assignment }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && assignment) {
      loadSubmissions();
    }
  }, [open, assignment]);

  const loadSubmissions = async () => {
    if (!assignment) return;

    try {
      setLoading(true);
      const data = await assignmentService.getAssignmentSubmissions(assignment.id);
      setSubmissions(data);
    } catch (error) {
      console.error('Error loading submissions:', error);
      alert('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async (submissionId, marks, feedback) => {
    try {
      await assignmentService.gradeSubmission(submissionId, {
        marks_obtained: marks,
        feedback: feedback,
        is_graded: true
      });
      loadSubmissions(); // Refresh
      alert('Submission graded successfully!');
    } catch (error) {
      console.error('Error grading submission:', error);
      alert('Failed to grade submission');
    }
  };

  if (!assignment) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Submissions for: {assignment.title}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : submissions.length === 0 ? (
          <Alert severity="info">No submissions yet.</Alert>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Roll No</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Marks</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>{submission.student_name}</TableCell>
                  <TableCell>{submission.roll_number}</TableCell>
                  <TableCell>
                    <Chip
                      label={submission.submission_type === 'mcq_answers' ? 'MCQ' : 'File'}
                      size="small"
                      color={submission.submission_type === 'mcq_answers' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>
                    {submission.is_graded ? (
                      <Chip label="Graded" color="success" size="small" />
                    ) : submission.is_submitted ? (
                      <Chip label="Submitted" color="warning" size="small" />
                    ) : (
                      <Chip label="Pending" color="default" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    {submission.marks_obtained !== null ? (
                      `${submission.marks_obtained}/${submission.total_marks} (${submission.percentage?.toFixed(1)}%)`
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {assignment.assignment_type === 'file_upload' && submission.is_submitted && !submission.is_graded && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          const marks = prompt('Enter marks:');
                          const feedback = prompt('Enter feedback (optional):');
                          if (marks !== null) {
                            handleGradeSubmission(submission.id, parseFloat(marks), feedback);
                          }
                        }}
                      >
                        Grade
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// Questions Dialog Component
const QuestionsDialog = ({ open, onClose, assignment }) => {
  if (!assignment) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Questions for: {assignment.title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
          {assignment.subject_name} • {assignment.questions?.length || 0} questions
        </Typography>

        {assignment.questions && assignment.questions.length > 0 ? (
          assignment.questions.map((question, index) => (
            <Card key={question.id || index} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Question {index + 1}
                </Typography>
                <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
                  {question.question_text}
                </Typography>

                <Box display="flex" alignItems="center" mb={1}>
                  <Chip
                    label={question.question_type === 'multiple_choice' ? 'Multiple Choice' :
                           question.question_type === 'true_false' ? 'True/False' : 'Short Answer'}
                    size="small"
                    color="primary"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {question.marks} mark{question.marks !== 1 ? 's' : ''}
                  </Typography>
                </Box>

                {question.question_type === 'multiple_choice' && question.options && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Options:
                    </Typography>
                    {question.options.map((option, optIndex) => (
                      <Box
                        key={optIndex}
                        sx={{
                          p: 1,
                          mb: 1,
                          borderRadius: 1,
                          bgcolor: question.correct_answer === option ? 'success.light' : 'grey.50',
                          border: question.correct_answer === option ? '2px solid green' : '1px solid grey'
                        }}
                      >
                        <Typography variant="body2">
                          {String.fromCharCode(65 + optIndex)}) {option}
                          {question.correct_answer === option && (
                            <Chip
                              label="Correct Answer"
                              size="small"
                              color="success"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {question.question_type === 'true_false' && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Correct Answer:
                    </Typography>
                    <Chip
                      label={question.correct_answer === 'true' ? 'True' : 'False'}
                      color="success"
                      size="small"
                    />
                  </Box>
                )}

                {question.question_type === 'short_answer' && question.correct_answer && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Sample Answer:
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      {question.correct_answer}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Alert severity="info">
            No questions found for this assignment.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TeacherAssignmentsTab;
