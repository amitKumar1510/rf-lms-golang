import { useMemo, useState } from "react";
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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ToggleOffRoundedIcon from "@mui/icons-material/ToggleOffRounded";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

import * as assignmentService from "../../services/assignmentService";

export default function AssignmentsTab({ teacher }) {
  const [selectedClassSubject, setSelectedClassSubject] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editFor, setEditFor] = useState(null); // assignment (full)
  const [editLoading, setEditLoading] = useState(false);
  const [editErr, setEditErr] = useState(null);

  const [openSubs, setOpenSubs] = useState(false);
  const [subsFor, setSubsFor] = useState(null); // assignment
  const [subs, setSubs] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsErr, setSubsErr] = useState(null);

  const [openGrade, setOpenGrade] = useState(false);
  const [gradeFor, setGradeFor] = useState(null); // submission
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");

  const [busyId, setBusyId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignment_type: "file_upload",
    due_date: "",
    total_marks: 100,
    passing_marks: 40,
  });
  const [mcqQuestions, setMcqQuestions] = useState([]); // {question_text, question_type, optionsText, correct_answer, marks, order}[]
  const [questionPdf, setQuestionPdf] = useState(null); // File

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    assignment_type: "file_upload",
    due_date: "",
    total_marks: 100,
    passing_marks: 40,
  });
  const [editQuestions, setEditQuestions] = useState([]); // {id?, question_text, optionsText, correct_answer, marks, order}
  const [deletedQuestionIds, setDeletedQuestionIds] = useState([]); // string[]
  const [editPdfFile, setEditPdfFile] = useState(null); // File
  const [removeExistingPdf, setRemoveExistingPdf] = useState(false);

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
        };
      });
  }, [teacher]);

  const load = async (class_subject_id) => {
    if (!class_subject_id) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await assignmentService.getAllAssignments({ class_subject_id });
      setItems(data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (assignment) => {
    if (!assignment?.id) return;
    setSubsErr(null);
    setSubsLoading(true);
    try {
      const data = await assignmentService.getAssignmentSubmissions(assignment.id);
      setSubs(data || []);
    } catch (e) {
      setSubsErr(e?.response?.data?.detail || e?.message || "Failed to load submissions");
    } finally {
      setSubsLoading(false);
    }
  };

  const toBackendDatetime = (yyyyMmDd) => {
    if (!yyyyMmDd) return null;
    return `${yyyyMmDd}T00:00:00`;
  };

  const toDateInput = (v) => {
    if (!v) return "";
    try {
      const d = new Date(v);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return "";
    }
  };

  const openEditDialog = async (row) => {
    if (!row?.id) return;
    setOpenEdit(true);
    setEditErr(null);
    setEditLoading(true);
    setEditFor(null);
    setDeletedQuestionIds([]);
    setEditPdfFile(null);
    setRemoveExistingPdf(false);
    try {
      const full = await assignmentService.getAssignment(row.id);
      setEditFor(full);
      setEditForm({
        title: full?.title || "",
        description: full?.description || "",
        assignment_type: full?.assignment_type || "file_upload",
        due_date: toDateInput(full?.due_date),
        total_marks: full?.total_marks ?? 100,
        passing_marks: full?.passing_marks ?? 40,
      });
      const qs = (full?.questions || []).map((q) => ({
        id: q.id,
        question_text: q.question_text || "",
        question_type: q.question_type || "multiple_choice",
        optionsText: Array.isArray(q.options) ? q.options.join(", ") : "",
        correct_answer: q.correct_answer || "",
        marks: q.marks ?? 1,
        order: q.order ?? 0,
      }));
      setEditQuestions(qs);
    } catch (e) {
      setEditErr(e?.response?.data?.detail || e?.message || "Failed to load assignment");
    } finally {
      setEditLoading(false);
    }
  };

  const submitEdit = async () => {
    if (!editFor?.id) return;
    setBusyId(editFor.id);
    setEditErr(null);
    try {
      // update base assignment fields (do not change assignment_type here)
      await assignmentService.updateAssignment(editFor.id, {
        title: editForm.title.trim(),
        description: editForm.description?.trim() || null,
        total_marks: Number(editForm.total_marks) || 100,
        passing_marks: Number(editForm.passing_marks) || 40,
        due_date: toBackendDatetime(editForm.due_date),
      });

      // manage question PDF for file_upload
      if (editForm.assignment_type === "file_upload") {
        if (removeExistingPdf) {
          await assignmentService.deleteAssignmentQuestionFile(editFor.id);
        } else if (editPdfFile) {
          await assignmentService.uploadAssignmentQuestionFile(editFor.id, editPdfFile);
        }
      }

      // question CRUD for mcq_quiz
      if (editForm.assignment_type === "mcq_quiz") {
        // deletes
        for (const qid of deletedQuestionIds || []) {
          await assignmentService.deleteAssignmentQuestion(editFor.id, qid);
        }
        // updates + creates
        for (let i = 0; i < (editQuestions || []).length; i++) {
          const q = editQuestions[i];
          const payload = {
            question_text: q.question_text?.trim() || "",
            question_type: q.question_type || "multiple_choice",
            options: (q.optionsText || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            correct_answer: q.correct_answer?.trim() || null,
            marks: Number(q.marks) || 1,
            order: q.order != null ? Number(q.order) : i,
          };
          if (!payload.question_text) continue;
          if (q.id) await assignmentService.updateAssignmentQuestion(editFor.id, q.id, payload);
          else await assignmentService.addAssignmentQuestion(editFor.id, payload);
        }
      }

      setOpenEdit(false);
      setEditFor(null);
      setEditPdfFile(null);
      setRemoveExistingPdf(false);
      setDeletedQuestionIds([]);
      setEditQuestions([]);
      await load(selectedClassSubject?.class_subject_id);
    } catch (e) {
      setEditErr(e?.response?.data?.detail || e?.message || "Failed to update assignment");
    } finally {
      setBusyId(null);
    }
  };

  const submitCreate = async () => {
    if (!selectedClassSubject?.class_subject_id || !selectedClassSubject?.subject_id) return;
    setBusyId("create");
    setErr(null);
    try {
      const questions =
        form.assignment_type === "mcq_quiz"
          ? (mcqQuestions || [])
              .filter((q) => q.question_text?.trim())
              .map((q, idx) => ({
                question_text: q.question_text.trim(),
                question_type: q.question_type || "multiple_choice",
                options:
                  (q.optionsText || "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean) || null,
                correct_answer: q.correct_answer?.trim() || null,
                marks: Number(q.marks) || 1,
                order: q.order != null ? Number(q.order) : idx,
              }))
          : null;

      const created = await assignmentService.createAssignment({
        title: form.title.trim(),
        description: form.description?.trim() || null,
        assignment_type: form.assignment_type,
        subject_id: selectedClassSubject.subject_id,
        class_subject_id: selectedClassSubject.class_subject_id,
        total_marks: Number(form.total_marks) || 100,
        passing_marks: Number(form.passing_marks) || 40,
        due_date: toBackendDatetime(form.due_date),
        questions,
      });

      if (form.assignment_type === "file_upload" && questionPdf && created?.id) {
        await assignmentService.uploadAssignmentQuestionFile(created.id, questionPdf);
      }

      setOpenCreate(false);
      setForm({ title: "", description: "", assignment_type: "file_upload", due_date: "", total_marks: 100, passing_marks: 40 });
      setMcqQuestions([]);
      setQuestionPdf(null);
      await load(selectedClassSubject.class_subject_id);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to create assignment");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (row) => {
    setBusyId(row.id);
    setErr(null);
    try {
      await assignmentService.deleteAssignment(row.id);
      await load(selectedClassSubject.class_subject_id);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const onToggleActive = async (row) => {
    setBusyId(row.id);
    setErr(null);
    try {
      if (row.is_active) await assignmentService.deactivateAssignment(row.id);
      else await assignmentService.activateAssignment(row.id);
      await load(selectedClassSubject.class_subject_id);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const canCreate = Boolean(form.title.trim() && selectedClassSubject?.class_subject_id);

  return (
    <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, flexWrap: "wrap", gap: 1 }}>
          <Typography fontWeight={900}>Assignments</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<AddRoundedIcon />} disabled={!selectedClassSubject?.class_subject_id} onClick={() => setOpenCreate(true)}>
              Create
            </Button>
            <Button variant="outlined" startIcon={<RefreshRoundedIcon />} disabled={!selectedClassSubject?.class_subject_id || loading} onClick={() => load(selectedClassSubject.class_subject_id)}>
              Refresh
            </Button>
          </Stack>
        </Stack>
        <Divider sx={{ mb: 2 }} />

        <Autocomplete
          options={classSubjectOptions}
          getOptionLabel={(o) => o?.label || ""}
          value={selectedClassSubject}
          onChange={(_, v) => {
            setSelectedClassSubject(v);
            setItems([]);
            if (v?.class_subject_id) load(v.class_subject_id);
          }}
          renderInput={(params) => <TextField {...params} label="Select assigned class subject" />}
          sx={{ mb: 2 }}
        />

        {err ? <Alert severity="error" sx={{ mb: 2 }}>{String(err)}</Alert> : null}
        {loading ? <Typography sx={{ opacity: 0.7 }}>Loading...</Typography> : null}

        {!loading ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Due</TableCell>
                <TableCell>Marks</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items?.length ? (
                items.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell>
                      <Typography fontWeight={800}>{a.title}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {a.description || ""}
                      </Typography>
                    </TableCell>
                    <TableCell>{a.assignment_type}</TableCell>
                    <TableCell>{a.due_date ? new Date(a.due_date).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>
                      {a.passing_marks}/{a.total_marks}
                    </TableCell>
                    <TableCell>{a.is_active ? <Chip size="small" color="success" label="Active" /> : <Chip size="small" label="Inactive" />}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditRoundedIcon />}
                        disabled={busyId === a.id}
                        onClick={() => openEditDialog(a)}
                        sx={{ display: { xs: "none", sm: "inline-flex" }, mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={busyId === a.id}
                        onClick={() => {
                          setSubsFor(a);
                          setOpenSubs(true);
                          setSubs([]);
                          loadSubmissions(a);
                        }}
                        sx={{ display: { xs: "none", sm: "inline-flex" }, mr: 1 }}
                      >
                        Submissions
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onToggleActive(a)}
                        startIcon={a.is_active ? <ToggleOffRoundedIcon /> : <ToggleOnRoundedIcon />}
                        disabled={busyId === a.id}
                        sx={{ display: { xs: "none", sm: "inline-flex" }, mr: 1 }}
                      >
                        {a.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="contained"
                        onClick={() => onDelete(a)}
                        startIcon={<DeleteOutlineRoundedIcon />}
                        disabled={busyId === a.id}
                        sx={{ display: { xs: "none", sm: "inline-flex" } }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography sx={{ opacity: 0.7 }}>
                      {selectedClassSubject?.class_subject_id ? "No assignments yet." : "Select an assigned class subject."}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : null}

        <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
          <DialogTitle>Create Assignment</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} fullWidth required />
              <TextField
                label="Description"
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                fullWidth
                multiline
                minRows={2}
              />
              <TextField
                label="Assignment type"
                value={form.assignment_type}
                onChange={(e) => setForm((s) => ({ ...s, assignment_type: e.target.value }))}
                helperText="file_upload or mcq_quiz"
                fullWidth
              />
              <TextField
                label="Due date"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((s) => ({ ...s, due_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Total marks"
                  type="number"
                  value={form.total_marks}
                  onChange={(e) => setForm((s) => ({ ...s, total_marks: e.target.value }))}
                  fullWidth
                />
                <TextField
                  label="Passing marks"
                  type="number"
                  value={form.passing_marks}
                  onChange={(e) => setForm((s) => ({ ...s, passing_marks: e.target.value }))}
                  fullWidth
                />
              </Stack>

              {form.assignment_type === "mcq_quiz" ? (
                <Stack spacing={1.5}>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight={900}>MCQ Questions</Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        setMcqQuestions((prev) => [
                          ...(prev || []),
                          {
                            question_text: "",
                            question_type: "multiple_choice",
                            optionsText: "",
                            correct_answer: "",
                            marks: 1,
                            order: (prev || []).length,
                          },
                        ])
                      }
                    >
                      Add Question
                    </Button>
                  </Stack>

                  {(mcqQuestions || []).length ? (
                    mcqQuestions.map((q, idx) => (
                      <Card key={idx} elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                        <CardContent>
                          <Stack spacing={1.5}>
                            <TextField
                              label={`Question ${idx + 1}`}
                              value={q.question_text}
                              onChange={(e) =>
                                setMcqQuestions((prev) => prev.map((x, i) => (i === idx ? { ...x, question_text: e.target.value } : x)))
                              }
                              fullWidth
                            />
                            <TextField
                              label="Options (comma separated)"
                              value={q.optionsText}
                              onChange={(e) =>
                                setMcqQuestions((prev) => prev.map((x, i) => (i === idx ? { ...x, optionsText: e.target.value } : x)))
                              }
                              fullWidth
                            />
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                              <TextField
                                label="Correct answer"
                                value={q.correct_answer}
                                onChange={(e) =>
                                  setMcqQuestions((prev) => prev.map((x, i) => (i === idx ? { ...x, correct_answer: e.target.value } : x)))
                                }
                                fullWidth
                              />
                              <TextField
                                label="Marks"
                                type="number"
                                value={q.marks}
                                onChange={(e) =>
                                  setMcqQuestions((prev) => prev.map((x, i) => (i === idx ? { ...x, marks: e.target.value } : x)))
                                }
                                fullWidth
                              />
                            </Stack>
                            <Button
                              color="error"
                              variant="contained"
                              size="small"
                              onClick={() => setMcqQuestions((prev) => prev.filter((_, i) => i !== idx))}
                            >
                              Remove
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      Add questions so students can answer MCQ quiz.
                    </Typography>
                  )}
                </Stack>
              ) : null}

              {form.assignment_type === "file_upload" ? (
                <Stack spacing={1.5}>
                  <Divider />
                  <Typography fontWeight={900}>Question PDF (optional)</Typography>
                  <Button variant="outlined" component="label">
                    {questionPdf ? `Selected: ${questionPdf.name}` : "Upload question PDF"}
                    <input
                      type="file"
                      accept="application/pdf"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setQuestionPdf(f);
                      }}
                    />
                  </Button>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    This PDF will be attached to the assignment as the question sheet.
                  </Typography>
                </Stack>
              ) : null}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button onClick={submitCreate} variant="contained" disabled={!canCreate || busyId === "create"}>
              {busyId === "create" ? "Creating..." : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit */}
        <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="md">
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {editErr ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {String(editErr)}
              </Alert>
            ) : null}
            {editLoading ? <Typography sx={{ opacity: 0.7 }}>Loading...</Typography> : null}

            {!editLoading ? (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField label="Title" value={editForm.title} onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))} fullWidth required />
                <TextField
                  label="Description"
                  value={editForm.description}
                  onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))}
                  fullWidth
                  multiline
                  minRows={2}
                />
                <TextField label="Assignment type" value={editForm.assignment_type} disabled helperText="Type cannot be changed after creation" fullWidth />
                <TextField
                  label="Due date"
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm((s) => ({ ...s, due_date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Total marks"
                    type="number"
                    value={editForm.total_marks}
                    onChange={(e) => setEditForm((s) => ({ ...s, total_marks: e.target.value }))}
                    fullWidth
                  />
                  <TextField
                    label="Passing marks"
                    type="number"
                    value={editForm.passing_marks}
                    onChange={(e) => setEditForm((s) => ({ ...s, passing_marks: e.target.value }))}
                    fullWidth
                  />
                </Stack>

                {editForm.assignment_type === "file_upload" ? (
                  <Stack spacing={1.5}>
                    <Divider />
                    <Typography fontWeight={900}>Question PDF</Typography>
                    {editFor?.question_file_url ? (
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                        <Button component="a" href={editFor.question_file_url} target="_blank" rel="noreferrer" variant="outlined">
                          Open current PDF
                        </Button>
                        <Button
                          color="error"
                          variant="contained"
                          onClick={() => setRemoveExistingPdf(true)}
                          disabled={removeExistingPdf}
                        >
                          {removeExistingPdf ? "Will remove on save" : "Remove PDF"}
                        </Button>
                      </Stack>
                    ) : (
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        No PDF attached.
                      </Typography>
                    )}
                    <Button variant="outlined" component="label" disabled={removeExistingPdf}>
                      {editPdfFile ? `Selected: ${editPdfFile.name}` : "Replace / Upload PDF"}
                      <input
                        type="file"
                        accept="application/pdf"
                        hidden
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          setEditPdfFile(f);
                        }}
                      />
                    </Button>
                  </Stack>
                ) : null}

                {editForm.assignment_type === "mcq_quiz" ? (
                  <Stack spacing={1.5}>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight={900}>Questions</Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          setEditQuestions((prev) => [
                            ...(prev || []),
                            {
                              id: null,
                              question_text: "",
                              question_type: "multiple_choice",
                              optionsText: "",
                              correct_answer: "",
                              marks: 1,
                              order: (prev || []).length,
                            },
                          ])
                        }
                      >
                        Add Question
                      </Button>
                    </Stack>
                    {(editQuestions || []).length ? (
                      editQuestions.map((q, idx) => (
                        <Card key={q.id || `new-${idx}`} elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                          <CardContent>
                            <Stack spacing={1.5}>
                              <TextField
                                label={`Question ${idx + 1}`}
                                value={q.question_text}
                                onChange={(e) =>
                                  setEditQuestions((prev) => prev.map((x, i) => (i === idx ? { ...x, question_text: e.target.value } : x)))
                                }
                                fullWidth
                              />
                              <TextField
                                label="Options (comma separated)"
                                value={q.optionsText}
                                onChange={(e) =>
                                  setEditQuestions((prev) => prev.map((x, i) => (i === idx ? { ...x, optionsText: e.target.value } : x)))
                                }
                                fullWidth
                              />
                              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                <TextField
                                  label="Correct answer"
                                  value={q.correct_answer}
                                  onChange={(e) =>
                                    setEditQuestions((prev) => prev.map((x, i) => (i === idx ? { ...x, correct_answer: e.target.value } : x)))
                                  }
                                  fullWidth
                                />
                                <TextField
                                  label="Marks"
                                  type="number"
                                  value={q.marks}
                                  onChange={(e) =>
                                    setEditQuestions((prev) => prev.map((x, i) => (i === idx ? { ...x, marks: e.target.value } : x)))
                                  }
                                  fullWidth
                                />
                              </Stack>
                              <Button
                                color="error"
                                variant="contained"
                                size="small"
                                onClick={() => {
                                  if (q.id) setDeletedQuestionIds((prev) => [...new Set([...(prev || []), q.id])]);
                                  setEditQuestions((prev) => prev.filter((_, i) => i !== idx));
                                }}
                              >
                                Delete Question
                              </Button>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        No questions. Add at least one question for MCQ quiz.
                      </Typography>
                    )}
                  </Stack>
                ) : null}
              </Stack>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setOpenEdit(false);
                setEditFor(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={submitEdit} variant="contained" disabled={!editFor?.id || busyId === editFor?.id || editLoading}>
              {busyId === editFor?.id ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Submissions */}
        <Dialog open={openSubs} onClose={() => setOpenSubs(false)} fullWidth maxWidth="lg">
          <DialogTitle>Submissions — {subsFor?.title || ""}</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {subsErr ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {String(subsErr)}
              </Alert>
            ) : null}
            {subsLoading ? <Typography sx={{ opacity: 0.7 }}>Loading...</Typography> : null}

            {!subsLoading ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>File</TableCell>
                    <TableCell>Marks</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subs?.length ? (
                    subs.map((s) => (
                      <TableRow key={s.id} hover>
                        <TableCell>
                          <Typography fontWeight={800}>{s.student_name || s.student_id}</Typography>
                        </TableCell>
                        <TableCell>{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "-"}</TableCell>
                        <TableCell>{s.submission_type}</TableCell>
                        <TableCell>
                          {s.file_path ? (
                            <Button component="a" href={s.file_path} target="_blank" rel="noreferrer" size="small" variant="outlined">
                              Open file
                            </Button>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {s.marks_obtained != null ? `${s.marks_obtained}/${s.total_marks ?? "-"}` : "-"}
                        </TableCell>
                        <TableCell>{s.is_graded ? <Chip size="small" color="success" label="Graded" /> : <Chip size="small" label="Pending" />}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="contained"
                            disabled={!s.is_submitted || busyId === s.id}
                            onClick={() => {
                              setGradeFor(s);
                              setGradeMarks(s.marks_obtained != null ? String(s.marks_obtained) : "");
                              setGradeFeedback(s.feedback || "");
                              setOpenGrade(true);
                            }}
                          >
                            Grade
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Typography sx={{ opacity: 0.7 }}>No submissions yet.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSubs(false)}>Close</Button>
            <Button
              onClick={() => {
                if (subsFor?.id) loadSubmissions(subsFor);
              }}
              variant="outlined"
              startIcon={<RefreshRoundedIcon />}
              disabled={subsLoading}
            >
              Refresh
            </Button>
          </DialogActions>
        </Dialog>

        {/* Grade */}
        <Dialog open={openGrade} onClose={() => setOpenGrade(false)} fullWidth maxWidth="sm">
          <DialogTitle>Grade — {gradeFor?.student_name || gradeFor?.student_id || ""}</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Type: {subsFor?.assignment_type} / {gradeFor?.submission_type}
              </Typography>
              {gradeFor?.file_path ? (
                <Button component="a" href={gradeFor.file_path} target="_blank" rel="noreferrer" variant="outlined">
                  Open submitted file
                </Button>
              ) : null}
              <TextField
                label={subsFor?.assignment_type === "mcq_quiz" ? "Marks (optional for auto-grade)" : "Marks (required)"}
                value={gradeMarks}
                onChange={(e) => setGradeMarks(e.target.value)}
                type="number"
                fullWidth
              />
              <TextField
                label="Feedback (optional)"
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setOpenGrade(false);
                setGradeFor(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!subsFor?.id || !gradeFor?.id) return;
                setBusyId(gradeFor.id);
                setErr(null);
                try {
                  const payload = {};
                  const m = gradeMarks.trim();
                  if (m) payload.marks_obtained = Number(m);
                  if (gradeFeedback.trim()) payload.feedback = gradeFeedback.trim();
                  const updated = await assignmentService.gradeSubmission(subsFor.id, gradeFor.id, payload);
                  setOpenGrade(false);
                  setGradeFor(null);
                  // refresh submissions list
                  setSubs((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                } catch (e) {
                  setErr(e?.response?.data?.detail || e?.message || "Failed to grade submission");
                } finally {
                  setBusyId(null);
                }
              }}
              variant="contained"
              disabled={!subsFor?.id || !gradeFor?.id || busyId === gradeFor?.id}
            >
              {busyId === gradeFor?.id ? "Saving..." : subsFor?.assignment_type === "mcq_quiz" ? "Save / Auto-grade" : "Save"}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}


