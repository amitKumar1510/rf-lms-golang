import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";

import * as assignmentService from "../../services/assignmentService";

export default function AssignmentsTab({ classSubjects }) {
  const classSubjectOptions = useMemo(() => {
    const xs = classSubjects || [];
    return xs
      .filter((x) => x?.id && x?.subject_id)
      .map((x) => ({
        class_subject_id: x.id,
        subject_id: x.subject_id,
        label: `${x?.subject?.name || x.subject_id}${x?.subject?.code ? ` (${x.subject.code})` : ""}`,
      }));
  }, [classSubjects]);

  const [selectedClassSubject, setSelectedClassSubject] = useState(null);
  const [items, setItems] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const subsByAssignmentId = useMemo(() => {
    const m = new Map();
    for (const s of subs || []) {
      if (s?.assignment_id) m.set(s.assignment_id, s);
    }
    return m;
  }, [subs]);

  const load = async (class_subject_id) => {
    if (!class_subject_id) return;
    setLoading(true);
    setErr(null);
    try {
      const [assignments, mySubs] = await Promise.all([
        assignmentService.getStudentAssignments({ class_subject_id }),
        assignmentService.getMySubmissions({ class_subject_id }),
      ]);
      setItems(assignments || []);
      setSubs(mySubs || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedClassSubject?.class_subject_id && classSubjectOptions.length) {
      setSelectedClassSubject(classSubjectOptions[0]);
      load(classSubjectOptions[0].class_subject_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classSubjectOptions.length]);

  // upload dialog
  const [openUpload, setOpenUpload] = useState(false);
  const [uploadFor, setUploadFor] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);

  // quiz dialog
  const [openQuiz, setOpenQuiz] = useState(false);
  const [quizFor, setQuizFor] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizErr, setQuizErr] = useState(null);
  const [quizDetails, setQuizDetails] = useState(null);
  const [answers, setAnswers] = useState({});

  const [busyId, setBusyId] = useState(null);

  const openQuizDialog = async (row) => {
    if (!row?.id) return;
    setOpenQuiz(true);
    setQuizFor(row);
    setQuizDetails(null);
    setQuizErr(null);
    setAnswers({});
    setQuizLoading(true);
    try {
      const full = await assignmentService.getStudentAssignment(row.id);
      setQuizDetails(full);
    } catch (e) {
      setQuizErr(e?.response?.data?.detail || e?.message || "Failed to load quiz");
    } finally {
      setQuizLoading(false);
    }
  };

  const statusChip = (a) => {
    const s = subsByAssignmentId.get(a.id);
    if (!s || !s.is_submitted) return <Chip size="small" label="Not submitted" />;
    if (s.is_graded) return <Chip size="small" color="success" label={`Graded ${s.marks_obtained ?? "-"} / ${s.total_marks ?? "-"}`} />;
    return <Chip size="small" color="warning" label="Submitted • Pending" />;
  };

  const toDate = (v) => {
    if (!v) return "-";
    try {
      return new Date(v).toLocaleDateString();
    } catch {
      return "-";
    }
  };

  return (
    <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, flexWrap: "wrap", gap: 1 }}>
          <Typography fontWeight={600}>Assignments</Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            disabled={!selectedClassSubject?.class_subject_id || loading}
            onClick={() => load(selectedClassSubject.class_subject_id)}
          >
            Refresh
          </Button>
        </Stack>
        <Divider sx={{ mb: 2 }} />

        <Autocomplete
          options={classSubjectOptions}
          getOptionLabel={(o) => o?.label || ""}
          value={selectedClassSubject}
          onChange={(_, v) => {
            setSelectedClassSubject(v);
            setItems([]);
            setSubs([]);
            if (v?.class_subject_id) load(v.class_subject_id);
          }}
          renderInput={(params) => <TextField {...params} label="Select subject" />}
          sx={{ mb: 2 }}
        />

        {err ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {String(err)}
          </Alert>
        ) : null}
        {loading ? <Typography sx={{ opacity: 0.7 }}>Loading...</Typography> : null}

        {!loading ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Due</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items?.length ? (
                items.map((a) => {
                  const s = subsByAssignmentId.get(a.id);
                  return (
                    <TableRow key={a.id} hover>
                      <TableCell>
                        <Typography fontWeight={500}>{a.title}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {a.description || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>{a.assignment_type}</TableCell>
                      <TableCell>{toDate(a.due_date)}</TableCell>
                      <TableCell>{statusChip(a)}</TableCell>
                      <TableCell align="right">
                        {a.assignment_type === "file_upload" ? (
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end">
                            {a.question_file_url ? (
                              <Button component="a" href={a.question_file_url} target="_blank" rel="noreferrer" size="small" variant="outlined">
                                View Questions (PDF)
                              </Button>
                            ) : null}
                            {s?.file_path ? (
                              <Button component="a" href={s.file_path} target="_blank" rel="noreferrer" size="small" variant="outlined">
                                View Submitted
                              </Button>
                            ) : null}
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<UploadFileRoundedIcon />}
                              disabled={busyId === a.id}
                              onClick={() => {
                                setUploadFor(a);
                                setUploadFile(null);
                                setOpenUpload(true);
                              }}
                            >
                              {s?.is_submitted ? "Re-upload" : "Upload"}
                            </Button>
                          </Stack>
                        ) : a.assignment_type === "mcq_quiz" ? (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<QuizRoundedIcon />}
                            disabled={busyId === a.id}
                            onClick={() => openQuizDialog(a)}
                          >
                            {s?.is_submitted ? "Re-attempt" : "Attempt quiz"}
                          </Button>
                        ) : (
                          <Typography sx={{ opacity: 0.7 }}>-</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography sx={{ opacity: 0.7 }}>
                      {selectedClassSubject?.class_subject_id ? "No assignments yet." : "Select a subject."}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : null}

        {/* Upload */}
        <Dialog open={openUpload} onClose={() => setOpenUpload(false)} fullWidth maxWidth="sm">
          <DialogTitle>Upload Submission — {uploadFor?.title || ""}</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="info">
                Upload your completed assignment file (PDF / image / doc). You can re-upload anytime before evaluation.
              </Alert>
              <Button variant="outlined" component="label">
                {uploadFile ? `Selected: ${uploadFile.name}` : "Choose file"}
                <input
                  type="file"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setUploadFile(f);
                  }}
                />
              </Button>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenUpload(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={!uploadFor?.id || !uploadFile || busyId === uploadFor?.id}
              onClick={async () => {
                if (!uploadFor?.id || !uploadFile) return;
                setBusyId(uploadFor.id);
                setErr(null);
                try {
                  const sub = await assignmentService.submitAssignmentFile(uploadFor.id, uploadFile);
                  setSubs((prev) => {
                    const m = new Map((prev || []).map((x) => [x.assignment_id, x]));
                    m.set(sub.assignment_id, sub);
                    return Array.from(m.values());
                  });
                  setOpenUpload(false);
                  setUploadFor(null);
                  setUploadFile(null);
                } catch (e) {
                  setErr(e?.response?.data?.detail || e?.message || "Upload failed");
                } finally {
                  setBusyId(null);
                }
              }}
            >
              {busyId === uploadFor?.id ? "Uploading..." : "Upload"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Quiz */}
        <Dialog open={openQuiz} onClose={() => setOpenQuiz(false)} fullWidth maxWidth="md">
          <DialogTitle>Quiz — {quizFor?.title || ""}</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {quizErr ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {String(quizErr)}
              </Alert>
            ) : null}
            {quizLoading ? <Typography sx={{ opacity: 0.7 }}>Loading...</Typography> : null}
            {!quizLoading && quizDetails ? (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Total marks: {quizDetails.total_marks} • Passing: {quizDetails.passing_marks}
                </Typography>
                {(quizDetails.questions || [])
                  .slice()
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((q, idx) => (
                    <Card key={q.id} elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                      <CardContent>
                        <Stack spacing={1}>
                          <Typography fontWeight={600}>
                            Q{idx + 1}. {q.question_text}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            Marks: {q.marks ?? 1}
                          </Typography>
                          <FormControl>
                            <RadioGroup
                              value={answers[q.id] ?? ""}
                              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                            >
                              {(q.options || []).map((opt) => (
                                <FormControlLabel key={opt} value={opt} control={<Radio />} label={opt} />
                              ))}
                            </RadioGroup>
                          </FormControl>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
              </Stack>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setOpenQuiz(false);
                setQuizFor(null);
                setQuizDetails(null);
                setAnswers({});
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={!quizFor?.id || quizLoading || busyId === quizFor?.id}
              onClick={async () => {
                if (!quizFor?.id) return;
                setBusyId(quizFor.id);
                setErr(null);
                try {
                  const payload = answers || {};
                  const sub = await assignmentService.submitAssignmentMcq(quizFor.id, payload);
                  setSubs((prev) => {
                    const m = new Map((prev || []).map((x) => [x.assignment_id, x]));
                    m.set(sub.assignment_id, sub);
                    return Array.from(m.values());
                  });
                  setOpenQuiz(false);
                  setQuizFor(null);
                  setQuizDetails(null);
                  setAnswers({});
                } catch (e) {
                  setErr(e?.response?.data?.detail || e?.message || "Submit failed");
                } finally {
                  setBusyId(null);
                }
              }}
            >
              {busyId === quizFor?.id ? "Submitting..." : "Submit"}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}



