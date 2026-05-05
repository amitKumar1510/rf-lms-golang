import { useEffect, useState } from "react";
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
  Divider,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import ThemeSettingsButton from "../../theme/ThemeSettingsButton";
import NotificationsBell from "../../notifications/NotificationsBell";

import * as classService from "../services/classService";

function DetailCard({ label, value }) {
  return (
    <Box className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
      <Typography variant="caption" className="block text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">
        {label}
      </Typography>
      <Typography className="mt-1 text-[0.92rem] font-medium text-slate-50 break-words">{value || "-"}</Typography>
    </Box>
  );
}

export default function PrincipleProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const [currentSession, setCurrentSession] = useState(null);

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

  const onLogout = () => {
    dispatch(logoutThunk());
    navigate("/login");
  };

  return (
    <Box className="relative min-h-screen overflow-x-hidden bg-[#050a13] text-slate-100">
      <Box className="pointer-events-none absolute right-[-120px] top-[-180px] h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-[70px]" />
      <Box className="pointer-events-none absolute bottom-[-220px] left-[-140px] h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[80px]" />

      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        className="border-b border-white/10 bg-[#07101f]/78 backdrop-blur-xl"
      >
        <Toolbar className="!min-h-[62px] gap-3 px-4 py-2.5 sm:px-5 md:!min-h-[72px] md:px-7">
          <IconButton onClick={() => navigate("/principle/dashboard")} color="inherit">
            <ArrowBackRoundedIcon />
          </IconButton>

          <Box className="min-w-0 flex-1">
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Typography variant="h6" fontWeight={600} className="font-inherit text-[0.95rem] leading-tight md:text-[1rem]">
                Principal Profile
              </Typography>
              <Chip size="small" icon={<ManageAccountsRoundedIcon />} label="Principal" color="primary" />
            </Stack>
            <Typography variant="body2" className="mt-0.5 text-[0.76rem] text-slate-400">
              Clean workspace details without crowding the dashboard.
            </Typography>
          </Box>

          <Tooltip title="Refresh session">
            <IconButton onClick={loadCurrentSession} color="inherit">
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>

          <NotificationsBell role={user?.role} />
          <ThemeSettingsButton />

          <Button
            onClick={onLogout}
            variant="contained"
            color="error"
            startIcon={<LogoutRoundedIcon />}
            className="!rounded-lg !px-3.5 !py-1.5 !text-[0.8rem] !shadow-none"
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box className="px-4 py-5 sm:px-5 md:px-7 md:py-6">
        <Box className="mx-auto w-full max-w-7xl space-y-4 md:space-y-5">
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
                  <Box className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[0.72rem] font-medium text-emerald-300">
                    Principal Workspace
                  </Box>
                  <Box className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.72rem] font-medium text-slate-300">
                    School ID: {user?.school_id || "-"}
                  </Box>
                  <Box className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.72rem] font-medium text-slate-300">
                    Session: {currentSession?.name || "-"}
                  </Box>
                </Stack>

                <Box className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                  <Card
                    elevation={0}
                    variant="outlined"
                    className="border border-white/10 bg-white/[0.035] shadow-[0_18px_50px_rgba(2,6,23,0.18)]"
                    sx={{ borderRadius: "8px" }}
                  >
                    <CardContent className="p-5 md:p-6">
                      <Box className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] p-4 md:p-5">
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            sx={{
                              width: 58,
                              height: 58,
                              bgcolor: "primary.main",
                              boxShadow: "0 14px 30px rgba(14,165,233,0.25)",
                            }}
                          >
                            {(user?.name || "P").slice(0, 1).toUpperCase()}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="overline" className="text-[0.68rem] tracking-[0.18em] text-slate-500">
                              Principal Profile
                            </Typography>
                            <Typography variant="h5" fontWeight={700} className="mt-1 text-[1.18rem] leading-tight text-slate-50">
                              {user?.name || "-"}
                            </Typography>
                            <Typography className="mt-1 text-[0.92rem] text-slate-400">
                              {user?.email || "-"}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: "wrap" }}>
                              <Chip size="small" icon={<PersonRoundedIcon />} label={user?.role || "principle"} variant="outlined" />
                              <Chip
                                size="small"
                                icon={<CalendarMonthRoundedIcon />}
                                label={currentSession?.name || "No session"}
                                variant="outlined"
                              />
                            </Stack>
                          </Box>
                        </Stack>
                      </Box>

                      <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                        <DetailCard label="Email" value={user?.email} />
                        <DetailCard label="School" value={user?.school_id} />
                        <DetailCard label="Role" value="Principal" />
                        <DetailCard label="Academic Session" value={currentSession?.name} />
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card
                    elevation={0}
                    variant="outlined"
                    className="border border-white/10 bg-white/[0.035] shadow-[0_18px_50px_rgba(2,6,23,0.18)]"
                    sx={{ borderRadius: "8px" }}
                  >
                    <CardContent className="p-5 md:p-6">
                      <Typography variant="body2" className="text-[0.72rem] uppercase tracking-[0.18em] text-slate-400">
                        Workspace Details
                      </Typography>
                      <Typography fontWeight={600} className="mt-3 text-[1.02rem] leading-snug text-slate-50">
                        Clean profile summary
                      </Typography>
                      <Typography variant="body2" className="mt-1 text-[0.92rem] leading-6 text-slate-400">
                        This page keeps the principal details out of the dashboard so the home view stays lighter and easier to scan.
                      </Typography>

                      <Divider className="my-4 border-white/10" />

                      <Box className="grid gap-3 sm:grid-cols-2">
                        <Box className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
                          <Typography variant="caption" className="block text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">
                            School ID
                          </Typography>
                          <Typography className="mt-1 text-[0.95rem] font-medium text-slate-50">{user?.school_id || "-"}</Typography>
                        </Box>
                        <Box className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
                          <Typography variant="caption" className="block text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">
                            Session
                          </Typography>
                          <Typography className="mt-1 text-[0.95rem] font-medium text-slate-50">
                            {currentSession?.name || "-"}
                          </Typography>
                        </Box>
                        <Box className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
                          <Typography variant="caption" className="block text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">
                            Role
                          </Typography>
                          <Typography className="mt-1 text-[0.95rem] font-medium text-slate-50">Principal</Typography>
                        </Box>
                        <Box className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
                          <Typography variant="caption" className="block text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">
                            Workspace
                          </Typography>
                          <Typography className="mt-1 text-[0.95rem] font-medium text-slate-50">Dedicated profile</Typography>
                        </Box>
                      </Box>

                      <Box className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3.5">
                        <Typography variant="caption" className="block text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">
                          Notes
                        </Typography>
                        <Typography className="mt-1 text-[0.92rem] leading-6 text-slate-300">
                          Use this page for the principal identity and workspace details. The dashboard is now reserved for daily LMS
                          actions and quick navigation.
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
