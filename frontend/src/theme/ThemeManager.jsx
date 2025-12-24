import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { useAppSelector } from "../store/hooks";
import { THEME_PRESETS, getThemeById } from "./presets";

const ThemeManagerContext = createContext(null);

function storageKeyForUser(user) {
  const id = user?.user_id || user?.email || user?.student_id || user?.teacher_id || user?.role || "guest";
  return `epro:theme:${id}`;
}

export function AppThemeProvider({ children }) {
  const user = useAppSelector((s) => s.auth.user);
  const storageKey = storageKeyForUser(user);

  const [themeId, setThemeId] = useState(() => {
    try {
      return localStorage.getItem(storageKey) || "dark_glass";
    } catch {
      return "dark_glass";
    }
  });

  useEffect(() => {
    // when user changes, load their saved theme
    try {
      const saved = localStorage.getItem(storageKey);
      setThemeId(saved || "dark_glass");
    } catch {
      setThemeId("dark_glass");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, themeId);
    } catch {
      // ignore
    }
  }, [storageKey, themeId]);

  const theme = useMemo(() => getThemeById(themeId), [themeId]);

  const value = useMemo(
    () => ({
      themeId,
      setThemeId,
      presets: THEME_PRESETS.map(({ id, name }) => ({ id, name })),
    }),
    [themeId],
  );

  return (
    <ThemeManagerContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeManagerContext.Provider>
  );
}

export function useThemeManager() {
  const ctx = useContext(ThemeManagerContext);
  if (!ctx) throw new Error("useThemeManager must be used inside AppThemeProvider");
  return ctx;
}


