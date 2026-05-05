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
  Divider,
  Grid,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import NotificationsBell from "../../notifications/NotificationsBell";

import * as studentService from "../services/studentService";

function DetailCard({ label, value }) {
  return (
    <Box className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
      <Typography variant="caption" className="block text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">
        {label}
      </Typography>
      <Typography className="mt-1 text-[0.95rem] font-medium text-slate-900 break-words">
        {value != null && String(value).trim() !== "" ? String(value) : "-"}
      </Typography>
    </Box>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <Card
      elevation={0}
      variant="outlined"
      className="h-full overflow-hidden border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
      sx={{ borderRadius: "24px" }}
    >
      <CardContent className="p-5 md:p-6">
        <Typography variant="body2" className="text-[0.72rem] uppercase tracking-[0.18em] text-slate-500">
          {title}
        </Typography>
        <Typography fontWeight={700} className="mt-2 text-[1.05rem] leading-snug text-slate-900">
          {subtitle}
        </Typography>
        <Divider className="my-4 border-slate-200" />
        {children}
      </CardContent>
    </Card>
  );
}

export default function StudentProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

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

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await studentService.getStudentByUserId();
      setProfile(data);
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

  const onLogout = () => {
    dispatch(logoutThunk());
    navigate("/login");
  };

  const student = profile?.student || null;
  const parent = profile?.parent || null;
  const address = profile?.address || null;
  const studentUser = student?.user || null;
  const classInfo = student?.class_info || null;
  const classLabel = classInfo
    ? `${classInfo?.name || ""}${classInfo?.section ? ` (${classInfo.section})` : ""}`.trim()
    : student?.class_id;

  const detailGroups = [
    {
      title: "Student Details",
      subtitle: "Personal and academic identity",
      fields: [
        { label: "Name", value: studentUser?.name },
        { label: "Email", value: studentUser?.email },
        { label: "Phone", value: studentUser?.phone },
        { label: "Roll number", value: student?.roll_number },
        { label: "Gender", value: student?.gender },
        { label: "Blood group", value: student?.blood_group },
        { label: "Date of birth", value: student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : "-" },
        { label: "Class", value: classLabel },
      ],
    },
    {
      title: "Parent Details",
      subtitle: "Guardian and contact information",
      fields: [
        { label: "Name", value: parent?.name },
        { label: "Relation", value: parent?.relation },
        { label: "Phone", value: parent?.phone },
        { label: "Email", value: parent?.email },
        { label: "Occupation", value: parent?.occupation },
        { label: "Education", value: parent?.education_level },
        {
          label: "Address",
          value: address
            ? [address.street, address.city, address.state, address.country, address.postal_code].filter(Boolean).join(", ")
            : "-",
        },
      ],
    },
  ];

  return (
    <ThemeProvider theme={studentTheme}>
      <Box className="relative min-h-screen overflow-x-hidden bg-[#f5f8ff] text-slate-900">
        <Box className="pointer-events-none absolute right-[-120px] top-[-140px] h-[340px] w-[340px] rounded-full bg-blue-200/40 blur-[80px]" />
        <Box className="pointer-events-none absolute bottom-[-160px] left-[-120px] h-[360px] w-[360px] rounded-full bg-blue-100/60 blur-[80px]" />

        <AppBar
          position="sticky"
          color="transparent"
          elevation={0}
          className="border-b border-slate-200/80 bg-white/90 backdrop-blur-xl"
        >
          <Toolbar className="!min-h-[62px] gap-3 px-4 py-2.5 sm:px-5 md:!min-h-[72px] md:px-7">
            <IconButton onClick={() => navigate("/students/dashboard")} color="inherit">
              <ArrowBackRoundedIcon />
            </IconButton>

            <Box className="min-w-0 flex-1">
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Typography variant="h6" fontWeight={700} className="font-inherit text-[0.95rem] leading-tight md:text-[1rem] text-slate-900">
                  Student Profile
                </Typography>
                <Chip size="small" icon={<ManageAccountsRoundedIcon />} label="Student" color="primary" />
              </Stack>
              <Typography variant="body2" className="mt-0.5 text-[0.76rem] text-slate-500">
                Full student details stay here so the dashboard remains clean.
              </Typography>
            </Box>

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
                  {user?.school_id || user?.role || "student"}
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

        <Box className="px-4 py-5 sm:px-5 md:px-7 md:py-6">
          <Box className="mx-auto w-full max-w-7xl space-y-4 md:space-y-5">
            <Card
              elevation={0}
              variant="outlined"
              className="overflow-hidden border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]"
              sx={{ borderRadius: "28px" }}
            >
              <CardContent className="relative p-5 md:p-6 lg:p-7">
                <Box className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_32%)]" />
                <Stack spacing={2.25} className="relative z-10">
                  <Stack direction="row" spacing={1} className="flex-wrap">
                    <Box className="rounded-2xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-[0.72rem] font-semibold text-blue-700">
                      Student Profile
                    </Box>
                    <Box className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-[0.72rem] font-semibold text-slate-600">
                      School ID: {user?.school_id || "-"}
                    </Box>
                    <Box className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-[0.72rem] font-semibold text-slate-600">
                      Class: {classLabel || "-"}
                    </Box>
                  </Stack>

                  <Box className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                    <Card
                      elevation={0}
                      variant="outlined"
                      className="border border-slate-200 bg-slate-50 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
                      sx={{ borderRadius: "24px" }}
                    >
                      <CardContent className="p-5 md:p-6">
                        <Box className="rounded-[22px] border border-slate-200 bg-white p-4 md:p-5">
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar
                              sx={{
                                width: 58,
                                height: 58,
                                bgcolor: "primary.main",
                                boxShadow: "0 14px 30px rgba(37,99,235,0.22)",
                              }}
                            >
                              <PersonRoundedIcon />
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="overline" className="text-[0.68rem] tracking-[0.18em] text-slate-500">
                                Student Profile
                              </Typography>
                              <Typography variant="h5" fontWeight={700} className="mt-1 text-[1.18rem] leading-tight text-slate-900">
                                {studentUser?.name || "-"}
                              </Typography>
                              <Typography className="mt-1 text-[0.92rem] text-slate-500">
                                {studentUser?.email || "-"}
                              </Typography>
                              <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: "wrap" }}>
                                <Chip size="small" icon={<SchoolRoundedIcon />} label="Student" variant="outlined" />
                                <Chip
                                  size="small"
                                  icon={<CalendarMonthRoundedIcon />}
                                  label={classLabel || "No class"}
                                  variant="outlined"
                                />
                              </Stack>
                            </Box>
                          </Stack>
                        </Box>

                        <Typography variant="body2" className="mt-4 text-[0.92rem] leading-6 text-slate-500">
                          This page holds the full student record, while the dashboard stays focused on learning shortcuts and live
                          workspace updates.
                        </Typography>

                        {loading ? <Typography className="mt-4 text-sm leading-normal text-slate-500">Loading profile...</Typography> : null}
                        {err ? (
                          <Box className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {String(err)}
                          </Box>
                        ) : null}
                      </CardContent>
                    </Card>

                    <Card
                      elevation={0}
                      variant="outlined"
                      className="border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
                      sx={{ borderRadius: "24px" }}
                    >
                      <CardContent className="p-5 md:p-6">
                        <Typography variant="body2" className="text-[0.72rem] uppercase tracking-[0.18em] text-slate-500">
                          Workspace Details
                        </Typography>
                        <Typography fontWeight={700} className="mt-2 text-[1.05rem] leading-snug text-slate-900">
                          Clean profile summary
                        </Typography>
                        <Typography variant="body2" className="mt-1 text-[0.92rem] leading-6 text-slate-500">
                          Use this space for the student identity and parent details. The dashboard now remains uncluttered.
                        </Typography>

                        <Divider className="my-4 border-slate-200" />

                        <Box className="grid gap-3 sm:grid-cols-2">
                          <DetailCard label="School ID" value={user?.school_id} />
                          <DetailCard label="Role" value="Student" />
                          <DetailCard label="Class" value={classLabel} />
                          <DetailCard label="Status" value="Active student workspace" />
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Grid container spacing={2.5}>
              {detailGroups.map((group) => (
                <Grid key={group.title} item xs={12} lg={group.title === "Parent Details" ? 5 : 7}>
                  <SectionCard title={group.title} subtitle={group.subtitle}>
                    <Grid container spacing={2}>
                      {group.fields.map((field) => (
                        <Grid key={field.label} item xs={12} sm={field.label === "Address" ? 12 : 6}>
                          <DetailCard label={field.label} value={field.value} />
                        </Grid>
                      ))}
                    </Grid>
                  </SectionCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
