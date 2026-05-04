import { createTheme } from "@mui/material/styles";
import { buildSaasComponents, buildTypography } from "./themeShared";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#38bdf8" },
    background: {
      default: "#060b16",
      paper: "rgba(10, 17, 32, 0.82)",
    },
    text: {
      primary: "#e5eefc",
      secondary: "#9aa8bf",
    },
  },
  shape: { borderRadius: 18 },
  typography: buildTypography(),
  components: buildSaasComponents({
    mode: "dark",
    backgroundDefault: "#060b16",
    surfaceBackground: "rgba(10, 17, 32, 0.82)",
    surfaceBorder: "rgba(148, 163, 184, 0.16)",
    surfaceShadow: "0 24px 70px rgba(2, 6, 23, 0.34)",
    paperShadow: "0 24px 70px rgba(2, 6, 23, 0.34)",
    appBarBackground: "rgba(7, 16, 31, 0.78)",
    backdropBackground: "rgba(2, 6, 23, 0.72)",
    tooltipBackground: "#0f172a",
    tooltipArrow: "#0f172a",
    textPrimary: "#e5eefc",
    textSecondary: "#9aa8bf",
  }),
});
