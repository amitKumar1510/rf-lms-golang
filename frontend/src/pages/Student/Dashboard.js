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
  CircularProgress
} from '@mui/material';
import {
  School as SchoolIcon,
  Subject as SubjectIcon,
  Grade as GradeIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mock data - in real app, fetch from API
  const [profile, setProfile] = useState({
    name: user?.name || 'Student Name',
    email: user?.email || 'student@school.com',
    roll_number: 'STU2024001',
    class_name: 'Grade 10-A',
    date_of_birth: '2008-05-15',
    gender: 'Male',
    blood_group: 'O+',
    admission_date: '2023-06-01',
    guardian_name: 'Parent Name',
    guardian_phone: '+1234567890'
  });

  const [enrollments, setEnrollments] = useState([
    {
      id: '1',
      subject: { name: 'Mathematics', code: 'MATH101' },
      academic_year: '2024-2025',
      midterm_marks: 85,
      final_marks: 92,
      grade: 'A+',
      attendance_percentage: 95,
      status: 'completed',
      teacher: 'Mr. Johnson'
    },
    {
      id: '2',
      subject: { name: 'English', code: 'ENG101' },
      academic_year: '2024-2025',
      midterm_marks: 78,
      final_marks: 88,
      grade: 'A',
      attendance_percentage: 98,
      status: 'completed',
      teacher: 'Ms. Smith'
    },
    {
      id: '3',
      subject: { name: 'Science', code: 'SCI101' },
      academic_year: '2024-2025',
      midterm_marks: 82,
      final_marks: null,
      grade: null,
      attendance_percentage: 92,
      status: 'enrolled',
      teacher: 'Dr. Brown'
    }
  ]);

  const [attendance, setAttendance] = useState({
    overall: 94,
    subjects: [
      { name: 'Mathematics', percentage: 95, present: 18, total: 20 },
      { name: 'English', percentage: 98, present: 19, total: 20 },
      { name: 'Science', percentage: 92, present: 17, total: 20 }
    ]
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

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

  const renderProfileTab = () => (
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
              <Typography>{profile.roll_number}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Overall Attendance</Typography>
              <Typography variant="h6" color="primary">{attendance.overall}%</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Current GPA</Typography>
              <Typography variant="h6" color="success.main">3.8</Typography>
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
                <Typography>{new Date(profile.date_of_birth).toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Gender</Typography>
                <Typography>{profile.gender}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Blood Group</Typography>
                <Typography>{profile.blood_group}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Admission Date</Typography>
                <Typography>{new Date(profile.admission_date).toLocaleDateString()}</Typography>
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
                <Typography>{profile.guardian_name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Contact Number</Typography>
                <Typography>{profile.guardian_phone}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderGradesTab = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        Academic performance for the current academic year (2024-2025)
      </Alert>

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
            {enrollments.map((enrollment) => (
              <TableRow key={enrollment.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <SubjectIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body1">{enrollment.subject.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {enrollment.subject.code}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{enrollment.teacher}</TableCell>
                <TableCell align="right">
                  {enrollment.midterm_marks ? `${enrollment.midterm_marks}%` : '-'}
                </TableCell>
                <TableCell align="right">
                  {enrollment.final_marks ? `${enrollment.final_marks}%` : '-'}
                </TableCell>
                <TableCell align="center">
                  {enrollment.grade ? (
                    <Chip
                      label={enrollment.grade}
                      color={getGradeColor(enrollment.grade)}
                      size="small"
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      {enrollment.attendance_percentage}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={enrollment.attendance_percentage}
                      sx={{ width: 60, height: 6 }}
                      color={enrollment.attendance_percentage >= 90 ? 'success' :
                             enrollment.attendance_percentage >= 75 ? 'warning' : 'error'}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={enrollment.status}
                    color={enrollment.status === 'completed' ? 'success' : 'primary'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderAttendanceTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Overall Attendance</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" color="primary" sx={{ mr: 1 }}>
                {attendance.overall}%
              </Typography>
              <Typography color="text.secondary">this semester</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={attendance.overall}
              sx={{ height: 10, borderRadius: 5 }}
              color={attendance.overall >= 90 ? 'success' : attendance.overall >= 75 ? 'warning' : 'error'}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Subject-wise Attendance</Typography>
            <List>
              {attendance.subjects.map((subject, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemText
                    primary={subject.name}
                    secondary={`${subject.present}/${subject.total} classes`}
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
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

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
          <Tab label="Grades" />
          <Tab label="Attendance" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {activeTab === 0 && renderProfileTab()}
              {activeTab === 1 && renderGradesTab()}
              {activeTab === 2 && renderAttendanceTab()}
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default StudentDashboard;
