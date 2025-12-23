import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logoutThunk } from "../../store/authSlice";
import { AppBar, Avatar, Box, Button, Chip, Container, Stack, Tab, Tabs, Toolbar, Typography } from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

import * as classService from "../services/classService";
import ClassesContentTab from "./tabs/ClassesContentTab";
import TeachersTab from "./tabs/TeachersTab";
import StudentsTab from "./tabs/StudentsTab";
import PerformanceTab from "./tabs/PerformanceTab";

export default function PrincipleDashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const [tab, setTab] = useState("classes");
  const [currentSession, setCurrentSession] = useState(null);

  useEffect(() => {
    if (!user) navigate("/login");
    if (user?.role !== "principle") navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    (async () => {
      try {
        const s = await classService.getCurrentSession();
        setCurrentSession(s || null);
      } catch {
        setCurrentSession(null);
      }
    })();
  }, []);

  const title = useMemo(() => "Principle Dashboard", []);

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
                <Chip size="small" label={`Role: ${user?.role || "principle"}`} />
                <Chip size="small" label={`School: ${user?.school_id || "-"}`} variant="outlined" />
                {currentSession?.name ? <Chip size="small" label={`Session: ${currentSession.name}`} variant="outlined" /> : null}
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center" sx={{ pr: 1 }}>
              <Avatar sx={{ width: 30, height: 30, bgcolor: "primary.main" }}>
                {(user?.name || "P").slice(0, 1).toUpperCase()}
              </Avatar>
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography fontWeight={700} variant="body2">
                  {user?.name || "Principle"}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {user?.email || ""}
                </Typography>
              </Box>
            </Stack>
            <Button onClick={onLogout} variant="contained" color="error" startIcon={<LogoutRoundedIcon />}>
              Logout
            </Button>
          </Stack>
        </Toolbar>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ width: "100%" }}>
          <Tab label="Classes & Content" value="classes" />
          <Tab label="Teachers" value="teachers" />
          <Tab label="Students" value="students" />
          <Tab label="Performance" value="performance" />
        </Tabs>
      </AppBar>

      <Container maxWidth={false} sx={{ py: 3, px: { xs: 1.5, sm: 3, md: 4 } }}>
        {tab === "classes" ? <ClassesContentTab /> : null}
        {tab === "teachers" ? <TeachersTab /> : null}
        {tab === "students" ? <StudentsTab /> : null}
        {tab === "performance" ? <PerformanceTab currentSession={currentSession} /> : null}
      </Container>
    </Box>
  );
}


