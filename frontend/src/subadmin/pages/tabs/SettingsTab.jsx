import { useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Divider, Grid, Stack, TextField, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";

import * as subadminService from "../../services/subadminService";

export default function SettingsTab({ me, onUpdated, onBack }) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdErr, setPwdErr] = useState(null);
  const [pwdOk, setPwdOk] = useState(null);

  const [form, setForm] = useState({
    name: me?.name || "",
    email: me?.email || "",
    phone: me?.phone || "",
    street: me?.address?.street || "",
    city: me?.address?.city || "",
    state: me?.address?.state || "",
    country: me?.address?.country || "",
    postal_code: me?.address?.postal_code || "",
  });

  const [pwd, setPwd] = useState({ new_password: "", confirm: "" });

  const canSave = useMemo(() => Boolean(me?.user_id && me?.school_id && form.name.trim() && form.email.trim()), [me, form]);
  const canChangePwd = useMemo(
    () => Boolean(pwd.new_password.trim() && pwd.new_password.trim().length >= 4 && pwd.new_password === pwd.confirm),
    [pwd],
  );

  const change = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));
  const changePwd = (k) => (e) => setPwd((s) => ({ ...s, [k]: e.target.value }));

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        role: "subadmin",
        school_id: me.school_id,
        phone: form.phone || null,
        address: {
          street: form.street || null,
          city: form.city || null,
          state: form.state || null,
          country: form.country || null,
          postal_code: form.postal_code || null,
        },
      };
      const updated = await subadminService.updateSubadmin(me.user_id, payload);
      onUpdated?.(updated);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async () => {
    if (!canChangePwd) return;
    setPwdSaving(true);
    setPwdErr(null);
    setPwdOk(null);
    try {
      await subadminService.updatePassword(pwd.new_password);
      setPwdOk("Password updated successfully");
      setPwd({ new_password: "", confirm: "" });
    } catch (e) {
      setPwdErr(e?.response?.data?.detail || e?.message || "Failed to update password");
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography fontWeight={900}>Settings</Typography>
          <Button startIcon={<ArrowBackRoundedIcon />} onClick={onBack} variant="outlined">
            Back
          </Button>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        {err ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {String(err)}
          </Alert>
        ) : null}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField label="Name" value={form.name} onChange={change("name")} fullWidth />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Email" value={form.email} onChange={change("email")} fullWidth />
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

        <Box sx={{ mt: 2 }}>
          <Button variant="contained" startIcon={<SaveRoundedIcon />} disabled={!canSave || saving} onClick={onSave}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <LockRoundedIcon color="primary" />
          <Typography fontWeight={900}>Change Password</Typography>
        </Stack>
        {pwdErr ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {String(pwdErr)}
          </Alert>
        ) : null}
        {pwdOk ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            {String(pwdOk)}
          </Alert>
        ) : null}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="New Password"
              type="password"
              value={pwd.new_password}
              onChange={changePwd("new_password")}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Confirm New Password"
              type="password"
              value={pwd.confirm}
              onChange={changePwd("confirm")}
              fullWidth
              error={Boolean(pwd.confirm) && pwd.confirm !== pwd.new_password}
              helperText={Boolean(pwd.confirm) && pwd.confirm !== pwd.new_password ? "Passwords do not match" : " "}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 1 }}>
          <Button
            variant="contained"
            startIcon={<LockRoundedIcon />}
            disabled={!canChangePwd || pwdSaving}
            onClick={onChangePassword}
          >
            {pwdSaving ? "Updating..." : "Update Password"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}


