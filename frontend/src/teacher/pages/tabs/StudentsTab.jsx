import { useMemo, useState } from "react";
import { Alert, Autocomplete, Card, CardContent, Chip, Divider, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import * as studentService from "../../services/studentService";

export default function StudentsTab({ teacher }) {
  const [selectedClass, setSelectedClass] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

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
      out.push({
        id,
        label: cl ? `${cl.name} (${cl.section})` : id,
      });
    }
    return out;
  }, [teacher]);

  const load = async (classId) => {
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

  return (
    <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <CardContent>
        <Typography fontWeight={900} sx={{ mb: 1 }}>
          Students (Class-wise)
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Autocomplete
          options={classOptions}
          getOptionLabel={(o) => o?.label || ""}
          value={selectedClass}
          onChange={(_, v) => {
            setSelectedClass(v);
            setItems([]);
            if (v?.id) load(v.id);
          }}
          renderInput={(params) => <TextField {...params} label="Select class" />}
          sx={{ mb: 2 }}
        />

        {err ? <Alert severity="error" sx={{ mb: 2 }}>{String(err)}</Alert> : null}
        {loading ? <Typography sx={{ opacity: 0.7 }}>Loading...</Typography> : null}

        {!loading ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Roll</TableCell>
                <TableCell>Parent</TableCell>
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
                    <TableRow key={s?.id} hover>
                      <TableCell>
                        <Typography fontWeight={800}>{u?.name || "-"}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {u?.email || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>{s?.roll_number || "-"}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{p?.name || "-"}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {p?.phone || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>{s?.is_active ? <Chip size="small" color="success" label="Active" /> : <Chip size="small" label="Inactive" />}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography sx={{ opacity: 0.7 }}>
                      {selectedClass?.id ? "No students found." : "Select a class to view students."}
                    </Typography>
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


