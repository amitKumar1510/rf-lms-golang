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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  School as SchoolIcon,
  Subject as SubjectIcon,
  Class as ClassIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mock data - in real app, fetch from API
  const [profile, setProfile] = useState({
    name: user?.name || 'Teacher Name',
    email: user?.email || 'teacher@school.com',
    qualification: 'M.Sc. Mathematics',
    experience_years: 5,
    specialization: 'Mathematics',
    subjects: [
      { name: 'Mathematics', code: 'MATH101', is_primary: true },
      { name: 'Physics', code: 'PHY101', is_primary: false }
    ]
  });

  const [workload, setWorkload] = useState({
    total_periods_per_week: 25,
    class_assignments: [
      {
        class_info: { name: 'Grade 10-A', grade_level: 'Grade 10', section: 'A' },
        subjects: [
          { subject: { name: 'Mathematics', code: 'MATH101' }, periods_per_week: 5, syllabus_completion: 75 }
        ]
      },
      {
        class_info: { name: 'Grade 9-B', grade_level: 'Grade 9', section: 'B' },
        subjects: [
          { subject: { name: 'Mathematics', code: 'MATH101' }, periods_per_week: 4, syllabus_completion: 60 }
        ]
      }
    ],
    homeroom_classes: [
      { name: 'Grade 10-A', grade_level: 'Grade 10', section: 'A' }
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

  const renderProfileTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar
              sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}
            >
              <PersonIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h6">{profile.name}</Typography>
            <Typography color="text.secondary">{profile.email}</Typography>
            <Chip label="Teacher" color="primary" size="small" sx={{ mt: 1 }} />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Professional Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Qualification</Typography>
                <Typography>{profile.qualification}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Experience</Typography>
                <Typography>{profile.experience_years} years</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Specialization</Typography>
                <Typography>{profile.specialization}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Teaching Subjects</Typography>
            <List>
              {profile.subjects.map((subject, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <SubjectIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${subject.name} (${subject.code})`}
                    secondary={subject.is_primary ? 'Primary Subject' : 'Secondary Subject'}
                  />
                  {subject.is_primary && (
                    <Chip label="Primary" color="primary" size="small" />
                  )}
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderWorkloadTab = () => (
    <Grid container spacing={3}>
      {/* Workload Summary */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Teaching Load</Typography>
            <Box display="flex" alignItems="center" mb={2}>
              <ScheduleIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5">{workload.total_periods_per_week}</Typography>
              <Typography color="text.secondary" sx={{ ml: 1 }}>periods/week</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Class Assignments: {workload.class_assignments.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Homeroom Classes: {workload.homeroom_classes.length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Class Assignments */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Class Assignments</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Class</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell align="right">Periods/Week</TableCell>
                    <TableCell align="right">Progress (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workload.class_assignments.map((assignment, index) => (
                    assignment.subjects.map((subject, subIndex) => (
                      <TableRow key={`${index}-${subIndex}`}>
                        <TableCell>
                          {assignment.class_info.grade_level} {assignment.class_info.section}
                        </TableCell>
                        <TableCell>{subject.subject.name}</TableCell>
                        <TableCell align="right">{subject.periods_per_week}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${subject.syllabus_completion}%`}
                            size="small"
                            color={subject.syllabus_completion >= 75 ? 'success' : subject.syllabus_completion >= 50 ? 'warning' : 'error'}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Homeroom Classes */}
        {workload.homeroom_classes.length > 0 && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Homeroom Classes</Typography>
              <List>
                {workload.homeroom_classes.map((classItem, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <ClassIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${classItem.grade_level} ${classItem.section}`}
                      secondary="Homeroom Teacher"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );

  const renderAssignmentsTab = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        Assignment management features will be available here for creating and managing student assignments.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Assignments</Typography>
              <Typography color="text.secondary">
                No assignments created yet.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Grading Queue</Typography>
              <Typography color="text.secondary">
                No assignments to grade.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Teacher Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Welcome back, {user?.name}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="teacher dashboard tabs">
          <Tab label="Profile" />
          <Tab label="Workload" />
          <Tab label="Assignments" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {activeTab === 0 && renderProfileTab()}
              {activeTab === 1 && renderWorkloadTab()}
              {activeTab === 2 && renderAssignmentsTab()}
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default TeacherDashboard;
