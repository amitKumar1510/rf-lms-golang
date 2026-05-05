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
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ToggleOffRoundedIcon from "@mui/icons-material/ToggleOffRounded";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";

import * as principleService from "../../services/principleService";

export default function PrinciplesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [actionErr, setActionErr] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [active, setActive] = useState(null);

  const emptyForm = useMemo(
    () => ({
      // user
      name: "",
      email: "",
      password: "principle",
      phone: "",
      // address
      street: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
      // profile
      qualification: "",
      experience_years: "",
      specialization: "",
      designation: "",
      office_phone: "",
      office_email: "",
    }),
    [],
  );
  const [form, setForm] = useState(emptyForm);

  const change = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const buildAddress = () => {
    const addr = {
      street: form.street?.trim() || null,
      city: form.city?.trim() || null,
      state: form.state?.trim() || null,
      country: form.country?.trim() || null,
      postal_code: form.postal_code?.trim() || null,
    };
    const any = Object.values(addr).some((v) => v && String(v).trim());
    return any ? addr : null;
  };

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await principleService.getAllPrinciples();
      setItems(data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load principles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateDialog = () => {
    setActionErr(null);
    setForm(emptyForm);
    setOpenCreate(true);
  };

  const openEditDialog = (p) => {
    setActionErr(null);
    setActive(p);
    setForm({
      name: p?.name || "",
      email: p?.email || "",
      password: "",
      phone: p?.phone || "",
      street: p?.address?.street || "",
      city: p?.address?.city || "",
      state: p?.address?.state || "",
      country: p?.address?.country || "",
      postal_code: p?.address?.postal_code || "",
      qualification: p?.qualification || "",
      experience_years: p?.experience_years ?? "",
      specialization: p?.specialization || "",
      designation: p?.designation || "",
      office_phone: p?.office_phone || "",
      office_email: p?.office_email || "",
    });
    setOpenEdit(true);
  };

  const canSubmitCreate = Boolean(form.name.trim() && form.email.trim());
  const canSubmitEdit = Boolean(form.name.trim() && form.email.trim() && active?.id);

  const submitCreate = async () => {
    setActionErr(null);
    setBusyId("create");
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password?.trim() || "principle",
        phone: form.phone?.trim() || null,
        address: buildAddress(),
        qualification: form.qualification?.trim() || null,
        experience_years: form.experience_years === "" ? null : Number(form.experience_years),
        specialization: form.specialization?.trim() || null,
        designation: form.designation?.trim() || null,
        office_phone: form.office_phone?.trim() || null,
        office_email: form.office_email?.trim() || null,
        // assigned_school_id intentionally omitted for subadmin scope (backend uses user's default school_id)
      };
      await principleService.createPrinciple(payload);
      setOpenCreate(false);
      await load();
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Failed to create principle");
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
        designation: form.designation?.trim() || null,
        office_phone: form.office_phone?.trim() || null,
        office_email: form.office_email?.trim() || null,
      };
      await principleService.updatePrinciple(active.id, payload);
      setOpenEdit(false);
      setActive(null);
      await load();
    } catch (e) {
      setActionErr(e?.response?.data?.detail || e?.message || "Failed to update principle");
    } finally {
      setBusyId(null);
    }
  };

  const onToggleActive = async (row) => {
    setActionErr(null);
    setBusyId(row.id);
    try {
      if (row.is_active) await principleService.deactivatePrinciple(row.id);
      else await principleService.activatePrinciple(row.id);
      await load();
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
      await principleService.deletePrinciple(row.id);
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
          <Typography fontWeight={600}>Principal</Typography>
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
                <TableCell>Principal</TableCell>
                <TableCell>Designation</TableCell>
                <TableCell>School</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items?.length ? (
                items.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography fontWeight={500}>{p.name}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {p.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{p.designation || "-"}</TableCell>
                    <TableCell>{p.assigned_school?.name || p.assigned_school_id || "-"}</TableCell>
                    <TableCell>
                      {p.is_active ? <Chip size="small" color="success" label="Active" /> : <Chip size="small" label="Inactive" />}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <span>
                          <IconButton size="small" onClick={() => openEditDialog(p)} disabled={busyId === p.id}>
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title={p.is_active ? "Deactivate" : "Activate"}>
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onToggleActive(p)}
                            startIcon={p.is_active ? <ToggleOffRoundedIcon /> : <ToggleOnRoundedIcon />}
                            sx={{ display: { xs: "none", sm: "inline-flex" }, mx: 1 }}
                            disabled={busyId === p.id}
                          >
                            {p.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </span>
                      </Tooltip>

                      <Tooltip title="Delete">
                        <span>
                          <Button
                            size="small"
                            color="error"
                            variant="contained"
                            onClick={() => onDelete(p)}
                            startIcon={<DeleteOutlineRoundedIcon />}
                            sx={{ display: { xs: "none", sm: "inline-flex" } }}
                            disabled={busyId === p.id}
                          >
                            Delete
                          </Button>
                        </span>
                      </Tooltip>

                      <Tooltip title={p.is_active ? "Deactivate" : "Activate"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onToggleActive(p)}
                            sx={{ display: { xs: "inline-flex", sm: "none" }, mr: 0.5 }}
                            disabled={busyId === p.id}
                          >
                            {p.is_active ? <ToggleOffRoundedIcon fontSize="small" /> : <ToggleOnRoundedIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDelete(p)}
                            sx={{ display: { xs: "inline-flex", sm: "none" } }}
                            disabled={busyId === p.id}
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
                    <Typography sx={{ opacity: 0.7 }}>No principal found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* Create dialog */}
        <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="md">
          <DialogTitle>Create Principal</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Name" value={form.name} onChange={change("name")} fullWidth required />
                <TextField label="Email" value={form.email} onChange={change("email")} fullWidth required />
                <TextField label="Password" type="password" value={form.password} onChange={change("password")} fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Phone" value={form.phone} onChange={change("phone")} fullWidth />
                <TextField label="Designation" value={form.designation} onChange={change("designation")} fullWidth />
                <TextField
                  label="Experience (years)"
                  type="number"
                  value={form.experience_years}
                  onChange={change("experience_years")}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Qualification" value={form.qualification} onChange={change("qualification")} fullWidth />
                <TextField label="Specialization" value={form.specialization} onChange={change("specialization")} fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Office phone" value={form.office_phone} onChange={change("office_phone")} fullWidth />
                <TextField label="Office email" value={form.office_email} onChange={change("office_email")} fullWidth />
              </Stack>

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
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button onClick={submitCreate} variant="contained" disabled={!canSubmitCreate || busyId === "create"}>
              {busyId === "create" ? "Creating..." : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit dialog */}
        <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="md">
          <DialogTitle>Edit Principal</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Name" value={form.name} onChange={change("name")} fullWidth required />
                <TextField label="Email" value={form.email} onChange={change("email")} fullWidth required />
                <TextField label="New Password (optional)" type="password" value={form.password} onChange={change("password")} fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Phone" value={form.phone} onChange={change("phone")} fullWidth />
                <TextField label="Designation" value={form.designation} onChange={change("designation")} fullWidth />
                <TextField
                  label="Experience (years)"
                  type="number"
                  value={form.experience_years}
                  onChange={change("experience_years")}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Qualification" value={form.qualification} onChange={change("qualification")} fullWidth />
                <TextField label="Specialization" value={form.specialization} onChange={change("specialization")} fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Office phone" value={form.office_phone} onChange={change("office_phone")} fullWidth />
                <TextField label="Office email" value={form.office_email} onChange={change("office_email")} fullWidth />
              </Stack>

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
            <Button onClick={submitEdit} variant="contained" disabled={!canSubmitEdit || busyId === active?.id}>
              {busyId === active?.id ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}

