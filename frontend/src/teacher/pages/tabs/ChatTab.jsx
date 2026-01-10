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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

import * as chatService from "../../services/chatService";
import * as studentService from "../../services/studentService";

export default function ChatTab({ teacher }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // new chat dialog
  const [openNew, setOpenNew] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const classOptions = useMemo(() => {
    const assigns = teacher?.class_assignments || [];
    const seen = new Set();
    const out = [];
    for (const a of assigns) {
      const cs = a?.class_subject;
      const cl = cs?.class_info;
      const id = cl?.id || cs?.class_id;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push({ id, label: cl ? `${cl.name} (${cl.section})` : id });
    }
    return out;
  }, [teacher]);

  const studentOptions = useMemo(() => {
    return (students || [])
      .map((row) => {
        const s = row?.student;
        const u = s?.user;
        const p = row?.parent;
        if (!p?.id) return null;
        return {
          id: s?.id,
          parent_id: p.id,
          label: `${u?.name || s?.id || "Student"}${p?.name ? ` • Parent: ${p.name}` : ""}`,
          raw: row,
        };
      })
      .filter(Boolean);
  }, [students]);

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

  const loadStudentsByClass = async (classId) => {
    if (!classId) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await studentService.getStudentsByClassId(classId);
      setStudents(data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const createConv = async () => {
    if (!selectedStudent?.parent_id) return;
    setLoading(true);
    setErr(null);
    try {
      const created = await chatService.createConversation({ parent_id: selectedStudent.parent_id });
      await loadConversations();
      setSelectedConv(created);
      setOpenNew(false);
      setSelectedClass(null);
      setStudents([]);
      setSelectedStudent(null);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to create chat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={2}>
      {err ? (
        <Alert severity="error">
          {String(err)}
        </Alert>
      ) : null}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flexWrap: "wrap", gap: 1 }}>
        <Typography fontWeight={900}>Chat</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={loadConversations} disabled={loading}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpenNew(true)}>
            New chat
          </Button>
        </Stack>
      </Stack>

      <Divider />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "320px 1fr" }, gap: 2 }}>
        <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <CardContent>
            <Typography fontWeight={900} sx={{ mb: 1 }}>
              Conversations
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {!conversations?.length ? (
              <Typography sx={{ opacity: 0.7 }}>No chats yet.</Typography>
            ) : (
              <List dense disablePadding>
                {conversations.map((c) => (
                  <ListItemButton key={c.id} selected={selectedConv?.id === c.id} onClick={() => setSelectedConv(c)} sx={{ borderRadius: 1 }}>
                    <ListItemText
                      primary={<Typography fontWeight={800}>{c.parent?.name || c.parent?.email || "Parent"}</Typography>}
                      secondary={<Typography variant="caption">{c.parent?.email || ""}</Typography>}
                    />
                    {c.last_message_at ? <Chip size="small" label={new Date(c.last_message_at).toLocaleDateString()} variant="outlined" /> : null}
                  </ListItemButton>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <CardContent>
            <Typography fontWeight={900}>Conversation</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
              {selectedConv ? `Parent: ${selectedConv.parent?.name || selectedConv.parent?.email || "-"}` : "Select a chat"}
            </Typography>
            <Divider sx={{ my: 2 }} />

            {!selectedConv ? (
              <Typography sx={{ opacity: 0.7 }}>Select a chat.</Typography>
            ) : (
              <Stack spacing={1.5}>
                <Stack spacing={1} sx={{ maxHeight: 420, overflow: "auto", pr: 1 }}>
                  {(messages || []).map((m) => {
                    const mine = m.sender_role === "teacher";
                    return (
                      <Box
                        key={m.id}
                        sx={{
                          alignSelf: mine ? "flex-end" : "flex-start",
                          maxWidth: "80%",
                          px: 1.5,
                          py: 1,
                          borderRadius: 2,
                          bgcolor: mine ? "primary.main" : "rgba(255,255,255,0.08)",
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
      </Box>

      <Dialog open={openNew} onClose={() => setOpenNew(false)} fullWidth maxWidth="sm">
        <DialogTitle>New chat</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              options={classOptions}
              getOptionLabel={(o) => o?.label || ""}
              value={selectedClass}
              onChange={(_, v) => {
                setSelectedClass(v);
                setStudents([]);
                setSelectedStudent(null);
                if (v?.id) loadStudentsByClass(v.id);
              }}
              renderInput={(params) => <TextField {...params} label="Select class" />}
            />
            <Autocomplete
              options={studentOptions}
              getOptionLabel={(o) => o?.label || ""}
              value={selectedStudent}
              onChange={(_, v) => setSelectedStudent(v)}
              renderInput={(params) => <TextField {...params} label="Select student (parent)" />}
              disabled={!students?.length}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNew(false)}>Cancel</Button>
          <Button variant="contained" disabled={!selectedStudent?.parent_id || loading} onClick={createConv}>
            Start
          </Button>
        </DialogActions>
      </Dialog>

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
    </Stack>
  );
}


