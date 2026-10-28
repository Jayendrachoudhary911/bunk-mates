import React, { createContext, useContext, useState, useEffect } from "react";

const SETTINGS_KEY = "bunkmate_settings";
const defaultSettings = {
  theme: "dark", // or "light"
  accent: "default", // or "blue", "green", etc.
  autoAccent: true,
  locationMode: "auto", // "auto" or "manual"
  manualLocation: "",
};

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  // Synchronously initialize from localStorage / cookie on mount to avoid defaults overwriting
  const [settings, setSettings] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const local = localStorage.getItem(SETTINGS_KEY);
        if (local) return { ...defaultSettings, ...JSON.parse(local) };
      }
      if (typeof document !== "undefined") {
        const cookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith(SETTINGS_KEY + "="))
          ?.split("=")[1];
        if (cookie) return { ...defaultSettings, ...JSON.parse(decodeURIComponent(cookie)) };
      }
    } catch {}
    return defaultSettings;
  });

  const isInitialMount = React.useRef(true);

  // Save to localStorage/cookie ONLY on actual changes, NOT on reload/mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      document.cookie = `${SETTINGS_KEY}=${encodeURIComponent(JSON.stringify(settings))}; path=/; max-age=31536000`;
    } catch {}
  }, [settings]);

  // Actions
  const setTheme = (theme) => setSettings((s) => ({ ...s, theme }));
  const setAccent = (accent) => setSettings((s) => ({ ...s, accent }));
  const setAutoAccent = (autoAccent) => setSettings((s) => ({ ...s, autoAccent }));

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setSettings,    // <-- expose setSettings for direct use
        setTheme,
        setAccent,
        setAutoAccent,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);