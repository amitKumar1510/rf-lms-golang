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

import * as assignmentService from "../../services/assignmentService";
import * as classService from "../../services/classService";
import * as subjectService from "../../services/subjectService";

export default function PerformanceTab({ currentSession }) {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [filterClass, setFilterClass] = useState(null);
  const [filterSubject, setFilterSubject] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const classOptions = useMemo(() => (classes || []).map((c) => ({ id: c.id, label: `${c.name} (${c.section})` })), [classes]);
  const subjectOptions = useMemo(() => {
    // If a class is selected, only show subjects allocated to that class
    if (filterClass?.id) {
      const uniq = new Map();
      for (const cs of classSubjects || []) {
        const subj = cs?.subject;
        if (!subj?.id) continue;
        uniq.set(subj.id, { id: subj.id, label: `${subj.name}${subj.code ? ` (${subj.code})` : ""}` });
      }
      return Array.from(uniq.values());
    }
    return (subjects || []).map((s) => ({ id: s.id, label: `${s.name}${s.code ? ` (${s.code})` : ""}` }));
  }, [subjects, classSubjects, filterClass?.id]);

  const loadLookups = async () => {
    try {
      const [cls, subs] = await Promise.all([classService.getAllClasses(), subjectService.getAllSubjects()]);
      setClasses(cls || []);
      setSubjects(subs || []);
    } catch {
      // non-blocking
    }
  };

  const loadClassSubjects = async (classId) => {
    if (!classId) {
      setClassSubjects([]);
      return;
    }
    try {
      const cs = await subjectService.getAllClassSubjects(classId);
      setClassSubjects(cs || []);
    } catch {
      setClassSubjects([]);
    }
  };

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const params = {};
      if (filterClass?.id) params.class_id = filterClass.id;
      if (filterSubject?.id) params.subject_id = filterSubject.id;
      const data = await assignmentService.getSchoolPerformance(params);
      setItems(data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load performance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // When class changes, refresh subject dropdown values to only that class's subjects
    loadClassSubjects(filterClass?.id || null);
    // reset subject if not valid for selected class
    if (filterClass?.id && filterSubject?.id) {
      const allowed = new Set((classSubjects || []).map((cs) => cs?.subject?.id).filter(Boolean));
      if (allowed.size && !allowed.has(filterSubject.id)) setFilterSubject(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterClass?.id]);

  const avgAll = useMemo(() => {
    const xs = (items || []).map((x) => x.average_percentage).filter((v) => typeof v === "number");
    if (!xs.length) return null;
    return xs.reduce((a, b) => a + b, 0) / xs.length;
  }, [items]);

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
            <CardContent>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Current session
              </Typography>
              <Typography fontWeight={900}>{currentSession?.name || "-"}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
            <CardContent>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Rows
              </Typography>
              <Typography fontWeight={900}>{items?.length || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
            <CardContent>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Avg %
              </Typography>
              <Typography fontWeight={900}>{avgAll == null ? "-" : `${avgAll.toFixed(1)}%`}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, flexWrap: "wrap", gap: 1 }}>
            <Typography fontWeight={900}>Performance (Assignments)</Typography>
            <Button variant="outlined" startIcon={<RefreshRoundedIcon />} disabled={loading} onClick={load}>
              Refresh
            </Button>
          </Stack>
          <Divider sx={{ mb: 2 }} />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
            <Autocomplete
              options={classOptions}
              getOptionLabel={(o) => o?.label || ""}
              value={filterClass}
              onChange={(_, v) => setFilterClass(v)}
              renderInput={(params) => <TextField {...params} label="Filter by class (optional)" />}
              fullWidth
            />
            <Autocomplete
              options={subjectOptions}
              getOptionLabel={(o) => o?.label || ""}
              value={filterSubject}
              onChange={(_, v) => setFilterSubject(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={filterClass?.id ? "Filter by subject (for selected class)" : "Filter by subject (optional)"}
                />
              )}
              fullWidth
            />
            <Button variant="contained" disabled={loading} onClick={load}>
              Apply
            </Button>
          </Stack>

          {err ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {String(err)}
            </Alert>
          ) : null}
          {loading ? <Typography sx={{ opacity: 0.7 }}>Loading...</Typography> : null}

          {!loading ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Class</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Assignments</TableCell>
                  <TableCell>Submissions</TableCell>
                  <TableCell>Graded</TableCell>
                  <TableCell>Avg %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items?.length ? (
                  items.map((r) => (
                    <TableRow key={r.class_subject_id} hover>
                      <TableCell>
                        <Typography fontWeight={800}>
                          {r.class_name ? `${r.class_name}${r.class_section ? ` (${r.class_section})` : ""}` : r.class_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={800}>
                          {r.subject_name ? `${r.subject_name}${r.subject_code ? ` (${r.subject_code})` : ""}` : r.subject_id}
                        </Typography>
                      </TableCell>
                      <TableCell>{r.total_assignments}</TableCell>
                      <TableCell>{r.total_submissions}</TableCell>
                      <TableCell>{r.graded_submissions}</TableCell>
                      <TableCell>
                        {r.average_percentage == null ? "-" : (
                          <Chip size="small" color="success" label={`${Number(r.average_percentage).toFixed(1)}%`} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography sx={{ opacity: 0.7 }}>No data.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </Stack>
  );
}


