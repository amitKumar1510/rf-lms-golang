import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logoutThunk } from "../../store/authSlice";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Drawer,
  Divider,
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
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ClassRoundedIcon from "@mui/icons-material/ClassRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import ThemeSettingsButton from "../../theme/ThemeSettingsButton";
import NotificationsBell from "../../notifications/NotificationsBell";

import * as teacherApi from "../services/teacherService";
import AssignedClassesTab from "./tabs/AssignedClassesTab";
import StudentsTab from "./tabs/StudentsTab";
import AssignmentsTab from "./tabs/AssignmentsTab";
import ContentTab from "./tabs/ContentTab";
import AttendanceTab from "./tabs/AttendanceTab";
import ChatTab from "./tabs/ChatTab";

const drawerWidth = 272;

const roleMeta = {
  teacher: {
    title: "Teacher Dashboard",
    subtitle: "Track assigned classes, students, lessons, attendance, and class communication.",
    badge: "Teacher",
  },
};

const navItems = [
  {
    id: "assigned",
    label: "Dashboard",
    helper: "Assigned classes",
    icon: DashboardRoundedIcon,
  },
  {
    id: "students",
    label: "Students",
    helper: "Learner overview",
    icon: PeopleRoundedIcon,
  },
  {
    id: "assignments",
    label: "Assignments",
    helper: "Work and tasks",
    icon: AssignmentRoundedIcon,
  },
  {
    id: "attendance",
    label: "Attendance",
    helper: "Daily tracking",
    icon: AccessTimeRoundedIcon,
  },
  {
    id: "content",
    label: "Content",
    helper: "Lessons and resources",
    icon: AutoStoriesRoundedIcon,
  },
  {
    id: "chat",
    label: "Chat",
    helper: "Teacher messages",
    icon: ChatRoundedIcon,
  },
];

