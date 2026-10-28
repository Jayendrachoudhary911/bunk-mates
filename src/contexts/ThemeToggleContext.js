// ThemeToggleContext.js
import React, {
  createContext,
  useState,
  useMemo,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { ThemeProvider } from "@mui/material/styles";
import { getTheme } from "../theme";

const ThemeToggleContext = createContext();

export const applyDomTheme = (themeMode) => {
  const isDark = themeMode === "dark";
  const bg = isDark ? "#0c0c0c" : "#f1f1f1";
  const text = isDark ? "#ffffff" : "#111111";

  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", themeMode);
    document.documentElement.style.backgroundColor = bg;
    document.documentElement.style.color = text;
    document.documentElement.style.colorScheme = themeMode;

    if (document.body) {
      document.body.setAttribute("data-theme", themeMode);
      document.body.style.backgroundColor = bg;
      document.body.style.color = text;
      document.body.style.setProperty(
        "--slick-dot-color",
        isDark ? "#888" : "#bbb"
      );
      document.body.style.setProperty(
        "--slick-dot-active-color",
        isDark ? "#ffffff" : "#000000"
      );
    }
  }
};

const resolveInitialTheme = () => {
  try {
    const rawTheme = localStorage.getItem("theme");
    if (rawTheme === "dark" || rawTheme === "light") {
      return { mode: rawTheme, preference: rawTheme };
    }
    if (rawTheme === "system") {
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      return { mode: prefersDark ? "dark" : "light", preference: "system" };
    }

    const bunkmateMode = localStorage.getItem("bunkmate_theme_mode");
    if (bunkmateMode === "dark" || bunkmateMode === "light") {
      return { mode: bunkmateMode, preference: bunkmateMode };
    }

    // Check cached preferences
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("bunkmate_user_preferences_v1_")) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const prefTheme = parsed?.appearance?.theme;
          if (prefTheme === "light" || prefTheme === "dark") {
            return { mode: prefTheme, preference: prefTheme };
          }
          if (prefTheme === "system") {
            const prefersDark =
              typeof window !== "undefined" &&
              window.matchMedia("(prefers-color-scheme: dark)").matches;
            return {
              mode: prefersDark ? "dark" : "light",
              preference: "system",
            };
          }
        }
      }
    }
  } catch (e) {
    console.warn("ThemeToggleContext: error resolving initial theme", e);
  }
  return { mode: "dark", preference: "dark" };
};

// Immediate DOM synchronization on load
const initialTheme = resolveInitialTheme();
applyDomTheme(initialTheme.mode);

export const ThemeToggleProvider = ({ children }) => {
  const [themeState, setThemeState] = useState(resolveInitialTheme);
  const [accent, setAccentState] = useState(() => {
    try {
      return localStorage.getItem("accent") || "default";
    } catch (e) {
      return "default";
    }
  });

  const mode = themeState.mode;
  const themePreference = themeState.preference;

  const setMode = useCallback((newMode) => {
    if (newMode === "system") {
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const resolved = prefersDark ? "dark" : "light";
      setThemeState({ mode: resolved, preference: "system" });
      try {
        localStorage.setItem("theme", "system");
        localStorage.setItem("bunkmate_theme_mode", resolved);
      } catch (e) {}
    } else if (newMode === "dark" || newMode === "light") {
      setThemeState({ mode: newMode, preference: newMode });
      try {
        localStorage.setItem("theme", newMode);
        localStorage.setItem("bunkmate_theme_mode", newMode);
      } catch (e) {}
    }
  }, []);

  const setAccent = useCallback((newAccent) => {
    setAccentState(newAccent);
    try {
      localStorage.setItem("accent", newAccent);
    } catch (e) {}
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev.mode === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", next);
        localStorage.setItem("bunkmate_theme_mode", next);
      } catch (e) {}
      return { mode: next, preference: next };
    });
  }, []);

  // Sync DOM and dispatch event whenever mode or accent changes
  useEffect(() => {
    applyDomTheme(mode);
    try {
      localStorage.setItem(
        "theme",
        themePreference === "system" ? "system" : mode
      );
      localStorage.setItem("bunkmate_theme_mode", mode);
      localStorage.setItem("accent", accent);
    } catch (e) {}

    window.dispatchEvent(
      new CustomEvent("bunkmate_theme_changed", { detail: { mode, accent } })
    );
  }, [mode, accent, themePreference]);

  // Listen to OS dark mode changes if user selected 'system'
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      if (themePreference === "system") {
        setThemeState({
          mode: e.matches ? "dark" : "light",
          preference: "system",
        });
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [themePreference]);

  const theme = useMemo(() => getTheme(mode, accent), [mode, accent]);

  return (
    <ThemeToggleContext.Provider
      value={{
        mode,
        themePreference,
        setMode,
        accent,
        setAccent,
        toggleTheme,
      }}
    >
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeToggleContext.Provider>
  );
};

const defaultThemeToggleContext = {
  mode: "dark",
  themePreference: "dark",
  setMode: () => {},
  accent: "default",
  setAccent: () => {},
  toggleTheme: () => {},
};

export const useThemeToggle = () => {
  const context = useContext(ThemeToggleContext);
  return context || defaultThemeToggleContext;
};

