import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logoutThunk } from "../../store/authSlice";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ThemeSettingsButton from "../../theme/ThemeSettingsButton";
import NotificationsBell from "../../notifications/NotificationsBell";

import * as parentAuthService from "../services/parentAuthService";
import * as studentService from "../services/studentService";
import * as subjectService from "../services/subjectService";
import * as moduleService from "../services/moduleService";
import * as submoduleService from "../services/submoduleService";
import * as contentService from "../services/contentService";
import * as assignmentService from "../services/assignmentService";
import AttendanceTab from "./tabs/AttendanceTab";
import ChatTab from "./tabs/ChatTab";

export default function ParentDashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const [tab, setTab] = useState("profile"); // profile | child | content | performance | chat
  const [parent, setParent] = useState(null);
  const [child, setChild] = useState(null); // StudentCreateResponse
  const [classSubjects, setClassSubjects] = useState([]);

  // content view
  const [selectedClassSubject, setSelectedClassSubject] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [submodules, setSubmodules] = useState([]);
  const [contentsBySubmoduleId, setContentsBySubmoduleId] = useState({});

  // performance
  const [subs, setSubs] = useState([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!user) navigate("/login");
    if (user?.role !== "parent") navigate("/");
  }, [user, navigate]);

  const title = useMemo(() => "Parent Dashboard", []);

  const onLogout = () => {
    dispatch(logoutThunk());
    navigate("/login");
  };

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const me = await parentAuthService.me();
      setParent(me);
      if (me?.student_id) {
        const s = await studentService.getStudentById(me.student_id);
        setChild(s);
        const classId = s?.student?.class_id;
        if (classId) {
          const cs = await subjectService.getAllClassSubjects(classId);
          setClassSubjects(cs || []);
        } else {
          setClassSubjects([]);
        }
      } else {
        setChild(null);
        setClassSubjects([]);
      }
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load parent dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async (subjectId) => {
    if (!subjectId) return;
    setLoading(true);
    setErr(null);
    try {
      const mods = await moduleService.getAllModules(subjectId);
      setModules(mods || []);
      const first = (mods || [])[0]?.id || "";
      setSelectedModuleId(first);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load modules");
    } finally {
      setLoading(false);
    }
  };

  const loadSubmodulesAndContents = async (moduleId) => {
    if (!moduleId) {
      setSubmodules([]);
      setContentsBySubmoduleId({});
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const sms = await submoduleService.getAllSubmodules(moduleId);
      setSubmodules(sms || []);
      const results = await Promise.all(
        (sms || []).map(async (sm) => {
          try {
            const cs = await contentService.getAllContents(sm.id);
            return [sm.id, cs || []];
          } catch {
            return [sm.id, []];
          }
        }),
      );
      const map = {};
      for (const [k, v] of results) map[k] = v;
      setContentsBySubmoduleId(map);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load contents");
    } finally {
      setLoading(false);
    }
  };

  const loadPerformance = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await assignmentService.getParentSubmissions();
      setSubs(data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load performance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "parent") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id, user?.role]);

  useEffect(() => {
    loadSubmodulesAndContents(selectedModuleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModuleId]);

  useEffect(() => {
    if (tab === "performance") loadPerformance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const childUser = child?.student?.user || null;
  const childStudent = child?.student || null;
  const childParent = child?.parent || null;

  const graded = (subs || []).filter((s) => s?.is_graded);
  const avg = (() => {
    const xs = graded.map((s) => s.percentage).filter((v) => typeof v === "number");
    if (!xs.length) return null;
    return xs.reduce((a, b) => a + b, 0) / xs.length;
  })();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="transparent" elevation={0} sx={{ backdropFilter: "blur(10px)", width: "100%" }}>
        <Toolbar>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
            <DashboardRoundedIcon color="primary" />
            <Box>
              <Typography fontWeight={600}>{title}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.3, flexWrap: "wrap" }}>
                <Chip size="small" label={`Role: ${user?.role || "parent"}`} />
                <Chip size="small" label={`School: ${user?.school_id || "-"}`} variant="outlined" />
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center" sx={{ pr: 1 }}>
              <Avatar sx={{ width: 30, height: 30, bgcolor: "primary.main" }}>
                {(user?.name || "P").slice(0, 1).toUpperCase()}
              </Avatar>
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography fontWeight={500} variant="body2">
                  {user?.name || "Parent"}
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
          <Tab label="My Details" value="profile" />
          <Tab label="Child Details" value="child" />
          <Tab label="Child Subjects & Content" value="content" />
          <Tab label="Child Attendance" value="attendance" />
          <Tab label="Performance" value="performance" />
          <Tab label="Chat" value="chat" />
        </Tabs>
      </AppBar>

      <Container maxWidth={false} sx={{ py: 3, px: { xs: 1.5, sm: 3, md: 4 } }}>
        {err ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {String(err)}
          </Alert>
        ) : null}
        {loading ? <Typography sx={{ opacity: 0.7, mb: 2 }}>Loading...</Typography> : null}

        {tab === "profile" ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                <CardContent>
                  <Typography fontWeight={600}>Parent Details</Typography>
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={0.5}>
                    <Typography fontWeight={500}>{parent?.name || "-"}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {parent?.email || "-"}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Phone: {parent?.phone || "-"}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Relation: {parent?.relation || "-"}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Occupation: {parent?.occupation || "-"}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Education: {parent?.education_level || "-"}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Marital status: {parent?.marital_status || "-"}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                <CardContent>
                  <Typography fontWeight={600}>Linked Child</Typography>
                  <Divider sx={{ my: 2 }} />
                  {childStudent ? (
                    <Stack spacing={0.5}>
                      <Typography fontWeight={500}>{childUser?.name || "-"}</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {childUser?.email || "-"}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Roll: {childStudent?.roll_number || "-"}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Class: {childStudent?.class_id || "-"}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography sx={{ opacity: 0.7 }}>No linked child found.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : null}

        {tab === "child" ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                <CardContent>
                  <Typography fontWeight={600}>Child Details</Typography>
                  <Divider sx={{ my: 2 }} />
                  {childStudent ? (
                    <Stack spacing={0.5}>
                      <Typography fontWeight={500}>{childUser?.name || "-"}</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Email: {childUser?.email || "-"}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Phone: {childUser?.phone || "-"}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Roll: {childStudent?.roll_number || "-"}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Gender: {childStudent?.gender || "-"}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Blood group: {childStudent?.blood_group || "-"}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography sx={{ opacity: 0.7 }}>No linked child found.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                <CardContent>
                  <Typography fontWeight={600}>Parent Record (from Student)</Typography>
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={0.5}>
                    <Typography fontWeight={500}>{childParent?.name || "-"}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {childParent?.email || "-"}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Phone: {childParent?.phone || "-"}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Relation: {childParent?.relation || "-"}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : null}

        {tab === "content" ? (
          <Stack spacing={2}>
            <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
              <CardContent>
                <Typography fontWeight={600}>Child Subjects & Content</Typography>
                <Divider sx={{ my: 2 }} />
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    select
                    label="Subject"
                    value={selectedClassSubject?.id || ""}
                    onChange={(e) => {
                      const id = e.target.value;
                      const cs = (classSubjects || []).find((x) => x.id === id) || null;
                      setSelectedClassSubject(cs);
                      setModules([]);
                      setSelectedModuleId("");
                      setSubmodules([]);
                      setContentsBySubmoduleId({});
                      if (cs?.subject_id) loadModules(cs.subject_id);
                    }}
                    fullWidth
                  >
                    {(classSubjects || []).map((cs) => (
                      <MenuItem key={cs.id} value={cs.id}>
                        {cs?.subject?.name || cs.subject_id}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="Module"
                    value={selectedModuleId}
                    onChange={(e) => setSelectedModuleId(e.target.value)}
                    fullWidth
                    disabled={!modules?.length}
                  >
                    {modules.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.name || m.id}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
              <CardContent>
                <Typography fontWeight={600}>Content</Typography>
                <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
                  Full page content for the selected module
                </Typography>
                <Divider sx={{ my: 2 }} />

                {!selectedModuleId ? (
                  <Typography sx={{ opacity: 0.7 }}>Select a subject and module.</Typography>
                ) : !submodules?.length ? (
                  <Typography sx={{ opacity: 0.7 }}>No submodules for this module.</Typography>
                ) : (
                  <Stack spacing={2}>
                    {submodules.map((sm) => {
                      const cs = contentsBySubmoduleId[sm.id] || [];
                      return (
                        <Card key={sm.id} elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                          <CardContent>
                            <Typography fontWeight={600}>{sm.name || "Submodule"}</Typography>
                            {sm.description ? (
                              <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
                                {sm.description}
                              </Typography>
                            ) : null}
                            <Divider sx={{ my: 2 }} />
                            {!cs.length ? (
                              <Typography sx={{ opacity: 0.7 }}>No content yet.</Typography>
                            ) : (
                              <Stack spacing={1.5}>
                                {cs.map((c) => (
                                  <Card key={c.id} elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                                    <CardContent>
                                      <Typography fontWeight={600}>{c.title || c.id}</Typography>
                                      {c.content_data ? (
                                        <Typography sx={{ whiteSpace: "pre-wrap", mt: 1 }}>{c.content_data}</Typography>
                                      ) : (
                                        <Typography sx={{ opacity: 0.7, mt: 1 }}>No text content.</Typography>
                                      )}
                                      {c.file_url ? (
                                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
                                          <Button component="a" href={c.file_url} target="_blank" rel="noreferrer" variant="outlined">
                                            Open attachment
                                          </Button>
                                          <Button component="a" href={c.file_url} download variant="contained">
                                            Download
                                          </Button>
                                        </Stack>
                                      ) : null}
                                    </CardContent>
                                  </Card>
                                ))}
                              </Stack>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        ) : null}

        {tab === "attendance" ? (
          <AttendanceTab child={childStudent} classSubjects={classSubjects} />
        ) : null}

        {tab === "performance" ? (
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <CardContent>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      Submissions
                    </Typography>
                    <Typography fontWeight={600}>{subs?.length || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <CardContent>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      Graded
                    </Typography>
                    <Typography fontWeight={600}>{graded?.length || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <CardContent>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      Average %
                    </Typography>
                    <Typography fontWeight={600}>{avg == null ? "-" : `${avg.toFixed(1)}%`}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
              <CardContent>
                <Typography fontWeight={600}>Marks</Typography>
                <Divider sx={{ my: 2 }} />
                {!graded.length ? (
                  <Typography sx={{ opacity: 0.7 }}>No graded marks yet.</Typography>
                ) : (
                  <Stack spacing={1}>
                    {graded.map((s) => (
                      <Card key={s.id} elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                        <CardContent>
                          <Typography fontWeight={600}>{s.assignment_title || s.assignment_id}</Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            {s.marks_obtained}/{s.total_marks} ({typeof s.percentage === "number" ? `${s.percentage.toFixed(1)}%` : "-"})
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            Grade: {s.grade || "-"}
                          </Typography>
                          {s.feedback ? (
                            <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                              Feedback: {s.feedback}
        </Typography>
                          ) : null}
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        ) : null}

        {tab === "chat" ? (
          <ChatTab classId={childStudent?.class_id} classSubjects={classSubjects} />
        ) : null}
      </Container>
    </Box>
  );
}




