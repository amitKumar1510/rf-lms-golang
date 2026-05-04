import { alpha } from "@mui/material/styles";

export const headingFontFamily = "'Inter', 'Segoe UI', sans-serif";
export const bodyFontFamily = "'Inter', 'Segoe UI', sans-serif";

export function buildTypography() {
  const headingBase = {
    fontFamily: headingFontFamily,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
  };

  return {
    fontFamily: bodyFontFamily,
    h1: { ...headingBase, fontSize: "2rem" },
    h2: { ...headingBase, fontSize: "1.75rem" },
    h3: { ...headingBase, fontSize: "1.5rem" },
    h4: { ...headingBase, fontSize: "1.25rem" },
    h5: { ...headingBase, fontSize: "1.125rem" },
    h6: { ...headingBase, fontSize: "1rem" },
    subtitle1: { fontFamily: bodyFontFamily, fontWeight: 500, lineHeight: 1.55, fontSize: "0.875rem" },
    subtitle2: { fontFamily: bodyFontFamily, fontWeight: 500, lineHeight: 1.55, fontSize: "0.8125rem" },
    body1: { fontFamily: bodyFontFamily, lineHeight: 1.6, fontSize: "0.875rem" },
    body2: { fontFamily: bodyFontFamily, lineHeight: 1.5, fontSize: "0.875rem" },
    button: {
      fontFamily: headingFontFamily,
      fontWeight: 500,
      textTransform: "none",
      letterSpacing: "0.01em",
      fontSize: "0.875rem",
    },
    overline: {
      fontFamily: headingFontFamily,
      fontWeight: 500,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      fontSize: "0.75rem",
    },
    caption: { fontFamily: bodyFontFamily, lineHeight: 1.45, fontSize: "0.75rem", fontWeight: 400 },
  };
}

export function buildSaasComponents({
  mode,
  backgroundDefault,
  surfaceBackground,
  surfaceBorder,
  surfaceShadow,
  paperShadow,
  appBarBackground,
  backdropBackground,
  tooltipBackground,
  tooltipArrow,
  textPrimary,
}) {
  const isDark = mode === "dark";
  const paperRadius = 20;

  const popupPaper = {
    backgroundImage: "none",
    backgroundColor: surfaceBackground,
    border: `1px solid ${surfaceBorder}`,
    boxShadow: paperShadow || surfaceShadow,
    borderRadius: paperRadius,
  };

  return {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollBehavior: "smooth",
        },
        body: {
          margin: 0,
          minWidth: 320,
          minHeight: "100vh",
          fontFamily: bodyFontFamily,
          backgroundColor: backgroundDefault,
          color: textPrimary,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          backgroundImage: isDark
            ? "radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 28%), radial-gradient(circle at top right, rgba(14, 165, 233, 0.10), transparent 26%), linear-gradient(180deg, rgba(3, 7, 18, 0) 0%, rgba(3, 7, 18, 0.28) 100%)"
            : "radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 28%), radial-gradient(circle at top right, rgba(14, 165, 233, 0.06), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(15, 23, 42, 0.03) 100%)",
        },
        "#root": {
          minHeight: "100vh",
        },
        "*": {
          boxSizing: "border-box",
        },
        "a, a:visited": {
          color: "inherit",
          textDecoration: "none",
        },
        "button, input, textarea, select": {
          fontFamily: bodyFontFamily,
        },
        "::selection": {
          backgroundColor: isDark ? alpha("#22c55e", 0.35) : alpha("#2563eb", 0.22),
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: surfaceBackground,
          border: `1px solid ${surfaceBorder}`,
          borderRadius: paperRadius,
          boxShadow: surfaceShadow,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: surfaceBackground,
          border: `1px solid ${surfaceBorder}`,
          borderRadius: paperRadius,
          boxShadow: surfaceShadow,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "none",
          borderBottom: `1px solid ${surfaceBorder}`,
          backgroundColor: appBarBackground,
          backdropFilter: "blur(24px)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: surfaceBackground,
          borderRight: `1px solid ${surfaceBorder}`,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: popupPaper,
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: popupPaper,
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: popupPaper,
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: popupPaper,
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: backdropBackground,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: tooltipBackground,
          border: `1px solid ${surfaceBorder}`,
          color: textPrimary,
          fontFamily: bodyFontFamily,
        },
        arrow: {
          color: tooltipArrow,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontWeight: 500,
          paddingInline: 16,
          paddingBlock: 8,
          boxShadow: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontFamily: headingFontFamily,
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "small",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: alpha(surfaceBackground, isDark ? 0.72 : 0.96),
          transition: "box-shadow 180ms ease, border-color 180ms ease",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: isDark ? alpha("#94a3b8", 0.28) : alpha("#0f172a", 0.18),
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: isDark ? "#60a5fa" : "#2563eb",
            borderWidth: 1,
          },
        },
        notchedOutline: {
          borderColor: isDark ? alpha("#94a3b8", 0.18) : alpha("#0f172a", 0.12),
        },
        input: {
          fontFamily: bodyFontFamily,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
        indicator: {
          height: 3,
          borderRadius: 999,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 48,
          textTransform: "none",
          fontFamily: headingFontFamily,
          fontWeight: 500,
          paddingInline: 18,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: surfaceBorder,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: surfaceBorder,
        },
        head: {
          fontFamily: headingFontFamily,
          fontWeight: 600,
          fontSize: "0.75rem",
        },
      },
    },
  };
}
