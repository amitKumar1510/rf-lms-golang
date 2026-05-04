import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";

import attendanceService from "@/teacher/services/attendance";
import { getAllSessions } from "../../../subadmin/services/classService";

export default function AttendanceTab({ teacher }) {
  const [selectedClassSubject, setSelectedClassSubject] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [currentSession, setCurrentSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  const [openMark, setOpenMark] = useState(false);
  const [markingDate, setMarkingDate] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});
  const [studentsList, setStudentsList] = useState([]);
  const [marking, setMarking] = useState(false);

  const [openEdit, setOpenEdit] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editingData, setEditingData] = useState({});

  // Get class subject options
  const classSubjectOptions = useMemo(() => {
    const assigns = teacher?.class_assignments || [];
    return assigns
      .filter((a) => a?.class_subject)
      .map((a) => {
        const cs = a.class_subject;
        const cl = cs?.class_info;
        const subj = cs?.subject;
        return {
          class_subject_id: a.class_subject_id,
          subject_id: cs?.subject_id,
          class_id: cs?.class_id,
          label: `${cl ? `${cl.name} (${cl.section})` : cs?.class_id} • ${subj ? `${subj.name} (${subj.code})` : cs?.subject_id}`,
          raw: cs,
        };
      });
  }, [teacher]);

  // Load current session
  useEffect(() => {
    const loadCurrentSession = async () => {
      setSessionLoading(true);
      try {
        const sessions = await getAllSessions();
        const current = sessions.find(s => s.is_current);
        setCurrentSession(current);
      } catch (e) {
        console.error("Failed to load current session:", e);
      } finally {
        setSessionLoading(false);
      }
    };
    loadCurrentSession();
  }, []);

  // Load attendance records for selected class subject and date
  const loadAttendance = async (class_subject_id, date) => {
    if (!class_subject_id || !date) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await attendanceService.getAttendanceByClassSubjectAndDate(class_subject_id, date);
      setItems(data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  // Check if selected date is within current session
  const isDateInCurrentSession = (date) => {
    if (!currentSession || !date) return false;
    const checkDate = new Date(date);
    const startDate = new Date(currentSession.start_date);
    const endDate = new Date(currentSession.end_date);
    return checkDate >= startDate && checkDate <= endDate;
  };

  // Handle class subject selection
  useEffect(() => {
    if (selectedClassSubject?.class_subject_id && selectedDate) {
      loadAttendance(selectedClassSubject.class_subject_id, selectedDate);
    } else {
      setItems([]);
    }
  }, [selectedClassSubject, selectedDate]);

  // Open mark attendance dialog
  const openMarkAttendanceDialog = (date) => {
    if (!selectedClassSubject) return;
    setMarkingDate(date);
    setOpenMark(true);
    // Load students for this class subject
    loadStudentsForAttendance(selectedClassSubject.class_subject_id);
  };

  // Load students for attendance marking
  const loadStudentsForAttendance = async (class_subject_id) => {
    try {
      const students = await attendanceService.getStudentsForAttendance(class_subject_id);
      setStudentsList(students);
      const initialData = {};
      students.forEach(student => {
        initialData[student.id] = { status: 'present', remarks: '' }; // Default to present
      });
      setAttendanceData(initialData);
    } catch (e) {
      setErr("Failed to load students");
    }
  };

  // Submit attendance
  const submitAttendance = async () => {
    if (!selectedClassSubject || !markingDate) return;

    setMarking(true);
    try {
      // Convert attendanceData to the format expected by the API
      const attendanceRecords = Object.entries(attendanceData).map(([studentId, data]) => ({
        student_id: studentId,
        status: data.status,
        remarks: data.remarks || null
      }));

      await attendanceService.markAttendance({
        class_subject_id: selectedClassSubject.class_subject_id,
        attendance_date: markingDate,
        attendance_records: attendanceRecords
      });
      setOpenMark(false);
      loadAttendance(selectedClassSubject.class_subject_id, selectedDate);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to mark attendance");
    } finally {
      setMarking(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (record) => {
    setEditingRecord(record);
    setEditingData({
      status: record.status,
      notes: record.notes || ''
    });
    setOpenEdit(true);
  };

  // Update attendance record
  const updateAttendance = async () => {
    if (!editingRecord) return;

    try {
      await attendanceService.updateAttendance(editingRecord.id, editingData);
      setOpenEdit(false);
      loadAttendance(selectedClassSubject.class_subject_id, selectedDate);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to update attendance");
    }
  };

  // Get status icon and color
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'present':
        return { icon: CheckCircleRoundedIcon, color: 'success', label: 'Present' };
      case 'absent':
        return { icon: CancelRoundedIcon, color: 'error', label: 'Absent' };
      case 'late':
        return { icon: ScheduleRoundedIcon, color: 'warning', label: 'Late' };
      default:
        return { icon: CancelRoundedIcon, color: 'default', label: 'Unknown' };
    }
  };

  return (
    <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <CardContent>
        <Typography fontWeight={600} sx={{ mb: 1 }}>
          Attendance Management
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {sessionLoading ? (
          <Typography sx={{ opacity: 0.7 }}>Loading session information...</Typography>
        ) : currentSession ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Autocomplete
                options={classSubjectOptions}
                getOptionLabel={(o) => o?.label || ""}
                value={selectedClassSubject}
                onChange={(_, v) => setSelectedClassSubject(v)}
                renderInput={(params) => <TextField {...params} label="Select class & subject" />}
                fullWidth
              />

              <TextField
                label="Attendance Date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                fullWidth
                InputProps={{
                  inputProps: {
                    min: currentSession.start_date,
                    max: currentSession.end_date
                  }
                }}
              />

              <Button
                variant="contained"
                onClick={() => openMarkAttendanceDialog(selectedDate)}
                disabled={!selectedClassSubject || !isDateInCurrentSession(selectedDate)}
              >
                Mark Attendance
              </Button>

              <Button
                variant="outlined"
                startIcon={<RefreshRoundedIcon />}
                onClick={() => loadAttendance(selectedClassSubject?.class_subject_id, selectedDate)}
                disabled={!selectedClassSubject || loading}
              >
                Refresh
              </Button>
            </Stack>

            {!isDateInCurrentSession(selectedDate) && selectedDate && (
              <Alert severity="warning">
                Selected date is outside the current session period ({new Date(currentSession.start_date).toLocaleDateString()} - {new Date(currentSession.end_date).toLocaleDateString()})
              </Alert>
            )}

            {err && <Alert severity="error">{String(err)}</Alert>}

            {selectedClassSubject && selectedDate && (
              <div>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Attendance for {selectedClassSubject.label} on {new Date(selectedDate).toLocaleDateString()}
                </Typography>

                {loading ? (
                  <Typography sx={{ opacity: 0.7 }}>Loading...</Typography>
                ) : items.length > 0 ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Roll Number</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Marked At</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((record) => {
                        const statusInfo = getStatusDisplay(record.status);
                        const StatusIcon = statusInfo.icon;
                        return (
                          <TableRow key={record.id} hover>
                            <TableCell>{record.student?.name || record.student_name}</TableCell>
                            <TableCell>{record.student?.roll_number || record.roll_number}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                icon={<StatusIcon />}
                                label={statusInfo.label}
                                color={statusInfo.color}
                              />
                            </TableCell>
                            <TableCell>{new Date(record.created_at).toLocaleString()}</TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                startIcon={<EditRoundedIcon />}
                                onClick={() => openEditDialog(record)}
                              >
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography sx={{ opacity: 0.7 }}>
                    No attendance records found for this date.
                    {isDateInCurrentSession(selectedDate) && " Click 'Mark Attendance' to create records."}
                  </Typography>
                )}
              </div>
            )}
          </Stack>
        ) : (
          <Alert severity="warning">No current session found. Please contact administrator.</Alert>
        )}

        {/* Mark Attendance Dialog */}
        <Dialog open={openMark} onClose={() => setOpenMark(false)} fullWidth maxWidth="lg">
          <DialogTitle>Mark Attendance - {markingDate && new Date(markingDate).toLocaleDateString()}</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography sx={{ mb: 2 }}>
              Mark attendance for {selectedClassSubject?.label}
            </Typography>

            <Stack spacing={2}>
              {Object.entries(attendanceData).map(([studentId, data]) => {
                const student = studentsList.find(s => s.id === studentId);
                return (
                  <Card key={studentId} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {student?.name || `Student ${studentId}`}{student?.roll_number && ` (Roll: ${student.roll_number})`}
                      </Typography>
                      <FormControl component="fieldset">
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Status</Typography>
                        <RadioGroup
                          row
                          value={data.status}
                          onChange={(e) => setAttendanceData(prev => ({
                            ...prev,
                            [studentId]: { ...prev[studentId], status: e.target.value }
                          }))}
                        >
                          <FormControlLabel value="present" control={<Radio />} label="Present" />
                          <FormControlLabel value="absent" control={<Radio />} label="Absent" />
                          <FormControlLabel value="late" control={<Radio />} label="Late" />
                        </RadioGroup>
                      </FormControl>
                      <TextField
                        label="Remarks (optional)"
                        value={data.remarks}
                        onChange={(e) => setAttendanceData(prev => ({
                          ...prev,
                          [studentId]: { ...prev[studentId], remarks: e.target.value }
                        }))}
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                      />
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenMark(false)}>Cancel</Button>
            <Button onClick={submitAttendance} variant="contained" disabled={marking}>
              {marking ? "Saving..." : "Save Attendance"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Attendance Dialog */}
        <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
          <DialogTitle>Edit Attendance</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl component="fieldset">
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Status</Typography>
                <RadioGroup
                  row
                  value={editingData.status}
                  onChange={(e) => setEditingData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <FormControlLabel value="present" control={<Radio />} label="Present" />
                  <FormControlLabel value="absent" control={<Radio />} label="Absent" />
                  <FormControlLabel value="late" control={<Radio />} label="Late" />
                </RadioGroup>
              </FormControl>

              <TextField
                label="Notes (optional)"
                value={editingData.notes}
                onChange={(e) => setEditingData(prev => ({ ...prev, notes: e.target.value }))}
                fullWidth
                multiline
                rows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
            <Button onClick={updateAttendance} variant="contained">
              Update
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}

