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
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ThemeSettingsButton from "../../theme/ThemeSettingsButton";
import NotificationsBell from "../../notifications/NotificationsBell";

import * as teacherApi from "../services/teacherService";
import AssignedClassesTab from "./tabs/AssignedClassesTab";
import StudentsTab from "./tabs/StudentsTab";
import AssignmentsTab from "./tabs/AssignmentsTab";
import ContentTab from "./tabs/ContentTab";
import AttendanceTab from "./tabs/AttendanceTab";
import ChatTab from "./tabs/ChatTab";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const [tab, setTab] = useState("assigned");
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!user) navigate("/login");
    if (user?.role !== "teacher") navigate("/");
  }, [user, navigate]);

  const title = useMemo(() => "Teacher Dashboard", []);
  const teacherId = user?.teacher_id;

  const loadTeacher = async () => {
    if (!teacherId) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await teacherApi.getTeacherById(teacherId);
      setTeacher(data);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load teacher profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeacher();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

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
              <Typography fontWeight={600}>{title}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.3, flexWrap: "wrap" }}>
                <Chip size="small" label={`Role: ${user?.role || "teacher"}`} />
                <Chip size="small" label={`School: ${user?.school_id || "-"}`} variant="outlined" />
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center" sx={{ pr: 1 }}>
              <Avatar sx={{ width: 30, height: 30, bgcolor: "primary.main" }}>
                {(user?.name || "T").slice(0, 1).toUpperCase()}
              </Avatar>
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography fontWeight={500} variant="body2">
                  {user?.name || "Teacher"}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {user?.email || ""}
                </Typography>
              </Box>
            </Stack>
            <NotificationsBell role={user?.role} />
            <ThemeSettingsButton />
            <Button onClick={onLogout} variant="contained" color="error" startIcon={<LogoutRoundedIcon />}>
              Logout
            </Button>
          </Stack>
        </Toolbar>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ width: "100%" }}>
          <Tab label="Assigned Classes" value="assigned" />
          <Tab label="Students" value="students" />
          <Tab label="Assignments" value="assignments" />
          <Tab label="Attendance" value="attendance" />
          <Tab label="Content" value="content" />
          <Tab label="Chat" value="chat" />
        </Tabs>
      </AppBar>

      <Container maxWidth={false} sx={{ py: 3, px: { xs: 1.5, sm: 3, md: 4 } }}>
        {tab === "assigned" ? <AssignedClassesTab teacher={teacher} loading={loading} error={err} /> : null}
        {tab === "students" ? <StudentsTab teacher={teacher} /> : null}
        {tab === "assignments" ? <AssignmentsTab teacher={teacher} /> : null}
        {tab === "attendance" ? <AttendanceTab teacher={teacher} /> : null}
        {tab === "content" ? <ContentTab teacher={teacher} /> : null}
        {tab === "chat" ? <ChatTab teacher={teacher} /> : null}
        {tab !== "assigned" && loading ? <Typography sx={{ opacity: 0.7, mt: 2 }}>Loading teacher profile...</Typography> : null}
      </Container>
    </Box>
  );
}




