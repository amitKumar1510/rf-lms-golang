import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

import * as notificationService from "./notificationService";

export default function NotificationsBell({ role }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [sendOpen, setSendOpen] = useState(false);
  const [audience, setAudience] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sendStatus, setSendStatus] = useState(null);

  const canSend = role === "principle";

  const refreshUnread = async () => {
    try {
      const r = await notificationService.getUnreadCount();
      setUnread(Number(r?.count || 0));
    } catch {
      // ignore
    }
  };

  const loadInbox = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await notificationService.getInbox({ limit: 80 });
      setItems(res?.items || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // One-time fetch as fallback (WS will keep it updated)
    refreshUnread();
  }, []);

  useEffect(() => {
    const httpBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const wsBase = httpBase.replace(/^http/, "ws");
    const token = localStorage.getItem("access_token");
    if (!token) return;

    let reconnect = null;
    let ws = null;
    let backoff = 1000;

    const connect = () => {
      try {
        if (reconnect) clearTimeout(reconnect);
        ws = new WebSocket(`${wsBase}/ws/notifications?token=${encodeURIComponent(token)}`);
        ws.onopen = () => {
          backoff = 1000;
        };
        ws.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            if (data?.type === "notification.unread_count") {
              setUnread(Number(data?.count || 0));
            }
            if (data?.type === "notification.new") {
              setUnread((x) => Number(x || 0) + 1);
            }
          } catch {
            // ignore
          }
        };
        ws.onclose = () => {
          const next = Math.min(backoff * 2, 30000);
          reconnect = setTimeout(connect, backoff);
          backoff = next;
        };
      } catch {
        const next = Math.min(backoff * 2, 30000);
        reconnect = setTimeout(connect, backoff);
        backoff = next;
      }
    };

    connect();
    return () => {
      try {
        if (reconnect) clearTimeout(reconnect);
      } catch {
        // ignore
      }
      try {
        ws?.close();
      } catch {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    loadInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onMarkRead = async (row) => {
    if (!row?.id || row?.is_read) return;
    try {
      await notificationService.markRead(row.id);
      await refreshUnread();
      await loadInbox();
    } catch {
      // ignore
    }
  };

  const onMarkAllRead = async () => {
    const unreadRows = (items || []).filter((x) => x && !x.is_read);
    for (const r of unreadRows) {
      // sequential to avoid backend spikes
      // eslint-disable-next-line no-await-in-loop
      await onMarkRead(r);
    }
  };

  const send = async () => {
    const t = title.trim();
    const m = message.trim();
    if (!t || !m) return;
    setSendStatus(null);
    try {
      const res = await notificationService.sendNotification({ title: t, message: m, audience });
      setSendStatus(res?.message || "Sent");
      setTitle("");
      setMessage("");
      setAudience("all");
      setSendOpen(false);
    } catch (e) {
      setSendStatus(e?.response?.data?.detail || e?.message || "Failed to send");
    }
  };

  const audienceOptions = useMemo(
    () => [
      { value: "all", label: "All users (same school)" },
      { value: "subadmin", label: "Subadmins" },
      { value: "teacher", label: "Teachers" },
      { value: "student", label: "Students" },
      { value: "parent", label: "Parents" },
    ],
    []
  );

  return (
    <>
      <IconButton color="inherit" onClick={() => setOpen(true)} title="Notifications">
        <Badge color="error" badgeContent={unread} max={99}>
          <NotificationsRoundedIcon />
        </Badge>
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ gap: 1, flexWrap: "wrap" }}>
            <Typography fontWeight={900}>Notifications</Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" startIcon={<MarkEmailReadRoundedIcon />} onClick={onMarkAllRead} disabled={!items?.some((x) => x && !x.is_read)}>
                Mark all read
              </Button>
              {canSend ? (
                <Button size="small" variant="contained" startIcon={<SendRoundedIcon />} onClick={() => setSendOpen(true)}>
                  Send
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {sendStatus ? (
            <Typography sx={{ mb: 1, color: sendStatus === "Sent" ? "success.main" : "warning.main" }}>{String(sendStatus)}</Typography>
          ) : null}
          {err ? <Typography sx={{ mb: 1, color: "error.main" }}>{String(err)}</Typography> : null}
          {loading ? <Typography sx={{ opacity: 0.7 }}>Loading...</Typography> : null}

          {!items?.length ? (
            <Typography sx={{ opacity: 0.7 }}>No notifications.</Typography>
          ) : (
            <List dense disablePadding>
              {items.map((row) => {
                const n = row?.notification;
                return (
                  <ListItemButton
                    key={row.id}
                    onClick={() => onMarkRead(row)}
                    sx={{ borderRadius: 1, mb: 0.5, border: row.is_read ? "1px solid transparent" : "1px solid rgba(255,255,255,0.18)" }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ gap: 1 }}>
                          <Typography fontWeight={900}>{n?.title || "Notification"}</Typography>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {n?.created_at ? new Date(n.created_at).toLocaleString() : ""}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography sx={{ opacity: 0.85, whiteSpace: "pre-wrap" }}>{n?.message || ""}</Typography>
                          {!row.is_read ? (
                            <Typography variant="caption" sx={{ color: "error.main" }}>
                              Unread
                            </Typography>
                          ) : null}
                        </Box>
                      }
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={sendOpen} onClose={() => setSendOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Send notification</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Audience" value={audience} onChange={(e) => setAudience(e.target.value)}>
              {audienceOptions.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextField label="Message" value={message} onChange={(e) => setMessage(e.target.value)} multiline minRows={4} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={send} disabled={!title.trim() || !message.trim()}>
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}


