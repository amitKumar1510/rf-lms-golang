import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

import * as chatService from "../../services/chatService";
import * as subjectService from "../../services/subjectService";

export default function ChatTab({ classId, classSubjects }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);

  const [newSubject, setNewSubject] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [newTeacher, setNewTeacher] = useState(null);

  const [text, setText] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const subjectOptions = useMemo(() => {
    return (classSubjects || []).map((cs) => ({
      id: cs.id,
      subject_id: cs.subject_id,
      label: cs?.subject?.name ? `${cs.subject.name}${cs.subject.code ? ` (${cs.subject.code})` : ""}` : cs.subject_id,
      raw: cs,
    }));
  }, [classSubjects]);

  const teacherOptions = useMemo(() => {
    return (teachers || []).map((t) => ({
      id: t?.teacher?.id || t?.teacher_id || t?.id,
      label: `${t?.teacher?.name || t?.teacher?.email || "Teacher"}${t?.teacher?.email ? ` • ${t.teacher.email}` : ""}`,
      raw: t,
    }));
  }, [teachers]);

  const loadConversations = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await chatService.listConversations();
      setConversations(data || []);
      if (!selectedConv && data?.length) setSelectedConv(data[0]);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId) => {
    if (!convId) return;
    try {
      const res = await chatService.listMessages(convId, { limit: 200 });
      setMessages(res?.items || []);
    } catch {
      // keep quiet
    }
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedConv?.id) return;
    loadMessages(selectedConv.id);
    const t = setInterval(() => loadMessages(selectedConv.id), 4000);
    return () => clearInterval(t);
  }, [selectedConv?.id]);

  const loadTeachersForSubject = async (cs) => {
    setTeachers([]);
    setNewTeacher(null);
    if (!classId || !cs?.subject_id) return;
    try {
      const data = await subjectService.getAllClassSubjectTeachers(classId, cs.subject_id);
      setTeachers((data || []).filter((x) => x?.teacher?.id));
    } catch {
      setTeachers([]);
    }
  };

  const createConv = async () => {
    if (!newTeacher?.id) return;
    setLoading(true);
    setErr(null);
    try {
      const created = await chatService.createConversation({
        teacher_id: newTeacher.id,
        class_subject_id: newSubject?.id || null,
      });
      await loadConversations();
      setSelectedConv(created);
      setNewTeacher(null);
      setNewSubject(null);
      setTeachers([]);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to create chat");
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    const m = text.trim();
    if (!m || !selectedConv?.id) return;
    setText("");
    try {
      await chatService.sendMessage(selectedConv.id, m);
      await loadMessages(selectedConv.id);
      await loadConversations();
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to send message");
    }
  };

  const openEdit = (m) => {
    setEditingMsg(m);
    setEditText(m?.text || "");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    const m = editingMsg;
    const t = editText.trim();
    if (!m?.id || !selectedConv?.id || !t) return;
    try {
      await chatService.updateMessage(selectedConv.id, m.id, t);
      setEditOpen(false);
      setEditingMsg(null);
      setEditText("");
      await loadMessages(selectedConv.id);
      await loadConversations();
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to edit message");
    }
  };

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, flexWrap: "wrap", gap: 1 }}>
                <Typography fontWeight={900}>Chats</Typography>
                <Button variant="outlined" size="small" startIcon={<RefreshRoundedIcon />} onClick={loadConversations} disabled={loading}>
                  Refresh
                </Button>
              </Stack>
              <Divider sx={{ mb: 2 }} />

            <Typography fontWeight={800} sx={{ mb: 1 }}>
              Start new chat
            </Typography>
            <Stack spacing={1.5}>
              <Autocomplete
                options={subjectOptions}
                getOptionLabel={(o) => o?.label || ""}
                value={newSubject}
                onChange={(_, v) => {
                  setNewSubject(v);
                  if (v?.raw) loadTeachersForSubject(v.raw);
                }}
                renderInput={(params) => <TextField {...params} label="Subject (optional)" />}
                disabled={!classId}
              />
              <Autocomplete
                options={teacherOptions}
                getOptionLabel={(o) => o?.label || ""}
                value={newTeacher}
                onChange={(_, v) => setNewTeacher(v)}
                renderInput={(params) => <TextField {...params} label="Teacher" />}
                disabled={!teachers?.length}
              />
              <Button variant="contained" disabled={!newTeacher?.id || loading} onClick={createConv}>
                Start chat
              </Button>
            </Stack>

            <Divider sx={{ my: 2 }} />
            {err ? <Alert severity="error" sx={{ mb: 2 }}>{String(err)}</Alert> : null}
            {loading ? <Typography sx={{ opacity: 0.7, mb: 2 }}>Loading...</Typography> : null}

            {!conversations?.length ? (
              <Typography sx={{ opacity: 0.7 }}>No chats yet.</Typography>
            ) : (
              <List dense disablePadding>
                {conversations.map((c) => (
                  <ListItemButton key={c.id} selected={selectedConv?.id === c.id} onClick={() => setSelectedConv(c)} sx={{ borderRadius: 1 }}>
                    <ListItemText
                      primary={<Typography fontWeight={800}>{c.teacher?.name || c.teacher?.email || "Teacher"}</Typography>}
                      secondary={<Typography variant="caption">{c.teacher?.email || ""}</Typography>}
                    />
                    {c.last_message_at ? <Chip size="small" label={new Date(c.last_message_at).toLocaleDateString()} variant="outlined" /> : null}
                  </ListItemButton>
                ))}
              </List>
            )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
            <CardContent>
              <Typography fontWeight={900}>Conversation</Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
                {selectedConv ? `Teacher: ${selectedConv.teacher?.name || selectedConv.teacher?.email || "-"}` : "Select a chat"}
              </Typography>
              <Divider sx={{ my: 2 }} />

            {!selectedConv ? (
              <Typography sx={{ opacity: 0.7 }}>Select a chat from the left.</Typography>
            ) : (
              <Stack spacing={1.5}>
                <Stack spacing={1} sx={{ maxHeight: 420, overflow: "auto", pr: 1 }}>
                  {(messages || []).map((m) => {
                    const mine = m.sender_role === "parent";
                    return (
                      <Box
                        key={m.id}
                        sx={{
                          width: "100%",
                          px: 1.5,
                          py: 1,
                          borderRadius: 2,
                          bgcolor: mine ? "primary.main" : "rgba(255,255,255,0.08)",
                          textAlign: mine ? "right" : "left",
                        }}
                      >
                        {mine ? (
                          <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mb: 0.25 }}>
                            <IconButton
                              size="small"
                              onClick={() => openEdit(m)}
                              sx={{ color: "inherit", opacity: 0.9 }}
                              aria-label="Edit message"
                            >
                              <EditRoundedIcon fontSize="inherit" />
                            </IconButton>
                          </Stack>
                        ) : null}
                        <Typography sx={{ whiteSpace: "pre-wrap" }}>{m.text}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {new Date(m.created_at).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>

                <Divider />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <TextField
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    label="Type a message"
                    fullWidth
                    multiline
                    minRows={2}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                  <Button variant="contained" startIcon={<SendRoundedIcon />} onClick={send} disabled={!text.trim()}>
                    Send
                  </Button>
                </Stack>
              </Stack>
            )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit message</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            label="Message"
            fullWidth
            multiline
            minRows={3}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditOpen(false);
              setEditingMsg(null);
              setEditText("");
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={saveEdit} disabled={!editText.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}


