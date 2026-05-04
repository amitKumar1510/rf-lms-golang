import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import { useAppSelector } from "../../store/hooks";
import * as studentService from "../services/studentService";
import * as subjectService from "../services/subjectService";
import * as moduleService from "../services/moduleService";
import * as submoduleService from "../services/submoduleService";
import * as contentService from "../services/contentService";

export default function SubjectContentPage() {
  const navigate = useNavigate();
  const { classSubjectId } = useParams();
  const { user } = useAppSelector((s) => s.auth);

  const [profile, setProfile] = useState(null);
  const [classSubjects, setClassSubjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [selModuleId, setSelModuleId] = useState("");
  const [submodules, setSubmodules] = useState([]);
  const [contentsBySubmoduleId, setContentsBySubmoduleId] = useState({});

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const activeClassSubject = useMemo(() => {
    return (classSubjects || []).find((x) => x?.id === classSubjectId) || null;
  }, [classSubjects, classSubjectId]);

  const subjectLabel = useMemo(() => {
    const subj = activeClassSubject?.subject || null;
    if (!subj) return activeClassSubject?.subject_id || "Subject";
    return `${subj.name}${subj.code ? ` (${subj.code})` : ""}`;
  }, [activeClassSubject]);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      if (!user) throw new Error("Not logged in");
      // fetch student profile reliably (doesn't depend on user.student_id being populated)
      const prof = await studentService.getStudentByUserId();
      setProfile(prof);
      const classId = prof?.student?.class_id;
      if (!classId) throw new Error("Class not found for student");

      const cs = await subjectService.getAllClassSubjects(classId);
      setClassSubjects(cs || []);

      const target = (cs || []).find((x) => x?.id === classSubjectId) || null;
      if (!target?.subject_id) {
        setModules([]);
        setSelModuleId("");
        setSubmodules([]);
        setContentsBySubmoduleId({});
        return;
      }

      const mods = await moduleService.getAllModules(target.subject_id);
      setModules(mods || []);
      const firstId = (mods || [])[0]?.id || "";
      setSelModuleId(firstId);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load subject content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classSubjectId, user?.user_id]);

  const loadModuleTree = async (moduleId) => {
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
      // load all contents for each submodule
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
      setErr(e?.response?.data?.detail || e?.message || "Failed to load module contents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModuleTree(selModuleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selModuleId]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box sx={{ py: 3, px: { xs: 1.5, sm: 3, md: 4 }, maxWidth: 1100, mx: "auto" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }}>
          <Stack spacing={0.25}>
            <Typography fontWeight={600} variant="h6">
              {subjectLabel} — Content
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Select a module to view submodules and full content.
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/students/dashboard?tab=content")}>
              Back
            </Button>
            <Button variant="outlined" startIcon={<RefreshRoundedIcon />} disabled={loading} onClick={load}>
              Refresh
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {err ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {String(err)}
          </Alert>
        ) : null}
        {loading ? <Typography sx={{ opacity: 0.7, mb: 2 }}>Loading...</Typography> : null}

        {!activeClassSubject ? (
          <Alert severity="warning">
            Subject not found for this URL. Please go back and open the subject from the cards list (the URL must use the <b>class_subject id</b>, not the class id).
          </Alert>
        ) : (
          <Stack spacing={2}>
            <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
              <CardContent>
                <FormControl fullWidth>
                  <InputLabel id="module-select-label">Module</InputLabel>
                  <Select
                    labelId="module-select-label"
                    label="Module"
                    value={selModuleId}
                    onChange={(e) => setSelModuleId(e.target.value)}
                  >
                    {(modules || []).map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.name || m.id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {!modules?.length ? (
                  <Typography sx={{ opacity: 0.7, mt: 1 }}>No modules available for this subject.</Typography>
                ) : null}
              </CardContent>
            </Card>

            {!submodules?.length ? (
              <Typography sx={{ opacity: 0.7 }}>No submodules available for this module.</Typography>
            ) : (
              <Stack spacing={2}>
                {submodules.map((sm) => {
                  const cs = contentsBySubmoduleId[sm.id] || [];
                  return (
                    <Card key={sm.id} elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                      <CardContent>
                        <Typography fontWeight={600} sx={{ mb: 0.5 }}>
                          {sm.name || "Submodule"}
                        </Typography>
                        {sm.description ? (
                          <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                            {sm.description}
                          </Typography>
                        ) : null}

                        <Divider sx={{ mb: 2 }} />

                        {!cs.length ? (
                          <Typography sx={{ opacity: 0.7 }}>No content yet.</Typography>
                        ) : (
                          <Stack spacing={1.5}>
                            {cs.map((c) => (
                              <Card key={c.id} elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                                <CardContent>
                                  <Stack spacing={1}>
                                    <Typography fontWeight={600}>{c.title || c.id}</Typography>
                                    {c.content_data ? (
                                      <Typography sx={{ whiteSpace: "pre-wrap" }}>{c.content_data}</Typography>
                                    ) : (
                                      <Typography sx={{ opacity: 0.7 }}>No text content.</Typography>
                                    )}
                                    {c.file_url ? (
                                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                        <Button component="a" href={c.file_url} target="_blank" rel="noreferrer" variant="outlined">
                                          Open attachment
                                        </Button>
                                        <Button component="a" href={c.file_url} download variant="contained">
                                          Download
                                        </Button>
                                      </Stack>
                                    ) : null}
                                  </Stack>
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
          </Stack>
        )}
      </Box>
    </Box>
  );
}



