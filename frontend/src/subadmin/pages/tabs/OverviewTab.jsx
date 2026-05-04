import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Card, CardContent, Divider, Grid, Stack, Typography } from "@mui/material";
import * as subadminService from "../../services/subadminService";

function StatCard({ label, value, helper }) {
  return (
    <Card
      elevation={0}
      variant="outlined"
      className="h-full overflow-hidden border border-white/10 bg-white/[0.04] shadow-[0_18px_50px_rgba(2,6,23,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-white/[0.06]"
      sx={{ borderRadius: "8px" }}
    >
      <CardContent className="p-5 md:p-6">
        <Typography variant="body2" className="text-[0.72rem] uppercase tracking-[0.18em] text-slate-400">
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={600} className="mt-2 text-[1.5rem] leading-tight text-slate-50">
          {value}
        </Typography>
        <Typography variant="body2" className="mt-2 text-sm leading-normal text-slate-400">
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

function InfoChip({ label, value }) {
  return (
    <Box className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.03] px-4 py-3">
      <Typography variant="caption" className="block text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">
        {label}
      </Typography>
      <Typography className="mt-1 truncate text-sm font-medium text-slate-100">{value || "-"}</Typography>
    </Box>
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
    <Box className="mx-auto w-full max-w-7xl">
      <Stack spacing={2.5}>
        <Card
          elevation={0}
          variant="outlined"
          className="overflow-hidden border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_24px_70px_rgba(2,6,23,0.24)]"
          sx={{ borderRadius: "8px" }}
        >
          <CardContent className="relative p-5 md:p-6 lg:p-7">
            <Box className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.1),transparent_28%)]" />
            <Grid container spacing={2.5} alignItems="stretch" className="relative z-10">
              <Grid item xs={12} lg={8}>
                <Stack spacing={2.25} className="h-full">
                  <Stack direction="row" spacing={1} className="flex-wrap">
                    <Box className="rounded-[8px] border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[0.72rem] font-medium text-emerald-300">
                      Subadmin Workspace
                    </Box>
                    <Box className="rounded-[8px] border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.72rem] font-medium text-slate-300">
                      School ID: {me?.school_id || "-"}
                    </Box>
                  </Stack>

                  <Box>
                    <Typography
                      variant="h4"
                      fontWeight={600}
                      className="text-[1.9rem] leading-tight text-slate-50 md:text-[2.2rem]"
                    >
                      Welcome back, {me?.name || "-"}
                    </Typography>
                    <Typography variant="body1" className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                      This workspace gives you a quick view of classes, teachers, students, subjects, and other school
                      activity, all pulled from the same backend overview endpoint.
                    </Typography>
                  </Box>

                  <Grid container spacing={1.25}>
                    <Grid item xs={12} sm={4}>
                      <InfoChip label="Name" value={me?.name} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <InfoChip label="Email" value={me?.email} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <InfoChip label="Phone" value={me?.phone} />
                    </Grid>
                  </Grid>
                </Stack>
              </Grid>


            </Grid>
          </CardContent>
        </Card>

        {err ? (
          <Alert severity="error" className="border border-red-500/30 bg-red-500/10 text-red-100">
            {String(err)}
          </Alert>
        ) : null}
        {loading ? <Typography className="text-sm leading-normal text-slate-400">Loading stats...</Typography> : null}

        <Box>
          <Typography variant="h6" fontWeight={600} className="mb-3 text-[1rem] leading-tight text-slate-100">
            Workspace Metrics
          </Typography>
          <Grid container spacing={1.25}>
            {stats.map((s) => (
              <Grid key={s.label} item xs={12} sm={6} md={4} xl={3}>
                <StatCard label={s.label} value={s.value} helper="Loaded from overview" />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Stack>
    </Box >
  );
}
