import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
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
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";

import attendanceService from "@/students/services/attendance";
import { getAllSessions } from "../../../subadmin/services/classService";

export default function AttendanceTab({ student, classSubjects }) {
  const [selectedClassSubject, setSelectedClassSubject] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [currentSession, setCurrentSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  // Get class subject options
  const classSubjectOptions = useMemo(() => {
    return (classSubjects || [])
      .filter((cs) => cs?.id && cs?.subject_id)
      .map((cs) => {
        const subj = cs?.subject;
        return {
          class_subject_id: cs.id,
          subject_id: cs.subject_id,
          label: subj ? `${subj.name}${subj.code ? ` (${subj.code})` : ""}` : cs.subject_id,
          raw: cs,
        };
      });
  }, [classSubjects]);

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
    if (!class_subject_id || !date || !student?.id) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await attendanceService.getStudentAttendanceHistory(
        student.id,
        class_subject_id,
        date,
        date
      );
      setItems(data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  // Load attendance when selections change
  useEffect(() => {
    if (selectedClassSubject?.class_subject_id && selectedDate && student?.id) {
      loadAttendance(selectedClassSubject.class_subject_id, selectedDate);
    } else {
      setItems([]);
    }
  }, [selectedClassSubject, selectedDate, student?.id]);

  // Get status icon and color
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'present':
        return { icon: CheckCircleRoundedIcon, color: 'success', label: 'Present' };
      case 'absent':
        return { icon: CancelRoundedIcon, color: 'error', label: 'Absent' };
      case 'late':
        return { icon: ScheduleRoundedIcon, color: 'warning', label: 'Late' };
      case 'excused':
        return { icon: ScheduleRoundedIcon, color: 'info', label: 'Excused' };
      default:
        return { icon: CancelRoundedIcon, color: 'default', label: 'Unknown' };
    }
  };

  // Calculate attendance statistics for the selected subject
  const attendanceStats = useMemo(() => {
    if (!items.length) return { total: 0, present: 0, absent: 0, late: 0, excused: 0, percentage: 0 };

    const stats = items.reduce((acc, record) => {
      acc.total++;
      switch (record.status) {
        case 'present':
          acc.present++;
          break;
        case 'absent':
          acc.absent++;
          break;
        case 'late':
          acc.late++;
          break;
        case 'excused':
          acc.excused++;
          break;
      }
      return acc;
    }, { total: 0, present: 0, absent: 0, late: 0, excused: 0 });

    stats.percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
    return stats;
  }, [items]);

  // Calculate overall attendance statistics across all subjects
  const overallStats = useMemo(() => {
    if (!classSubjects?.length || !student?.id) return { total: 0, present: 0, absent: 0, late: 0, excused: 0, percentage: 0 };

    // This would need an API call to get overall stats, but for now we'll show per-subject stats
    return attendanceStats;
  }, [classSubjects, student, attendanceStats]);

  return (
    <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <CardContent>
        <Typography fontWeight={900} sx={{ mb: 1 }}>
          My Attendance
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {sessionLoading ? (
          <Typography sx={{ opacity: 0.7 }}>Loading session information...</Typography>
        ) : currentSession && student ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Autocomplete
                options={classSubjectOptions}
                getOptionLabel={(o) => o?.label || ""}
                value={selectedClassSubject}
                onChange={(_, v) => setSelectedClassSubject(v)}
                renderInput={(params) => <TextField {...params} label="Select subject" />}
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
                variant="outlined"
                startIcon={<RefreshRoundedIcon />}
                onClick={() => loadAttendance(selectedClassSubject?.class_subject_id, selectedDate)}
                disabled={!selectedClassSubject || loading}
              >
                Refresh
              </Button>
            </Stack>

            {/* Overall Attendance Statistics */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <CardContent>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      Total Days
                    </Typography>
                    <Typography fontWeight={900}>{overallStats.total}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <CardContent>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      Present
                    </Typography>
                    <Typography fontWeight={900} color="success.main">{overallStats.present}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <CardContent>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      Absent
                    </Typography>
                    <Typography fontWeight={900} color="error.main">{overallStats.absent}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <CardContent>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      Attendance %
                    </Typography>
                    <Typography fontWeight={900} color={overallStats.percentage >= 75 ? "success.main" : overallStats.percentage >= 60 ? "warning.main" : "error.main"}>
                      {overallStats.percentage}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {err && <Alert severity="error">{String(err)}</Alert>}

            {/* Attendance Records */}
            {selectedClassSubject && selectedDate && (
              <div>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Attendance Records for {selectedClassSubject.label}
                </Typography>

                {loading ? (
                  <Typography sx={{ opacity: 0.7 }}>Loading...</Typography>
                ) : items.length > 0 ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Subject</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Remarks</TableCell>
                        <TableCell>Marked By</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((record) => {
                        const statusInfo = getStatusDisplay(record.status);
                        const StatusIcon = statusInfo.icon;
                        return (
                          <TableRow key={record.id} hover>
                            <TableCell>{new Date(record.attendance_date).toLocaleDateString()}</TableCell>
                            <TableCell>{selectedClassSubject.label}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                icon={<StatusIcon />}
                                label={statusInfo.label}
                                color={statusInfo.color}
                              />
                            </TableCell>
                            <TableCell>{record.remarks || "-"}</TableCell>
                            <TableCell>{record.marker?.name || "System"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography sx={{ opacity: 0.7 }}>
                    No attendance records found for this date.
                  </Typography>
                )}
              </div>
            )}
          </Stack>
        ) : (
          <Alert severity="warning">
            {!student ? "Student information not found." : "No current session found. Please contact administrator."}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
