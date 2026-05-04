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
import StarRoundedIcon from "@mui/icons-material/StarRounded";

import * as classService from "../../services/classService";

export default function SessionsTab() {

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [actionErr, setActionErr] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [active, setActive] = useState(null);

  const emptyForm = useMemo(() => ({ name: "", start_date: "", end_date: "" }), []);
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
    // Keep a simple ISO-like string; Pydantic will parse it as datetime.
    return `${yyyyMmDd}T00:00:00`;
  };

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await classService.getAllSessions();
      setItems(data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load sessions");
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
      start_date: toDateInput(row?.start_date),
      end_date: toDateInput(row?.end_date),
    });
    setOpenEdit(true);
  };

  const change = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submitCreate = async () => {
    setActionErr(null);
    setBusyId("create");
    try {
      await classService.createSession({
        name: form.name.trim(),
        start_date: toBackendDatetime(form.start_date),
        end_date: toBackendDatetime(form.end_date),
      });
      setOpenCreate(false);
      await load();
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Failed to create session");
    } finally {
      setBusyId(null);
    }
  };

  const submitEdit = async () => {
    if (!active?.id) return;
    setActionErr(null);
    setBusyId(active.id);
    try {
      await classService.updateSession(active.id, {
        name: form.name.trim(),
        start_date: toBackendDatetime(form.start_date),
        end_date: toBackendDatetime(form.end_date),
      });
      setOpenEdit(false);
      setActive(null);
      await load();
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Failed to update session");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (row) => {
    if (!row?.id) return;
    setActionErr(null);
    setBusyId(row.id);
    try {
      await classService.deleteSession(row.id);
      await load();
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Failed to delete session");
    } finally {
      setBusyId(null);
    }
  };

  const onSetCurrent = async (row) => {
    if (!row?.id) return;
    setActionErr(null);
    setBusyId(row.id);
    try {
      await classService.setCurrentSession(row.id);
      await load();
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Failed to set current session");
    } finally {
      setBusyId(null);
    }
  };

  const canSubmit = Boolean(form.name.trim());

  return (
    <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, gap: 1, flexWrap: "wrap" }}>
          <Typography fontWeight={600}>Academic Sessions</Typography>
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
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell>Current</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items?.length ? (
                items.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Typography fontWeight={500}>{s.name}</Typography>
                    </TableCell>
                    <TableCell>{s.start_date ? new Date(s.start_date).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>{s.end_date ? new Date(s.end_date).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>
                      {s.is_current ? <Chip size="small" color="success" label="Current" /> : <Chip size="small" variant="outlined" label="—" />}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <span>
                          <IconButton size="small" onClick={() => openEditDialog(s)} disabled={busyId === s.id}>
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Set current">
                        <span>
                          <IconButton size="small" onClick={() => onSetCurrent(s)} disabled={busyId === s.id || s.is_current}>
                            <StarRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <span>
                          <IconButton size="small" color="error" onClick={() => onDelete(s)} disabled={busyId === s.id}>
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
                    <Typography sx={{ opacity: 0.7 }}>No sessions found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* Create dialog */}
        <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
          <DialogTitle>Create Session</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Session name" value={form.name} onChange={change("name")} fullWidth required />
              <TextField
                label="Start date"
                type="date"
                value={form.start_date}
                onChange={change("start_date")}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="End date"
                type="date"
                value={form.end_date}
                onChange={change("end_date")}
                InputLabelProps={{ shrink: true }}
                fullWidth
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
          <DialogTitle>Edit Session</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Session name" value={form.name} onChange={change("name")} fullWidth required />
              <TextField
                label="Start date"
                type="date"
                value={form.start_date}
                onChange={change("start_date")}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="End date"
                type="date"
                value={form.end_date}
                onChange={change("end_date")}
                InputLabelProps={{ shrink: true }}
                fullWidth
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
      </CardContent>
    </Card>
  );
}


