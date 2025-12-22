import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#2563eb" },
    background: {
      default: "#0b1220",
      paper: "rgba(255,255,255,0.06)",
    },
  },
  shape: { borderRadius: 14 },
});


