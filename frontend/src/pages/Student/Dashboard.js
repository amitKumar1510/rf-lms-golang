import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab,
  Avatar,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  School as SchoolIcon,
  Subject as SubjectIcon,
  Grade as GradeIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import studentService from '../../services/studentService';
import assignmentService from '../../services/assignmentService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await studentService.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getGradeColor = (grade) => {
    if (!grade) return 'default';
    if (grade.startsWith('A')) return 'success';
    if (grade.startsWith('B')) return 'primary';
    if (grade.startsWith('C')) return 'warning';
    return 'error';
  };

  const handleSubjectClick = (subjectId) => {
    navigate(`/student/subject/${subjectId}`);
  };

  const renderProfileTab = () => {
    if (!dashboardData?.profile) return null;

    const profile = dashboardData.profile;
    const stats = dashboardData.quick_stats;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'secondary.main' }}
              >
                <PersonIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h6">{profile.name}</Typography>
              <Typography color="text.secondary">{profile.email}</Typography>
              <Chip label="Student" color="secondary" size="small" sx={{ mt: 1 }} />
              <Typography variant="body2" sx={{ mt: 1, color: 'primary.main' }}>
                {profile.class_name}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Quick Stats</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Roll Number</Typography>
                <Typography>{profile.roll_number || 'Not assigned'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Overall Attendance</Typography>
                <Typography variant="h6" color="primary">{stats?.overall_attendance || 0}%</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Current GPA</Typography>
                <Typography variant="h6" color="success.main">{stats?.current_gpa || 0}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Personal Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                  <Typography>
                    {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Gender</Typography>
                  <Typography>{profile.gender || 'Not provided'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Blood Group</Typography>
                  <Typography>{profile.blood_group || 'Not provided'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Admission Date</Typography>
                  <Typography>
                    {profile.admission_date ? new Date(profile.admission_date).toLocaleDateString() : 'Not provided'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Guardian Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Guardian Name</Typography>
                  <Typography>{profile.guardian_name || 'Not provided'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Contact Number</Typography>
                  <Typography>{profile.guardian_phone || 'Not provided'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {profile.address && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Address Information</Typography>
                <Typography variant="body2">
                  {profile.address.street && `${profile.address.street}, `}
                  {profile.address.city && `${profile.address.city}, `}
                  {profile.address.state && `${profile.address.state}, `}
                  {profile.address.country && profile.address.country}
                  {profile.address.postal_code && ` - ${profile.address.postal_code}`}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    );
  };

  const renderSubjectsTab = () => {
    if (!dashboardData?.subjects) return null;

    return (
      <Box>
        <Alert severity="info" sx={{ mb: 3 }}>
          Your enrolled subjects for the current academic year
        </Alert>

        {dashboardData.subjects.length === 0 ? (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
            No subjects enrolled yet
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {dashboardData.subjects.map((subjectInfo) => (
              <Grid item xs={12} sm={6} md={4} key={subjectInfo.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: (theme) => theme.shadows[8],
                      cursor: 'pointer'
                    },
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                  onClick={() => handleSubjectClick(subjectInfo.subject_id)}
                >
                  <CardContent sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    p: 3
                  }}>
                    {/* Header with icon and title */}
                    <Box display="flex" alignItems="center" mb={2}>
                      <Box sx={{
                        bgcolor: 'primary.main',
                        borderRadius: 2,
                        p: 1,
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <SubjectIcon sx={{ color: 'white', fontSize: 24 }} />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="h6" sx={{
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          lineHeight: 1.2,
                          mb: 0.5
                        }}>
                          {subjectInfo.subject?.name || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {subjectInfo.subject?.code || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Subject Type Chip */}
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={subjectInfo.is_compulsory ? 'Compulsory' : 'Elective'}
                        color={subjectInfo.is_compulsory ? 'primary' : 'secondary'}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    </Box>

                    {/* Credits */}
                    {subjectInfo.credits && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                          Credits: <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{subjectInfo.credits}</Box>
                        </Typography>
                      </Box>
                    )}

                    {/* Teacher Email - Push to bottom if credits exist, otherwise flexible */}
                    <Box sx={{
                      mt: subjectInfo.credits ? 0 : 'auto',
                      mb: 2,
                      flexGrow: subjectInfo.credits ? 0 : 1
                    }}>
                      {subjectInfo.teacher && subjectInfo.teacher.email && (
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                            Teacher Email
                          </Typography>
                          <Typography variant="body2" sx={{
                            wordBreak: 'break-word',
                            fontSize: '0.875rem',
                            color: 'primary.main',
                            fontWeight: 500
                          }}>
                            {subjectInfo.teacher.email}
                          </Typography>
                        </>
                      )}
                    </Box>

                    {/* Academic Year - Always at bottom */}
                    <Box sx={{ mt: 'auto', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                      {subjectInfo.academic_year && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {subjectInfo.academic_year}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  const renderGradesOverviewChart = () => {
    const terms = ['Term 1', 'Term 2', 'Term 3', 'Current'];
    let chartData;

    if (!dashboardData?.grades || dashboardData.grades.length === 0) {
      // Show empty chart with default axes
      chartData = {
        labels: terms,
        datasets: [
          {
            label: 'No Data Available',
            data: [0, 0, 0, 0],
            borderColor: '#cccccc',
            backgroundColor: '#cccccc20',
            tension: 0.4,
          }
        ]
      };
    } else {
      // Calculate GPA trend (mock data for demonstration - in real app, you'd have historical data)
      const subjects = [...new Set(dashboardData.grades.map(g => g.subject?.name).filter(Boolean))];

      if (subjects.length === 0) {
        chartData = {
          labels: terms,
          datasets: [
            {
              label: 'No Subject Data',
              data: [0, 0, 0, 0],
              borderColor: '#cccccc',
              backgroundColor: '#cccccc20',
              tension: 0.4,
            }
          ]
        };
      } else {
        chartData = {
          labels: terms,
          datasets: subjects.map((subjectName, index) => {
            const subjectGrades = dashboardData.grades.filter(g => g.subject?.name === subjectName);
            const currentGrade = subjectGrades.length > 0 ? subjectGrades[0].final_marks || subjectGrades[0].midterm_marks || 0 : 0;

            // Generate mock trend data
            const trend = [
              Math.max(0, currentGrade - 15 + Math.random() * 10), // Previous terms
              Math.max(0, currentGrade - 8 + Math.random() * 8),
              Math.max(0, currentGrade - 3 + Math.random() * 6),
              currentGrade // Current
            ];

            const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];
            return {
              label: subjectName,
              data: trend,
              borderColor: colors[index % colors.length],
              backgroundColor: colors[index % colors.length] + '20',
              tension: 0.4,
            };
          })
        };
      }
    }

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Grade Trends Over Terms',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: 100,
          title: {
            display: true,
            text: 'Marks (%)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Terms'
          }
        }
      },
    };

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Grade Trends</Typography>
          <Box sx={{ height: 300 }}>
            <Line data={chartData} options={options} />
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderSubjectWiseGradesChart = () => {
    let chartData;

    if (!dashboardData?.grades || dashboardData.grades.length === 0) {
      // Show empty chart with actual subject names
      const subjectNames = dashboardData?.subjects?.length > 0
        ? dashboardData.subjects.slice(0, 6).map(subjectInfo => subjectInfo.subject?.name || 'Unknown')
        : ['Subject 1', 'Subject 2', 'Subject 3']; // fallback if no subjects data

      chartData = {
        labels: subjectNames,
        datasets: [
          {
            label: 'Midterm Marks',
            data: subjectNames.map(() => 0),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
          {
            label: 'Final Marks',
            data: subjectNames.map(() => 0),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          }
        ]
      };
    } else {
      chartData = {
        labels: dashboardData.grades.map(grade => grade.subject?.name || 'Unknown').slice(0, 6), // Limit to 6 subjects
        datasets: [
          {
            label: 'Midterm Marks',
            data: dashboardData.grades.map(grade => grade.midterm_marks || 0).slice(0, 6),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
          {
            label: 'Final Marks',
            data: dashboardData.grades.map(grade => grade.final_marks || 0).slice(0, 6),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          }
        ]
      };
    }

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Subject-wise Performance Comparison',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: 100,
          title: {
            display: true,
            text: 'Marks (%)'
          }
        }
      },
    };

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Subject-wise Performance</Typography>
          <Box sx={{ height: 300 }}>
            <Bar data={chartData} options={options} />
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderAttendanceChart = () => {
    let chartData;

    if (!dashboardData?.attendance?.subjects || dashboardData.attendance.subjects.length === 0) {
      // Show empty chart with actual subject names
      const subjectNames = dashboardData?.subjects?.length > 0
        ? dashboardData.subjects.slice(0, 8).map(subjectInfo => subjectInfo.subject?.name || 'Unknown')
        : ['Subject 1', 'Subject 2', 'Subject 3', 'Subject 4']; // fallback if no subjects data

      chartData = {
        labels: subjectNames,
        datasets: [
          {
            label: 'Attendance (%)',
            data: subjectNames.map(() => 0),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          }
        ]
      };
    } else {
      chartData = {
        labels: dashboardData.attendance.subjects.map(subject => subject.name).slice(0, 8), // Limit to 8 subjects
        datasets: [
          {
            label: 'Attendance (%)',
            data: dashboardData.attendance.subjects.map(subject => subject.percentage).slice(0, 8),
            backgroundColor: dashboardData.attendance.subjects.map((_, index) => {
              const percentage = dashboardData.attendance.subjects[index]?.percentage || 0;
              if (percentage >= 90) return 'rgba(75, 192, 192, 0.6)';
              if (percentage >= 75) return 'rgba(255, 206, 86, 0.6)';
              return 'rgba(255, 99, 132, 0.6)';
            }).slice(0, 8),
            borderColor: dashboardData.attendance.subjects.map((_, index) => {
              const percentage = dashboardData.attendance.subjects[index]?.percentage || 0;
              if (percentage >= 90) return 'rgba(75, 192, 192, 1)';
              if (percentage >= 75) return 'rgba(255, 206, 86, 1)';
              return 'rgba(255, 99, 132, 1)';
            }).slice(0, 8),
            borderWidth: 1,
          }
        ]
      };
    }

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Subject-wise Attendance',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: 100,
          title: {
            display: true,
            text: 'Attendance (%)'
          }
        }
      },
    };

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Attendance Overview</Typography>
          <Box sx={{ height: 300 }}>
            <Bar data={chartData} options={options} />
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderGradesTab = () => {
    if (!dashboardData?.grades) return null;

    return (
      <Box>
        <Alert severity="info" sx={{ mb: 3 }}>
          Academic performance overview
        </Alert>

        {/* Charts Section */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          📊 Performance Analytics
        </Typography>
        {renderGradesOverviewChart()}
        {renderSubjectWiseGradesChart()}

        <Typography variant="h6" sx={{ mb: 2, mt: 4, fontWeight: 600 }}>
          📋 Detailed Grades
        </Typography>

        {dashboardData.grades.length === 0 ? (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
            No grades available yet
          </Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Subject</TableCell>
                  <TableCell>Teacher</TableCell>
                  <TableCell align="right">Midterm</TableCell>
                  <TableCell align="right">Final</TableCell>
                  <TableCell align="center">Grade</TableCell>
                  <TableCell align="right">Attendance</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboardData.grades.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <SubjectIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body1">{grade.subject?.name || 'N/A'}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {grade.subject?.code || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{grade.teacher || 'Not assigned'}</TableCell>
                    <TableCell align="right">
                      {grade.midterm_marks !== null ? `${grade.midterm_marks}%` : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {grade.final_marks !== null ? `${grade.final_marks}%` : '-'}
                    </TableCell>
                    <TableCell align="center">
                      {grade.grade ? (
                        <Chip
                          label={grade.grade}
                          color={getGradeColor(grade.grade)}
                          size="small"
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {grade.attendance_percentage || 0}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={grade.attendance_percentage || 0}
                          sx={{ width: 60, height: 6 }}
                          color={(grade.attendance_percentage || 0) >= 90 ? 'success' :
                                 (grade.attendance_percentage || 0) >= 75 ? 'warning' : 'error'}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={grade.status || 'enrolled'}
                        color={(grade.status === 'completed') ? 'success' : 'primary'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    );
  };

  // Assignment related state
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);

  // Load assignments when assignments tab is selected
  useEffect(() => {
    if (activeTab === 2) { // Assignments tab
      loadAssignments();
    }
  }, [activeTab]);

  const loadAssignments = async () => {
    try {
      setAssignmentsLoading(true);
      const data = await assignmentService.getStudentAssignments();
      setAssignments(data);
      setAssignmentsError('');
    } catch (error) {
      console.error('Error loading assignments:', error);
      setAssignmentsError('Failed to load assignments. Please try again.');
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const renderAssignmentsTab = () => {

    const handleAttemptAssignment = (assignment) => {
      setSelectedAssignment(assignment);
      setMcqAnswers({});
      setSelectedFile(null);
      setShowAssignmentDialog(true);
    };

    const handleSubmitAssignment = async () => {
      if (!selectedAssignment) return;

      try {
        let submissionData = {
          assignment_id: selectedAssignment.id,
          submission_type: selectedAssignment.assignment_type === 'mcq_quiz' ? 'mcq_answers' : 'file_upload'
        };

        if (selectedAssignment.assignment_type === 'mcq_quiz') {
          submissionData.submitted_answers = mcqAnswers;
        } else {
          if (!selectedFile) {
            alert('Please select a file to upload');
            return;
          }
          // In a real implementation, you'd upload the file first and get the file path
          // For now, we'll just simulate it
          submissionData.file_path = 'uploaded_file_path';
          submissionData.file_name = selectedFile.name;
        }

        await assignmentService.submitAssignment(selectedAssignment.id, submissionData);
        setShowAssignmentDialog(false);
        loadAssignments(); // Refresh to show updated status
        alert('Assignment submitted successfully!');
      } catch (error) {
        console.error('Error submitting assignment:', error);
        alert('Failed to submit assignment. Please try again.');
      }
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
        <Typography variant="h5" gutterBottom>
          My Assignments
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
          View and submit your assignments
        </Typography>

        {assignments.length === 0 ? (
          <Alert severity="info">
            No assignments available at the moment.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {assignments.map((assignment) => (
              <Grid item xs={12} md={6} lg={4} key={assignment.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {assignment.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {assignment.subject_name}
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
                    {assignment.due_date && (
                      <Typography variant="body2" color="text.secondary">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </Typography>
                    )}
                    <Box mt={2}>
                      {assignment.has_submitted ? (
                        <Box>
                          <Chip
                            label={assignment.is_graded ? 'Graded' : 'Submitted'}
                            color={assignment.is_graded ? 'success' : 'warning'}
                            size="small"
                          />
                          {assignment.marks_obtained !== null && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Score: {assignment.marks_obtained}/{assignment.total_marks}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          onClick={() => handleAttemptAssignment(assignment)}
                        >
                          {assignment.assignment_type === 'mcq_quiz' ? 'Take Quiz' : 'Submit Assignment'}
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Assignment Dialog */}
        <AssignmentDialog
          open={showAssignmentDialog}
          onClose={() => setShowAssignmentDialog(false)}
          assignment={selectedAssignment}
          onSubmit={handleSubmitAssignment}
          mcqAnswers={mcqAnswers}
          setMcqAnswers={setMcqAnswers}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
        />
      </Box>
    );
  };

  const renderAttendanceTab = () => {
    if (!dashboardData?.attendance) return null;

    const attendance = dashboardData.attendance;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Overall Attendance</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" color="primary" sx={{ mr: 1 }}>
                  {attendance.overall || 0}%
                </Typography>
                <Typography color="text.secondary">
                  {attendance.academic_year || 'current academic year'}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={attendance.overall || 0}
                sx={{ height: 10, borderRadius: 5 }}
                color={(attendance.overall || 0) >= 90 ? 'success' : (attendance.overall || 0) >= 75 ? 'warning' : 'error'}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Subject-wise Attendance</Typography>
              {!attendance.subjects || attendance.subjects.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No attendance records found
                </Typography>
              ) : (
                <List>
                  {attendance.subjects.map((subject, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText
                        primary={subject.name}
                        secondary={subject.total === 0 ? 'No attendance data' : `${subject.present}/${subject.total} classes`}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 100 }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {subject.percentage}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={subject.percentage}
                          sx={{ width: 60, height: 6 }}
                          color={subject.percentage >= 90 ? 'success' :
                                 subject.percentage >= 75 ? 'warning' : 'error'}
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Student Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Welcome back, {user?.name}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="student dashboard tabs">
          <Tab label="Profile" />
          <Tab label="Subjects" />
          <Tab label="Assignments" />
          <Tab label="Grades" />
          <Tab label="Attendance" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : (
            <>
              {activeTab === 0 && renderProfileTab()}
              {activeTab === 1 && renderSubjectsTab()}
              {activeTab === 2 && renderAssignmentsTab()}
              {activeTab === 3 && renderGradesTab()}
              {activeTab === 4 && renderAttendanceTab()}
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

// Assignment Dialog Component
const AssignmentDialog = ({
  open,
  onClose,
  assignment,
  onSubmit,
  mcqAnswers,
  setMcqAnswers,
  selectedFile,
  setSelectedFile
}) => {
  if (!assignment) return null;

  const handleMcqAnswerChange = (questionId, answer) => {
    setMcqAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const isMcqComplete = () => {
    if (assignment.assignment_type !== 'mcq_quiz') return true;
    return assignment.questions?.every(q => mcqAnswers[q.id]) || false;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {assignment.assignment_type === 'mcq_quiz' ? 'Take Quiz' : 'Submit Assignment'}: {assignment.title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            {assignment.description}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Marks: {assignment.total_marks} | Subject: {assignment.subject_name}
          </Typography>
          {assignment.due_date && (
            <Typography variant="body2" color="error">
              Due Date: {new Date(assignment.due_date).toLocaleDateString()}
            </Typography>
          )}
        </Box>

        {assignment.assignment_type === 'mcq_quiz' ? (
          // MCQ Quiz Interface
          <Box>
            <Typography variant="h6" gutterBottom>
              Questions
            </Typography>
            {assignment.questions?.map((question, index) => (
              <Card key={question.id} sx={{ mb: 2, p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {index + 1}. {question.question_text}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  ({question.marks} marks)
                </Typography>

                {question.question_type === 'multiple_choice' && (
                  <RadioGroup
                    value={mcqAnswers[question.id] || ''}
                    onChange={(e) => handleMcqAnswerChange(question.id, e.target.value)}
                  >
                    {question.options?.map((option, optIndex) => (
                      <FormControlLabel
                        key={optIndex}
                        value={option}
                        control={<Radio />}
                        label={option}
                      />
                    ))}
                  </RadioGroup>
                )}

                {question.question_type === 'true_false' && (
                  <RadioGroup
                    value={mcqAnswers[question.id] || ''}
                    onChange={(e) => handleMcqAnswerChange(question.id, e.target.value)}
                  >
                    <FormControlLabel value="true" control={<Radio />} label="True" />
                    <FormControlLabel value="false" control={<Radio />} label="False" />
                  </RadioGroup>
                )}

                {question.question_type === 'short_answer' && (
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Enter your answer"
                    value={mcqAnswers[question.id] || ''}
                    onChange={(e) => handleMcqAnswerChange(question.id, e.target.value)}
                  />
                )}
              </Card>
            ))}
          </Box>
        ) : (
          // File Upload Interface
          <Box>
            <Typography variant="h6" gutterBottom>
              Upload Your Assignment
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please upload your assignment file (PDF, DOC, DOCX, etc.)
            </Typography>

            <input
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              id="assignment-file"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="assignment-file">
              <Button variant="outlined" component="span" fullWidth sx={{ mb: 2 }}>
                Choose File
              </Button>
            </label>

            {selectedFile && (
              <Typography variant="body2">
                Selected: {selectedFile.name}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={
            (assignment.assignment_type === 'mcq_quiz' && !isMcqComplete()) ||
            (assignment.assignment_type === 'file_upload' && !selectedFile)
          }
        >
          Submit {assignment.assignment_type === 'mcq_quiz' ? 'Quiz' : 'Assignment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentDashboard;
