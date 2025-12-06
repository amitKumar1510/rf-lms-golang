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
  Alert,
  CircularProgress
} from '@mui/material';
import {
  School as SchoolIcon,
  Group as GroupIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import principleService from '../../services/principleService';

const PrincipleDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mock data - in real app, fetch from API
  const [schoolStats, setSchoolStats] = useState({
    total_students: 0,
    total_teachers: 0,
    total_classes: 0,
    average_attendance: 0
  });

  const [departments, setDepartments] = useState([
    { name: 'Mathematics', teachers: 12},
    { name: 'English',  teachers: 10, },
    { name: 'Science',  teachers: 15, }
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const stats = await principleService.getDashboardStats();
        setSchoolStats(stats);
        setError('');
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <GroupIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Students</Typography>
            </Box>
            <Typography variant="h4">{schoolStats.total_students.toLocaleString()}</Typography>
            {/* <Typography variant="body2" color="success.main">
              +5% from last year
            </Typography> */}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <PersonIcon color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Teachers</Typography>
            </Box>
            <Typography variant="h4">{schoolStats.total_teachers}</Typography>
            {/* <Typography variant="body2" color="success.main">
              +2 new this year
            </Typography> */}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <SchoolIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Classes</Typography>
            </Box>
            <Typography variant="h4">{schoolStats.total_classes}</Typography>
            {/* <Typography variant="body2" color="text.secondary">
              All grades covered
            </Typography> */}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <AssessmentIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Avg Attendance</Typography>
            </Box>
            <Typography variant="h4">{schoolStats.average_attendance}%</Typography>
            {/* <Typography variant="body2" color="success.main">
              Above target
            </Typography> */}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderDepartmentsTab = () => (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Department</TableCell>
              {/* <TableCell align="right">Students</TableCell> */}
              <TableCell align="right">Teachers</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map((dept, index) => (
              <TableRow key={index}>
                <TableCell>{dept.name}</TableCell>
                <TableCell align="right">{dept.teachers}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderReportsTab = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        School performance reports and analytics will be available here.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Monthly Reports</Typography>
              <Typography color="text.secondary">
                Generate comprehensive school reports
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Academic Analytics</Typography>
              <Typography color="text.secondary">
                View detailed performance analytics
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
        School Principle Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Welcome back, {user?.name}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="principle dashboard tabs">
          <Tab label="Overview" />
          <Tab label="Departments" />
          <Tab label="Reports" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {activeTab === 0 && renderOverviewTab()}
              {activeTab === 1 && renderDepartmentsTab()}
              {activeTab === 2 && renderReportsTab()}
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default PrincipleDashboard;
