import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";

import * as subjectService from "../../services/subjectService";

export default function SubjectsContentTab({ classSubjects }) {
  const navigate = useNavigate();
  const items = useMemo(() => classSubjects || [], [classSubjects]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [teachersByClassSubjectId, setTeachersByClassSubjectId] = useState({}); // { [classSubjectId]: TeacherLike[] }

  useEffect(() => {
    // Preload teacher info per class-subject (small N; cache in-memory)
    if (!items.length) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const results = await Promise.all(
          items.map(async (cs) => {
            try {
              const teachers = await subjectService.getAllClassSubjectTeachers(cs.class_id, cs.subject_id);
              return [cs.id, teachers || []];
            } catch {
              return [cs.id, []];
            }
          }),
        );
        if (!mounted) return;
        const map = {};
        for (const [k, v] of results) map[k] = v;
        setTeachersByClassSubjectId(map);
      } catch (e) {
        if (!mounted) return;
        setErr(e?.response?.data?.detail || e?.message || "Failed to load teachers");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [items]);

  const toTeacherLabel = (t) => {
    const teacher = t?.teacher || t || null;
    const name = teacher?.name || teacher?.user?.name || "-";
    const email = teacher?.email || teacher?.user?.email || "";
    return { name, email };
  };

  return (
    <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, flexWrap: "wrap", gap: 1 }}>
          <Stack spacing={0.25}>
            <Typography fontWeight={600}>Subjects</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Tap a subject card to open its content page.
            </Typography>
          </Stack>
          <Button variant="outlined" disabled={loading} onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </Stack>
        <Divider sx={{ mb: 2 }} />

        {err ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {String(err)}
          </Alert>
        ) : null}
        {loading ? <Typography sx={{ opacity: 0.7, mb: 2 }}>Loading...</Typography> : null}

        {!items?.length ? (
          <Typography sx={{ opacity: 0.7 }}>No subjects found for your class.</Typography>
        ) : (
          <Grid container spacing={2}>
            {items.map((cs) => {
              const subj = cs?.subject || {};
              const teachers = teachersByClassSubjectId[cs.id] || [];
              const primary = teachers.find((x) => x?.is_active) || teachers[0] || null;
              const { name: teacherName, email: teacherEmail } = toTeacherLabel(primary);
              return (
                <Grid key={cs.id} item xs={12} sm={6} md={4}>
                  <Card
                    elevation={0}
                    variant="outlined"
                    sx={{
                      borderColor: "rgba(255,255,255,0.12)",
                      cursor: "pointer",
                      transition: "transform 120ms ease, border-color 120ms ease",
                      "&:hover": { transform: "translateY(-2px)", borderColor: "rgba(255,255,255,0.22)" },
                    }}
                    onClick={() => navigate(`/students/subjects/${cs.id}/content`)}
                  >
                    <CardContent>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <MenuBookRoundedIcon color="primary" />
                          <Typography fontWeight={600}>
                            {subj?.name || cs.subject_id}
                            {subj?.code ? ` (${subj.code})` : ""}
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                          <Chip size="small" icon={<SchoolRoundedIcon />} label={cs.is_compulsory ? "Compulsory" : "Elective"} />
                          {cs.credits != null ? <Chip size="small" variant="outlined" label={`Credits: ${cs.credits}`} /> : null}
                        </Stack>

                        <Divider />

                        <Stack spacing={0.5}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <PersonRoundedIcon fontSize="small" />
                            <Typography fontWeight={500}>{teacherName}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <EmailRoundedIcon fontSize="small" />
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                              {teacherEmail || "-"}
                            </Typography>
                          </Stack>
                        </Stack>

                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          Click to view modules, submodules and full content.
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}



