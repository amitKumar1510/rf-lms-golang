import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, CardContent, Chip, Divider, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import * as assignmentService from "../../services/assignmentService";

function calcAvgPercent(graded) {
  const xs = graded.filter((s) => typeof s.percentage === "number");
  if (!xs.length) return null;
  const sum = xs.reduce((a, b) => a + (b.percentage || 0), 0);
  return sum / xs.length;
}

export default function MarksTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const graded = useMemo(() => (items || []).filter((s) => s?.is_graded), [items]);
  const avg = useMemo(() => calcAvgPercent(graded), [graded]);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await assignmentService.getMySubmissions();
      setItems(data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to load marks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
            <CardContent>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Total submissions
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {items?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
            <CardContent>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Graded
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {graded?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
            <CardContent>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Average score
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {avg == null ? "-" : `${avg.toFixed(1)}%`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, flexWrap: "wrap", gap: 1 }}>
            <Typography fontWeight={600}>Marks</Typography>
            <Button variant="outlined" startIcon={<RefreshRoundedIcon />} disabled={loading} onClick={load}>
              Refresh
            </Button>
          </Stack>
          <Divider sx={{ mb: 2 }} />

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
                  <TableCell>Assignment</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Marks</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Feedback</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {graded?.length ? (
                  graded.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell>
                        <Typography fontWeight={500}>{s.assignment_title || s.assignment_id}</Typography>
                      </TableCell>
                      <TableCell>{s.submission_type}</TableCell>
                      <TableCell>{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "-"}</TableCell>
                      <TableCell>
                        {s.marks_obtained != null ? `${s.marks_obtained}/${s.total_marks ?? "-"}` : "-"}
                        {typeof s.percentage === "number" ? (
                          <Typography variant="caption" sx={{ opacity: 0.7, display: "block" }}>
                            {s.percentage.toFixed(1)}%
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>{s.grade ? <Chip size="small" color="success" label={s.grade} /> : "-"}</TableCell>
                      <TableCell>{s.feedback || "-"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography sx={{ opacity: 0.7 }}>No graded marks yet.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </Stack>
  );
}



