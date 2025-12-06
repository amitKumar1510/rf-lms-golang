import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Button,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  EventAvailable as EventAvailableIcon
} from '@mui/icons-material';
import attendanceService from '../../services/attendanceService';

const TeacherAttendanceTab = ({ classSubjects }) => {
  const [selectedClassSubject, setSelectedClassSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [existingAttendance, setExistingAttendance] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');

  // Load students when class-subject changes
  useEffect(() => {
    if (selectedClassSubject) {
      fetchStudentsForClass(selectedClassSubject);
    } else {
      setStudents([]);
      setAttendance({});
      setExistingAttendance([]);
      setIsEditMode(false);
    }
  }, [selectedClassSubject]);

  // Re-fetch attendance data when date changes
  useEffect(() => {
    if (selectedClassSubject && selectedDate) {
      fetchStudentsForClass(selectedClassSubject);
    }
  }, [selectedDate]);

  const fetchStudentsForClass = async (classSubjectId) => {
    try {
      setAttendanceLoading(true);

      // Fetch students and existing attendance data in parallel
      const [studentsData, existingAttendanceData] = await Promise.all([
        attendanceService.getStudentsForClassSubject(classSubjectId),
        attendanceService.getAttendanceForDate(classSubjectId, selectedDate).catch((error) => {
          console.error('Error fetching existing attendance:', error);
          return [];
        })
      ]);

      setStudents(studentsData);
      setExistingAttendance(existingAttendanceData);
      setIsEditMode(existingAttendanceData.length > 0);

      // Initialize attendance - use existing data if available, otherwise default to present
      const initialAttendance = {};
      studentsData.forEach(student => {
        // Find existing attendance record for this student
        const existingRecord = existingAttendanceData.find(record => record.student_id === student.id);
        initialAttendance[student.id] = existingRecord ? existingRecord.status : 'present';
      });

      setAttendance(initialAttendance);
      setAttendanceError('');
    } catch (error) {
      console.error('Error fetching students:', error);
      setAttendanceError('Failed to load students. Please try again.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status) => {
    const allAttendance = {};
    students.forEach(student => {
      allAttendance[student.id] = status;
    });
    setAttendance(allAttendance);
  };

  const handleSubmitAttendance = async () => {
    try {
      setAttendanceLoading(true);
      const attendanceRecords = students.map(student => ({
        student_id: student.id,
        status: attendance[student.id] || 'absent',
        remarks: null
      }));

      const attendanceData = {
        attendance_date: selectedDate,
        class_subject_id: selectedClassSubject,
        attendance_records: attendanceRecords
      };

      const result = await attendanceService.markAttendance(attendanceData);
      alert(isEditMode ? 'Attendance updated successfully!' : 'Attendance submitted successfully!');
      setAttendanceError('');

      // Refresh the data to show updated attendance
      if (selectedClassSubject) {
        fetchStudentsForClass(selectedClassSubject);
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
      setAttendanceError(error.message || 'Failed to submit attendance. Please try again.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const getAttendanceStats = () => {
    const stats = {
      total: students.length,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0
    };

    Object.values(attendance).forEach(status => {
      if (status === 'present') stats.present++;
      else if (status === 'absent') stats.absent++;
      else if (status === 'late') stats.late++;
      else if (status === 'excused') stats.excused++;
    });

    return stats;
  };

  const handleClassSubjectChange = (event) => {
    const classSubjectId = event.target.value;
    setSelectedClassSubject(classSubjectId);
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Mark Attendance
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Select a class and subject to mark attendance for students
      </Typography>

      {attendanceError && <Alert severity="error" sx={{ mb: 2 }}>{attendanceError}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Select Class & Subject</InputLabel>
            <Select
              value={selectedClassSubject}
              label="Select Class & Subject"
              onChange={handleClassSubjectChange}
              disabled={attendanceLoading || classSubjects.length === 0}
            >
              {classSubjects.length > 0 ? (
                classSubjects.map((classSubject) => (
                  <MenuItem key={classSubject.id} value={classSubject.id}>
                    {`${classSubject.class_name} - ${classSubject.subject_name}`}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No classes assigned</MenuItem>
              )}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Attendance Date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={!selectedClassSubject}
          />
        </Grid>
      </Grid>

      {selectedClassSubject && (
        <Box sx={{ mt: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6">
                Students in {(() => {
                  const selected = classSubjects.find(cs => cs.id === selectedClassSubject);
                  return selected ? `${selected.class_name} - ${selected.subject_name}` : 'Unknown Class';
                })()}
              </Typography>
              {isEditMode && (
                <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                  ✏️ Editing existing attendance for {selectedDate}
                </Typography>
              )}
            </Box>
            <Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleMarkAll('present')}
                sx={{ mr: 1 }}
                startIcon={<CheckCircleIcon />}
              >
                Mark All Present
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                onClick={() => handleMarkAll('absent')}
                startIcon={<EventAvailableIcon />}
              >
                Mark All Absent
              </Button>
            </Box>
          </Box>

          {/* Attendance Statistics */}
          <Box display="flex" gap={3} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            {(() => {
              const stats = getAttendanceStats();
              return (
                <>
                  <Box textAlign="center">
                    <Typography variant="h6" color="primary">{stats.present}</Typography>
                    <Typography variant="body2" color="text.secondary">Present</Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h6" color="error">{stats.absent}</Typography>
                    <Typography variant="body2" color="text.secondary">Absent</Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h6" color="warning.main">{stats.late}</Typography>
                    <Typography variant="body2" color="text.secondary">Late</Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h6" color="info.main">{stats.excused}</Typography>
                    <Typography variant="body2" color="text.secondary">Excused</Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h6" color="text.primary">{stats.total}</Typography>
                    <Typography variant="body2" color="text.secondary">Total</Typography>
                  </Box>
                </>
              );
            })()}
          </Box>

          <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Roll No</TableCell>
                  <TableCell>Student Name</TableCell>
                  <TableCell align="center">Present</TableCell>
                  <TableCell align="center">Absent</TableCell>
                  <TableCell align="center">Late</TableCell>
                  <TableCell align="center">Excused</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.roll_number}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell align="center">
                      <Checkbox
                        checked={attendance[student.id] === 'present'}
                        onChange={() => handleAttendanceChange(student.id, 'present')}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox
                        checked={attendance[student.id] === 'absent'}
                        onChange={() => handleAttendanceChange(student.id, 'absent')}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox
                        checked={attendance[student.id] === 'late'}
                        onChange={() => handleAttendanceChange(student.id, 'late')}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox
                        checked={attendance[student.id] === 'excused'}
                        onChange={() => handleAttendanceChange(student.id, 'excused')}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Box display="flex" justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleSubmitAttendance}
              disabled={attendanceLoading}
            >
              {attendanceLoading
                ? 'Submitting...'
                : isEditMode
                  ? 'Update Attendance'
                  : 'Submit Attendance'
              }
            </Button>
          </Box>
        </Box>
      )}

      {classSubjects.length === 0 && !attendanceLoading && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            No class subjects assigned for attendance marking
          </Typography>
          <Typography variant="body2">
            You may have general subject assignments, but no specific class-subject assignments for attendance.
            Please contact your administrator to assign you to specific classes for the subjects you teach.
          </Typography>
        </Alert>
      )}

      {attendanceLoading && (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default TeacherAttendanceTab;
