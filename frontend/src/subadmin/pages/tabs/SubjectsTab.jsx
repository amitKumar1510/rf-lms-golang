import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ToggleOffRoundedIcon from "@mui/icons-material/ToggleOffRounded";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";

import * as subjectService from "../../services/subjectService";
import * as moduleService from "../../services/moduleService";
import * as submoduleService from "../../services/submoduleService";
import * as contentService from "../../services/contentService";

export default function SubjectsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [actionErr, setActionErr] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [active, setActive] = useState(null);

  // Manage content (Modules -> Submodules -> Content) for a subject
  const [openContent, setOpenContent] = useState(false);
  const [activeSubject, setActiveSubject] = useState(null);
  const [modules, setModules] = useState([]);
  const [submodules, setSubmodules] = useState([]);
  const [contents, setContents] = useState([]);
  const [selModule, setSelModule] = useState(null);
  const [selSubmodule, setSelSubmodule] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentErr, setContentErr] = useState(null);

  const [openModuleDialog, setOpenModuleDialog] = useState(false);
  const [openSubmoduleDialog, setOpenSubmoduleDialog] = useState(false);
  const [openContentDialog, setOpenContentDialog] = useState(false);
  const [editTarget, setEditTarget] = useState({ type: null, row: null }); // module|submodule|content

  const [moduleForm, setModuleForm] = useState({ name: "", description: "", order_index: 0 });
  const [submoduleForm, setSubmoduleForm] = useState({ name: "", description: "", order_index: 0 });
  const [contentForm, setContentForm] = useState({ title: "", content_type: "pdf", content_data: "", order_index: 0, file: null });

  const emptyForm = useMemo(() => ({ name: "", code: "", description: "" }), []);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await subjectService.getAllSubjects();
      setItems(data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateDialog = () => {
    setForm(emptyForm);
    setOpenCreate(true);
  };

  const openEditDialog = (row) => {
    setActive(row);
    setForm({
      name: row?.name || "",
      code: row?.code || "",
      description: row?.description || "",
    });
    setOpenEdit(true);
  };

  const change = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const canSubmit = Boolean(form.name.trim() && form.code.trim());

  const submitCreate = async () => {
    setActionErr(null);
    setBusyId("create");
    try {
      await subjectService.createSubject({
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description?.trim() || null,
      });
      setOpenCreate(false);
      await load();
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Failed to create subject");
    } finally {
      setBusyId(null);
    }
  };

  const submitEdit = async () => {
    if (!active?.id) return;
    setActionErr(null);
    setBusyId(active.id);
    try {
      await subjectService.updateSubject(active.id, {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description?.trim() || null,
      });
      setOpenEdit(false);
      setActive(null);
      await load();
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Failed to update subject");
    } finally {
      setBusyId(null);
    }
  };

  const onToggleActive = async (row) => {
    if (!row?.id) return;
    setActionErr(null);
    setBusyId(row.id);
    try {
      if (row.is_active) await subjectService.deactivateSubject(row.id);
      else await subjectService.activateSubject(row.id);
      await load();
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (row) => {
    if (!row?.id) return;
    setActionErr(null);
    setBusyId(row.id);
    try {
      await subjectService.deleteSubject(row.id);
      await load();
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const openManageContentDialog = async (subject) => {
    setActiveSubject(subject);
    setOpenContent(true);
    setContentErr(null);
    setSelModule(null);
    setSelSubmodule(null);
    setSubmodules([]);
    setContents([]);
    setContentLoading(true);
    try {
      const data = await moduleService.getAllModules(subject.id);
      setModules(data || []);
    } catch (e) {
      setContentErr(e?.response?.data?.detail || e?.message || "Failed to load modules");
    } finally {
      setContentLoading(false);
    }
  };

  const loadSubmodules = async (moduleRow) => {
    setSelModule(moduleRow);
    setSelSubmodule(null);
    setSubmodules([]);
    setContents([]);
    if (!moduleRow?.id) return;
    setContentLoading(true);
    setContentErr(null);
    try {
      const data = await submoduleService.getAllSubmodules(moduleRow.id);
      setSubmodules(data || []);
    } catch (e) {
      setContentErr(e?.response?.data?.detail || e?.message || "Failed to load submodules");
    } finally {
      setContentLoading(false);
    }
  };

  const loadContents = async (submoduleRow) => {
    setSelSubmodule(submoduleRow);
    setContents([]);
    if (!submoduleRow?.id) return;
    setContentLoading(true);
    setContentErr(null);
    try {
      const data = await contentService.getAllContents(submoduleRow.id);
      setContents(data || []);
    } catch (e) {
      setContentErr(e?.response?.data?.detail || e?.message || "Failed to load contents");
    } finally {
      setContentLoading(false);
    }
  };

  const refreshModules = async () => {
    if (!activeSubject?.id) return;
    setContentLoading(true);
    setContentErr(null);
    try {
      const data = await moduleService.getAllModules(activeSubject.id);
      setModules(data || []);
    } catch (e) {
      setContentErr(e?.response?.data?.detail || e?.message || "Failed to load modules");
    } finally {
      setContentLoading(false);
    }
  };

  const refreshSubmodules = async () => {
    if (!selModule?.id) return;
    setContentLoading(true);
    setContentErr(null);
    try {
      const data = await submoduleService.getAllSubmodules(selModule.id);
      setSubmodules(data || []);
    } catch (e) {
      setContentErr(e?.response?.data?.detail || e?.message || "Failed to load submodules");
    } finally {
      setContentLoading(false);
    }
  };

  const refreshContents = async () => {
    if (!selSubmodule?.id) return;
    setContentLoading(true);
    setContentErr(null);
    try {
      const data = await contentService.getAllContents(selSubmodule.id);
      setContents(data || []);
    } catch (e) {
      setContentErr(e?.response?.data?.detail || e?.message || "Failed to load contents");
    } finally {
      setContentLoading(false);
    }
  };

  return (
    <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, gap: 1, flexWrap: "wrap" }}>
          <Typography fontWeight={900}>Subjects</Typography>
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
                <TableCell>Code</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Active</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items?.length ? (
                items.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Typography fontWeight={800}>{s.name}</Typography>
                    </TableCell>
                    <TableCell>{s.code}</TableCell>
                    <TableCell sx={{ maxWidth: 420 }}>
                      <Typography variant="body2" sx={{ opacity: 0.8 }} noWrap>
                        {s.description || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {s.is_active ? <Chip size="small" color="success" label="Active" /> : <Chip size="small" label="Inactive" />}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Manage content (modules, submodules, content)">
                        <span>
                          <IconButton size="small" onClick={() => openManageContentDialog(s)} disabled={busyId === s.id}>
                            <MenuBookRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <span>
                          <IconButton size="small" onClick={() => openEditDialog(s)} disabled={busyId === s.id}>
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title={s.is_active ? "Deactivate" : "Activate"}>
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onToggleActive(s)}
                            startIcon={s.is_active ? <ToggleOffRoundedIcon /> : <ToggleOnRoundedIcon />}
                            sx={{ display: { xs: "none", sm: "inline-flex" }, mx: 1 }}
                            disabled={busyId === s.id}
                          >
                            {s.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </span>
                      </Tooltip>

                      <Tooltip title="Delete">
                        <span>
                          <Button
                            size="small"
                            color="error"
                            variant="contained"
                            onClick={() => onDelete(s)}
                            startIcon={<DeleteOutlineRoundedIcon />}
                            sx={{ display: { xs: "none", sm: "inline-flex" } }}
                            disabled={busyId === s.id}
                          >
                            Delete
                          </Button>
                        </span>
                      </Tooltip>

                      <Tooltip title={s.is_active ? "Deactivate" : "Activate"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onToggleActive(s)}
                            sx={{ display: { xs: "inline-flex", sm: "none" }, mr: 0.5 }}
                            disabled={busyId === s.id}
                          >
                            {s.is_active ? <ToggleOffRoundedIcon fontSize="small" /> : <ToggleOnRoundedIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDelete(s)}
                            sx={{ display: { xs: "inline-flex", sm: "none" } }}
                            disabled={busyId === s.id}
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
                  <TableCell colSpan={5}>
                    <Typography sx={{ opacity: 0.7 }}>No subjects found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
          <DialogTitle>Create Subject</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Name" value={form.name} onChange={change("name")} fullWidth required />
              <TextField label="Code" value={form.code} onChange={change("code")} fullWidth required />
              <TextField label="Description" value={form.description} onChange={change("description")} fullWidth multiline minRows={2} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button onClick={submitCreate} variant="contained" disabled={!canSubmit || busyId === "create"}>
              {busyId === "create" ? "Creating..." : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Name" value={form.name} onChange={change("name")} fullWidth required />
              <TextField label="Code" value={form.code} onChange={change("code")} fullWidth required />
              <TextField label="Description" value={form.description} onChange={change("description")} fullWidth multiline minRows={2} />
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

        {/* Manage Content Dialog */}
        <Dialog
          open={openContent}
          onClose={() => {
            setOpenContent(false);
            setActiveSubject(null);
            setModules([]);
            setSubmodules([]);
            setContents([]);
            setSelModule(null);
            setSelSubmodule(null);
            setContentErr(null);
          }}
          fullWidth
          maxWidth="xl"
        >
          <DialogTitle>
            Manage Content —{" "}
            <Typography component="span" fontWeight={900}>
              {activeSubject?.name || "-"}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {contentErr ? <Alert severity="error" sx={{ mb: 2 }}>{String(contentErr)}</Alert> : null}
            {contentLoading ? <Typography sx={{ opacity: 0.7, mb: 1 }}>Loading...</Typography> : null}

            <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ mt: 1 }}>
              {/* Modules */}
              <Card elevation={0} variant="outlined" sx={{ flex: 1, borderColor: "rgba(255,255,255,0.12)" }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography fontWeight={900}>Modules</Typography>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="contained" onClick={() => { setEditTarget({ type: "module", row: null }); setModuleForm({ name: "", description: "", order_index: 0 }); setOpenModuleDialog(true); }}>
                        Add
                      </Button>
                      <Button size="small" variant="outlined" onClick={refreshModules}>Refresh</Button>
                    </Stack>
                  </Stack>
                  <Divider sx={{ mb: 1 }} />
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Active</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(modules || []).length ? (
                        modules.map((m) => (
                          <TableRow key={m.id} hover selected={selModule?.id === m.id} onClick={() => loadSubmodules(m)} sx={{ cursor: "pointer" }}>
                            <TableCell>
                              <Typography fontWeight={800}>{m.name}</Typography>
                            </TableCell>
                            <TableCell>{m.is_active ? <Chip size="small" color="success" label="Active" /> : <Chip size="small" label="Inactive" />}</TableCell>
                            <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                              <Tooltip title="Edit">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setEditTarget({ type: "module", row: m });
                                      setModuleForm({ name: m.name || "", description: m.description || "", order_index: m.order_index ?? 0 });
                                      setOpenModuleDialog(true);
                                    }}
                                  >
                                    <EditRoundedIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title={m.is_active ? "Deactivate" : "Activate"}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={async () => {
                                      try {
                                        if (m.is_active) await moduleService.deactivateModule(activeSubject.id, m.id);
                                        else await moduleService.activateModule(activeSubject.id, m.id);
                                        await refreshModules();
                                      } catch (e2) {
                                        setContentErr(e2?.response?.data?.detail || e2?.message || "Module action failed");
                                      }
                                    }}
                                  >
                                    {m.is_active ? <ToggleOffRoundedIcon fontSize="small" /> : <ToggleOnRoundedIcon fontSize="small" />}
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={async () => {
                                      try {
                                        await moduleService.deleteModule(activeSubject.id, m.id);
                                        if (selModule?.id === m.id) {
                                          setSelModule(null);
                                          setSelSubmodule(null);
                                          setSubmodules([]);
                                          setContents([]);
                                        }
                                        await refreshModules();
                                      } catch (e2) {
                                        setContentErr(e2?.response?.data?.detail || e2?.message || "Delete failed");
                                      }
                                    }}
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
                          <TableCell colSpan={3}>
                            <Typography sx={{ opacity: 0.7 }}>No modules yet.</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Submodules */}
              <Card elevation={0} variant="outlined" sx={{ flex: 1, borderColor: "rgba(255,255,255,0.12)" }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography fontWeight={900}>Submodules</Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={!selModule?.id}
                        onClick={() => {
                          setEditTarget({ type: "submodule", row: null });
                          setSubmoduleForm({ name: "", description: "", order_index: 0 });
                          setOpenSubmoduleDialog(true);
                        }}
                      >
                        Add
                      </Button>
                      <Button size="small" variant="outlined" disabled={!selModule?.id} onClick={refreshSubmodules}>
                        Refresh
                      </Button>
                    </Stack>
                  </Stack>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Module: {selModule?.name || "—"}
                  </Typography>
                  <Divider sx={{ mt: 1, mb: 1 }} />
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Active</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(submodules || []).length ? (
                        submodules.map((sm) => (
                          <TableRow key={sm.id} hover selected={selSubmodule?.id === sm.id} onClick={() => loadContents(sm)} sx={{ cursor: "pointer" }}>
                            <TableCell>
                              <Typography fontWeight={800}>{sm.name}</Typography>
                            </TableCell>
                            <TableCell>{sm.is_active ? <Chip size="small" color="success" label="Active" /> : <Chip size="small" label="Inactive" />}</TableCell>
                            <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                              <Tooltip title="Edit">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setEditTarget({ type: "submodule", row: sm });
                                      setSubmoduleForm({ name: sm.name || "", description: sm.description || "", order_index: sm.order_index ?? 0 });
                                      setOpenSubmoduleDialog(true);
                                    }}
                                  >
                                    <EditRoundedIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title={sm.is_active ? "Deactivate" : "Activate"}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={async () => {
                                      try {
                                        if (sm.is_active) await submoduleService.deactivateSubmodule(selModule.id, sm.id);
                                        else await submoduleService.activateSubmodule(selModule.id, sm.id);
                                        await refreshSubmodules();
                                      } catch (e2) {
                                        setContentErr(e2?.response?.data?.detail || e2?.message || "Submodule action failed");
                                      }
                                    }}
                                  >
                                    {sm.is_active ? <ToggleOffRoundedIcon fontSize="small" /> : <ToggleOnRoundedIcon fontSize="small" />}
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={async () => {
                                      try {
                                        await submoduleService.deleteSubmodule(selModule.id, sm.id);
                                        if (selSubmodule?.id === sm.id) {
                                          setSelSubmodule(null);
                                          setContents([]);
                                        }
                                        await refreshSubmodules();
                                      } catch (e2) {
                                        setContentErr(e2?.response?.data?.detail || e2?.message || "Delete failed");
                                      }
                                    }}
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
                          <TableCell colSpan={3}>
                            <Typography sx={{ opacity: 0.7 }}>{selModule?.id ? "No submodules yet." : "Select a module first."}</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Contents */}
              <Card elevation={0} variant="outlined" sx={{ flex: 1.2, borderColor: "rgba(255,255,255,0.12)" }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography fontWeight={900}>Content</Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={!selSubmodule?.id}
                        onClick={() => {
                          setEditTarget({ type: "content", row: null });
                          setContentForm({ title: "", content_type: "pdf", content_data: "", order_index: 0, file: null });
                          setOpenContentDialog(true);
                        }}
                      >
                        Add
                      </Button>
                      <Button size="small" variant="outlined" disabled={!selSubmodule?.id} onClick={refreshContents}>
                        Refresh
                      </Button>
                    </Stack>
                  </Stack>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Submodule: {selSubmodule?.name || "—"}
                  </Typography>
                  <Divider sx={{ mt: 1, mb: 1 }} />
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>File</TableCell>
                        <TableCell>Active</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(contents || []).length ? (
                        contents.map((c) => (
                          <TableRow key={c.id} hover>
                            <TableCell>
                              <Typography fontWeight={800}>{c.title}</Typography>
                            </TableCell>
                            <TableCell>{c.content_type}</TableCell>
                            <TableCell>
                              {c.file_url ? (
                                <a href={c.file_url} target="_blank" rel="noreferrer">
                                  {c.file_name || "Open"}
                                </a>
                              ) : (
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                  —
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>{c.is_active ? <Chip size="small" color="success" label="Active" /> : <Chip size="small" label="Inactive" />}</TableCell>
                            <TableCell align="right">
                              <Tooltip title="Edit">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setEditTarget({ type: "content", row: c });
                                      setContentForm({
                                        title: c.title || "",
                                        content_type: c.content_type || "pdf",
                                        content_data: c.content_data || "",
                                        order_index: c.order_index ?? 0,
                                        file: null,
                                      });
                                      setOpenContentDialog(true);
                                    }}
                                  >
                                    <EditRoundedIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title={c.is_active ? "Deactivate" : "Activate"}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={async () => {
                                      try {
                                        if (c.is_active) await contentService.deactivateContent(selSubmodule.id, c.id);
                                        else await contentService.activateContent(selSubmodule.id, c.id);
                                        await refreshContents();
                                      } catch (e2) {
                                        setContentErr(e2?.response?.data?.detail || e2?.message || "Content action failed");
                                      }
                                    }}
                                  >
                                    {c.is_active ? <ToggleOffRoundedIcon fontSize="small" /> : <ToggleOnRoundedIcon fontSize="small" />}
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={async () => {
                                      try {
                                        await contentService.deleteContent(selSubmodule.id, c.id);
                                        await refreshContents();
                                      } catch (e2) {
                                        setContentErr(e2?.response?.data?.detail || e2?.message || "Delete failed");
                                      }
                                    }}
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
                          <TableCell colSpan={5}>
                            <Typography sx={{ opacity: 0.7 }}>{selSubmodule?.id ? "No content yet." : "Select a submodule first."}</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Stack>

            {/* Module dialog */}
            <Dialog open={openModuleDialog} onClose={() => setOpenModuleDialog(false)} fullWidth maxWidth="sm">
              <DialogTitle>{editTarget.row ? "Edit Module" : "Create Module"}</DialogTitle>
              <DialogContent sx={{ pt: 1 }}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField label="Name" value={moduleForm.name} onChange={(e) => setModuleForm((s) => ({ ...s, name: e.target.value }))} fullWidth required />
                  <TextField label="Description" value={moduleForm.description} onChange={(e) => setModuleForm((s) => ({ ...s, description: e.target.value }))} fullWidth multiline minRows={2} />
                  <TextField label="Order index" type="number" value={moduleForm.order_index} onChange={(e) => setModuleForm((s) => ({ ...s, order_index: Number(e.target.value) }))} fullWidth />
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenModuleDialog(false)}>Cancel</Button>
                <Button
                  variant="contained"
                  disabled={!moduleForm.name.trim()}
                  onClick={async () => {
                    try {
                      if (!activeSubject?.id) return;
                      if (editTarget.row) {
                        await moduleService.updateModule(activeSubject.id, editTarget.row.id, {
                          name: moduleForm.name.trim(),
                          description: moduleForm.description?.trim() || null,
                          order_index: moduleForm.order_index ?? 0,
                        });
                      } else {
                        await moduleService.createModule({
                          subject_id: activeSubject.id,
                          name: moduleForm.name.trim(),
                          description: moduleForm.description?.trim() || null,
                          order_index: moduleForm.order_index ?? 0,
                        });
                      }
                      setOpenModuleDialog(false);
                      await refreshModules();
                    } catch (e2) {
                      setContentErr(e2?.response?.data?.detail || e2?.message || "Save failed");
                    }
                  }}
                >
                  Save
                </Button>
              </DialogActions>
            </Dialog>

            {/* Submodule dialog */}
            <Dialog open={openSubmoduleDialog} onClose={() => setOpenSubmoduleDialog(false)} fullWidth maxWidth="sm">
              <DialogTitle>{editTarget.row ? "Edit Submodule" : "Create Submodule"}</DialogTitle>
              <DialogContent sx={{ pt: 1 }}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField label="Name" value={submoduleForm.name} onChange={(e) => setSubmoduleForm((s) => ({ ...s, name: e.target.value }))} fullWidth required />
                  <TextField label="Description" value={submoduleForm.description} onChange={(e) => setSubmoduleForm((s) => ({ ...s, description: e.target.value }))} fullWidth multiline minRows={2} />
                  <TextField label="Order index" type="number" value={submoduleForm.order_index} onChange={(e) => setSubmoduleForm((s) => ({ ...s, order_index: Number(e.target.value) }))} fullWidth />
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenSubmoduleDialog(false)}>Cancel</Button>
                <Button
                  variant="contained"
                  disabled={!submoduleForm.name.trim() || !selModule?.id}
                  onClick={async () => {
                    try {
                      if (!selModule?.id) return;
                      if (editTarget.row) {
                        await submoduleService.updateSubmodule(selModule.id, editTarget.row.id, {
                          name: submoduleForm.name.trim(),
                          description: submoduleForm.description?.trim() || null,
                          order_index: submoduleForm.order_index ?? 0,
                        });
                      } else {
                        await submoduleService.createSubmodule({
                          module_id: selModule.id,
                          name: submoduleForm.name.trim(),
                          description: submoduleForm.description?.trim() || null,
                          order_index: submoduleForm.order_index ?? 0,
                        });
                      }
                      setOpenSubmoduleDialog(false);
                      await refreshSubmodules();
                    } catch (e2) {
                      setContentErr(e2?.response?.data?.detail || e2?.message || "Save failed");
                    }
                  }}
                >
                  Save
                </Button>
              </DialogActions>
            </Dialog>

            {/* Content dialog */}
            <Dialog open={openContentDialog} onClose={() => setOpenContentDialog(false)} fullWidth maxWidth="sm">
              <DialogTitle>{editTarget.row ? "Edit Content" : "Create Content"}</DialogTitle>
              <DialogContent sx={{ pt: 1 }}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField label="Title" value={contentForm.title} onChange={(e) => setContentForm((s) => ({ ...s, title: e.target.value }))} fullWidth required />
                  <TextField
                    label="Content type (ppt/pdf/video/text/image/other)"
                    value={contentForm.content_type}
                    onChange={(e) => setContentForm((s) => ({ ...s, content_type: e.target.value }))}
                    fullWidth
                  />
                  <TextField
                    label="Content data (for text content)"
                    value={contentForm.content_data}
                    onChange={(e) => setContentForm((s) => ({ ...s, content_data: e.target.value }))}
                    fullWidth
                    multiline
                    minRows={3}
                  />
                  <TextField
                    label="Order index"
                    type="number"
                    value={contentForm.order_index}
                    onChange={(e) => setContentForm((s) => ({ ...s, order_index: Number(e.target.value) }))}
                    fullWidth
                  />
                  <Button variant="outlined" component="label">
                    {contentForm.file ? `Selected: ${contentForm.file.name}` : "Upload file (optional)"}
                    <input
                      type="file"
                      hidden
                      onChange={(e) => setContentForm((s) => ({ ...s, file: e.target.files?.[0] || null }))}
                    />
                  </Button>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    You must provide either a file or content_data.
                  </Typography>
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenContentDialog(false)}>Cancel</Button>
                <Button
                  variant="contained"
                  disabled={!contentForm.title.trim() || !selSubmodule?.id}
                  onClick={async () => {
                    try {
                      if (!selSubmodule?.id) return;
                      if (editTarget.row) {
                        await contentService.updateContent(selSubmodule.id, editTarget.row.id, {
                          title: contentForm.title.trim(),
                          content_type: contentForm.content_type.trim(),
                          content_data: contentForm.content_data,
                          order_index: contentForm.order_index ?? 0,
                          file: contentForm.file,
                        });
                      } else {
                        await contentService.createContent(selSubmodule.id, {
                          title: contentForm.title.trim(),
                          content_type: contentForm.content_type.trim(),
                          content_data: contentForm.content_data,
                          order_index: contentForm.order_index ?? 0,
                          file: contentForm.file,
                        });
                      }
                      setOpenContentDialog(false);
                      await refreshContents();
                    } catch (e2) {
                      setContentErr(e2?.response?.data?.detail || e2?.message || "Save failed");
                    }
                  }}
                >
                  Save
                </Button>
              </DialogActions>
            </Dialog>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenContent(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}

