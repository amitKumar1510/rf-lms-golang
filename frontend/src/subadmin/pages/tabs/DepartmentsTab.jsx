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

import * as departmentService from "../../services/departmentService";

export default function DepartmentsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [actionErr, setActionErr] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [active, setActive] = useState(null);

  const emptyForm = useMemo(() => ({ name: "", description: "" }), []);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await departmentService.getAllDepartments();
      setItems(data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load departments");
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
      description: row?.description || "",
    });
    setOpenEdit(true);
  };

  const change = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const canSubmit = Boolean(form.name.trim());

  const submitCreate = async () => {
    setActionErr(null);
    setBusyId("create");
    try {
      await departmentService.createDepartment({
        name: form.name.trim(),
        description: form.description?.trim() || null,
      });
      setOpenCreate(false);
      await load();
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Failed to create department");
    } finally {
      setBusyId(null);
    }
  };

  const submitEdit = async () => {
    if (!active?.id) return;
    setActionErr(null);
    setBusyId(active.id);
    try {
      await departmentService.updateDepartment(active.id, {
        name: form.name.trim(),
        description: form.description?.trim() || null,
      });
      setOpenEdit(false);
      setActive(null);
      await load();
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Failed to update department");
    } finally {
      setBusyId(null);
    }
  };

  const onToggleActive = async (row) => {
    if (!row?.id) return;
    setActionErr(null);
    setBusyId(row.id);
    try {
      if (row.is_active) await departmentService.deactivateDepartment(row.id);
      else await departmentService.activateDepartment(row.id);
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
      await departmentService.deleteDepartment(row.id);
      await load();
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, gap: 1, flexWrap: "wrap" }}>
          <Typography fontWeight={600}>Departments</Typography>
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
                <TableCell>Description</TableCell>
                <TableCell>Active</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items?.length ? (
                items.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell>
                      <Typography fontWeight={500}>{d.name}</Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 520 }}>
                      <Typography variant="body2" sx={{ opacity: 0.8 }} noWrap>
                        {d.description || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {d.is_active ? <Chip size="small" color="success" label="Active" /> : <Chip size="small" label="Inactive" />}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <span>
                          <IconButton size="small" onClick={() => openEditDialog(d)} disabled={busyId === d.id}>
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title={d.is_active ? "Deactivate" : "Activate"}>
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onToggleActive(d)}
                            startIcon={d.is_active ? <ToggleOffRoundedIcon /> : <ToggleOnRoundedIcon />}
                            sx={{ display: { xs: "none", sm: "inline-flex" }, mx: 1 }}
                            disabled={busyId === d.id}
                          >
                            {d.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </span>
                      </Tooltip>

                      <Tooltip title="Delete">
                        <span>
                          <Button
                            size="small"
                            color="error"
                            variant="contained"
                            onClick={() => onDelete(d)}
                            startIcon={<DeleteOutlineRoundedIcon />}
                            sx={{ display: { xs: "none", sm: "inline-flex" } }}
                            disabled={busyId === d.id}
                          >
                            Delete
                          </Button>
                        </span>
                      </Tooltip>

                      <Tooltip title={d.is_active ? "Deactivate" : "Activate"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onToggleActive(d)}
                            sx={{ display: { xs: "inline-flex", sm: "none" }, mr: 0.5 }}
                            disabled={busyId === d.id}
                          >
                            {d.is_active ? <ToggleOffRoundedIcon fontSize="small" /> : <ToggleOnRoundedIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDelete(d)}
                            sx={{ display: { xs: "inline-flex", sm: "none" } }}
                            disabled={busyId === d.id}
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
                  <TableCell colSpan={4}>
                    <Typography sx={{ opacity: 0.7 }}>No departments found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
          <DialogTitle>Create Department</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Name" value={form.name} onChange={change("name")} fullWidth required />
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
          <DialogTitle>Edit Department</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Name" value={form.name} onChange={change("name")} fullWidth required />
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
      </CardContent>
    </Card>
  );
}



