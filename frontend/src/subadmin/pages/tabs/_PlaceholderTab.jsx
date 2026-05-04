import { Card, CardContent, Divider, Typography } from "@mui/material";

export default function PlaceholderTab({ title, subtitle = "We will integrate routes here next." }) {
  return (
    <Card elevation={0} variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
      <CardContent>
        <Typography fontWeight={600} sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography sx={{ opacity: 0.75 }}>{subtitle}</Typography>
      </CardContent>
    </Card>
  );
}



