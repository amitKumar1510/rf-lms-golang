import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { parentLoginThunk } from "../../store/authSlice";
import { Alert, Box, Button, Card, CardContent, Container, Stack, TextField, Typography } from "@mui/material";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";

export default function ParentLogin() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error, user } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user?.role === "parent") navigate("/parent/dashboard");
  }, [navigate, user]);

  const onSubmit = async (e) => {
    e.preventDefault();
    await dispatch(parentLoginThunk({ email, password }));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(135deg, #0b1220 0%, #111827 60%, #0b1220 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Card elevation={0} sx={{ bgcolor: "background.paper", border: "1px solid rgba(255,255,255,0.12)" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <LoginRoundedIcon color="primary" />
                <Typography variant="h5" fontWeight={500}>
                  Parent Login
                </Typography>
              </Stack>

              <Typography variant="body2" sx={{ opacity: 0.75 }}>
                Sign in to access Parent dashboard.
              </Typography>

              <Box component="form" onSubmit={onSubmit}>
                <Stack spacing={2}>
                  <TextField
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    fullWidth
                    autoComplete="email"
                  />
                  <TextField
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    required
                    fullWidth
                    autoComplete="current-password"
                  />

                  {error ? <Alert severity="error">{String(error)}</Alert> : null}

                  <Button variant="contained" size="large" type="submit" disabled={status === "loading"} fullWidth>
                    {status === "loading" ? "Signing in..." : "Sign in"}
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}



