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
  InputLabel,
  MenuItem,
  Select,
  IconButton,
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
import ToggleOffRoundedIcon from "@mui/icons-material/ToggleOffRounded";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";

import * as studentService from "../../services/studentService";
import * as classService from "../../services/classService";

export default function StudentsTab() {
  const [items, setItems] = useState([]); // StudentCreateResponse[]
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [actionErr, setActionErr] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [filterMode, setFilterMode] = useState("all"); // all | class
  const [filterClass, setFilterClass] = useState(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [active, setActive] = useState(null); // StudentCreateResponse

  const [rollPreview, setRollPreview] = useState("");
  const [rollLoading, setRollLoading] = useState(false);
  const [classFull, setClassFull] = useState(false);

  const emptyForm = useMemo(
    () => ({
      name: "",
      email: "",
      password: "student",
      phone: "",
      roll_number: "",
      date_of_birth: "",
      gender: "",
      blood_group: "",
      class_id: "",
      admission_date: "",
      // parent
      parent_name: "",
      parent_phone: "",
      parent_relation: "",
      parent_email: "",
      parent_occupation: "",
      parent_education_level: "",
      parent_marital_status: "",
      // address (stored on student user, sourced from parent.address in backend)
      street: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
    }),
    [],
  );
  const [form, setForm] = useState(emptyForm);

  const toDateInput = (v) => {
    if (!v) return "";
    try {
      const d = new Date(v);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return "";
    }
  };

  const toBackendDatetime = (yyyyMmDd) => {
    if (!yyyyMmDd) return null;
    return `${yyyyMmDd}T00:00:00`;
  };

  const loadLookups = async () => {
    try {
      const cls = await classService.getAllClasses();
      setClasses(cls || []);
    } catch {
      // non-blocking
    }
  };

  const loadStudents = async (mode = filterMode) => {
    setLoading(true);
    setErr(null);
    try {
      let data = [];
      if (mode === "all") data = await studentService.getAllStudents();
      else if (mode === "class") {
        if (!filterClass?.id) throw new Error("Please select a class");
        data = await studentService.getStudentsByClassId(filterClass.id);
      }
      setItems(data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
    loadStudents("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const change = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const openCreateDialog = () => {
    setActionErr(null);
    setForm(emptyForm);
    setRollPreview("");
    setClassFull(false);
    setOpenCreate(true);
  };

  const openEditDialog = (row) => {
    setActionErr(null);
    setActive(row);
    const s = row?.student || {};
    const u = s?.user || {};
    const p = row?.parent || {};
    const a = row?.address || {};

    setForm({
      name: u?.name || "",
      email: u?.email || "",
      password: "",
      phone: u?.phone || "",
      roll_number: s?.roll_number || "",
      date_of_birth: s?.date_of_birth || "",
      gender: s?.gender || "",
      blood_group: s?.blood_group || "",
      class_id: s?.class_id || "",
      admission_date: toDateInput(s?.admission_date),
      parent_name: p?.name || "",
      parent_phone: p?.phone || "",
      parent_relation: p?.relation || "",
      parent_email: p?.email || "",
      parent_occupation: p?.occupation || "",
      parent_education_level: p?.education_level || "",
      parent_marital_status: p?.marital_status || "",
      street: a?.street || "",
      city: a?.city || "",
      state: a?.state || "",
      country: a?.country || "",
      postal_code: a?.postal_code || "",
    });
    setRollPreview(String(s?.roll_number || ""));
    setClassFull(false);
    setOpenEdit(true);
  };

  const buildPayload = () => {
    const parentAddr = {
      street: form.street?.trim() || null,
      city: form.city?.trim() || null,
      state: form.state?.trim() || null,
      country: form.country?.trim() || null,
      postal_code: form.postal_code?.trim() || null,
    };
    const anyAddr = Object.values(parentAddr).some((v) => v && String(v).trim());

    const parent = {
      name: form.parent_name?.trim() || null,
      phone: form.parent_phone?.trim() || null,
      relation: form.parent_relation?.trim() || null,
      email: form.parent_email?.trim() || null,
      occupation: form.parent_occupation?.trim() || null,
      education_level: form.parent_education_level?.trim() || null,
      marital_status: form.parent_marital_status?.trim() || null,
      address: anyAddr ? parentAddr : null,
    };
    const anyParent = Object.entries(parent).some(([k, v]) => k !== "address" && v) || anyAddr;

    return {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password?.trim() || undefined,
      phone: form.phone?.trim() || null,
      // roll_number is auto-allocated based on class selection
      roll_number: rollPreview || null,
      date_of_birth: form.date_of_birth || null, // yyyy-mm-dd
      gender: form.gender?.trim() || null,
      blood_group: form.blood_group?.trim() || null,
      class_id: form.class_id,
      admission_date: toBackendDatetime(form.admission_date),
      parent: anyParent ? parent : null,
    };
  };

  const canSubmit = Boolean(form.name.trim() && form.email.trim() && form.class_id && !classFull && !rollLoading);

  const computeRollPreview = async (classId) => {
    if (!classId) {
      setRollPreview("");
      setClassFull(false);
      return;
    }
    const classObj = classes?.find((c) => c.id === classId);
    setRollLoading(true);
    try {
      const students = await studentService.getStudentsByClassId(classId);
      const used = (students || []).length;
      const cap = classObj?.capacity ?? null;
      if (cap != null && used >= cap) {
        setClassFull(true);
        setRollPreview("");
        return;
      }
      setClassFull(false);
      let maxNum = 0;
      for (const row of students || []) {
        const rn = row?.student?.roll_number;
        if (rn != null && String(rn).trim().match(/^\d+$/)) {
          maxNum = Math.max(maxNum, Number(String(rn).trim()));
        }
      }
      const next = maxNum + 1;
      setRollPreview(String(next).padStart(2, "0"));
    } catch {
      // If preview fails, backend will still allocate on create.
      setRollPreview("");
      setClassFull(false);
    } finally {
      setRollLoading(false);
    }
  };

  const submitCreate = async () => {
    setActionErr(null);
    setBusyId("create");
    try {
      const payload = buildPayload();
      // For create, backend default password is "student" if omitted, but we usually pass it.
      if (!payload.password) payload.password = "student";
      await studentService.createStudent(payload);
      setOpenCreate(false);
      await loadStudents(filterMode);
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Failed to create student");
    } finally {
      setBusyId(null);
    }
  };

  const submitEdit = async () => {
    const studentId = active?.student?.id;
    if (!studentId) return;
    setActionErr(null);
    setBusyId(studentId);
    try {
      const payload = buildPayload();
      await studentService.updateStudent(studentId, payload);
      setOpenEdit(false);
      setActive(null);
      await loadStudents(filterMode);
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Failed to update student");
    } finally {
      setBusyId(null);
    }
  };

  const onToggleActive = async (row) => {
    const studentId = row?.student?.id;
    if (!studentId) return;
    setActionErr(null);
    setBusyId(studentId);
    try {
      if (row?.student?.is_active) await studentService.deactivateStudent(studentId);
      else await studentService.activateStudent(studentId);
      await loadStudents(filterMode);
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (row) => {
    const studentId = row?.student?.id;
    if (!studentId) return;
    setActionErr(null);
    setBusyId(studentId);
    try {
      await studentService.deleteStudent(studentId);
      await loadStudents(filterMode);
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const classLabel = (c) => `${c?.name || ""}${c?.section ? ` (${c.section})` : ""}`;
  const classNameById = (id) => classes?.find((c) => c.id === id)?.name || id || "-";

  return (
    <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, gap: 1, flexWrap: "wrap" }}>
          <Typography fontWeight={600}>Students</Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Button onClick={openCreateDialog} variant="contained" startIcon={<AddRoundedIcon />}>
              Create
            </Button>
            <Button onClick={() => loadStudents(filterMode)} variant="outlined" startIcon={<RefreshRoundedIcon />} disabled={loading}>
              Refresh
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel id="student-filter-mode">Filter</InputLabel>
            <Select
              labelId="student-filter-mode"
              label="Filter"
              value={filterMode}
              onChange={(e) => {
                setFilterMode(e.target.value);
                setErr(null);
              }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="class">By Class</MenuItem>
            </Select>
          </FormControl>

          {filterMode === "class" ? (
            <Autocomplete
              options={classes || []}
              getOptionLabel={classLabel}
              value={filterClass}
              onChange={(_, v) => setFilterClass(v)}
              renderInput={(params) => <TextField {...params} label="Class" />}
              sx={{ flex: 1 }}
            />
          ) : null}

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              onClick={() => {
                setFilterMode("all");
                setFilterClass(null);
                loadStudents("all");
              }}
              variant="text"
            >
              Clear
            </Button>
            <Button onClick={() => loadStudents(filterMode)} variant="contained" disabled={loading}>
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
                <TableCell>Student</TableCell>
                <TableCell>Roll</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Parent</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items?.length ? (
                items.map((row) => {
                  const s = row?.student;
                  const u = s?.user;
                  const p = row?.parent;
                  const studentId = s?.id;
                  return (
                    <TableRow key={studentId} hover>
                      <TableCell>
                        <Typography fontWeight={500}>{u?.name || "-"}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {u?.email || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>{s?.roll_number || "-"}</TableCell>
                      <TableCell>{classNameById(s?.class_id)}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{p?.name || "-"}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {p?.phone || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {s?.is_active ? <Chip size="small" color="success" label="Active" /> : <Chip size="small" label="Inactive" />}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <span>
                            <IconButton size="small" onClick={() => openEditDialog(row)} disabled={busyId === studentId}>
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title={s?.is_active ? "Deactivate" : "Activate"}>
                          <span>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => onToggleActive(row)}
                              startIcon={s?.is_active ? <ToggleOffRoundedIcon /> : <ToggleOnRoundedIcon />}
                              sx={{ display: { xs: "none", sm: "inline-flex" }, mx: 1 }}
                              disabled={busyId === studentId}
                            >
                              {s?.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          </span>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <span>
                            <Button
                              size="small"
                              color="error"
                              variant="contained"
                              onClick={() => onDelete(row)}
                              startIcon={<DeleteOutlineRoundedIcon />}
                              sx={{ display: { xs: "none", sm: "inline-flex" } }}
                              disabled={busyId === studentId}
                            >
                              Delete
                            </Button>
                          </span>
                        </Tooltip>

                        <Tooltip title={s?.is_active ? "Deactivate" : "Activate"}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => onToggleActive(row)}
                              sx={{ display: { xs: "inline-flex", sm: "none" }, mr: 0.5 }}
                              disabled={busyId === studentId}
                            >
                              {s?.is_active ? <ToggleOffRoundedIcon fontSize="small" /> : <ToggleOnRoundedIcon fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onDelete(row)}
                              sx={{ display: { xs: "inline-flex", sm: "none" } }}
                              disabled={busyId === studentId}
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography sx={{ opacity: 0.7 }}>No students found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* Create */}
        <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="md">
          <DialogTitle>Create Student</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Name" value={form.name} onChange={change("name")} fullWidth required />
                <TextField label="Email" value={form.email} onChange={change("email")} fullWidth required />
                <TextField label="Password" type="password" value={form.password} onChange={change("password")} fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Phone" value={form.phone} onChange={change("phone")} fullWidth />
                <TextField
                  label="Roll number (auto)"
                  value={rollLoading ? "..." : rollPreview || ""}
                  fullWidth
                  disabled
                  helperText={classFull ? "Class capacity is full" : "Auto allocated from selected class"}
                />
                <TextField
                  label="Date of birth"
                  type="date"
                  value={form.date_of_birth}
                  onChange={change("date_of_birth")}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Gender" value={form.gender} onChange={change("gender")} fullWidth />
                <TextField label="Blood group" value={form.blood_group} onChange={change("blood_group")} fullWidth />
                <TextField
                  label="Admission date"
                  type="date"
                  value={form.admission_date}
                  onChange={change("admission_date")}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>

              <FormControl fullWidth>
                <InputLabel id="student-class-label">Class</InputLabel>
                <Select
                  labelId="student-class-label"
                  label="Class"
                  value={form.class_id}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((s) => ({ ...s, class_id: v }));
                    computeRollPreview(v);
                  }}
                >
                  {classes.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {classLabel(c)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider />
              <Typography fontWeight={600}>Parent (optional)</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Parent name" value={form.parent_name} onChange={change("parent_name")} fullWidth />
                <TextField label="Parent phone" value={form.parent_phone} onChange={change("parent_phone")} fullWidth />
                <TextField label="Relation" value={form.parent_relation} onChange={change("parent_relation")} fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Parent email" value={form.parent_email} onChange={change("parent_email")} fullWidth />
                <TextField label="Occupation" value={form.parent_occupation} onChange={change("parent_occupation")} fullWidth />
                <TextField label="Education level" value={form.parent_education_level} onChange={change("parent_education_level")} fullWidth />
              </Stack>
              <TextField label="Marital status" value={form.parent_marital_status} onChange={change("parent_marital_status")} fullWidth />

              <Divider />
              <Typography fontWeight={600}>Address (optional)</Typography>
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
                  Note: backend stores the student address using the parent address fields you provide here.
                </Typography>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button onClick={submitCreate} variant="contained" disabled={!canSubmit || busyId === "create"}>
              {busyId === "create" ? "Creating..." : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit */}
        <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="md">
          <DialogTitle>Edit Student</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Name" value={form.name} onChange={change("name")} fullWidth required />
                <TextField label="Email" value={form.email} onChange={change("email")} fullWidth required />
                <TextField label="New Password (optional)" type="password" value={form.password} onChange={change("password")} fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Phone" value={form.phone} onChange={change("phone")} fullWidth />
                <TextField label="Roll number" value={form.roll_number} fullWidth disabled />
                <TextField
                  label="Date of birth"
                  type="date"
                  value={form.date_of_birth}
                  onChange={change("date_of_birth")}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Gender" value={form.gender} onChange={change("gender")} fullWidth />
                <TextField label="Blood group" value={form.blood_group} onChange={change("blood_group")} fullWidth />
                <TextField
                  label="Admission date"
                  type="date"
                  value={form.admission_date}
                  onChange={change("admission_date")}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>

              <FormControl fullWidth>
                <InputLabel id="student-class-label-edit">Class</InputLabel>
                <Select labelId="student-class-label-edit" label="Class" value={form.class_id} onChange={change("class_id")}>
                  {classes.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {classLabel(c)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider />
              <Typography fontWeight={600}>Parent (optional)</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Parent name" value={form.parent_name} onChange={change("parent_name")} fullWidth />
                <TextField label="Parent phone" value={form.parent_phone} onChange={change("parent_phone")} fullWidth />
                <TextField label="Relation" value={form.parent_relation} onChange={change("parent_relation")} fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Parent email" value={form.parent_email} onChange={change("parent_email")} fullWidth />
                <TextField label="Occupation" value={form.parent_occupation} onChange={change("parent_occupation")} fullWidth />
                <TextField label="Education level" value={form.parent_education_level} onChange={change("parent_education_level")} fullWidth />
              </Stack>
              <TextField label="Marital status" value={form.parent_marital_status} onChange={change("parent_marital_status")} fullWidth />

              <Divider />
              <Typography fontWeight={600}>Address (optional)</Typography>
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
            <Button
              onClick={() => {
                setOpenEdit(false);
                setActive(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={submitEdit} variant="contained" disabled={!canSubmit || !active?.student?.id || busyId === active?.student?.id}>
              {busyId === active?.student?.id ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}

