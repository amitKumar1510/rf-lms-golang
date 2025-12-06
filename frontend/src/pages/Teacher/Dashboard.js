import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import {
  Subject as SubjectIcon,
  Class as ClassIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  EventAvailable as EventAvailableIcon,
  Add as AddIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import attendanceService from '../../services/attendanceService';

// Import separate tab components
import TeacherProfileTab from '../../components/teacher/TeacherProfileTab';
import TeacherWorkloadTab from '../../components/teacher/TeacherWorkloadTab';
import TeacherAssignmentsTab from '../../components/teacher/TeacherAssignmentsTab';
import TeacherAttendanceTab from '../../components/teacher/TeacherAttendanceTab';
import TeacherAnalyticsTab from '../../components/teacher/TeacherAnalyticsTab';
import teacherService from '../../services/teacherService';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [workload, setWorkload] = useState(null);

  // Class subjects state (needed for assignments and attendance tabs)
  const [classSubjects, setClassSubjects] = useState([]);




  // Fetch teacher profile data
  const fetchTeacherProfile = async () => {
    try {
      const profileData = await teacherService.getProfileWithAssignments();
      setProfile(profileData);
      setError('');
    } catch (err) {
      console.error('Failed to fetch teacher profile:', err);
      setError('Failed to load teacher profile');
      // Set fallback profile data
      setProfile({
        name: user?.name || 'Teacher Name',
        email: user?.email || 'teacher@school.com',
        qualification: 'Not specified',
        experience_years: null,
        specialization: 'Not specified',
        subjects: [],
        class_assignments: []
      });
    }
  };

  // Fetch teacher workload data
  const fetchTeacherWorkload = async () => {
    try {
      const workloadData = await teacherService.getWorkload();
      setWorkload(workloadData);
    } catch (err) {
      console.error('Failed to fetch teacher workload:', err);
      // Set fallback workload data
      setWorkload({
        total_periods_per_week: 0,
        class_assignments: [],
        homeroom_classes: []
      });
    }
  };

  // Fetch all teacher data
  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTeacherProfile(),
        fetchTeacherWorkload()
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, []);

  // Fetch class subjects (needed for assignments and attendance tabs)
  const fetchClassSubjects = async () => {
    try {
      const data = await attendanceService.getClassSubjects();
      setClassSubjects(data);
    } catch (error) {
      console.error('Error fetching class subjects:', error);
    }
  };


  // Load class subjects when needed (for assignments and attendance tabs)
  useEffect(() => {
    if ((activeTab === 2 || activeTab === 3) && classSubjects.length === 0) {
      fetchClassSubjects();
    }
  }, [activeTab]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, redirect to login
      navigate('/login');
    }
  };


  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Teacher Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome back, {user?.name}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ ml: 2 }}
        >
          Logout
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="teacher dashboard tabs">
          <Tab label="Profile" />
          <Tab label="Workload" />
          <Tab label="Assignments" />
          <Tab label="Attendance" />
          <Tab label="Analytics" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {activeTab === 0 && <TeacherProfileTab profile={profile} loading={loading} error={error} />}
              {activeTab === 1 && <TeacherWorkloadTab workload={workload} loading={loading} error={error} />}
              {activeTab === 2 && <TeacherAssignmentsTab classSubjects={classSubjects} />}
              {activeTab === 3 && <TeacherAttendanceTab classSubjects={classSubjects} />}
              {activeTab === 4 && <TeacherAnalyticsTab />}
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default TeacherDashboard;
