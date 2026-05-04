import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logoutThunk } from "../../store/authSlice";
import * as adminService from "../services/adminService";
import {
  Alert,
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
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import ThemeSettingsButton from "../../theme/ThemeSettingsButton";
import NotificationsBell from "../../notifications/NotificationsBell";

const drawerWidth = 272;

const roleMeta = {
  admin: {
    title: "Admin Dashboard",
    subtitle: "Manage schools, create subadmins, and keep the admin workspace organized.",
    badge: "Administrator",
  },
  teacher: {
    title: "Teacher Dashboard",
    subtitle: "Track class activity, teaching work, and daily school operations.",
    badge: "Teacher",
  },
  student: {
    title: "Student Dashboard",
    subtitle: "Review class content, tasks, and learning progress from one place.",
    badge: "Student",
  },
  parent: {
    title: "Parent Dashboard",
    subtitle: "Follow attendance, marks, and student updates in a clean workspace.",
    badge: "Parent",
  },
  subadmin: {
    title: "Subadmin Dashboard",
    subtitle: "Handle school operations and keep your campus data in sync.",
    badge: "Subadmin",
  },
  principle: {
    title: "Principal Dashboard",
    subtitle: "Oversee the school workspace with a high-level administrative view.",
    badge: "Principal",
  },
};

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    helper: "Brief overview",
    path: "/admin/dashboard",
    icon: DashboardRoundedIcon,
  },
  {
    id: "create-school",
    label: "Create School",
    helper: "Add campuses",
    path: "/admin/create-school",
    icon: SchoolRoundedIcon,
  },
  {
    id: "create-subadmins",
    label: "Create Subadmins",
    helper: "Manage users",
    path: "/admin/create-subadmins",
    icon: GroupsRoundedIcon,
  },
  {
    id: "profile",
    label: "Profile",
    helper: "Admin details",
    path: "/admin/profile",
    icon: ManageAccountsRoundedIcon,
  },
];

function SidebarItem({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <ListItemButton
      selected={active}
      onClick={onClick}
      className={[
        "group mb-1 rounded-2xl border px-4 py-3 transition-all duration-200",
        active
          ? "border-sky-500/20 bg-sky-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          : "border-transparent hover:border-white/10 hover:bg-white/5",
      ].join(" ")}
    >
      <ListItemIcon className="min-w-9 text-slate-400 transition-colors duration-200 group-hover:text-slate-100" sx={{ minWidth: 36 }}>
        <Icon fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={
          <Typography fontWeight={800} className="font-['Montserrat'] text-[0.9rem] text-slate-100">
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

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, hydrateStatus } = useAppSelector((s) => s.auth);

  const [me, setMe] = useState(null);
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [subadmins, setSubadmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [subErr, setSubErr] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const currentRole = user?.role || "admin";
  const roleInfo = roleMeta[currentRole] || roleMeta.admin;
  const activeSection = useMemo(() => {
    const found = navItems.find((item) => location.pathname.startsWith(item.path));
    return found?.id || "dashboard";
  }, [location.pathname]);

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

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [admin, allSchools] = await Promise.all([adminService.getMe(), adminService.getAllSchools()]);
      setMe(admin);
      setSchools(allSchools);
      setSelectedSchoolId((current) => current || (allSchools?.length ? allSchools[0].id : ""));
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSubadmins = useCallback(async (schoolId) => {
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
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (selectedSchoolId) loadSubadmins(selectedSchoolId);
  }, [loadSubadmins, selectedSchoolId]);

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

  const selectedSchool = useMemo(
    () => schools.find((school) => school.id === selectedSchoolId) || null,
    [schools, selectedSchoolId]
  );

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

  const workspace = {
    me,
    schools,
    selectedSchoolId,
    selectedSchool,
    setSelectedSchoolId,
    subadmins,
    loading,
    err,
    subLoading,
    subErr,
    newSchool,
    setNewSchool,
    canCreate,
    refresh,
    loadSubadmins,
    onCreateSchool,
    onCreateSubadmin,
    user,
    currentRole,
    roleInfo,
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
            <Typography fontWeight={900} className="font-['Montserrat'] text-[1rem] leading-tight text-slate-100">
              RF LMS
            </Typography>
            <Typography variant="caption" className="text-[0.72rem] text-slate-400">
              Admin workspace
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
                navigate(item.path);
                setMobileOpen(false);
              }}
            />
          ))}
        </List>
      </Box>

      <Box className="border-t border-white/10 p-4">
        <Box className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <Typography variant="caption" className="mb-1 block text-[0.7rem] text-slate-400">
            Logged in as
          </Typography>
          <Typography fontWeight={800} className="mt-0.5 font-['Montserrat'] text-[0.95rem] text-slate-100">
            {me?.name || user?.name || "Admin"}
          </Typography>
          <Typography variant="caption" className="text-[0.72rem] text-slate-400">
            {currentRole}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

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
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "none",
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      <Box component="nav" className="hidden md:fixed md:inset-y-0 md:left-0 md:z-[1200] md:block md:w-[272px]">
        <Box className="relative h-screen">
          {sidebarContent}
        </Box>
      </Box>

      <Box component="main" className="relative z-10 min-w-0 flex-1 md:ml-[272px]">
        <AppBar
          position="fixed"
          color="transparent"
          elevation={0}
          className="!left-0 !top-0 !z-[1200] !w-full border-b border-white/10 bg-[#07101f]/80 backdrop-blur-xl md:!left-[272px] md:!w-[calc(100%-272px)]"
        >
          <Toolbar className="!min-h-[74px] gap-4 px-4 py-3 sm:px-5 md:!min-h-[84px] md:px-7">
            <IconButton onClick={() => setMobileOpen(true)} className="md:!hidden" color="inherit">
              <MenuRoundedIcon />
            </IconButton>

            <Box className="min-w-0 flex-1">
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Typography variant="h6" fontWeight={900} className="font-['Montserrat'] text-[1.02rem] leading-tight md:text-[1.08rem]">
                  {roleInfo.title}
                </Typography>
                <Chip size="small" icon={<WorkspacePremiumRoundedIcon />} label={roleInfo.badge} color="primary" />
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
              <IconButton onClick={refresh} color="inherit" className="transition-transform duration-200 hover:scale-105">
                <RefreshRoundedIcon />
              </IconButton>
            </Tooltip>

            <NotificationsBell role={user?.role} />
            <ThemeSettingsButton />

            <Stack direction="row" spacing={1} alignItems="center" className="pl-1">
              <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main" }}>
                {(me?.name || user?.name || "A").slice(0, 1).toUpperCase()}
              </Avatar>
              <Box className="hidden sm:block">
                <Typography fontWeight={800} variant="body2" className="font-['Montserrat'] text-[0.9rem] leading-tight">
                  {me?.name || user?.name || "Admin"}
                </Typography>
                <Typography variant="caption" className="text-[0.72rem] text-slate-400">
                  {currentRole}
                </Typography>
              </Box>
            </Stack>

            <Button onClick={onLogout} variant="contained" color="error" startIcon={<LogoutRoundedIcon />} className="!rounded-xl !px-4 !py-2 !text-sm !shadow-none transition-transform duration-200 hover:scale-[1.01]">
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        <Box className="px-4 pb-6 pt-[74px] sm:px-5 md:px-7 md:pt-[84px]">
          {err ? (
            <Alert
              severity="error"
              className="mb-6 rounded-2xl border border-red-400/20 bg-red-950/40"
            >
              {String(err)}
            </Alert>
          ) : null}

          <Outlet context={workspace} />
        </Box>
      </Box>
    </Box>
  );
}