function SidebarItem({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <ListItemButton
      selected={active}
      onClick={onClick}
      className={[
        "group mb-1 rounded-xl border px-4 py-3 transition-all duration-200",
        active
          ? "border-sky-500/20 bg-sky-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          : "border-transparent hover:border-white/10 hover:bg-white/5",
      ].join(" ")}
    >
      <ListItemIcon
        className="min-w-9 text-slate-400 transition-colors duration-200 group-hover:text-slate-100"
        sx={{ minWidth: 36 }}
      >
        <Icon fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={
          <Typography fontWeight={500} className="font-inherit text-[0.9rem] text-slate-100">
            {item.label}
          </Typography>
        }
        secondary={
          <Typography variant="caption" className="text-[0.72rem] text-slate-400">
            {item.helper}
          </Typography>
        }
      />
    </ListItemButton>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <Card
      elevation={0}
      variant="outlined"
      className="h-full overflow-hidden border border-white/10 bg-white/[0.04] shadow-[0_18px_50px_rgba(2,6,23,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-white/[0.06]"
      sx={{ borderRadius: "8px" }}
    >
      <CardContent className="p-5 md:p-6">
        <Typography variant="body2" className="text-[0.72rem] uppercase tracking-[0.18em] text-slate-400">
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={600} className="mt-2 text-[1.5rem] leading-tight text-slate-50">
          {value}
        </Typography>
        <Typography variant="body2" className="mt-2 text-sm leading-normal text-slate-400">
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

function InfoChip({ label, value }) {
  return (
    <Box className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.03] px-4 py-3">
      <Typography variant="caption" className="block text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">
        {label}
      </Typography>
      <Typography className="mt-1 truncate text-sm font-medium text-slate-100">{value || "-"}</Typography>
    </Box>
  );
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const [tab, setTab] = useState("assigned");
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login");
    if (user?.role !== "teacher") navigate("/");
  }, [user, navigate]);

  const title = useMemo(() => "Teacher Dashboard", []);
  const teacherId = user?.teacher_id;
  const roleInfo = roleMeta.teacher;
  const schoolId = teacher?.school_id || user?.school_id || "";

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

  const activeSection = tab;

  const sectionMeta = {
    assigned: {
      title: "Dashboard",
      subtitle: "A quick snapshot of your assigned classes and current teaching load.",
    },
    students: {
      title: "Students",
      subtitle: "Review the students connected to your assigned classes.",
    },
    assignments: {
      title: "Assignments",
      subtitle: "Create, review, and manage class assignments in one place.",
    },
    attendance: {
      title: "Attendance",
      subtitle: "Track attendance for your classes with the same backend data.",
    },
    content: {
      title: "Content",
      subtitle: "Manage lesson materials and subject resources from here.",
    },
    chat: {
      title: "Chat",
      subtitle: "Continue teacher conversations and class communication.",
    },
  };

  const sidebarContent = (
    <Box className="flex h-full flex-col border-r border-white/10 bg-[#070c18]/95 backdrop-blur-xl">
      <Box className="border-b border-white/10 px-5 py-5">
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: "primary.main",
              boxShadow: "0 14px 30px rgba(37, 99, 235, 0.32)",
            }}
          >
            <SchoolRoundedIcon />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={600} className="font-inherit text-[1rem] leading-tight text-slate-100">
              RF LMS
            </Typography>
            <Typography variant="caption" className="text-[0.72rem] text-slate-400">
              Teacher workspace
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box className="flex-1 px-4 py-4">
        <Typography variant="overline" className="px-1.5 text-[0.68rem] tracking-[0.18em] text-slate-500">
          Menu
        </Typography>
        <List disablePadding className="mt-3">
          {navItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={activeSection === item.id}
              onClick={() => {
                setTab(item.id);
                setMobileOpen(false);
              }}
            />
          ))}
        </List>
      </Box>

      <Box className="border-t border-white/10 p-4">
        <Box className="rounded-[8px] border border-white/10 bg-white/5 p-4">
          <Typography variant="caption" className="mb-1 block text-[0.7rem] text-slate-400">
            Logged in as
          </Typography>
          <Typography fontWeight={500} className="mt-0.5 font-inherit text-[0.95rem] text-slate-100">
            {teacher?.name || user?.name || "Teacher"}
          </Typography>
          <Typography variant="caption" className="text-[0.72rem] text-slate-400">
            {user?.role || "teacher"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  const currentStats = [
    { label: "Assigned Classes", value: teacher?.class_assignments?.length ?? 0, helper: "Loaded from profile" },
    { label: "Subjects", value: teacher?.subjects?.length ?? 0, helper: "Linked subjects" },
    { label: "Departments", value: teacher?.departments?.length ?? 0, helper: "Current assignments" },
    { label: "School ID", value: schoolId || "-", helper: "Workspace access" },
  ];

  return (
    <Box className="relative flex min-h-screen overflow-x-hidden bg-[#060b16] text-slate-100">
      <Box className="pointer-events-none absolute right-[-120px] top-[-180px] h-[360px] w-[360px] rounded-full bg-sky-500/10 blur-[60px]" />
      <Box className="pointer-events-none absolute bottom-[-220px] left-[-140px] h-[420px] w-[420px] rounded-full bg-indigo-500/10 blur-[70px]" />

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
        <Box className="relative h-screen">{sidebarContent}</Box>
      </Box>

      <Box component="main" className="relative z-10 min-w-0 flex-1 md:ml-[272px]">
        <AppBar
          position="fixed"
          color="transparent"
          elevation={0}
          className="!left-0 !top-0 !z-[1200] !w-full !rounded-none border-b border-white/10 bg-[#07101f]/80 backdrop-blur-xl md:!left-[272px] md:!w-[calc(100%-272px)]"
        >
          <Toolbar className="!min-h-[74px] !rounded-none gap-4 px-4 py-3 sm:px-5 md:!min-h-[84px] md:px-7">
            <IconButton onClick={() => setMobileOpen(true)} className="md:!hidden" color="inherit">
              <MenuRoundedIcon />
            </IconButton>

            <Box className="min-w-0 flex-1">
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Typography variant="h6" fontWeight={600} className="font-inherit text-[1.02rem] leading-tight md:text-[1.08rem]">
                  {title}
                </Typography>
                <Chip size="small" icon={<ManageAccountsRoundedIcon />} label={roleInfo.badge} color="primary" />
              </Stack>
              <Typography variant="body2" className="mt-1 text-[0.82rem] text-slate-400">
                {roleInfo.subtitle}
              </Typography>
            </Box>

            <TextField
              size="small"
              placeholder="Search or type command..."
              className="hidden !w-[250px] md:!flex lg:!w-[320px]"
              sx={{
                "& .MuiInputBase-root": {
                  borderRadius: 999,
                  bgcolor: "rgba(255,255,255,0.04)",
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

            <Tooltip title="Refresh">
              <IconButton
                onClick={loadTeacher}
                color="inherit"
                className="transition-transform duration-200 hover:scale-105"
              >
                <RefreshRoundedIcon />
              </IconButton>
            </Tooltip>

            <NotificationsBell role={user?.role} />
            <ThemeSettingsButton />

            <Stack direction="row" spacing={1} alignItems="center" className="pl-1">
              <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main" }}>
                {(teacher?.name || user?.name || "T").slice(0, 1).toUpperCase()}
              </Avatar>
              <Box className="hidden sm:block">
                <Typography fontWeight={500} variant="body2" className="font-inherit text-[0.9rem] leading-tight">
                  {teacher?.name || user?.name || "Teacher"}
                </Typography>
                <Typography variant="caption" className="text-[0.72rem] text-slate-400">
                  {schoolId || user?.role || "teacher"}
                </Typography>
              </Box>
            </Stack>

            <Button
              onClick={onLogout}
              variant="contained"
              color="error"
              startIcon={<LogoutRoundedIcon />}
              className="!rounded-lg !px-4 !py-2 !text-sm !shadow-none transition-transform duration-200 hover:scale-[1.01]"
            >
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        <Box className="px-4 pb-6 pt-[92px] sm:px-5 md:px-7 md:pt-[102px]">
          <Box className="mx-auto w-full max-w-7xl">
            <Stack spacing={2.5}>
              {tab === "assigned" ? (
                <Card
                  elevation={0}
                  variant="outlined"
                  className="overflow-hidden border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_24px_70px_rgba(2,6,23,0.24)]"
                  sx={{ borderRadius: "8px" }}
                >
                  <CardContent className="relative p-5 md:p-6 lg:p-7">
                    <Box className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.1),transparent_28%)]" />
                    <Stack spacing={2.25} className="relative z-10">
                      <Stack direction="row" spacing={1} className="flex-wrap">
                        <Box className="rounded-[8px] border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[0.72rem] font-medium text-emerald-300">
                          Teacher Workspace
                        </Box>
                        <Box className="rounded-[8px] border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.72rem] font-medium text-slate-300">
                          School ID: {schoolId || "-"}
                        </Box>
                      </Stack>

                      <Box className="grid gap-5 lg:grid-cols-[1.6fr_0.9fr]">
                        <Box className="space-y-6">
                          <Box>
                            <Typography
                              variant="h4"
                              fontWeight={600}
                              className="text-[1.9rem] leading-tight text-slate-50 md:text-[2.2rem]"
                            >
                              Welcome back, {teacher?.name || user?.name || "Teacher"}
                            </Typography>
                            <Typography variant="body1" className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                              This workspace keeps your classes, learners, assignments, attendance, and content in one
                              place without changing the existing teacher flows.
                            </Typography>
                          </Box>

                          <Box className="grid gap-[10px] sm:grid-cols-2 xl:grid-cols-4">
                            {currentStats.map((item) => (
                              <StatCard
                                key={item.label}
                                label={item.label}
                                value={item.value}
                                helper={item.helper}
                              />
                            ))}
                          </Box>
                        </Box>

                        <Card
                          elevation={0}
                          variant="outlined"
                          className="h-full border border-white/10 bg-white/[0.04] shadow-[0_18px_50px_rgba(2,6,23,0.18)]"
                          sx={{ borderRadius: "8px" }}
                        >
                          <CardContent className="flex h-full flex-col p-5 md:p-6">
                            <Typography
                              variant="body2"
                              className="text-[0.72rem] uppercase tracking-[0.18em] text-slate-400"
                            >
                              Teacher Profile
                            </Typography>
                            <Typography fontWeight={600} className="mt-3 text-[1.05rem] leading-snug text-slate-50">
                              {teacher?.name || user?.name || "-"}
                            </Typography>
                            <Typography variant="body2" className="mt-1 text-sm leading-normal text-slate-400">
                              {teacher?.email || user?.email || "-"}
                            </Typography>

                            <Divider className="my-4 border-white/10" />

                            <Stack spacing={1.25}>
                              <Box className="rounded-[8px] border border-white/10 bg-slate-950/40 px-4 py-3">
                                <Typography
                                  variant="caption"
                                  className="block text-[0.68rem] uppercase tracking-[0.18em] text-slate-500"
                                >
                                  Phone
                                </Typography>
                                <Typography className="mt-1 text-sm font-medium text-slate-100">
                                  {teacher?.phone || user?.phone || "-"}
                                </Typography>
                              </Box>
                              <Box className="rounded-[8px] border border-white/10 bg-slate-950/40 px-4 py-3">
                                <Typography
                                  variant="caption"
                                  className="block text-[0.68rem] uppercase tracking-[0.18em] text-slate-500"
                                >
                                  Status
                                </Typography>
                                <Typography className="mt-1 text-sm font-medium text-emerald-300">
                                  Active workspace
                                </Typography>
                              </Box>
                            </Stack>

                            <Typography variant="caption" className="mt-4 block text-[0.72rem] leading-relaxed text-slate-500">
                              Teacher profile data is loaded from the same backend endpoint as before.
                            </Typography>
                          </CardContent>
                        </Card>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}

              {err ? (
                <Box className="rounded-[8px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {String(err)}
                </Box>
              ) : null}
              {loading ? <Typography className="text-sm leading-normal text-slate-400">Loading teacher profile...</Typography> : null}

              <Box className="space-y-3">
                <Typography variant="h6" fontWeight={600} className="text-[1rem] leading-tight text-slate-100">
                  {sectionMeta[tab]?.title || "Teacher Workspace"}
                </Typography>
                <Typography className="text-sm leading-normal text-slate-400">
                  {sectionMeta[tab]?.subtitle || "Select a section from the sidebar."}
                </Typography>

                <Box className="rounded-[8px] border border-white/10 bg-white/[0.03] p-4 md:p-5">
                  {tab === "assigned" ? <AssignedClassesTab teacher={teacher} loading={loading} error={err} /> : null}
                  {tab === "students" ? <StudentsTab teacher={teacher} /> : null}
                  {tab === "assignments" ? <AssignmentsTab teacher={teacher} /> : null}
                  {tab === "attendance" ? <AttendanceTab teacher={teacher} /> : null}
                  {tab === "content" ? <ContentTab teacher={teacher} /> : null}
                  {tab === "chat" ? <ChatTab teacher={teacher} /> : null}
                  {tab !== "assigned" && loading ? (
                    <Typography className="mt-2 text-sm leading-normal text-slate-400">
                      Loading teacher profile...
                    </Typography>
                  ) : null}
                </Box>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
