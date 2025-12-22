import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
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
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
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
import ToggleOffRoundedIcon from "@mui/icons-material/ToggleOffRounded";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";

import * as teacherService from "../../services/teacherService";
import * as classService from "../../services/classService";
import * as subjectService from "../../services/subjectService";
import * as departmentService from "../../services/departmentService";

export default function TeachersTab() {
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [actionErr, setActionErr] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [filterMode, setFilterMode] = useState("all"); // all | class | subject | department
  const [filterClass, setFilterClass] = useState(null);
  const [filterSubject, setFilterSubject] = useState(null);
  const [filterDepartment, setFilterDepartment] = useState(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [active, setActive] = useState(null);

  const emptyForm = useMemo(
    () => ({
      name: "",
      email: "",
      password: "teacher",
      phone: "",
      qualification: "",
      experience_years: "",
      specialization: "",
      // address
      street: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
    }),
    [],
  );
  const [form, setForm] = useState(emptyForm);

  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [primarySubjectId, setPrimarySubjectId] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [primaryDepartmentId, setPrimaryDepartmentId] = useState("");

  const [updateSubjects, setUpdateSubjects] = useState(false);
  const [updateDepartments, setUpdateDepartments] = useState(false);

  const change = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

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
      // keep non-blocking
    }
  };

  const loadTeachers = async (mode = filterMode) => {
    setLoading(true);
    setErr(null);
    try {
      let data = [];
      if (mode === "all") data = await teacherService.getAllTeachers();
      else if (mode === "class") {
        if (!filterClass?.id) throw new Error("Please select a class");
        data = await teacherService.getTeachersByClassId(filterClass.id);
      } else if (mode === "subject") {
        if (!filterSubject?.id) throw new Error("Please select a subject");
        data = await teacherService.getTeachersBySubjectId(filterSubject.id);
      } else if (mode === "department") {
        if (!filterDepartment?.id) throw new Error("Please select a department");
        data = await teacherService.getTeachersByDepartmentId(filterDepartment.id);
      }
      setItems(data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
    loadTeachers("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateDialog = () => {
    setActionErr(null);
    setForm(emptyForm);
    setSelectedSubjects([]);
    setPrimarySubjectId("");
    setSelectedDepartments([]);
    setPrimaryDepartmentId("");
    setOpenCreate(true);
  };

  const openEditDialog = (t) => {
    setActionErr(null);
    setActive(t);
    setUpdateSubjects(false);
    setUpdateDepartments(false);
    setForm({
      name: t?.name || "",
      email: t?.email || "",
      password: "",
      phone: t?.phone || "",
      qualification: t?.qualification || "",
      experience_years: t?.experience_years ?? "",
      specialization: t?.specialization || "",
      street: t?.address?.street || "",
      city: t?.address?.city || "",
      state: t?.address?.state || "",
      country: t?.address?.country || "",
      postal_code: t?.address?.postal_code || "",
    });
    const subs = (t?.subjects || []).map((ts) => ts.subject).filter(Boolean);
    setSelectedSubjects(subs);
    setPrimarySubjectId((t?.subjects || []).find((ts) => ts.is_primary)?.subject_id || "");

    const depts = (t?.departments || []).map((td) => td.department).filter(Boolean);
    setSelectedDepartments(depts);
    setPrimaryDepartmentId((t?.departments || []).find((td) => td.is_primary)?.department_id || "");
    setOpenEdit(true);
  };

  const buildAddress = () => {
    const addr = {
      street: form.street || null,
      city: form.city || null,
      state: form.state || null,
      country: form.country || null,
      postal_code: form.postal_code || null,
    };
    const any = Object.values(addr).some((v) => v && String(v).trim());
    return any ? addr : null;
  };

  const buildSubjectsPayload = () => {
    const primary = primarySubjectId || (selectedSubjects?.[0]?.id ?? "");
    return (selectedSubjects || []).map((s) => ({
      subject_id: s.id,
      is_primary: s.id === primary,
      experience_years: null,
    }));
  };

  const buildDepartmentsPayload = () => {
    const primary = primaryDepartmentId || (selectedDepartments?.[0]?.id ?? "");
    return (selectedDepartments || []).map((d) => ({
      department_id: d.id,
      is_primary: d.id === primary,
    }));
  };

  const submitCreate = async () => {
    setActionErr(null);
    setBusyId("create");
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password?.trim() || "teacher",
        phone: form.phone?.trim() || null,
        address: buildAddress(),
        qualification: form.qualification?.trim() || null,
        experience_years: form.experience_years === "" ? null : Number(form.experience_years),
        specialization: form.specialization?.trim() || null,
        subjects: buildSubjectsPayload(),
        departments: buildDepartmentsPayload(),
      };
      await teacherService.createTeacher(payload);
      setOpenCreate(false);
      await loadTeachers("all");
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Failed to create teacher");
    } finally {
      setBusyId(null);
    }
  };

  const submitEdit = async () => {
    if (!active?.id) return;
    setActionErr(null);
    setBusyId(active.id);
    try {
      const payload = {
        name: form.name?.trim() || undefined,
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || null,
        password: form.password?.trim() || undefined,
        address: buildAddress(),
        qualification: form.qualification?.trim() || null,
        experience_years: form.experience_years === "" ? null : Number(form.experience_years),
        specialization: form.specialization?.trim() || null,
      };

      if (updateSubjects) payload.subjects = buildSubjectsPayload();
      if (updateDepartments) payload.departments = buildDepartmentsPayload();

      await teacherService.updateTeacher(active.id, payload);
      setOpenEdit(false);
      setActive(null);
      await loadTeachers(filterMode);
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Failed to update teacher");
    } finally {
      setBusyId(null);
    }
  };

  const onToggleActive = async (row) => {
    setActionErr(null);
    setBusyId(row.id);
    try {
      if (row.is_active) await teacherService.deactivateTeacher(row.id);
      else await teacherService.activateTeacher(row.id);
      await loadTeachers(filterMode);
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (row) => {
    setActionErr(null);
    setBusyId(row.id);
    try {
      await teacherService.deleteTeacher(row.id);
      await loadTeachers(filterMode);
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const canCreate = Boolean(form.name.trim() && form.email.trim());
  const canEdit = Boolean(form.name.trim() && form.email.trim() && active?.id);

  return (
    <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, gap: 1, flexWrap: "wrap" }}>
          <Typography fontWeight={900}>Teachers</Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Button onClick={openCreateDialog} variant="contained" startIcon={<AddRoundedIcon />}>
              Create
            </Button>
            <Button onClick={() => loadTeachers(filterMode)} variant="outlined" startIcon={<RefreshRoundedIcon />} disabled={loading}>
              Refresh
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel id="teacher-filter-mode">Filter</InputLabel>
            <Select
              labelId="teacher-filter-mode"
              label="Filter"
              value={filterMode}
              onChange={(e) => {
                setFilterMode(e.target.value);
                setErr(null);
              }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="class">By Class</MenuItem>
              <MenuItem value="subject">By Subject</MenuItem>
              <MenuItem value="department">By Department</MenuItem>
            </Select>
          </FormControl>

          {filterMode === "class" ? (
            <Autocomplete
              options={classes || []}
              getOptionLabel={(c) => `${c?.name || ""}${c?.section ? ` (${c.section})` : ""}`}
              value={filterClass}
              onChange={(_, v) => setFilterClass(v)}
              renderInput={(params) => <TextField {...params} label="Class" />}
              sx={{ flex: 1 }}
            />
          ) : null}

          {filterMode === "subject" ? (
            <Autocomplete
              options={subjects || []}
              getOptionLabel={(s) => `${s?.name || ""}${s?.code ? ` (${s.code})` : ""}`}
              value={filterSubject}
              onChange={(_, v) => setFilterSubject(v)}
              renderInput={(params) => <TextField {...params} label="Subject" />}
              sx={{ flex: 1 }}
            />
          ) : null}

          {filterMode === "department" ? (
            <Autocomplete
              options={departments || []}
              getOptionLabel={(d) => d?.name || ""}
              value={filterDepartment}
              onChange={(_, v) => setFilterDepartment(v)}
              renderInput={(params) => <TextField {...params} label="Department" />}
              sx={{ flex: 1 }}
            />
          ) : null}

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              onClick={() => {
                setFilterMode("all");
                setFilterClass(null);
                setFilterSubject(null);
                setFilterDepartment(null);
                loadTeachers("all");
              }}
              variant="text"
            >
              Clear
            </Button>
            <Button onClick={() => loadTeachers(filterMode)} variant="contained" disabled={loading}>
              Apply
            </Button>
          </Stack>
        </Stack>

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
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
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
                      <Typography fontWeight={800}>{t.name}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {t.id}
                      </Typography>
                    </TableCell>
                    <TableCell>{t.email}</TableCell>
                    <TableCell>{t.phone || "-"}</TableCell>
                    <TableCell>{t.subjects?.length || 0}</TableCell>
                    <TableCell>{t.departments?.length || 0}</TableCell>
                    <TableCell>
                      {t.is_active ? <Chip size="small" color="success" label="Active" /> : <Chip size="small" label="Inactive" />}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <span>
                          <IconButton size="small" onClick={() => openEditDialog(t)} disabled={busyId === t.id}>
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title={t.is_active ? "Deactivate" : "Activate"}>
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onToggleActive(t)}
                            startIcon={t.is_active ? <ToggleOffRoundedIcon /> : <ToggleOnRoundedIcon />}
                            sx={{ display: { xs: "none", sm: "inline-flex" }, mx: 1 }}
                            disabled={busyId === t.id}
                          >
                            {t.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </span>
                      </Tooltip>

                      <Tooltip title="Delete">
                        <span>
                          <Button
                            size="small"
                            color="error"
                            variant="contained"
                            onClick={() => onDelete(t)}
                            startIcon={<DeleteOutlineRoundedIcon />}
                            sx={{ display: { xs: "none", sm: "inline-flex" } }}
                            disabled={busyId === t.id}
                          >
                            Delete
                          </Button>
                        </span>
                      </Tooltip>

                      <Tooltip title={t.is_active ? "Deactivate" : "Activate"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onToggleActive(t)}
                            sx={{ display: { xs: "inline-flex", sm: "none" }, mr: 0.5 }}
                            disabled={busyId === t.id}
                          >
                            {t.is_active ? <ToggleOffRoundedIcon fontSize="small" /> : <ToggleOnRoundedIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDelete(t)}
                            sx={{ display: { xs: "inline-flex", sm: "none" } }}
                            disabled={busyId === t.id}
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
                  <TableCell colSpan={7}>
                    <Typography sx={{ opacity: 0.7 }}>No teachers found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* Create dialog */}
        <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="md">
          <DialogTitle>Create Teacher</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Name" value={form.name} onChange={change("name")} fullWidth required />
                <TextField label="Email" value={form.email} onChange={change("email")} fullWidth required />
                <TextField label="Password" type="password" value={form.password} onChange={change("password")} fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Phone" value={form.phone} onChange={change("phone")} fullWidth />
                <TextField label="Qualification" value={form.qualification} onChange={change("qualification")} fullWidth />
                <TextField
                  label="Experience (years)"
                  type="number"
                  value={form.experience_years}
                  onChange={change("experience_years")}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </Stack>
              <TextField label="Specialization" value={form.specialization} onChange={change("specialization")} fullWidth />

              <Divider />
              <Typography fontWeight={900}>Subjects</Typography>
              <Autocomplete
                multiple
                options={subjects || []}
                getOptionLabel={(s) => `${s?.name || ""}${s?.code ? ` (${s.code})` : ""}`}
                value={selectedSubjects}
                onChange={(_, v) => {
                  setSelectedSubjects(v);
                  if (primarySubjectId && !v.some((x) => x.id === primarySubjectId)) setPrimarySubjectId("");
                }}
                renderInput={(params) => <TextField {...params} label="Select subjects" placeholder="Search" />}
              />
              <Autocomplete
                options={selectedSubjects || []}
                getOptionLabel={(s) => `${s?.name || ""}${s?.code ? ` (${s.code})` : ""}`}
                value={selectedSubjects.find((s) => s.id === primarySubjectId) || null}
                onChange={(_, v) => setPrimarySubjectId(v?.id || "")}
                renderInput={(params) => <TextField {...params} label="Primary subject (optional)" />}
              />

              <Divider />
              <Typography fontWeight={900}>Departments</Typography>
              <Autocomplete
                multiple
                options={departments || []}
                getOptionLabel={(d) => d?.name || ""}
                value={selectedDepartments}
                onChange={(_, v) => {
                  setSelectedDepartments(v);
                  if (primaryDepartmentId && !v.some((x) => x.id === primaryDepartmentId)) setPrimaryDepartmentId("");
                }}
                renderInput={(params) => <TextField {...params} label="Select departments" placeholder="Search" />}
              />
              <Autocomplete
                options={selectedDepartments || []}
                getOptionLabel={(d) => d?.name || ""}
                value={selectedDepartments.find((d) => d.id === primaryDepartmentId) || null}
                onChange={(_, v) => setPrimaryDepartmentId(v?.id || "")}
                renderInput={(params) => <TextField {...params} label="Primary department (optional)" />}
              />

              <Divider />
              <Typography fontWeight={900}>Address (optional)</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Street" value={form.street} onChange={change("street")} fullWidth />
                <TextField label="City" value={form.city} onChange={change("city")} fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="State" value={form.state} onChange={change("state")} fullWidth />
                <TextField label="Country" value={form.country} onChange={change("country")} fullWidth />
                <TextField label="Postal code" value={form.postal_code} onChange={change("postal_code")} fullWidth />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button onClick={submitCreate} variant="contained" disabled={!canCreate || busyId === "create"}>
              {busyId === "create" ? "Creating..." : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit dialog */}
        <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="md">
          <DialogTitle>Edit Teacher</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Name" value={form.name} onChange={change("name")} fullWidth required />
                <TextField label="Email" value={form.email} onChange={change("email")} fullWidth required />
                <TextField label="New Password (optional)" type="password" value={form.password} onChange={change("password")} fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Phone" value={form.phone} onChange={change("phone")} fullWidth />
                <TextField label="Qualification" value={form.qualification} onChange={change("qualification")} fullWidth />
                <TextField
                  label="Experience (years)"
                  type="number"
                  value={form.experience_years}
                  onChange={change("experience_years")}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </Stack>
              <TextField label="Specialization" value={form.specialization} onChange={change("specialization")} fullWidth />

              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontWeight={900}>Subjects</Typography>
                <FormControlLabel control={<Switch checked={updateSubjects} onChange={(e) => setUpdateSubjects(e.target.checked)} />} label="Update subjects" />
              </Stack>
              <Autocomplete
                multiple
                options={subjects || []}
                getOptionLabel={(s) => `${s?.name || ""}${s?.code ? ` (${s.code})` : ""}`}
                value={selectedSubjects}
                onChange={(_, v) => {
                  setSelectedSubjects(v);
                  if (primarySubjectId && !v.some((x) => x.id === primarySubjectId)) setPrimarySubjectId("");
                }}
                renderInput={(params) => <TextField {...params} label="Select subjects" placeholder="Search" />}
                disabled={!updateSubjects}
              />
              <Autocomplete
                options={selectedSubjects || []}
                getOptionLabel={(s) => `${s?.name || ""}${s?.code ? ` (${s.code})` : ""}`}
                value={selectedSubjects.find((s) => s.id === primarySubjectId) || null}
                onChange={(_, v) => setPrimarySubjectId(v?.id || "")}
                renderInput={(params) => <TextField {...params} label="Primary subject (optional)" />}
                disabled={!updateSubjects}
              />

              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontWeight={900}>Departments</Typography>
                <FormControlLabel
                  control={<Switch checked={updateDepartments} onChange={(e) => setUpdateDepartments(e.target.checked)} />}
                  label="Update departments"
                />
              </Stack>
              <Autocomplete
                multiple
                options={departments || []}
                getOptionLabel={(d) => d?.name || ""}
                value={selectedDepartments}
                onChange={(_, v) => {
                  setSelectedDepartments(v);
                  if (primaryDepartmentId && !v.some((x) => x.id === primaryDepartmentId)) setPrimaryDepartmentId("");
                }}
                renderInput={(params) => <TextField {...params} label="Select departments" placeholder="Search" />}
                disabled={!updateDepartments}
              />
              <Autocomplete
                options={selectedDepartments || []}
                getOptionLabel={(d) => d?.name || ""}
                value={selectedDepartments.find((d) => d.id === primaryDepartmentId) || null}
                onChange={(_, v) => setPrimaryDepartmentId(v?.id || "")}
                renderInput={(params) => <TextField {...params} label="Primary department (optional)" />}
                disabled={!updateDepartments}
              />

              <Divider />
              <Typography fontWeight={900}>Address (optional)</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Street" value={form.street} onChange={change("street")} fullWidth />
                <TextField label="City" value={form.city} onChange={change("city")} fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="State" value={form.state} onChange={change("state")} fullWidth />
                <TextField label="Country" value={form.country} onChange={change("country")} fullWidth />
                <TextField label="Postal code" value={form.postal_code} onChange={change("postal_code")} fullWidth />
              </Stack>

              <Box sx={{ opacity: 0.75 }}>
                <Typography variant="caption">
                  Tip: “Update subjects/departments” will replace existing assignments (backend marks old ones deleted and inserts new ones).
                </Typography>
              </Box>
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
            <Button onClick={submitEdit} variant="contained" disabled={!canEdit || busyId === active?.id}>
              {busyId === active?.id ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
