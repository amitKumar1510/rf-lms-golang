import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Class as ClassIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

const TeacherWorkloadTab = ({ workload, loading, error }) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!workload) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Workload data not available.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Teaching Workload
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        View your weekly teaching schedule and class assignments
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary.main">
                {workload.total_periods_per_week || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Periods/Week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ClassIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4" color="secondary.main">
                {workload.class_assignments?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Teaching Assignments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" color="info.main">
                {workload.total_assignments_created || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Assignments Created
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ScheduleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {workload.homeroom_classes?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Homeroom Classes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Class Assignments Table */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Class-wise Subject Assignments
          </Typography>
          {workload.class_assignments && workload.class_assignments.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Class</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell align="right">Periods/Week</TableCell>
                    <TableCell align="right">Syllabus Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workload.class_assignments.map((assignment, index) => (
                    assignment.subjects.map((subject, subIndex) => (
                      <TableRow key={`${index}-${subIndex}`}>
                        <TableCell>{assignment.class_info?.name || 'Unknown Class'}</TableCell>
                        <TableCell>{subject.subject?.name || 'Unknown Subject'}</TableCell>
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
          ) : (
            <Typography color="text.secondary">
              No class assignments found.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Homeroom Classes */}
      {workload.homeroom_classes && workload.homeroom_classes.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Homeroom Responsibilities
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {workload.homeroom_classes.map((homeroom, index) => (
                <Chip
                  key={index}
                  label={`${homeroom.class_name} (${homeroom.academic_year})`}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default TeacherWorkloadTab;
