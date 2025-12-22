import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logoutThunk } from "../../store/authSlice";
import * as adminService from "../services/adminService";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";

import SchoolsTable from "./components/SchoolsTable";
import SubadminsTable from "./components/SubadminsTable";
import SubadminFormDialog from "./components/SubadminFormDialog";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { accessToken, user, hydrateStatus } = useAppSelector((s) => s.auth);

  const [me, setMe] = useState(null);
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [subadmins, setSubadmins] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [subLoading, setSubLoading] = useState(false);
  const [subErr, setSubErr] = useState(null);
  const [openCreateSubadmin, setOpenCreateSubadmin] = useState(false);

  const [newSchool, setNewSchool] = useState({
    name: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
  });

  // Guard: cookie-based sessions may not have accessToken; rely on hydrated user.role instead.
  useEffect(() => {
    if (hydrateStatus === "loading") return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "admin") {
      navigate("/");
    }
  }, [hydrateStatus, navigate, user]);

  const refresh = async () => {
    setLoading(true);
    setErr(null);
    try {
      const [admin, allSchools] = await Promise.all([adminService.getMe(), adminService.getAllSchools()]);
      setMe(admin);
      setSchools(allSchools);
      if (!selectedSchoolId && allSchools?.length) setSelectedSchoolId(allSchools[0].id);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const loadSubadmins = async (schoolId) => {
    if (!schoolId) return;
    setSubLoading(true);
    setSubErr(null);
    try {
      const data = await adminService.getSubadminsBySchoolId(schoolId);
      setSubadmins(data);
    } catch (e) {
      setSubErr(e?.response?.data?.detail || e?.message || "Failed to load subadmins");
    } finally {
      setSubLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedSchoolId) loadSubadmins(selectedSchoolId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchoolId]);

  const onLogout = () => {
    dispatch(logoutThunk());
    navigate("/login");
  };

  const canCreate = useMemo(() => {
    return Boolean(
      newSchool.name.trim() &&
        newSchool.street.trim() &&
        newSchool.city.trim() &&
        newSchool.state.trim() &&
        newSchool.country.trim() &&
        newSchool.postal_code.trim()
    );
  }, [newSchool]);

  const onCreateSchool = async (e) => {
    e.preventDefault();
    if (!canCreate) return;
    setErr(null);
    try {
      await adminService.addSchool({
        name: newSchool.name,
        phone: newSchool.phone || null,
        email: newSchool.email || null,
        address: {
          street: newSchool.street,
          city: newSchool.city,
          state: newSchool.state,
          country: newSchool.country,
          postal_code: newSchool.postal_code,
        },
      });
      setNewSchool({
        name: "",
        phone: "",
        email: "",
        street: "",
        city: "",
        state: "",
        country: "",
        postal_code: "",
      });
      await refresh();
    } catch (e2) {
      setErr(e2?.response?.data?.detail || e2?.message || "Failed to create school");
    }
  };

  const onCreateSubadmin = async (payload) => {
    await adminService.createSubadmin(payload);
    await loadSubadmins(selectedSchoolId);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="transparent" elevation={0} sx={{ backdropFilter: "blur(10px)" }}>
        <Toolbar>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
            <SchoolRoundedIcon color="primary" />
            <Box>
              <Typography fontWeight={900}>Admin Dashboard</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Manage schools and subadmins
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button onClick={refresh} variant="outlined" startIcon={<RefreshRoundedIcon />}>
              Refresh
            </Button>
            <Button onClick={onLogout} variant="contained" color="error" startIcon={<LogoutRoundedIcon />}>
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {err ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {String(err)}
          </Alert>
        ) : null}

        <SubadminFormDialog
          open={openCreateSubadmin}
          onClose={() => setOpenCreateSubadmin(false)}
          onSubmit={onCreateSubadmin}
          schoolId={selectedSchoolId}
        />

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ bgcolor: "background.paper", border: "1px solid rgba(255,255,255,0.12)" }}>
              <CardContent>
                <Typography fontWeight={800} sx={{ mb: 1 }}>
                  Profile
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {loading ? (
                  <Typography sx={{ opacity: 0.7 }}>Loading...</Typography>
                ) : (
                  <Stack spacing={0.5}>
                    <Typography>
                      <b>{me?.name}</b>
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {me?.email}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {me?.phone || "-"}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.65, mt: 1 }}>
                      Role: {me?.role}
                    </Typography>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card elevation={0} sx={{ bgcolor: "background.paper", border: "1px solid rgba(255,255,255,0.12)" }}>
              <CardContent>
                <Typography fontWeight={800} sx={{ mb: 1 }}>
                  Create School
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box component="form" onSubmit={onCreateSchool}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="School name"
                        value={newSchool.name}
                        onChange={(e) => setNewSchool((s) => ({ ...s, name: e.target.value }))}
                        required
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Phone"
                        value={newSchool.phone}
                        onChange={(e) => setNewSchool((s) => ({ ...s, phone: e.target.value }))}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Email"
                        type="email"
                        value={newSchool.email}
                        onChange={(e) => setNewSchool((s) => ({ ...s, email: e.target.value }))}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Street"
                        value={newSchool.street}
                        onChange={(e) => setNewSchool((s) => ({ ...s, street: e.target.value }))}
                        required
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="City"
                        value={newSchool.city}
                        onChange={(e) => setNewSchool((s) => ({ ...s, city: e.target.value }))}
                        required
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="State"
                        value={newSchool.state}
                        onChange={(e) => setNewSchool((s) => ({ ...s, state: e.target.value }))}
                        required
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Country"
                        value={newSchool.country}
                        onChange={(e) => setNewSchool((s) => ({ ...s, country: e.target.value }))}
                        required
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Postal code"
                        value={newSchool.postal_code}
                        onChange={(e) => setNewSchool((s) => ({ ...s, postal_code: e.target.value }))}
                        required
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button type="submit" variant="contained" disabled={!canCreate} startIcon={<AddRoundedIcon />}>
                        Create
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            {loading ? (
              <Card elevation={0} sx={{ bgcolor: "background.paper", border: "1px solid rgba(255,255,255,0.12)" }}>
                <CardContent>
                  <Typography sx={{ opacity: 0.7 }}>Loading schools...</Typography>
                </CardContent>
              </Card>
            ) : (
              <SchoolsTable schools={schools} selectedSchoolId={selectedSchoolId} onSelect={setSelectedSchoolId} />
            )}
          </Grid>

          <Grid item xs={12} md={5}>
            <Card elevation={0} sx={{ bgcolor: "background.paper", border: "1px solid rgba(255,255,255,0.12)" }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccountTreeRoundedIcon color="primary" />
                    <Typography fontWeight={800}>Subadmins</Typography>
                  </Stack>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddRoundedIcon />}
                    disabled={!selectedSchoolId}
                    onClick={() => setOpenCreateSubadmin(true)}
                  >
                    Create
                  </Button>
                </Stack>

                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Selected school: {selectedSchoolId || "-"}
                </Typography>
                <Divider sx={{ my: 2 }} />

                {subErr ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {String(subErr)}
                  </Alert>
                ) : null}

                {subLoading ? (
                  <Typography sx={{ opacity: 0.7 }}>Loading...</Typography>
                ) : (
                  <SubadminsTable subadmins={subadmins} />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
