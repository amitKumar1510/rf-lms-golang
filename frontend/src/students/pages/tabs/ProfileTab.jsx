import { Card, CardContent, Divider, Grid, Stack, Typography } from "@mui/material";

function Field({ label, value }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" sx={{ opacity: 0.7 }}>
        {label}
      </Typography>
      <Typography fontWeight={500}>{value != null && String(value).trim() !== "" ? String(value) : "-"}</Typography>
    </Stack>
  );
}

export default function ProfileTab({ profile }) {
  const student = profile?.student || null;
  const parent = profile?.parent || null;
  const address = profile?.address || null;
  const user = student?.user || null;
  const cls = student?.class_info || null;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <CardContent>
            <Typography fontWeight={600} sx={{ mb: 1 }}>
              Student Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Field label="Name" value={user?.name} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field label="Email" value={user?.email} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field label="Phone" value={user?.phone} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field label="Roll number" value={student?.roll_number} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field label="Gender" value={student?.gender} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field label="Blood group" value={student?.blood_group} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field
                  label="Date of birth"
                  value={student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : "-"}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field
                  label="Class"
                  value={cls ? `${cls?.name || ""} ${cls?.section ? `(${cls.section})` : ""}`.trim() : student?.class_id}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
          <CardContent>
            <Typography fontWeight={600} sx={{ mb: 1 }}>
              Parent Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Field label="Name" value={parent?.name} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field label="Relation" value={parent?.relation} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field label="Phone" value={parent?.phone} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field label="Email" value={parent?.email} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field label="Occupation" value={parent?.occupation} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field label="Education" value={parent?.education_level} />
              </Grid>
              <Grid item xs={12}>
                <Field
                  label="Address"
                  value={
                    address
                      ? [address.street, address.city, address.state, address.country, address.postal_code].filter(Boolean).join(", ")
                      : "-"
                  }
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}




