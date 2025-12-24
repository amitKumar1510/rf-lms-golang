import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { clearError, loginThunk, parentLoginThunk } from "../../store/authSlice";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Stack,
  Tab,
  Tabs,
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
  const [mode, setMode] = useState("school"); // school | parent

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
    dispatch(clearError());
    if (mode === "parent") await dispatch(parentLoginThunk({ email, password }));
    else await dispatch(loginThunk({ email, password }));
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
                  Login
                </Typography>
              </Stack>

              <Typography variant="body2" sx={{ opacity: 0.75 }}>
                Sign in to access the respective dashboard.
              </Typography>

              <Tabs
                value={mode}
                onChange={(_, v) => {
                  setMode(v);
                  setEmail("");
                  setPassword("");
                  dispatch(clearError());
                }}
                variant="fullWidth"
              >
                <Tab label="School Login" value="school" />
                <Tab label="Parent Login" value="parent" />
              </Tabs>
              <Divider />

              <Box component="form" onSubmit={onSubmit}>
                <Stack spacing={2}>
                  <TextField
                    label={mode === "parent" ? "Parent Email" : "Email"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={mode === "parent" ? "parent@example.com" : "admin@example.com"}
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
                    {status === "loading" ? "Signing in..." : mode === "parent" ? "Sign in as Parent" : "Sign in"}
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
