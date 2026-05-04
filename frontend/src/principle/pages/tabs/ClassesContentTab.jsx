import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import * as classService from "../../services/classService";
import * as subjectService from "../../services/subjectService";
import * as moduleService from "../../services/moduleService";
import * as submoduleService from "../../services/submoduleService";
import * as contentService from "../../services/contentService";

export default function ClassesContentTab() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedClassSubject, setSelectedClassSubject] = useState(null);

  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [submodules, setSubmodules] = useState([]);
  const [contentsBySubmoduleId, setContentsBySubmoduleId] = useState({});

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const classOptions = useMemo(() => {
    return (classes || []).map((c) => ({
      id: c.id,
      label: `${c.name} (${c.section})`,
      raw: c,
    }));
  }, [classes]);

  const subjectOptions = useMemo(() => {
    return (classSubjects || []).map((cs) => {
      const subj = cs?.subject;
      return {
        id: cs.id, // class_subject id
        class_subject_id: cs.id,
        subject_id: cs.subject_id,
        label: subj ? `${subj.name}${subj.code ? ` (${subj.code})` : ""}` : cs.subject_id,
        raw: cs,
      };
    });
  }, [classSubjects]);

  const loadClasses = async () => {
    setLoading(true);
    setErr(null);
    try {
      const cls = await classService.getAllClasses();
      setClasses(cls || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const loadClassSubjects = async (classId) => {
    if (!classId) return;
    setLoading(true);
    setErr(null);
    try {
      const cs = await subjectService.getAllClassSubjects(classId);
      setClassSubjects(cs || []);
      setSelectedClassSubject((cs || [])[0] || null);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load class subjects");
    } finally {
      setLoading(false);
    }
  };

  const selectedSubjectOption = useMemo(() => {
    if (!selectedClassSubject?.id) return null;
    const subj = selectedClassSubject?.subject;
    return {
      id: selectedClassSubject.id,
      class_subject_id: selectedClassSubject.id,
      subject_id: selectedClassSubject.subject_id,
      label: subj ? `${subj.name}${subj.code ? ` (${subj.code})` : ""}` : selectedClassSubject.subject_id,
      raw: selectedClassSubject,
    };
  }, [selectedClassSubject]);

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
      setErr(e?.response?.data?.detail || e?.message || "Failed to load submodules/contents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (classOptions.length && !selectedClass) {
      setSelectedClass(classOptions[0]);
      loadClassSubjects(classOptions[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classOptions.length]);

  useEffect(() => {
    const subjectId = selectedClassSubject?.subject_id;
    setModules([]);
    setSelectedModuleId("");
    setSubmodules([]);
    setContentsBySubmoduleId({});
    if (subjectId) loadModules(subjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassSubject?.id]);

  useEffect(() => {
    loadSubmodulesAndContents(selectedModuleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModuleId]);

  return (
    <Stack spacing={2}>
      <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, flexWrap: "wrap", gap: 1 }}>
            <Typography fontWeight={600}>Classes & Content</Typography>
            <Button variant="outlined" startIcon={<RefreshRoundedIcon />} disabled={loading} onClick={loadClasses}>
              Refresh
            </Button>
          </Stack>
          <Divider sx={{ mb: 2 }} />

          {err ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {String(err)}
            </Alert>
          ) : null}

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Autocomplete
              options={classOptions}
              getOptionLabel={(o) => o?.label || ""}
              value={selectedClass}
              onChange={(_, v) => {
                setSelectedClass(v);
                setClassSubjects([]);
                setSelectedClassSubject(null);
                if (v?.id) loadClassSubjects(v.id);
              }}
              renderInput={(params) => <TextField {...params} label="Select class" />}
              fullWidth
            />

            <Autocomplete
              options={subjectOptions}
              getOptionLabel={(o) => o?.label || ""}
              value={selectedSubjectOption}
              onChange={(_, v) => {
                const cs = v?.raw || null;
                setSelectedClassSubject(cs);
              }}
              renderInput={(params) => <TextField {...params} label="Select subject" />}
              fullWidth
              disabled={!selectedClass?.id || !subjectOptions.length}
            />

            <TextField
              select
              label="Module"
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              fullWidth
              disabled={!modules?.length}
              helperText={!selectedClassSubject ? "Select a subject" : !modules?.length ? "No modules" : " "}
            >
              {modules.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name || m.id}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {loading ? <Typography sx={{ opacity: 0.7, mt: 2 }}>Loading...</Typography> : null}
        </CardContent>
      </Card>

      <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
        <CardContent>
          <Typography fontWeight={600}>Content</Typography>
          <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
            {selectedClassSubject?.subject?.name ? `Subject: ${selectedClassSubject.subject.name}` : "Select a subject to view content"}
          </Typography>
          <Divider sx={{ my: 2 }} />

          {!selectedModuleId ? (
            <Typography sx={{ opacity: 0.7 }}>Select a module to view all content in full page.</Typography>
          ) : !submodules?.length ? (
            <Typography sx={{ opacity: 0.7 }}>No submodules for this module.</Typography>
          ) : (
            <Stack spacing={2}>
              {submodules.map((sm) => {
                const cs = contentsBySubmoduleId[sm.id] || [];
                return (
                  <Card key={sm.id} elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ gap: 1, flexWrap: "wrap" }}>
                        <Stack spacing={0.25}>
                          <Typography fontWeight={600}>{sm.name || "Submodule"}</Typography>
                          {sm.description ? (
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
                              {sm.description}
                            </Typography>
                          ) : null}
                        </Stack>
                        <Chip size="small" label={`${cs.length} item(s)`} variant="outlined" />
                      </Stack>
                      <Divider sx={{ my: 2 }} />

                      {!cs.length ? (
                        <Typography sx={{ opacity: 0.7 }}>No content yet.</Typography>
                      ) : (
                        <Stack spacing={1.5}>
                          {cs.map((c) => (
                            <Card key={c.id} elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                              <CardContent>
                                <Stack spacing={1}>
                                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                                    <Typography fontWeight={600}>{c.title || c.id}</Typography>
                                    {c.content_type ? <Chip size="small" label={c.content_type} /> : null}
                                  </Stack>
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
        </CardContent>
      </Card>
    </Stack>
  );
}



