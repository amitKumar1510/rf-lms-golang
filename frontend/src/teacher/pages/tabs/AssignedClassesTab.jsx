import { useMemo } from "react";
import { Alert, Card, CardContent, Chip, Divider, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";

export default function AssignedClassesTab({ teacher, loading, error }) {
  const rows = useMemo(() => {
    const assigns = teacher?.class_assignments || [];
    return assigns
      .filter((a) => a?.class_subject)
      .map((a) => {
        const cs = a.class_subject;
        const cl = cs?.class_info;
        const subj = cs?.subject;
        return {
          id: a.id,
          class_id: cl?.id || cs?.class_id,
          class_name: cl ? `${cl.name} (${cl.section})` : cs?.class_id,
          subject_name: subj ? `${subj.name} (${subj.code})` : cs?.subject_id,
          academic_year: a.academic_year || cl?.academic_year || "-",
          periods_per_week: a.periods_per_week ?? "-",
          syllabus_completion: a.syllabus_completion ?? 0,
          is_active: a.is_active,
        };
      });
  }, [teacher]);

  return (
    <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <CardContent>
        <Typography fontWeight={600} sx={{ mb: 1 }}>
          Assigned Classes & Subjects
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {error ? <Alert severity="error" sx={{ mb: 2 }}>{String(error)}</Alert> : null}
        {loading ? <Typography sx={{ opacity: 0.7 }}>Loading...</Typography> : null}

        {!loading ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Class</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Academic year</TableCell>
                <TableCell>Periods/week</TableCell>
                <TableCell>Syllabus %</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length ? (
                rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Typography fontWeight={500}>{r.class_name}</Typography>
                    </TableCell>
                    <TableCell>{r.subject_name}</TableCell>
                    <TableCell>{r.academic_year}</TableCell>
                    <TableCell>{r.periods_per_week}</TableCell>
                    <TableCell>{r.syllabus_completion}</TableCell>
                    <TableCell>{r.is_active ? <Chip size="small" color="success" label="Active" /> : <Chip size="small" label="Inactive" />}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography sx={{ opacity: 0.7 }}>No assigned classes found for this teacher yet.</Typography>
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



