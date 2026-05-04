import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Card,
  CardContent,
  Chip,
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
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import * as classService from "../../services/classService";
import * as studentService from "../../services/studentService";

export default function StudentsTab() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const classOptions = useMemo(() => (classes || []).map((c) => ({ id: c.id, label: `${c.name} (${c.section})` })), [classes]);

  const loadClasses = async () => {
    try {
      const cls = await classService.getAllClasses();
      setClasses(cls || []);
    } catch {
      // non-blocking
    }
  };

  const loadStudents = async (classId) => {
    if (!classId) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await studentService.getStudentsByClassId(classId);
      setItems(data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load students");
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
      loadStudents(classOptions[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classOptions.length]);

  return (
    <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, flexWrap: "wrap", gap: 1 }}>
          <Typography fontWeight={600}>Students (Class-wise)</Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            disabled={!selectedClass?.id || loading}
            onClick={() => loadStudents(selectedClass.id)}
          >
            Refresh
          </Button>
        </Stack>
        <Divider sx={{ mb: 2 }} />

        <Autocomplete
          options={classOptions}
          getOptionLabel={(o) => o?.label || ""}
          value={selectedClass}
          onChange={(_, v) => {
            setSelectedClass(v);
            setItems([]);
            if (v?.id) loadStudents(v.id);
          }}
          renderInput={(params) => <TextField {...params} label="Select class" />}
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
                <TableCell>Student</TableCell>
                <TableCell>Roll</TableCell>
                <TableCell>Parent</TableCell>
                <TableCell>Parent Contact</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items?.length ? (
                items.map((row) => {
                  const s = row?.student;
                  const u = s?.user;
                  const p = row?.parent;
                  return (
                    <TableRow key={s?.id || Math.random()} hover>
                      <TableCell>
                        <Typography fontWeight={500}>{u?.name || "-"}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {u?.email || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>{s?.roll_number || "-"}</TableCell>
                      <TableCell>
                        <Typography fontWeight={500}>{p?.name || "-"}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {p?.relation || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{p?.phone || "-"}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {p?.email || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>{s?.is_active ? <Chip size="small" color="success" label="Active" /> : <Chip size="small" label="Inactive" />}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography sx={{ opacity: 0.7 }}>{selectedClass?.id ? "No students found." : "Select a class."}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : null}
      </CardContent>
    </Card>
  );
}




