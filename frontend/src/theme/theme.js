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
  components: {
    // Make popups/dropdowns/dialogs readable (opaque) even if cards are slightly translucent.
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: "#0f172a", // solid dark
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: "#0f172a",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: "#0f172a",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: "#0f172a",
          border: "1px solid rgba(255,255,255,0.14)",
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(0,0,0,0.72)",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#0f172a",
          border: "1px solid rgba(255,255,255,0.14)",
        },
        arrow: {
          color: "#0f172a",
        },
      },
    },
  },
});


