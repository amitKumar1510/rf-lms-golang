import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logoutThunk } from "../../store/authSlice";
import { AppBar, Avatar, Box, Button, Chip, Container, Stack, Tab, Tabs, Toolbar, Typography } from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

import * as studentService from "../services/studentService";
import * as subjectService from "../services/subjectService";
import ProfileTab from "./tabs/ProfileTab";
import SubjectsContentTab from "./tabs/SubjectsContentTab";
import AssignmentsTab from "./tabs/AssignmentsTab";
import MarksTab from "./tabs/MarksTab";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState(null); // StudentCreateResponse
  const [classSubjects, setClassSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!user) navigate("/login");
    if (user?.role !== "student") navigate("/");
  }, [user, navigate]);

  const title = useMemo(() => "Student Dashboard", []);
  // const studentId = user?.student_id;

  const load = async () => {
    // if (!studentId) return;
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      // const data = await studentService.getStudentById(studentId);
      const data = await studentService.getStudentByUserId();
      // console.log("data", data);
      setProfile(data);
      const classId = data?.student?.class_id;
      if (classId) {
        const cs = await subjectService.getAllClassSubjects(classId);
        setClassSubjects(cs || []);
      } else {
        setClassSubjects([]);
      }
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load student profile");
    } finally {
      setLoading(false);
    }
  };
  // console.log("profile", profile);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  useEffect(() => {
    const sp = new URLSearchParams(location.search || "");
    const t = sp.get("tab");
    if (t) setTab(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const onLogout = () => {
    dispatch(logoutThunk());
    navigate("/login");
  };

  const classInfo = profile?.student?.class_info || null;
  const classLabel = classInfo ? `${classInfo?.name || ""}${classInfo?.section ? ` (${classInfo.section})` : ""}`.trim() : profile?.student?.class_id;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="transparent" elevation={0} sx={{ backdropFilter: "blur(10px)", width: "100%" }}>
        <Toolbar>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
            <DashboardRoundedIcon color="primary" />
            <Box>
              <Typography fontWeight={900}>{title}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.3, flexWrap: "wrap" }}>
                <Chip size="small" label={`Role: ${user?.role || "student"}`} />
                <Chip size="small" label={`School: ${user?.school_id || "-"}`} variant="outlined" />
                {classLabel ? <Chip size="small" label={`Class: ${classLabel}`} variant="outlined" /> : null}
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center" sx={{ pr: 1 }}>
              <Avatar sx={{ width: 30, height: 30, bgcolor: "primary.main" }}>
                {(user?.name || "S").slice(0, 1).toUpperCase()}
              </Avatar>
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography fontWeight={700} variant="body2">
                  {user?.name || "Student"}
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
          <Tab label="My Details" value="profile" />
          <Tab label="Subjects & Content" value="content" />
          <Tab label="Assignments / Quizzes" value="assignments" />
          <Tab label="Marks" value="marks" />
        </Tabs>
      </AppBar>

      <Container maxWidth={false} sx={{ py: 3, px: { xs: 1.5, sm: 3, md: 4 } }}>
        {err ? <Typography sx={{ color: "error.main", mb: 2 }}>{String(err)}</Typography> : null}
        {loading ? <Typography sx={{ opacity: 0.7, mb: 2 }}>Loading...</Typography> : null}

        {tab === "profile" ? <ProfileTab profile={profile} /> : null}
        {tab === "content" ? <SubjectsContentTab classSubjects={classSubjects} /> : null}
        {tab === "assignments" ? <AssignmentsTab classSubjects={classSubjects} /> : null}
        {tab === "marks" ? <MarksTab /> : null}
      </Container>
    </Box>
  );
}


