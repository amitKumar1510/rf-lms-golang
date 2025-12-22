import { Box, Container, Typography } from "@mui/material";

export default function StudentDashboard() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      <Container maxWidth="md">
        <Typography variant="h5" fontWeight={900}>
          Student Dashboard
        </Typography>
        <Typography sx={{ opacity: 0.7, mt: 1 }}>Coming soon.</Typography>
      </Container>
    </Box>
  );
}


