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
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ClassRoundedIcon from "@mui/icons-material/ClassRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import ThemeSettingsButton from "../../theme/ThemeSettingsButton";
import NotificationsBell from "../../notifications/NotificationsBell";

import * as classService from "../services/classService";
import ClassesContentTab from "./tabs/ClassesContentTab";
import TeachersTab from "./tabs/TeachersTab";
import StudentsTab from "./tabs/StudentsTab";
import PerformanceTab from "./tabs/PerformanceTab";

const drawerWidth = 272;

const roleMeta = {
  principle: {
    title: "Principal Dashboard",
    subtitle: "Manage classes, teachers, students, and performance from one polished workspace.",
    badge: "Principal",
  },
};

const navItems = [
  {
    id: "classes",
    label: "Classes & Content",
    helper: "Class setup and resources",
    icon: ClassRoundedIcon,
  },
  {
    id: "teachers",
    label: "Teachers",
    helper: "Staff overview",
    icon: PersonRoundedIcon,
  },
  {
    id: "students",
    label: "Students",
    helper: "Learner records",
    icon: PeopleRoundedIcon,
  },
  {
    id: "performance",
    label: "Performance",
    helper: "Assignments and results",
    icon: AssignmentRoundedIcon,
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
      <CardContent className="flex h-full items-start gap-4 p-5 md:p-6">
        <Box className="mt-1 rounded-[8px] border border-white/10 bg-white/[0.04] p-2 text-slate-300">
          <AutoGraphRoundedIcon fontSize="small" />
        </Box>
        <Box className="min-w-0">
          <Typography variant="body2" className="text-[0.72rem] uppercase tracking-[0.18em] text-slate-400">
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={600} className="mt-2 text-[1.5rem] leading-tight text-slate-50">
            {value}
          </Typography>
          <Typography variant="body2" className="mt-2 text-sm leading-normal text-slate-400">
            {helper}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function PrincipleDashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const [tab, setTab] = useState("classes");
  const [currentSession, setCurrentSession] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login");
    if (user?.role !== "principle") navigate("/");
  }, [user, navigate]);

  const loadCurrentSession = async () => {
    try {
      const s = await classService.getCurrentSession();
      setCurrentSession(s || null);
    } catch {
      setCurrentSession(null);
    }
  };

  useEffect(() => {
    loadCurrentSession();
  }, []);

  const title = useMemo(() => "Principal Dashboard", []);
  const roleInfo = roleMeta.principle;
  const activeSection = tab;

  const onLogout = () => {
    dispatch(logoutThunk());
    navigate("/login");
  };

  const sectionMeta = {
    classes: {
      title: "Classes & Content",
      subtitle: "Shape the class structure and keep learning resources in one place.",
    },
    teachers: {
      title: "Teachers",
      subtitle: "Review staff assignments and manage teaching coverage.",
    },
    students: {
      title: "Students",
      subtitle: "Monitor student records connected to the school workspace.",
    },
    performance: {
      title: "Performance",
      subtitle: "Track assignment performance and class-level progress.",
    },
  };

  const currentStats = [
    { label: "Role", value: user?.role || "principle", helper: "Signed-in workspace" },
    { label: "School ID", value: user?.school_id || "-", helper: "Current campus" },
    { label: "Session", value: currentSession?.name || "-", helper: "Academic session" },
    { label: "Active View", value: sectionMeta[tab]?.title || "Dashboard", helper: "Current section" },
  ];

  const quickActions = [
    { id: "classes", label: "Go to Classes", icon: ClassRoundedIcon },
    { id: "teachers", label: "Open Teachers", icon: PersonRoundedIcon },
    { id: "students", label: "View Students", icon: PeopleRoundedIcon },
    { id: "performance", label: "Check Performance", icon: AssignmentRoundedIcon },
  ];

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
              Principal workspace
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
            {user?.name || "Principal"}
          </Typography>
          <Typography variant="caption" className="text-[0.72rem] text-slate-400">
            {user?.role || "principle"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box className="relative flex min-h-screen overflow-x-hidden bg-[#060b16] text-slate-100 md:h-screen md:overflow-hidden">
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
        <Box className="relative h-full">{sidebarContent}</Box>
      </Box>

      <Box component="main" className="relative z-10 min-w-0 flex-1 md:ml-[272px] md:h-screen md:overflow-y-auto md:overflow-x-hidden">
        <AppBar
          position="fixed"
          color="transparent"
          elevation={0}
          className="!left-0 !top-0 !z-[1200] !w-full !rounded-none border-b border-white/10 bg-[#07101f]/80 backdrop-blur-xl md:!left-[272px] md:!w-[calc(100%-272px)]"
        >
          <Toolbar className="!min-h-[62px] !rounded-none gap-3 px-4 py-2.5 sm:px-5 md:!min-h-[72px] md:px-7">
            <IconButton onClick={() => setMobileOpen(true)} className="md:!hidden" color="inherit">
              <MenuRoundedIcon />
            </IconButton>

            <Box className="min-w-0 flex-1">
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Typography variant="h6" fontWeight={600} className="font-inherit text-[0.95rem] leading-tight md:text-[1rem]">
                  {title}
                </Typography>
                <Chip size="small" icon={<ManageAccountsRoundedIcon />} label={roleInfo.badge} color="primary" />
              </Stack>
              <Typography variant="body2" className="mt-0.5 text-[0.76rem] text-slate-400">
                {roleInfo.subtitle}
              </Typography>
            </Box>

            <TextField
              size="small"
              placeholder="Search or type command..."
              className="hidden !w-[210px] md:!flex lg:!w-[280px]"
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

            <Tooltip title="Refresh session">
              <IconButton onClick={loadCurrentSession} color="inherit" className="transition-transform duration-200 hover:scale-105">
                <RefreshRoundedIcon />
              </IconButton>
            </Tooltip>

            <NotificationsBell role={user?.role} />
            <ThemeSettingsButton />

            <Stack direction="row" spacing={1} alignItems="center" className="pl-1">
              <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main" }}>
                {(user?.name || "P").slice(0, 1).toUpperCase()}
              </Avatar>
              <Box className="hidden sm:block">
                <Typography fontWeight={500} variant="body2" className="font-inherit text-[0.9rem] leading-tight">
                  {user?.name || "Principal"}
                </Typography>
                <Typography variant="caption" className="text-[0.72rem] text-slate-400">
                  {user?.email || user?.role || "principle"}
                </Typography>
              </Box>
            </Stack>

            <Button
              onClick={() => navigate("/principle/profile")}
              variant="outlined"
              startIcon={<AccountCircleRoundedIcon />}
              className="hidden !rounded-lg !border-white/10 !px-3.5 !py-1.5 !text-[0.8rem] !text-slate-100 hover:!border-sky-400/40 hover:!bg-sky-400/10 md:!inline-flex"
            >
              Profile
            </Button>

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

        <Box className="px-4 pb-6 pt-[82px] sm:px-5 md:px-7 md:pt-[92px]">
          <Box className="mx-auto w-full max-w-7xl">
            <Stack spacing={2.5}>
              {tab === "classes" ? (
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
                          Principal Workspace
                        </Box>
                        <Box className="rounded-[8px] border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.72rem] font-medium text-slate-300">
                          School ID: {user?.school_id || "-"}
                        </Box>
                        <Box className="rounded-[8px] border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.72rem] font-medium text-slate-300">
                          Session: {currentSession?.name || "-"}
                        </Box>
                      </Stack>

                      <Box className="space-y-6">
                        <Box>
                          <Typography
                            variant="h4"
                            fontWeight={600}
                            className="text-[1.55rem] leading-tight text-slate-50 md:text-[1.8rem]"
                          >
                            Welcome back, {user?.name || "Principal"}
                          </Typography>
                          <Typography variant="body1" className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                            This workspace brings together classes, teachers, students, and performance in a calm, high-signal
                            layout that feels like a real LMS command center.
                          </Typography>
                        </Box>

                        <Box className="grid gap-[10px] sm:grid-cols-2 xl:grid-cols-4">
                          {currentStats.map((item) => (
                            <StatCard key={item.label} label={item.label} value={item.value} helper={item.helper} />
                          ))}
                        </Box>

                        <Box className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                              <Button
                                key={action.id}
                                onClick={() => setTab(action.id)}
                                variant={tab === action.id ? "contained" : "outlined"}
                                startIcon={<Icon fontSize="small" />}
                                className="!justify-start !rounded-xl !px-4 !py-3 !normal-case"
                                sx={{
                                  borderColor: tab === action.id ? "transparent" : "rgba(255,255,255,0.12)",
                                  bgcolor: tab === action.id ? "rgba(14,165,233,0.18)" : "transparent",
                                }}
                              >
                                {action.label}
                              </Button>
                            );
                          })}
                        </Box>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}

              <Box className="space-y-3">
                <Stack direction="row" alignItems="end" justifyContent="space-between" sx={{ gap: 2, flexWrap: "wrap" }}>
                  <Box>
                    <Typography variant="h6" fontWeight={600} className="text-[1rem] leading-tight text-slate-100">
                      {sectionMeta[tab]?.title || "Principal Workspace"}
                    </Typography>
                    <Typography className="text-sm leading-normal text-slate-400">
                      {sectionMeta[tab]?.subtitle || "Select a section from the sidebar."}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    icon={<CalendarMonthRoundedIcon />}
                    label={currentSession?.name ? `Session ${currentSession.name}` : "No active session"}
                    variant="outlined"
                    className="!rounded-lg"
                  />
                </Stack>

                <Box className="rounded-[8px] border border-white/10 bg-white/[0.03] p-4 md:p-5">
                  {tab === "classes" ? <ClassesContentTab /> : null}
                  {tab === "teachers" ? <TeachersTab /> : null}
                  {tab === "students" ? <StudentsTab /> : null}
                  {tab === "performance" ? <PerformanceTab currentSession={currentSession} /> : null}
                </Box>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
