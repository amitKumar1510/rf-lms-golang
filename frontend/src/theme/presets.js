import { createTheme } from "@mui/material/styles";

const baseComponents = {
  // readable popups/dropdowns/dialogs (opaque)
  MuiPopover: {
    styleOverrides: {
      paper: {
        backgroundImage: "none",
        backgroundColor: "#0f172a",
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
};

export const THEME_PRESETS = [
  {
    id: "dark_glass",
    name: "Dark Glass (Default)",
    theme: createTheme({
      palette: {
        mode: "dark",
        primary: { main: "#2563eb" },
        background: {
          default: "#0b1220",
          paper: "rgba(255,255,255,0.06)",
        },
      },
      shape: { borderRadius: 14 },
      components: baseComponents,
    }),
  },
  {
    id: "dark_solid",
    name: "Dark Solid",
    theme: createTheme({
      palette: {
        mode: "dark",
        primary: { main: "#22c55e" },
        background: {
          default: "#0b1020",
          paper: "#0f172a",
        },
      },
      shape: { borderRadius: 14 },
      components: baseComponents,
    }),
  },
  {
    id: "light_clean",
    name: "Light Clean",
    theme: createTheme({
      palette: {
        mode: "light",
        primary: { main: "#2563eb" },
        background: {
          default: "#f5f7fb",
          paper: "#ffffff",
        },
      },
      shape: { borderRadius: 14 },
      components: {
        ...baseComponents,
        MuiPopover: {
          styleOverrides: {
            paper: {
              backgroundImage: "none",
              backgroundColor: "#ffffff",
              border: "1px solid rgba(15,23,42,0.12)",
              boxShadow: "0 16px 40px rgba(15,23,42,0.18)",
            },
          },
        },
        MuiMenu: {
          styleOverrides: {
            paper: {
              backgroundImage: "none",
              backgroundColor: "#ffffff",
              border: "1px solid rgba(15,23,42,0.12)",
              boxShadow: "0 16px 40px rgba(15,23,42,0.18)",
            },
          },
        },
        MuiAutocomplete: {
          styleOverrides: {
            paper: {
              backgroundImage: "none",
              backgroundColor: "#ffffff",
              border: "1px solid rgba(15,23,42,0.12)",
              boxShadow: "0 16px 40px rgba(15,23,42,0.18)",
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              backgroundImage: "none",
              backgroundColor: "#ffffff",
              border: "1px solid rgba(15,23,42,0.12)",
            },
          },
        },
        MuiBackdrop: {
          styleOverrides: {
            root: {
              backgroundColor: "rgba(15,23,42,0.35)",
            },
          },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              backgroundColor: "#111827",
              border: "1px solid rgba(255,255,255,0.18)",
            },
            arrow: { color: "#111827" },
          },
        },
      },
    }),
  },
  {
    id: "high_contrast",
    name: "High Contrast",
    theme: createTheme({
      palette: {
        mode: "dark",
        primary: { main: "#fbbf24" },
        background: {
          default: "#000000",
          paper: "#0b0b0b",
        },
      },
      shape: { borderRadius: 10 },
      components: baseComponents,
    }),
  },
  {
    id: "midnight_purple",
    name: "Midnight Purple",
    theme: createTheme({
      palette: {
        mode: "dark",
        primary: { main: "#a78bfa" },
        background: {
          default: "#090a14",
          paper: "rgba(167,139,250,0.08)",
        },
      },
      shape: { borderRadius: 14 },
      components: baseComponents,
    }),
  },
];

export function getThemeById(id) {
  return THEME_PRESETS.find((t) => t.id === id)?.theme || THEME_PRESETS[0].theme;
}


