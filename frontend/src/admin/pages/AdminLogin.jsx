import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loginThunk } from "../../store/authSlice";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";

export default function AdminLogin() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error, accessToken, user } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Cookie-based sessions may not have accessToken in localStorage, but /api/users/me sets user.
    if (user?.role) {
      const role = user.role;
      if (role === "admin") navigate("/admin/dashboard");
      else if (role === "subadmin") navigate("/subadmin/dashboard");
      else if (role === "teacher") navigate("/teacher/dashboard");
      else if (role === "student") navigate("/students/dashboard");
      else if (role === "parent") navigate("/parent/dashboard");
      else if (role === "principle") navigate("/principle/dashboard");
      else navigate("/admin/dashboard");
      return;
    }
    // Fallback for bearer-token-only flows
    if (accessToken) navigate("/admin/dashboard");
  }, [accessToken, navigate, user]);

  const onSubmit = async (e) => {
    e.preventDefault();
    await dispatch(loginThunk({ email, password }));
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
                <Typography variant="h5" fontWeight={800}>
                  Admin Login
                </Typography>
              </Stack>

              <Typography variant="body2" sx={{ opacity: 0.75 }}>
                Sign in to access Admin dashboard.
              </Typography>

              <Box component="form" onSubmit={onSubmit}>
                <Stack spacing={2}>
                  <TextField
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    type="email"
                    required
                    fullWidth
                    autoComplete="email"
                  />

                  <TextField
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    type="password"
                    required
                    fullWidth
                    autoComplete="current-password"
                  />

                  {error ? <Alert severity="error">{String(error)}</Alert> : null}

                  <Button
                    variant="contained"
                    size="large"
                    type="submit"
                    disabled={status === "loading"}
                    fullWidth
                  >
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
