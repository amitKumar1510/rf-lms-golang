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
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import LibraryAddRoundedIcon from "@mui/icons-material/LibraryAddRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import ToggleOffRoundedIcon from "@mui/icons-material/ToggleOffRounded";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";

import * as classService from "../../services/classService";
import * as subjectService from "../../services/subjectService";
import * as teacherService from "../../services/teacherService";

export default function ClassesTab() {
  const [items, setItems] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [actionErr, setActionErr] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [active, setActive] = useState(null);

  // Manage subjects for a class
  const [openSubjects, setOpenSubjects] = useState(false);
  const [activeClass, setActiveClass] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsErr, setSubjectsErr] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [assignOpts, setAssignOpts] = useState({ is_compulsory: true, credits: "" });
  const [openEditAssigned, setOpenEditAssigned] = useState(false);
  const [activeAssigned, setActiveAssigned] = useState(null); // ClassSubject row
  const [editAssigned, setEditAssigned] = useState({ is_compulsory: true, credits: "" });

  // Manage teachers for a class-subject
  const [openTeachers, setOpenTeachers] = useState(false);
  const [activeClassSubject, setActiveClassSubject] = useState(null); // ClassSubject row
  const [teacherOptions, setTeacherOptions] = useState([]);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [teacherSel, setTeacherSel] = useState(null);
  const [assignForm, setAssignForm] = useState({ academic_year: "", periods_per_week: 1, syllabus_completion: 0 });
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teachersErr, setTeachersErr] = useState(null);

  const emptyForm = useMemo(
    () => ({
      name: "",
      grade_level: "",
      section: "",
      capacity: "",
      session_name: "", // used to populate academic_year
      academic_year: "",
    }),
    [],
  );
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const [classesData, sessionsData] = await Promise.all([classService.getAllClasses(), classService.getAllSessions()]);
      setItems(classesData || []);
      setSessions(sessionsData || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const change = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const openCreateDialog = () => {
    setForm(emptyForm);
    setOpenCreate(true);
  };

  const openEditDialog = (row) => {
    setActive(row);
    setForm({
      name: row?.name || "",
      grade_level: row?.grade_level || "",
      section: row?.section || "",
      capacity: row?.capacity ?? "",
      session_name: sessions?.some((s) => s?.name === row?.academic_year) ? row?.academic_year : "",
      academic_year: row?.academic_year || "",
    });
    setOpenEdit(true);
  };

  const buildPayload = () => {
    const academic_year = (form.session_name || form.academic_year || "").trim();
    return {
      name: form.name.trim(),
      grade_level: form.grade_level.trim(),
      section: form.section.trim(),
      academic_year,
      capacity: form.capacity === "" ? null : Number(form.capacity),
    };
  };

  const canSubmit = Boolean(form.name.trim() && form.grade_level.trim() && form.section.trim() && (form.session_name || form.academic_year).trim());

  const submitCreate = async () => {
    setActionErr(null);
    setBusyId("create");
    try {
      await classService.createClass(buildPayload());
      setOpenCreate(false);
      await load();
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Failed to create class");
    } finally {
      setBusyId(null);
    }
  };

  const submitEdit = async () => {
    if (!active?.id) return;
    setActionErr(null);
    setBusyId(active.id);
    try {
      await classService.updateClass(active.id, buildPayload());
      setOpenEdit(false);
      setActive(null);
      await load();
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Failed to update class");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (row) => {
    if (!row?.id) return;
    setActionErr(null);
    setBusyId(row.id);
    try {
      await classService.deleteClass(row.id);
      await load();
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Failed to delete class");
    } finally {
      setBusyId(null);
    }
  };

  const openSubjectsDialog = async (row) => {
    setActiveClass(row);
    setOpenSubjects(true);
    setSelectedSubjects([]);
    setAssignOpts({ is_compulsory: true, credits: "" });
    setSubjectsErr(null);
    setSubjectsLoading(true);
    try {
      const [subs, clsSubs] = await Promise.all([subjectService.getAllSubjects(), subjectService.getAllClassSubjects(row.id)]);
      setSubjects(subs || []);
      setClassSubjects(clsSubs || []);
    } catch (e) {
      setSubjectsErr(e?.response?.data?.detail || e?.message || "Failed to load class subjects");
    } finally {
      setSubjectsLoading(false);
    }
  };

  const reloadClassSubjects = async () => {
    if (!activeClass?.id) return;
    setSubjectsLoading(true);
    setSubjectsErr(null);
    try {
      const clsSubs = await subjectService.getAllClassSubjects(activeClass.id);
      setClassSubjects(clsSubs || []);
    } catch (e) {
      setSubjectsErr(e?.response?.data?.detail || e?.message || "Failed to load class subjects");
    } finally {
      setSubjectsLoading(false);
    }
  };

  const assignSelected = async () => {
    if (!activeClass?.id || !selectedSubjects?.length) return;
    setSubjectsErr(null);
    setBusyId(`assign:${activeClass.id}`);
    try {
      const payload = {
        is_compulsory: Boolean(assignOpts.is_compulsory),
        credits: assignOpts.credits === "" ? null : Number(assignOpts.credits),
      };
      await Promise.all(selectedSubjects.map((s) => subjectService.assignSubjectToClass(s.id, activeClass.id, payload)));
      setSelectedSubjects([]);
      await reloadClassSubjects();
    } catch (e) {
      setSubjectsErr(e?.response?.data?.detail || e?.message || "Failed to assign subjects");
    } finally {
      setBusyId(null);
    }
  };

  const removeAssigned = async (subjectId) => {
    if (!activeClass?.id || !subjectId) return;
    setSubjectsErr(null);
    setBusyId(`rm:${activeClass.id}:${subjectId}`);
    try {
      await subjectService.deleteClassSubject(activeClass.id, subjectId);
      await reloadClassSubjects();
    } catch (e) {
      setSubjectsErr(e?.response?.data?.detail || e?.message || "Failed to remove subject");
    } finally {
      setBusyId(null);
    }
  };

  const openEditAssignedDialog = (cs) => {
    setActiveAssigned(cs);
    setEditAssigned({
      is_compulsory: Boolean(cs?.is_compulsory),
      credits: cs?.credits ?? "",
    });
    setOpenEditAssigned(true);
  };

  const saveAssignedEdits = async () => {
    if (!activeClass?.id || !activeAssigned?.subject_id) return;
    setSubjectsErr(null);
    setBusyId(`edit:${activeClass.id}:${activeAssigned.subject_id}`);
    try {
      await subjectService.updateClassSubject(activeClass.id, activeAssigned.subject_id, {
        is_compulsory: Boolean(editAssigned.is_compulsory),
        credits: editAssigned.credits === "" ? null : Number(editAssigned.credits),
      });
      setOpenEditAssigned(false);
      setActiveAssigned(null);
      await reloadClassSubjects();
    } catch (e) {
      setSubjectsErr(e?.response?.data?.detail || e?.message || "Failed to update assigned subject");
    } finally {
      setBusyId(null);
    }
  };

  const openTeachersDialog = async (cs) => {
    if (!activeClass?.id || !cs?.subject_id) return;
    setActiveClassSubject(cs);
    setOpenTeachers(true);
    setTeachersErr(null);
    setTeachersLoading(true);
    setTeacherSel(null);
    setAssignForm({
      academic_year: activeClass?.academic_year || "",
      periods_per_week: 1,
      syllabus_completion: 0,
    });
    try {
      const [teacherList, assigned] = await Promise.all([
        // Prefer subject filter (smaller list); fallback to all.
        teacherService.getTeachersBySubjectId(cs.subject_id).catch(() => teacherService.getAllTeachers()),
        subjectService.getAllClassSubjectTeachers(activeClass.id, cs.subject_id),
      ]);
      setTeacherOptions(teacherList || []);
      setTeacherAssignments(assigned || []);
    } catch (e) {
      setTeachersErr(e?.response?.data?.detail || e?.message || "Failed to load teacher assignments");
    } finally {
      setTeachersLoading(false);
    }
  };

  const refreshTeacherAssignments = async () => {
    if (!activeClass?.id || !activeClassSubject?.subject_id) return;
    setTeachersLoading(true);
    setTeachersErr(null);
    try {
      const assigned = await subjectService.getAllClassSubjectTeachers(activeClass.id, activeClassSubject.subject_id);
      setTeacherAssignments(assigned || []);
    } catch (e) {
      setTeachersErr(e?.response?.data?.detail || e?.message || "Failed to load teacher assignments");
    } finally {
      setTeachersLoading(false);
    }
  };

  const assignTeacher = async () => {
    if (!activeClass?.id || !activeClassSubject?.subject_id || !teacherSel?.id) return;
    setTeachersErr(null);
    setBusyId(`assignTeacher:${activeClass.id}:${activeClassSubject.subject_id}:${teacherSel.id}`);
    try {
      await subjectService.assignTeacherToClassSubject(activeClass.id, activeClassSubject.subject_id, teacherSel.id, {
        academic_year: assignForm.academic_year || undefined,
        periods_per_week: Number(assignForm.periods_per_week) || 1,
        syllabus_completion: Number(assignForm.syllabus_completion) || 0,
      });
      setTeacherSel(null);
      await refreshTeacherAssignments();
    } catch (e) {
      setTeachersErr(e?.response?.data?.detail || e?.message || "Failed to assign teacher");
    } finally {
      setBusyId(null);
    }
  };

  const toggleTeacherAssignment = async (row) => {
    if (!activeClass?.id || !activeClassSubject?.subject_id || !row?.teacher?.id) return;
    setTeachersErr(null);
    setBusyId(`toggleTeacher:${row.teacher.id}`);
    try {
      if (row.is_active) await subjectService.deactivateClassSubjectTeacher(activeClass.id, activeClassSubject.subject_id, row.teacher.id);
      else await subjectService.activateClassSubjectTeacher(activeClass.id, activeClassSubject.subject_id, row.teacher.id);
      await refreshTeacherAssignments();
    } catch (e) {
      setTeachersErr(e?.response?.data?.detail || e?.message || "Failed to update assignment");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, gap: 1, flexWrap: "wrap" }}>
          <Typography fontWeight={600}>Classes</Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Button onClick={openCreateDialog} variant="contained" startIcon={<AddRoundedIcon />}>
              Create
            </Button>
            <Button onClick={load} variant="outlined" startIcon={<RefreshRoundedIcon />} disabled={loading}>
              Refresh
            </Button>
          </Stack>
        </Stack>
        <Divider sx={{ mb: 2 }} />

        {err ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {String(err)}
          </Alert>
        ) : null}
        {actionErr ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {String(actionErr)}
          </Alert>
        ) : null}

        {loading ? (
          <Typography sx={{ opacity: 0.7 }}>Loading...</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Grade</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>Session</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items?.length ? (
                items.map((c) => (
                  <TableRow
                    key={c.id}
                    hover
                    onClick={() => openSubjectsDialog(c)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>
                      <Typography fontWeight={500}>{c.name}</Typography>
                    </TableCell>
                    <TableCell>{c.grade_level}</TableCell>
                    <TableCell>{c.section}</TableCell>
                    <TableCell>{c.academic_year || "-"}</TableCell>
                    <TableCell>{c.capacity ?? "-"}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Manage subjects">
                        <span>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              openSubjectsDialog(c);
                            }}
                            disabled={busyId === c.id}
                          >
                            <LibraryAddRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <span>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(c);
                            }}
                            disabled={busyId === c.id}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(c);
                            }}
                            disabled={busyId === c.id}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography sx={{ opacity: 0.7 }}>No classes found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* Create dialog */}
        <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
          <DialogTitle>Create Class</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Class name" value={form.name} onChange={change("name")} fullWidth required />
              <TextField label="Grade level" value={form.grade_level} onChange={change("grade_level")} fullWidth required />
              <TextField label="Section" value={form.section} onChange={change("section")} fullWidth required />

              {sessions?.length ? (
                <FormControl fullWidth>
                  <InputLabel id="session-select-label">Session</InputLabel>
                  <Select
                    labelId="session-select-label"
                    label="Session"
                    value={form.session_name}
                    onChange={(e) => setForm((s) => ({ ...s, session_name: e.target.value, academic_year: e.target.value }))}
                  >
                    {sessions.map((s) => (
                      <MenuItem key={s.id} value={s.name}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  label="Academic year / session"
                  value={form.academic_year}
                  onChange={change("academic_year")}
                  fullWidth
                  required
                />
              )}

              <TextField
                label="Capacity"
                type="number"
                value={form.capacity}
                onChange={change("capacity")}
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button onClick={submitCreate} variant="contained" disabled={!canSubmit || busyId === "create"}>
              {busyId === "create" ? "Creating..." : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit dialog */}
        <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
          <DialogTitle>Edit Class</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Class name" value={form.name} onChange={change("name")} fullWidth required />
              <TextField label="Grade level" value={form.grade_level} onChange={change("grade_level")} fullWidth required />
              <TextField label="Section" value={form.section} onChange={change("section")} fullWidth required />

              {sessions?.length ? (
                <FormControl fullWidth>
                  <InputLabel id="session-select-label-edit">Session</InputLabel>
                  <Select
                    labelId="session-select-label-edit"
                    label="Session"
                    value={form.session_name || form.academic_year}
                    onChange={(e) => setForm((s) => ({ ...s, session_name: e.target.value, academic_year: e.target.value }))}
                  >
                    {sessions.map((s) => (
                      <MenuItem key={s.id} value={s.name}>
                        {s.name}
                      </MenuItem>
                    ))}
                    {!sessions.some((s) => s?.name === form.academic_year) && form.academic_year ? (
                      <MenuItem value={form.academic_year}>{form.academic_year}</MenuItem>
                    ) : null}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  label="Academic year / session"
                  value={form.academic_year}
                  onChange={change("academic_year")}
                  fullWidth
                  required
                />
              )}

              <TextField
                label="Capacity"
                type="number"
                value={form.capacity}
                onChange={change("capacity")}
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setOpenEdit(false);
                setActive(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={submitEdit} variant="contained" disabled={!canSubmit || !active?.id || busyId === active?.id}>
              {busyId === active?.id ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Manage subjects dialog */}
        <Dialog
          open={openSubjects}
          onClose={() => {
            setOpenSubjects(false);
            setActiveClass(null);
            setSubjectsErr(null);
            setSelectedSubjects([]);
          }}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            Assign Subjects —{" "}
            <Typography component="span" fontWeight={600}>
              {activeClass?.name || "-"}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {subjectsErr ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {String(subjectsErr)}
              </Alert>
            ) : null}

            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
                <Autocomplete
                  multiple
                  options={subjects || []}
                  getOptionLabel={(o) => `${o?.name || ""}${o?.code ? ` (${o.code})` : ""}`}
                  value={selectedSubjects}
                  onChange={(_, v) => setSelectedSubjects(v)}
                  renderInput={(params) => <TextField {...params} label="Select subjects" placeholder="Search by name/code" />}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Credits"
                  type="number"
                  value={assignOpts.credits}
                  onChange={(e) => setAssignOpts((s) => ({ ...s, credits: e.target.value }))}
                  sx={{ width: { xs: "100%", md: 160 } }}
                  inputProps={{ min: 0 }}
                />
                <FormControl sx={{ width: { xs: "100%", md: 220 } }}>
                  <InputLabel id="is-compulsory-label">Type</InputLabel>
                  <Select
                    labelId="is-compulsory-label"
                    label="Type"
                    value={assignOpts.is_compulsory ? "compulsory" : "optional"}
                    onChange={(e) => setAssignOpts((s) => ({ ...s, is_compulsory: e.target.value === "compulsory" }))}
                  >
                    <MenuItem value="compulsory">Compulsory</MenuItem>
                    <MenuItem value="optional">Optional</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ flexWrap: "wrap" }}>
                <Button onClick={reloadClassSubjects} variant="outlined" startIcon={<RefreshRoundedIcon />} disabled={subjectsLoading}>
                  Refresh
                </Button>
                <Button
                  onClick={assignSelected}
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  disabled={!selectedSubjects?.length || busyId === `assign:${activeClass?.id}`}
                >
                  {busyId === `assign:${activeClass?.id}` ? "Assigning..." : "Assign Selected"}
                </Button>
              </Stack>

              <Divider />

              <Typography fontWeight={600}>Assigned Subjects</Typography>
              {subjectsLoading ? (
                <Typography sx={{ opacity: 0.7 }}>Loading...</Typography>
              ) : classSubjects?.length ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject</TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Credits</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {classSubjects.map((cs) => (
                      <TableRow key={cs.id} hover>
                        <TableCell>
                          <Typography fontWeight={500}>{cs?.subject?.name || "-"}</Typography>
                        </TableCell>
                        <TableCell>{cs?.subject?.code || "-"}</TableCell>
                        <TableCell>
                          {cs.is_compulsory ? <Chip size="small" color="primary" label="Compulsory" /> : <Chip size="small" label="Optional" />}
                        </TableCell>
                        <TableCell>{cs.credits ?? "-"}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Assign / Manage teachers">
                            <span>
                              <IconButton size="small" onClick={() => openTeachersDialog(cs)}>
                                <PersonAddRoundedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => openEditAssignedDialog(cs)}
                                disabled={busyId === `edit:${activeClass?.id}:${cs.subject_id}`}
                              >
                                <EditRoundedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Remove">
                            <span>
                              <Button
                                size="small"
                                color="error"
                                variant="contained"
                                onClick={() => removeAssigned(cs.subject_id)}
                                startIcon={<DeleteOutlineRoundedIcon />}
                                disabled={busyId === `rm:${activeClass?.id}:${cs.subject_id}`}
                                sx={{ display: { xs: "none", sm: "inline-flex" } }}
                              >
                                Remove
                              </Button>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeAssigned(cs.subject_id)}
                                disabled={busyId === `rm:${activeClass?.id}:${cs.subject_id}`}
                                sx={{ display: { xs: "inline-flex", sm: "none" } }}
                              >
                                <DeleteOutlineRoundedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography sx={{ opacity: 0.7 }}>No subjects assigned to this class yet.</Typography>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setOpenSubjects(false);
                setActiveClass(null);
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit assigned subject dialog */}
        <Dialog
          open={openEditAssigned}
          onClose={() => {
            setOpenEditAssigned(false);
            setActiveAssigned(null);
          }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Edit Assigned Subject</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Subject"
                value={activeAssigned?.subject?.name ? `${activeAssigned.subject.name} (${activeAssigned?.subject?.code || ""})` : ""}
                fullWidth
                disabled
              />
              <TextField
                label="Credits"
                type="number"
                value={editAssigned.credits}
                onChange={(e) => setEditAssigned((s) => ({ ...s, credits: e.target.value }))}
                fullWidth
                inputProps={{ min: 0 }}
              />
              <FormControl fullWidth>
                <InputLabel id="edit-assigned-type-label">Type</InputLabel>
                <Select
                  labelId="edit-assigned-type-label"
                  label="Type"
                  value={editAssigned.is_compulsory ? "compulsory" : "optional"}
                  onChange={(e) => setEditAssigned((s) => ({ ...s, is_compulsory: e.target.value === "compulsory" }))}
                >
                  <MenuItem value="compulsory">Compulsory</MenuItem>
                  <MenuItem value="optional">Optional</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setOpenEditAssigned(false);
                setActiveAssigned(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveAssignedEdits}
              variant="contained"
              disabled={!activeAssigned?.subject_id || busyId === `edit:${activeClass?.id}:${activeAssigned?.subject_id}`}
            >
              {busyId === `edit:${activeClass?.id}:${activeAssigned?.subject_id}` ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Manage teachers dialog */}
        <Dialog
          open={openTeachers}
          onClose={() => {
            setOpenTeachers(false);
            setActiveClassSubject(null);
            setTeacherAssignments([]);
            setTeacherOptions([]);
            setTeacherSel(null);
            setTeachersErr(null);
          }}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            Manage Teachers —{" "}
            <Typography component="span" fontWeight={600}>
              {activeClass?.name || "-"} / {activeClassSubject?.subject?.name || "-"}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {teachersErr ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {String(teachersErr)}
              </Alert>
            ) : null}
            {teachersLoading ? <Typography sx={{ opacity: 0.7, mb: 1 }}>Loading...</Typography> : null}

            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
                <Autocomplete
                  options={teacherOptions || []}
                  getOptionLabel={(t) => `${t?.name || ""}${t?.email ? ` (${t.email})` : ""}`}
                  value={teacherSel}
                  onChange={(_, v) => setTeacherSel(v)}
                  renderInput={(params) => <TextField {...params} label="Select teacher" />}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Academic year"
                  value={assignForm.academic_year}
                  onChange={(e) => setAssignForm((s) => ({ ...s, academic_year: e.target.value }))}
                  sx={{ width: { xs: "100%", md: 180 } }}
                />
                <TextField
                  label="Periods/week"
                  type="number"
                  value={assignForm.periods_per_week}
                  onChange={(e) => setAssignForm((s) => ({ ...s, periods_per_week: e.target.value }))}
                  sx={{ width: { xs: "100%", md: 140 } }}
                  inputProps={{ min: 0 }}
                />
                <TextField
                  label="Syllabus %"
                  type="number"
                  value={assignForm.syllabus_completion}
                  onChange={(e) => setAssignForm((s) => ({ ...s, syllabus_completion: e.target.value }))}
                  sx={{ width: { xs: "100%", md: 140 } }}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Stack>

              <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ flexWrap: "wrap" }}>
                <Button onClick={refreshTeacherAssignments} variant="outlined" startIcon={<RefreshRoundedIcon />}>
                  Refresh
                </Button>
                <Button
                  onClick={assignTeacher}
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  disabled={!teacherSel?.id || busyId?.startsWith("assignTeacher:")}
                >
                  Assign Teacher
                </Button>
              </Stack>

              <Divider />
              <Typography fontWeight={600}>Assigned Teachers</Typography>
              {teacherAssignments?.length ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Teacher</TableCell>
                      <TableCell>Academic year</TableCell>
                      <TableCell>Periods/week</TableCell>
                      <TableCell>Syllabus %</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teacherAssignments.map((ta) => (
                      <TableRow key={ta.id} hover>
                        <TableCell>
                          <Typography fontWeight={500}>{ta?.teacher?.name || "-"}</Typography>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {ta?.teacher?.email || ""}
                          </Typography>
                        </TableCell>
                        <TableCell>{ta.academic_year || "-"}</TableCell>
                        <TableCell>{ta.periods_per_week ?? "-"}</TableCell>
                        <TableCell>{ta.syllabus_completion ?? 0}</TableCell>
                        <TableCell>{ta.is_active ? <Chip size="small" color="success" label="Active" /> : <Chip size="small" label="Inactive" />}</TableCell>
                        <TableCell align="right">
                          <Tooltip title={ta.is_active ? "Deactivate" : "Activate"}>
                            <span>
                              <IconButton size="small" onClick={() => toggleTeacherAssignment(ta)} disabled={busyId === `toggleTeacher:${ta?.teacher?.id}`}>
                                {ta.is_active ? <ToggleOffRoundedIcon fontSize="small" /> : <ToggleOnRoundedIcon fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography sx={{ opacity: 0.7 }}>No teachers assigned yet.</Typography>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenTeachers(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}


