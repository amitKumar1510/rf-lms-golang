import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Card, CardContent, Divider, Grid, Stack, Typography } from "@mui/material";
import * as subadminService from "../../services/subadminService";

function StatCard({ label, value }) {
  return (
    <Card elevation={0} variant="outlined" sx={{ height: "100%", borderColor: "rgba(255,255,255,0.12)" }}>
      <CardContent>
        <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.1 }}>
          {value}
        </Typography>
        <Typography sx={{ opacity: 0.75, mt: 0.5 }}>{label}</Typography>
      </CardContent>
    </Card>
  );
}

export default function OverviewTab({ me }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await subadminService.getOverview();
        setCounts(data);
      } catch (e) {
        setErr(e?.response?.data?.detail || e?.message || "Failed to load overview stats");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const stats = useMemo(
    () => [
      { label: "Total Teachers", value: counts?.total_teachers ?? 0 },
      { label: "Total Students", value: counts?.total_students ?? 0 },
      { label: "Total Classes", value: counts?.total_classes ?? 0 },
      { label: "Total Subjects", value: counts?.total_subjects ?? 0 },
      { label: "Total Departments", value: counts?.total_departments ?? 0 },
      { label: "Total Sessions", value: counts?.total_sessions ?? 0 },
      { label: "Total Subadmins", value: counts?.total_subadmins ?? 0 },
    ],
    [counts],
  );

  return (
    <Stack spacing={2}>
      <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
            <BoxText me={me} />
          </Stack>
        </CardContent>
      </Card>

      {err ? <Alert severity="error">{String(err)}</Alert> : null}
      {loading ? <Typography sx={{ opacity: 0.7 }}>Loading stats...</Typography> : null}

      <Grid container spacing={2}>
        {stats.map((s) => (
          <Grid key={s.label} item xs={12} sm={6} md={3}>
            <StatCard label={s.label} value={s.value} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

function BoxText({ me }) {
  return (
    <Box sx={{ width: "100%" }}>
      <Typography fontWeight={900} sx={{ mb: 0.8 }}>
        Overview
      </Typography>
      <Divider sx={{ mb: 1.5 }} />
      <Stack spacing={0.3}>
        <Typography>
          <b>Name:</b> {me?.name || "-"}
        </Typography>
        <Typography>
          <b>Email:</b> {me?.email || "-"}
        </Typography>
        <Typography>
          <b>Phone:</b> {me?.phone || "-"}
        </Typography>
        <Typography>
          <b>School ID:</b> {me?.school_id || "-"}
        </Typography>
      </Stack>
      <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: "block" }}>
        Stats are loaded from your backend overview endpoint.
      </Typography>
    </Box>
  );
}


