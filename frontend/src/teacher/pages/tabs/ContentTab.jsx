import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
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

import * as moduleService from "../../services/moduleService";
import * as submoduleService from "../../services/submoduleService";
import * as contentService from "../../services/contentService";

export default function ContentTab({ teacher }) {
  const classSubjectOptions = useMemo(() => {
    const assigns = teacher?.class_assignments || [];
    return assigns
      .filter((a) => a?.class_subject)
      .map((a) => {
        const cs = a.class_subject;
        const cl = cs?.class_info;
        const subj = cs?.subject;
        return {
          class_subject_id: a.class_subject_id,
          subject_id: cs?.subject_id,
          label: `${cl ? `${cl.name} (${cl.section})` : cs?.class_id} • ${subj ? `${subj.name} (${subj.code})` : cs?.subject_id}`,
          subject_name: subj?.name || cs?.subject_id,
        };
      });
  }, [teacher]);

  const [selectedClassSubject, setSelectedClassSubject] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [submodules, setSubmodules] = useState([]);
  const [contentsBySubmoduleId, setContentsBySubmoduleId] = useState({});

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const loadModules = async (subjectId) => {
    if (!subjectId) return;
    setLoading(true);
    setErr(null);
    try {
      const mods = await moduleService.getAllModules(subjectId);
      setModules(mods || []);
      const first = (mods || [])[0]?.id || "";
      setSelectedModuleId(first);
      setSubmodules([]);
      setContentsBySubmoduleId({});
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
    loadSubmodulesAndContents(selectedModuleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModuleId]);

  return (
    <Stack spacing={2}>
      <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, flexWrap: "wrap", gap: 1 }}>
            <Typography fontWeight={900}>Content (Assigned)</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshRoundedIcon />}
              disabled={loading || !selectedClassSubject?.subject_id}
              onClick={() => loadModules(selectedClassSubject.subject_id)}
            >
              Refresh
            </Button>
          </Stack>
          <Divider sx={{ mb: 2 }} />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Autocomplete
              options={classSubjectOptions}
              getOptionLabel={(o) => o?.label || ""}
              value={selectedClassSubject}
              onChange={(_, v) => {
                setSelectedClassSubject(v);
                setModules([]);
                setSelectedModuleId("");
                setSubmodules([]);
                setContentsBySubmoduleId({});
                if (v?.subject_id) loadModules(v.subject_id);
              }}
              renderInput={(params) => <TextField {...params} label="Select assigned class subject" />}
              fullWidth
            />

            <TextField
              select
              label="Module"
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              fullWidth
              disabled={!modules?.length}
              helperText={!selectedClassSubject ? "Select a class-subject first" : !modules?.length ? "No modules found" : " "}
            >
              {modules.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name || m.id}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {err ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {String(err)}
            </Alert>
          ) : null}
          {loading ? <Typography sx={{ opacity: 0.7, mt: 2 }}>Loading...</Typography> : null}
        </CardContent>
      </Card>

      <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
        <CardContent>
          <Typography fontWeight={900}>Content</Typography>
          <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
            {selectedClassSubject ? `Subject: ${selectedClassSubject.subject_name}` : "Select a subject"}
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
                          <Typography fontWeight={900}>{sm.name || "Submodule"}</Typography>
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
                                    <Typography fontWeight={900}>{c.title || c.id}</Typography>
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


