import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function SubadminFormDialog({ open, onClose, onSubmit, schoolId }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "subadmin",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
  });
  const [err, setErr] = useState(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => form.name.trim() && form.email.trim() && schoolId, [form.name, form.email, schoolId]);

  const change = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const handleSubmit = async () => {
    setErr(null);
    setSaving(true);
    try {
      await onSubmit({
        name: form.name,
        email: form.email,
        password: form.password || "subadmin",
        phone: form.phone || null,
        role: "subadmin",
        school_id: schoolId,
        address: {
          street: form.street || null,
          city: form.city || null,
          state: form.state || null,
          country: form.country || null,
          postal_code: form.postal_code || null,
        },
      });
      setForm({
        name: "",
        email: "",
        password: "subadmin",
        phone: "",
        street: "",
        city: "",
        state: "",
        country: "",
        postal_code: "",
      });
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to create subadmin");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          bgcolor: "rgba(9, 16, 32, 0.96)",
          border: "1px solid rgba(148, 163, 184, 0.18)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 30px 80px rgba(2, 6, 23, 0.55)",
          borderRadius: 4,
        },
      }}
    >
      <DialogTitle className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(14,165,233,0.04))] pb-4">
        <Stack spacing={0.4}>
          <Typography fontWeight={900} className="font-['Montserrat'] text-[1rem] text-slate-100">
            Create Subadmin
          </Typography>
          <Typography variant="caption" className="text-[0.72rem] text-slate-400">
            Add a new user under the selected school
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent className="pt-6">
        <Box className="pt-1">
          {err ? (
            <Alert severity="error" className="mb-4 rounded-2xl border border-red-400/20 bg-red-950/40">
              {String(err)}
            </Alert>
          ) : null}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField label="Name" value={form.name} onChange={change("name")} fullWidth required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Email" value={form.email} onChange={change("email")} fullWidth required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Password" value={form.password} onChange={change("password")} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Phone" value={form.phone} onChange={change("phone")} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Street" value={form.street} onChange={change("street")} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="City" value={form.city} onChange={change("city")} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="State" value={form.state} onChange={change("state")} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Country" value={form.country} onChange={change("country")} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Postal code" value={form.postal_code} onChange={change("postal_code")} fullWidth />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: "1px solid rgba(148, 163, 184, 0.12)" }}>
        <Button onClick={onClose} color="inherit" className="!rounded-xl !px-4 !py-2 !text-sm">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!canSubmit || saving} className="!rounded-xl !px-4 !py-2 !text-sm !shadow-none">
          {saving ? "Creating..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


