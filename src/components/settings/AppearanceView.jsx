import React from "react";
import { Box, Typography, Card } from "@mui/material";
import { Check } from "@mui/icons-material";
import {
  SettingsLayout,
  SettingsHeader,
  SettingsSection,
  SettingsGroup,
  SettingsSegmentedControl,
  SettingsSwitchRow,
  SETTINGS_THEME,
} from "./SettingsShared";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";

const ACCENT_OPTIONS = [
  { id: "oceanBlue", label: "Ocean Blue", color: "#287FE0" },
  { id: "coral", label: "Coral Red", color: "#FF5252" },
  { id: "orange", label: "Orange", color: "#F9971F" },
  { id: "green", label: "Green", color: "#29C99A" },
  { id: "violet", label: "Violet", color: "#8B5CF6" },
  { id: "cyan", label: "Cyan", color: "#00BCD4" },
  { id: "white", label: "White", color: "#FFFFFF" },
];

export default function AppearanceView({ onBack, preferences, onUpdatePreferences }) {
  const { mode, themePreference, setMode, setAccent } = useThemeToggle();
  const appearance = preferences?.appearance || {};
  const isDark = mode === "dark";

  const handleThemeChange = (newTheme) => {
    onUpdatePreferences({
      ...preferences,
      appearance: {
        ...appearance,
        theme: newTheme,
      },
    });
    setMode(newTheme);
  };

  const handleAccentChange = (accentId) => {
    onUpdatePreferences({
      ...preferences,
      appearance: {
        ...appearance,
        accentColor: accentId,
      },
    });
    // Map to theme accent if applicable
    const accentKeyMap = {
      oceanBlue: "blue",
      coral: "coral",
      orange: "orange",
      green: "green",
      violet: "gray",
      cyan: "turquoise",
      white: "default",
    };
    if (setAccent) {
      setAccent(accentKeyMap[accentId] || "default");
    }
  };

  const handleFontSizeChange = (size) => {
    onUpdatePreferences({
      ...preferences,
      appearance: {
        ...appearance,
        fontSize: size,
      },
    });
    localStorage.setItem("bunkmate_fontSize", size === "small" ? "13" : size === "large" ? "17" : "15");
  };

  const handleReduceAnimations = (reduce) => {
    onUpdatePreferences({
      ...preferences,
      appearance: {
        ...appearance,
        reduceAnimations: reduce,
      },
    });
  };

  const currentSize = appearance.fontSize || "medium";
  const previewFontSize = currentSize === "small" ? "0.85rem" : currentSize === "large" ? "1.1rem" : "0.95rem";
  const activeSelectedTheme = appearance.theme || (themePreference === "system" ? "system" : mode);

  return (
    <SettingsLayout>
      <SettingsHeader title="Appearance" onBack={onBack} />

      {/* Theme Selection */}
      <SettingsSection title="THEME SELECTION" sx={{ ml: 0.5, mt: 0 }} />
      <SettingsGroup sx={{ p: 1.5, mb: 3 }}>
        <SettingsSegmentedControl
          value={activeSelectedTheme}
          onChange={handleThemeChange}
          options={[
            { label: "Dark", value: "dark" },
            { label: "Light", value: "light" },
            { label: "System", value: "system" },
          ]}
        />
      </SettingsGroup>

      {/* Accent Color */}
      <SettingsSection title="ACCENT COLOR" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "space-between" }}>
          {ACCENT_OPTIONS.map((opt) => {
            const isSelected = (appearance.accentColor || "oceanBlue") === opt.id;
            return (
              <Box
                key={opt.id}
                component="button"
                type="button"
                onClick={() => handleAccentChange(opt.id)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.8,
                  bgcolor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  p: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    bgcolor: opt.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: isSelected
                      ? isDark
                        ? "3px solid #FFFFFF"
                        : "3px solid #111111"
                      : isDark
                      ? "2px solid rgba(255, 255, 255, 0.2)"
                      : "2px solid rgba(0, 0, 0, 0.15)",
                    boxShadow: isSelected ? `0 0 16px ${opt.color}80` : "none",
                    transition: "transform 0.15s ease",
                    "&:hover": { transform: "scale(1.08)" },
                  }}
                >
                  {isSelected && (
                    <Check sx={{ color: opt.id === "white" ? "#000000" : "#FFFFFF", fontSize: 22 }} />
                  )}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: isSelected
                      ? isDark ? "#FFFFFF" : "#111111"
                      : isDark ? "#A0A3AD" : "#616770",
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: "0.75rem",
                  }}
                >
                  {opt.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </SettingsGroup>

      {/* Typography & Preview */}
      <SettingsSection title="FONT SIZE" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 1.5, mb: 2 }}>
        <SettingsSegmentedControl
          value={currentSize}
          onChange={handleFontSizeChange}
          options={[
            { label: "Small", value: "small" },
            { label: "Medium", value: "medium" },
            { label: "Large", value: "large" },
          ]}
        />
      </SettingsGroup>

      {/* Live Text Preview Box */}
      <Card
        sx={{
          bgcolor: isDark ? SETTINGS_THEME.surface : "#ffffff",
          p: 2.2,
          borderRadius: "20px",
          border: isDark ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(0, 0, 0, 0.06)",
          boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.03)",
          mb: 3,
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: SETTINGS_THEME.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", mb: 0.8, display: "block" }}
        >
          Live Text Preview
        </Typography>
        <Typography
          sx={{
            color: isDark ? "#FFFFFF" : "#111111",
            fontSize: previewFontSize,
            lineHeight: 1.6,
          }}
        >
          Traveling together makes memories that last forever. With BunkMates, explore destinations, organize shared expenses, and stay coordinated seamlessly.
        </Typography>
      </Card>

      {/* Motion */}
      <SettingsSection title="MOTION & ANIMATIONS" sx={{ ml: 0.5 }} />
      <SettingsGroup>
        <SettingsSwitchRow
          title="Reduce Animations"
          subtitle="Minimize nonessential transitions and decorative motion"
          checked={Boolean(appearance.reduceAnimations)}
          onChange={handleReduceAnimations}
        />
      </SettingsGroup>
    </SettingsLayout>
  );
}
