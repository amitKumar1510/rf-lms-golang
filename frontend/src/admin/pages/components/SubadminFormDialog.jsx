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
  TextField,
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Create Subadmin</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {err ? (
            <Alert severity="error" sx={{ mb: 2 }}>
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
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!canSubmit || saving}>
          {saving ? "Creating..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


