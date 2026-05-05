import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logoutThunk } from "../../store/authSlice";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import NotificationsBell from "../../notifications/NotificationsBell";

import * as studentService from "../services/studentService";
import * as subjectService from "../services/subjectService";
import SubjectsContentTab from "./tabs/SubjectsContentTab";
import AssignmentsTab from "./tabs/AssignmentsTab";
import AttendanceTab from "./tabs/AttendanceTab";
import MarksTab from "./tabs/MarksTab";

const drawerWidth = 272;

const roleMeta = {
  student: {
    title: "Student Dashboard",
    subtitle: "Track classes, course content, assignments, attendance, and marks from one workspace.",
    badge: "Student",
  },
};

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    helper: "Overview and shortcuts",
    icon: DashboardRoundedIcon,
  },
  {
    id: "content",
    label: "Course",
    helper: "Lessons and resources",
    icon: AutoStoriesRoundedIcon,
  },
  {
    id: "assignments",
    label: "Assignment",
    helper: "Tasks and quizzes",
    icon: AssignmentRoundedIcon,
  },
  {
    id: "attendance",
    label: "Attendance",
    helper: "Presence tracking",
    icon: AccessTimeRoundedIcon,
  },
  {
    id: "marks",
    label: "Marks",
    helper: "Results and progress",
    icon: SchoolRoundedIcon,
  },
  {
    id: "profile",
    label: "Profile",
    helper: "Personal details",
    icon: ManageAccountsRoundedIcon,
    route: "/students/profile",
  },
];

