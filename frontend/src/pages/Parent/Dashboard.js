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
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import {
  ChildCare as ChildCareIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Grade as GradeIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const ParentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mock data - in real app, fetch from API
  const [children, setChildren] = useState([
    {
      id: '1',
      name: 'Alice Johnson',
      class: 'Grade 10-A',
      roll_number: 'STU2024001',
      attendance: 95,
      avg_grade: 'A-',
      subjects: [
        { name: 'Mathematics', grade: 'A+', teacher: 'Mr. Johnson' },
        { name: 'English', grade: 'A', teacher: 'Ms. Smith' },
        { name: 'Science', grade: 'B+', teacher: 'Dr. Brown' }
      ]
    },
    {
      id: '2',
      name: 'Bob Johnson',
      class: 'Grade 8-B',
      roll_number: 'STU2024002',
      attendance: 92,
      avg_grade: 'B+',
      subjects: [
        { name: 'Mathematics', grade: 'B', teacher: 'Mrs. Davis' },
        { name: 'English', grade: 'A-', teacher: 'Mr. Wilson' },
        { name: 'Science', grade: 'B+', teacher: 'Ms. Garcia' }
      ]
    }
  ]);

  const [notices, setNotices] = useState([
    {
      id: '1',
      title: 'Parent-Teacher Meeting',
      date: '2024-12-15',
      description: 'Annual parent-teacher conference scheduled for December 15th.'
    },
    {
      id: '2',
      title: 'Holiday Notice',
      date: '2024-12-20',
      description: 'School will be closed for winter holidays from Dec 20-31.'
    }
  ]);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderChildrenTab = () => (
    <Grid container spacing={3}>
      {children.map((child) => (
        <Grid item xs={12} md={6} key={child.id}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{child.name}</Typography>
                  <Typography color="text.secondary">{child.class}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Roll: {child.roll_number}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Attendance</Typography>
                  <Typography variant="h6" color="primary">{child.attendance}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Avg Grade</Typography>
                  <Typography variant="h6" color="success.main">{child.avg_grade}</Typography>
                </Grid>
              </Grid>

              <Box mt={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Subject Performance
                </Typography>
                {child.subjects.map((subject, index) => (
                  <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">{subject.name}</Typography>
                    <Chip
                      label={subject.grade}
                      size="small"
                      color={
                        subject.grade.startsWith('A') ? 'success' :
                        subject.grade.startsWith('B') ? 'primary' : 'warning'
                      }
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderReportsTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Academic Reports</Typography>

      {children.map((child) => (
        <Card key={child.id} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" color="primary" gutterBottom>
              {child.name} - {child.class}
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Teacher</TableCell>
                    <TableCell align="center">Grade</TableCell>
                    <TableCell align="right">Performance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {child.subjects.map((subject, index) => (
                    <TableRow key={index}>
                      <TableCell>{subject.name}</TableCell>
                      <TableCell>{subject.teacher}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={subject.grade}
                          size="small"
                          color={
                            subject.grade.startsWith('A') ? 'success' :
                            subject.grade.startsWith('B') ? 'primary' : 'warning'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          Excellent
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  const renderNoticesTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>School Notices</Typography>

      <List>
        {notices.map((notice) => (
          <ListItem key={notice.id} sx={{ mb: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <EventIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="h6" color="primary">
                  {notice.title}
                </Typography>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {new Date(notice.date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body1">
                    {notice.description}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>

      {notices.length === 0 && (
        <Alert severity="info">
          No school notices at this time.
        </Alert>
      )}
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Parent Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Welcome back, {user?.name}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="parent dashboard tabs">
          <Tab label="Children" />
          <Tab label="Reports" />
          <Tab label="Notices" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {activeTab === 0 && renderChildrenTab()}
              {activeTab === 1 && renderReportsTab()}
              {activeTab === 2 && renderNoticesTab()}
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default ParentDashboard;
