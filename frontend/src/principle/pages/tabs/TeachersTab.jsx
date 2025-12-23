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
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import * as teacherService from "../../services/teacherService";
import * as classService from "../../services/classService";
import * as subjectService from "../../services/subjectService";
import * as departmentService from "../../services/departmentService";

export default function TeachersTab() {
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [filterMode, setFilterMode] = useState("all"); // all | class | subject | department
  const [filterClass, setFilterClass] = useState(null);
  const [filterSubject, setFilterSubject] = useState(null);
  const [filterDepartment, setFilterDepartment] = useState(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [openProfile, setOpenProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErr, setProfileErr] = useState(null);
  const [activeTeacher, setActiveTeacher] = useState(null);

  const classOptions = useMemo(() => (classes || []).map((c) => ({ id: c.id, label: `${c.name} (${c.section})` })), [classes]);
  const subjectOptions = useMemo(() => (subjects || []).map((s) => ({ id: s.id, label: `${s.name}${s.code ? ` (${s.code})` : ""}` })), [subjects]);
  const departmentOptions = useMemo(() => (departments || []).map((d) => ({ id: d.id, label: d.name })), [departments]);

  const loadLookups = async () => {
    try {
      const [cls, subs, depts] = await Promise.all([
        classService.getAllClasses(),
        subjectService.getAllSubjects(),
        departmentService.getAllDepartments(),
      ]);
      setClasses(cls || []);
      setSubjects(subs || []);
      setDepartments(depts || []);
    } catch {
      // non-blocking
    }
  };

  const loadTeachers = async () => {
    setLoading(true);
    setErr(null);
    try {
      let data = [];
      if (filterMode === "all") data = await teacherService.getAllTeachers();
      else if (filterMode === "class") {
        if (!filterClass?.id) throw new Error("Select a class");
        data = await teacherService.getTeachersByClassId(filterClass.id);
      } else if (filterMode === "subject") {
        if (!filterSubject?.id) throw new Error("Select a subject");
        data = await teacherService.getTeachersBySubjectId(filterSubject.id);
      } else if (filterMode === "department") {
        if (!filterDepartment?.id) throw new Error("Select a department");
        data = await teacherService.getTeachersByDepartmentId(filterDepartment.id);
      }
      setItems(data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  const openTeacherProfile = async (row) => {
    if (!row?.id) return;
    setOpenProfile(true);
    setProfileErr(null);
    setProfileLoading(true);
    setActiveTeacher(null);
    try {
      const full = await teacherService.getTeacherById(row.id);
      setActiveTeacher(full);
    } catch (e) {
      setProfileErr(e?.response?.data?.detail || e?.message || "Failed to load teacher profile");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
    loadTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teacherSubjects = (activeTeacher?.subjects || []).map((ts) => ts?.subject?.name || ts.subject_id).filter(Boolean);
  const teacherDepartments = (activeTeacher?.departments || []).map((td) => td?.department?.name || td.department_id).filter(Boolean);
  const assignments = activeTeacher?.class_assignments || [];

  return (
    <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, flexWrap: "wrap", gap: 1 }}>
          <Typography fontWeight={900}>Teachers</Typography>
          <Button variant="outlined" startIcon={<RefreshRoundedIcon />} disabled={loading} onClick={loadTeachers}>
            Refresh
          </Button>
        </Stack>
        <Divider sx={{ mb: 2 }} />

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Filter mode"
            value={filterMode}
            onChange={(e) => {
              setFilterMode(e.target.value);
              setFilterClass(null);
              setFilterSubject(null);
              setFilterDepartment(null);
            }}
            select
            fullWidth
          >
            <option value="all">All</option>
            <option value="class">By class</option>
            <option value="subject">By subject</option>
            <option value="department">By department</option>
          </TextField>

          {filterMode === "class" ? (
            <Autocomplete
              options={classOptions}
              getOptionLabel={(o) => o?.label || ""}
              value={filterClass}
              onChange={(_, v) => setFilterClass(v)}
              renderInput={(params) => <TextField {...params} label="Class" />}
              fullWidth
            />
          ) : null}
          {filterMode === "subject" ? (
            <Autocomplete
              options={subjectOptions}
              getOptionLabel={(o) => o?.label || ""}
              value={filterSubject}
              onChange={(_, v) => setFilterSubject(v)}
              renderInput={(params) => <TextField {...params} label="Subject" />}
              fullWidth
            />
          ) : null}
          {filterMode === "department" ? (
            <Autocomplete
              options={departmentOptions}
              getOptionLabel={(o) => o?.label || ""}
              value={filterDepartment}
              onChange={(_, v) => setFilterDepartment(v)}
              renderInput={(params) => <TextField {...params} label="Department" />}
              fullWidth
            />
          ) : null}

          <Button
            variant="contained"
            disabled={
              loading ||
              (filterMode === "class" && !filterClass?.id) ||
              (filterMode === "subject" && !filterSubject?.id) ||
              (filterMode === "department" && !filterDepartment?.id)
            }
            onClick={loadTeachers}
          >
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
                <TableCell>Teacher</TableCell>
                <TableCell>Subjects</TableCell>
                <TableCell>Departments</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items?.length ? (
                items.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      <Typography fontWeight={800}>{t.name || "-"}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {t.email || ""}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                        {(t.subjects || []).slice(0, 3).map((s) => (
                          <Chip key={s.id} size="small" label={s?.subject?.name || s.subject_id} variant="outlined" />
                        ))}
                        {(t.subjects || []).length > 3 ? <Chip size="small" label={`+${t.subjects.length - 3}`} /> : null}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                        {(t.departments || []).slice(0, 2).map((d) => (
                          <Chip key={d.id} size="small" label={d?.department?.name || d.department_id} variant="outlined" />
                        ))}
                        {(t.departments || []).length > 2 ? <Chip size="small" label={`+${t.departments.length - 2}`} /> : null}
                      </Stack>
                    </TableCell>
                    <TableCell>{t.is_active ? <Chip size="small" color="success" label="Active" /> : <Chip size="small" label="Inactive" />}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="contained" startIcon={<VisibilityRoundedIcon />} onClick={() => openTeacherProfile(t)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography sx={{ opacity: 0.7 }}>No teachers found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : null}

        <Dialog open={openProfile} onClose={() => setOpenProfile(false)} fullWidth maxWidth="md">
          <DialogTitle>Teacher Profile</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {profileErr ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {String(profileErr)}
              </Alert>
            ) : null}
            {profileLoading ? <Typography sx={{ opacity: 0.7 }}>Loading...</Typography> : null}

            {!profileLoading && activeTeacher ? (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)", flex: 1 }}>
                    <CardContent>
                      <Typography fontWeight={900}>Basic</Typography>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography fontWeight={800}>{activeTeacher.name}</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {activeTeacher.email}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Phone: {activeTeacher.phone || "-"}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                        Qualification: {activeTeacher.qualification || "-"}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Experience: {activeTeacher.experience_years ?? "-"}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Specialization: {activeTeacher.specialization || "-"}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)", flex: 1 }}>
                    <CardContent>
                      <Typography fontWeight={900}>Subjects & Departments</Typography>
                      <Divider sx={{ my: 1.5 }} />
                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                        {(teacherSubjects || []).length ? teacherSubjects.map((s) => <Chip key={s} label={s} size="small" />) : <Chip size="small" label="No subjects" />}
                      </Stack>
                      <Divider sx={{ my: 1.5 }} />
                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                        {(teacherDepartments || []).length ? teacherDepartments.map((d) => <Chip key={d} label={d} size="small" variant="outlined" />) : <Chip size="small" label="No departments" />}
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>

                <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <CardContent>
                    <Typography fontWeight={900}>Class Assignments</Typography>
                    <Divider sx={{ my: 1.5 }} />
                    {assignments?.length ? (
                      <Stack spacing={1}>
                        {assignments.map((a) => (
                          <Stack key={a.id} direction="row" justifyContent="space-between" sx={{ gap: 1, flexWrap: "wrap" }}>
                            <Typography fontWeight={800}>
                              {a?.class_subject?.class_info?.name
                                ? `${a.class_subject.class_info.name} (${a.class_subject.class_info.section})`
                                : a?.class_subject?.class_id || "-"}
                              {" • "}
                              {a?.class_subject?.subject?.name || a?.class_subject?.subject_id || "-"}
                            </Typography>
                            <Chip size="small" label={a.is_active ? "Active" : "Inactive"} color={a.is_active ? "success" : "default"} />
                          </Stack>
                        ))}
                      </Stack>
                    ) : (
                      <Typography sx={{ opacity: 0.7 }}>No class assignments.</Typography>
                    )}
                  </CardContent>
                </Card>
              </Stack>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenProfile(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}


