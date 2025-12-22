import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logoutThunk } from "../../store/authSlice";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

import OverviewTab from "./tabs/OverviewTab";
import SubadminsTab from "./tabs/SubadminsTab";
import ClassesTab from "./tabs/ClassesTab";
import SessionsTab from "./tabs/SessionsTab";
import SubjectsTab from "./tabs/SubjectsTab";
import DepartmentsTab from "./tabs/DepartmentsTab";
import TeachersTab from "./tabs/TeachersTab";
import StudentsTab from "./tabs/StudentsTab";
import PrinciplesTab from "./tabs/PrinciplesTab";
import SettingsTab from "./tabs/SettingsTab";

export default function SubadminDashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const [tab, setTab] = useState("overview");
  const [me, setMe] = useState(user);

  useEffect(() => {
    if (!user) navigate("/login");
    if (user?.role !== "subadmin") navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    setMe(user);
  }, [user]);

  const schoolId = me?.school_id;

  const title = useMemo(() => "Subadmin Dashboard", []);

  const onLogout = () => {
    dispatch(logoutThunk());
    navigate("/login");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="transparent" elevation={0} sx={{ backdropFilter: "blur(10px)", width: "100%" }}>
        <Toolbar>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
            <DashboardRoundedIcon color="primary" />
            <Box>
              <Typography fontWeight={900}>{title}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.3, flexWrap: "wrap" }}>
                <Chip size="small" label={`Role: ${me?.role || "subadmin"}`} />
                <Chip size="small" label={`School: ${schoolId || "-"}`} variant="outlined" />
              </Stack>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center" sx={{ pr: 1 }}>
              <Avatar sx={{ width: 30, height: 30, bgcolor: "primary.main" }}>
                {(me?.name || "S").slice(0, 1).toUpperCase()}
              </Avatar>
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography fontWeight={700} variant="body2">
                  {me?.name || "Subadmin"}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {me?.email || ""}
                </Typography>
              </Box>
            </Stack>
            <IconButton color="inherit" onClick={() => setTab("settings")} title="Settings">
              <SettingsRoundedIcon />
            </IconButton>
            <Button onClick={onLogout} variant="contained" color="error" startIcon={<LogoutRoundedIcon />}>
              Logout
            </Button>
          </Stack>
        </Toolbar>
        <Tabs
          value={tab === "settings" ? false : tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ width: "100%", px: { xs: 0, sm: 0 } }}
        >
          <Tab label="Overview" value="overview" />
          <Tab label="Subadmins" value="subadmins" />
          <Tab label="Session" value="session" />
          <Tab label="Classes" value="classes" />
          
          <Tab label="Subjects" value="subjects" />
          <Tab label="Departments" value="departments" />
          <Tab label="Teachers" value="teachers" />
          <Tab label="Students" value="students" />
          <Tab label="Principles" value="principles" />
        </Tabs>
      </AppBar>

      <Container maxWidth={false} sx={{ py: 3, px: { xs: 1.5, sm: 3, md: 4 } }}>
        {tab === "overview" ? <OverviewTab me={me} /> : null}
        {tab === "subadmins" ? <SubadminsTab schoolId={schoolId} /> : null}
        {tab === "classes" ? <ClassesTab /> : null}
        {tab === "session" ? <SessionsTab /> : null}
        {tab === "subjects" ? <SubjectsTab /> : null}
        {tab === "departments" ? <DepartmentsTab /> : null}
        {tab === "teachers" ? <TeachersTab /> : null}
        {tab === "students" ? <StudentsTab /> : null}
        {tab === "principles" ? <PrinciplesTab /> : null}
        {tab === "settings" ? (
          <SettingsTab me={me} onBack={() => setTab("overview")} onUpdated={() => window.location.reload()} />
        ) : null}
      </Container>
    </Box>
  );
}