function SidebarItem({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <ListItemButton
      selected={active}
      onClick={onClick}
      className={[
        "group mb-1 rounded-2xl border px-4 py-3.5 transition-all duration-200",
        active
          ? "border-blue-200 bg-blue-50 shadow-[0_10px_30px_rgba(59,130,246,0.12)]"
          : "border-transparent hover:border-slate-200 hover:bg-slate-50",
      ].join(" ")}
    >
      <ListItemIcon
        className={[
          "min-w-9 transition-colors duration-200",
          active ? "text-blue-600" : "text-slate-500 group-hover:text-blue-500",
        ].join(" ")}
        sx={{ minWidth: 36 }}
      >
        <Icon fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={
          <Typography
            fontWeight={600}
            className={[
              "font-inherit text-[0.92rem]",
              active ? "text-blue-700" : "text-slate-800",
            ].join(" ")}
          >
            {item.label}
          </Typography>
        }
        secondary={
          <Typography variant="caption" className={active ? "text-[0.72rem] text-blue-500" : "text-[0.72rem] text-slate-500"}>
            {item.helper}
          </Typography>
        }
      />
    </ListItemButton>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const [tab, setTab] = useState("dashboard");
  const [profile, setProfile] = useState(null);
  const [classSubjects, setClassSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const studentTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: "light",
          primary: { main: "#2563eb" },
          background: {
            default: "#f5f8ff",
            paper: "#ffffff",
          },
        },
        shape: {
          borderRadius: 16,
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
            },
          },
        },
      }),
    [],
  );

  useEffect(() => {
    if (!user) navigate("/login");
    if (user?.role !== "student") navigate("/");
  }, [user, navigate]);

  const title = useMemo(() => "Student Dashboard", []);
  const roleInfo = roleMeta.student;

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await studentService.getStudentByUserId();
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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  useEffect(() => {
    const sp = new URLSearchParams(location.search || "");
    const t = sp.get("tab");
    if (t && ["dashboard", "content", "assignments", "attendance", "marks"].includes(t)) setTab(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const onLogout = () => {
    dispatch(logoutThunk());
    navigate("/login");
  };

  const student = profile?.student || null;
  const classInfo = student?.class_info || null;
  const classLabel = classInfo
    ? `${classInfo?.name || ""}${classInfo?.section ? ` (${classInfo.section})` : ""}`.trim()
    : student?.class_id;

  const schoolId = user?.school_id || "-";

  const sectionMeta = {
    dashboard: {
      title: "Dashboard",
      subtitle: "Review your student summary and quick access points.",
    },
    content: {
      title: "Course",
      subtitle: "Open your subject cards and access learning content.",
    },
    assignments: {
      title: "Assignment",
      subtitle: "Review your assignments and quiz activities.",
    },
    attendance: {
      title: "Attendance",
      subtitle: "Check your attendance history and presence records.",
    },
    marks: {
      title: "Marks",
      subtitle: "Track marks and progress across your subjects.",
    },
  };

  const sidebarContent = (
    <Box className="flex h-full min-h-0 flex-col overflow-y-auto border-r border-slate-200 bg-white">
      <Box className="border-b border-slate-100 px-5 py-5">
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Avatar
            sx={{
              width: 44,
              height: 44,
              bgcolor: "primary.main",
              color: "white",
              boxShadow: "0 12px 24px rgba(37, 99, 235, 0.24)",
            }}
          >
            <SchoolRoundedIcon />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={700} className="font-inherit text-[1rem] leading-tight text-slate-900">
              ShikshAI
            </Typography>
            <Typography variant="caption" className="text-[0.72rem] text-slate-500">
              Student Panel
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box className="flex-1 min-h-0 px-3 py-4">
        <Typography variant="overline" className="px-2 text-[0.68rem] tracking-[0.22em] text-blue-500">
          Student
        </Typography>
        <Typography variant="overline" className="mt-4 px-2 text-[0.68rem] tracking-[0.22em] text-slate-400">
          Menu
        </Typography>
        <List disablePadding className="mt-3">
          {navItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={item.id === "profile" ? location.pathname === "/students/profile" : tab === item.id}
              onClick={() => {
                if (item.id === "profile") {
                  navigate("/students/profile");
                } else {
                  setTab(item.id);
                }
                setMobileOpen(false);
              }}
            />
          ))}
        </List>
      </Box>

      <Box className="border-t border-slate-100 p-4">
        <Box className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <Typography variant="caption" className="mb-1 block text-[0.7rem] text-slate-500">
            Logged in as
          </Typography>
          <Typography fontWeight={600} className="mt-0.5 font-inherit text-[0.95rem] text-slate-900">
            {user?.name || "Student"}
          </Typography>
          <Typography variant="caption" className="text-[0.72rem] text-slate-500">
            {user?.role || "student"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={studentTheme}>
      <Box className="relative flex min-h-screen overflow-x-hidden bg-[#f5f8ff] text-slate-900 md:h-screen md:overflow-hidden">
        <Box className="pointer-events-none absolute right-[-120px] top-[-140px] h-[340px] w-[340px] rounded-full bg-blue-200/40 blur-[80px]" />
        <Box className="pointer-events-none absolute bottom-[-160px] left-[-120px] h-[360px] w-[360px] rounded-full bg-blue-100/60 blur-[80px]" />

        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
          }}
        >
          {sidebarContent}
        </Drawer>

        <Box component="nav" className="hidden md:fixed md:inset-y-0 md:left-0 md:z-[1200] md:block md:w-[272px]">
          <Box className="relative h-full overflow-hidden">{sidebarContent}</Box>
        </Box>

        <Box component="main" className="relative z-10 min-w-0 flex-1 md:ml-[272px] md:h-screen md:overflow-y-auto md:overflow-x-hidden">
          <AppBar
            position="fixed"
            color="transparent"
            elevation={0}
            className="!left-0 !top-0 !z-[1200] !w-full !rounded-none border-b border-slate-200/80 bg-white/90 backdrop-blur-xl md:!left-[272px] md:!w-[calc(100%-272px)]"
          >
            <Toolbar className="!min-h-[62px] !rounded-none gap-3 px-4 py-2.5 sm:px-5 md:!min-h-[72px] md:px-7">
              <IconButton onClick={() => setMobileOpen(true)} className="md:!hidden" color="inherit">
                <MenuRoundedIcon />
              </IconButton>

              <Box className="min-w-0 flex-1">
                <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap" }}>
                  <Typography variant="h6" fontWeight={700} className="font-inherit text-[0.95rem] leading-tight md:text-[1rem] text-slate-900">
                    {title}
                  </Typography>
                  <Chip size="small" icon={<ManageAccountsRoundedIcon />} label={roleInfo.badge} color="primary" />
                </Stack>
                <Typography variant="body2" className="mt-0.5 text-[0.76rem] text-slate-500">
                  {roleInfo.subtitle}
                </Typography>
              </Box>

              <TextField
                size="small"
                placeholder="Search..."
                className="hidden !w-[220px] md:!flex lg:!w-[280px]"
                sx={{
                  "& .MuiInputBase-root": {
                    borderRadius: 999,
                    bgcolor: "rgba(59,130,246,0.05)",
                    border: "1px solid rgba(148,163,184,0.25)",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <Tooltip title="Refresh profile">
                <IconButton onClick={load} color="primary" className="transition-transform duration-200 hover:scale-105">
                  <RefreshRoundedIcon />
                </IconButton>
              </Tooltip>

              <NotificationsBell role={user?.role} />

              <Stack direction="row" spacing={1} alignItems="center" className="pl-1">
                <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main" }}>
                  {(user?.name || "S").slice(0, 1).toUpperCase()}
                </Avatar>
                <Box className="hidden sm:block">
                  <Typography fontWeight={600} variant="body2" className="font-inherit text-[0.9rem] leading-tight text-slate-900">
                    {user?.name || "Student"}
                  </Typography>
                  <Typography variant="caption" className="text-[0.72rem] text-slate-500">
                    {schoolId || user?.role || "student"}
                  </Typography>
                </Box>
              </Stack>

              <Button
                onClick={onLogout}
                variant="contained"
                color="primary"
                startIcon={<LogoutRoundedIcon />}
                className="!rounded-lg !px-4 !py-2 !text-sm !shadow-none transition-transform duration-200 hover:scale-[1.01]"
              >
                Logout
              </Button>
            </Toolbar>
          </AppBar>

          <Box className="px-4 pb-6 pt-[82px] sm:px-5 md:px-7 md:pt-[92px]">
          <Box className="mx-auto w-full max-w-7xl">
            <Stack spacing={2.5}>
              <Box className="space-y-3">
                  <Stack direction="row" alignItems="end" justifyContent="space-between" sx={{ gap: 2, flexWrap: "wrap" }}>
                    <Box>
                      <Typography variant="h6" fontWeight={700} className="text-[1rem] leading-tight text-slate-900">
                        {sectionMeta[tab]?.title || "Student Workspace"}
                      </Typography>
                      <Typography className="text-sm leading-normal text-slate-500">
                        {sectionMeta[tab]?.subtitle || "Select a section from the sidebar."}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      icon={<CalendarMonthRoundedIcon />}
                      label={classLabel ? `Class ${classLabel}` : "No class"}
                      variant="outlined"
                      className="!rounded-lg"
                      sx={{ borderColor: "rgba(148,163,184,0.35)", bgcolor: "white" }}
                    />
                  </Stack>

                  {err ? (
                    <Box className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {String(err)}
                    </Box>
                  ) : null}
                  {loading ? <Typography className="text-sm leading-normal text-slate-500">Loading student profile...</Typography> : null}

                  <Box className="rounded-[28px] border border-slate-200 bg-white p-4 md:p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                    {tab === "dashboard" ? (
                      <Box className="space-y-4">
                        <Box className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                          <Typography variant="body2" className="text-[0.72rem] uppercase tracking-[0.18em] text-slate-500">
                            Workspace Overview
                          </Typography>
                          <Typography fontWeight={700} className="mt-2 text-[1.05rem] leading-snug text-slate-900">
                            Your student profile is now kept on a separate page.
                          </Typography>
                          <Typography variant="body2" className="mt-1 text-sm leading-6 text-slate-500">
                            Use the sidebar profile button when you need full personal details. This dashboard stays focused on your
                            learning flow and quick access points.
                          </Typography>
                        </Box>

                        <Box className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          {[
                            {
                              title: "Course",
                              note: "Open subject content and learning material.",
                            },
                            {
                              title: "Assignment",
                              note: "Review tasks and quizzes from teachers.",
                            },
                            {
                              title: "Attendance",
                              note: "Track presence records and summaries.",
                            },
                            {
                              title: "Marks",
                              note: "See progress and performance updates.",
                            },
                          ].map((item) => (
                            <Box
                              key={item.title}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)]"
                            >
                              <Typography fontWeight={700} className="text-[0.96rem] text-slate-900">
                                {item.title}
                              </Typography>
                              <Typography variant="body2" className="mt-1 text-sm leading-6 text-slate-500">
                                {item.note}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    ) : null}
                    {tab === "content" ? <SubjectsContentTab classSubjects={classSubjects} /> : null}
                    {tab === "assignments" ? <AssignmentsTab classSubjects={classSubjects} /> : null}
                    {tab === "attendance" ? <AttendanceTab student={student} classSubjects={classSubjects} /> : null}
                    {tab === "marks" ? <MarksTab /> : null}
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
