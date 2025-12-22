import { Box, Card, CardContent, Divider, Grid, Stack, Typography } from "@mui/material";

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
  const stats = [
    { label: "Total Admins", value: 0 },
    { label: "Total Teachers", value: 0 },
    { label: "Total Students", value: 0 },
    { label: "Total Classes", value: 0 },
    { label: "Total Subjects", value: 0 },
    { label: "Total Sessions", value: 0 },
    { label: "Total Subadmins", value: 0 },
    { label: "Total Principles", value: 0 },
  ];

  return (
    <Stack spacing={2}>
      <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
            <BoxText me={me} />
          </Stack>
        </CardContent>
      </Card>

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
        Stats are placeholders for now; we’ll wire them to routes next.
      </Typography>
    </Box>
  );
}


