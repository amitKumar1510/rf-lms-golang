import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import teacherService from '../../services/teacherService';

const TeacherAnalyticsTab = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  const [analyticsType, setAnalyticsType] = useState('class-wise'); // 'class-wise' or 'subject-wise'

  // Load analytics data when component mounts or type changes
  useEffect(() => {
    fetchAnalyticsData(analyticsType);
  }, [analyticsType]);

  const fetchAnalyticsData = async (type) => {
    try {
      setAnalyticsLoading(true);
      let data;
      if (type === 'class-wise') {
        data = await teacherService.getClassWiseAttendanceAnalytics();
      } else {
        data = await teacherService.getSubjectWiseStudentAttendance();
      }
      setAnalyticsData(data);
      setAnalyticsError('');
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalyticsError('Failed to load analytics data. Please try again.');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleAnalyticsTypeChange = (type) => {
    setAnalyticsType(type);
    // Data will be refetched via useEffect
  };

  if (analyticsLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (analyticsError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {analyticsError}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Attendance Analytics
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        View attendance percentages by class and subject
      </Typography>

      {analyticsData && (
        <>
          {/* Session Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Academic Session: {analyticsData.academic_session?.name || 'Current Session'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {analyticsData.academic_session?.start_date && analyticsData.academic_session?.end_date
                  ? `${new Date(analyticsData.academic_session.start_date).toLocaleDateString()} - ${new Date(analyticsData.academic_session.end_date).toLocaleDateString()}`
                  : 'Session dates not available'}
              </Typography>
            </CardContent>
          </Card>

          {/* Analytics Type Toggle */}
          <Box sx={{ mb: 3 }}>
            <Button
              variant={analyticsType === 'class-wise' ? 'contained' : 'outlined'}
              onClick={() => handleAnalyticsTypeChange('class-wise')}
              sx={{ mr: 2 }}
            >
              Class-wise Analytics
            </Button>
            <Button
              variant={analyticsType === 'subject-wise' ? 'contained' : 'outlined'}
              onClick={() => handleAnalyticsTypeChange('subject-wise')}
            >
              Subject-wise Analytics
            </Button>
          </Box>

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {analyticsType === 'class-wise'
                      ? analyticsData.summary?.total_classes || 0
                      : analyticsData.summary?.total_subjects || 0
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {analyticsType === 'class-wise' ? 'Total Classes' : 'Total Subjects'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary">
                    {analyticsType === 'class-wise'
                      ? analyticsData.summary?.classes_with_data || 0
                      : analyticsData.summary?.subjects_with_data || 0
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    With Data
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {analyticsData.summary?.total_students || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Students
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4"
                    color={analyticsData.summary?.average_attendance >= 75 ? 'success.main' :
                           analyticsData.summary?.average_attendance >= 60 ? 'warning.main' : 'error.main'}
                  >
                    {analyticsData.summary?.average_attendance?.toFixed(1) || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Attendance
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed Analytics */}
          {analyticsType === 'class-wise' ? (
            // Class-wise Analytics
            <Box>
              <Typography variant="h6" gutterBottom>
                Class-wise Subject Attendance
              </Typography>
              {analyticsData.classes?.map((classData, index) => (
                <Card key={classData.class_id || index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">{classData.class_name}</Typography>
                      <Chip
                        label={`${classData.class_average_attendance}% avg`}
                        color={classData.class_average_attendance >= 75 ? 'success' :
                               classData.class_average_attendance >= 60 ? 'warning' : 'error'}
                        size="small"
                      />
                    </Box>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Subject</TableCell>
                          <TableCell align="right">Classes Attended</TableCell>
                          <TableCell align="right">Present</TableCell>
                          <TableCell align="right">Total Records</TableCell>
                          <TableCell align="right">Attendance %</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {classData.subjects?.map((subject, subIndex) => (
                          <TableRow key={subject.subject_id || subIndex}>
                            <TableCell>{subject.subject_name}</TableCell>
                            <TableCell align="right">{subject.total_classes}</TableCell>
                            <TableCell align="right">{subject.total_present}</TableCell>
                            <TableCell align="right">{subject.total_records}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${subject.attendance_percentage}%`}
                                size="small"
                                color={subject.attendance_percentage >= 75 ? 'success' :
                                       subject.attendance_percentage >= 60 ? 'warning' : 'error'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            // Subject-wise Analytics
            <Box>
              <Typography variant="h6" gutterBottom>
                Subject-wise Student Attendance
              </Typography>
              {analyticsData.subjects?.map((subjectData, index) => (
                <Card key={subjectData.subject_id || index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        {subjectData.subject_name} - {subjectData.class_name}
                      </Typography>
                      <Chip
                        label={`${subjectData.subject_average_attendance}% avg`}
                        color={subjectData.subject_average_attendance >= 75 ? 'success' :
                               subjectData.subject_average_attendance >= 60 ? 'warning' : 'error'}
                        size="small"
                      />
                    </Box>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Student</TableCell>
                          <TableCell align="right">Classes Attended</TableCell>
                          <TableCell align="right">Present</TableCell>
                          <TableCell align="right">Total Records</TableCell>
                          <TableCell align="right">Attendance %</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {subjectData.students?.map((student, subIndex) => (
                          <TableRow key={student.student_id || subIndex}>
                            <TableCell>{student.student_name}</TableCell>
                            <TableCell align="right">{student.total_classes}</TableCell>
                            <TableCell align="right">{student.total_present}</TableCell>
                            <TableCell align="right">{student.total_records}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${student.attendance_percentage}%`}
                                size="small"
                                color={student.attendance_percentage >= 75 ? 'success' :
                                       student.attendance_percentage >= 60 ? 'warning' : 'error'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default TeacherAnalyticsTab;
