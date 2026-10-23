import React from "react";
import {
  Box,
  Typography,
} from "@mui/material";
import {
  WbSunnyOutlined,
  DarkModeOutlined,
  SettingsBrightnessOutlined,
  ColorLensOutlined,
  FormatSizeOutlined,
  MotionPhotosOffOutlined,
  Check,
} from "../../icons";
import {
  SettingsHeader,
  SettingsCard,
  SettingsSectionTitle,
  SettingsSwitchRow,
  SettingsSegmentedControl,
  SETTINGS_THEME,
} from "./SettingsComponents";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";

const ACCENT_OPTIONS = [
  { id: "blue", name: "Ocean Blue", color: "#287FE0" },
  { id: "green", name: "Emerald", color: "#10B981" },
  { id: "red", name: "Crimson", color: "#F43F5E" },
  { id: "purple", name: "Amethyst", color: "#A855F7" },
  { id: "coral", name: "Coral Red", color: "#FF7043" },
  { id: "orange", name: "Amber Orange", color: "#FFA726" },
  { id: "turquoise", name: "Cyan", color: "#00BCD6" },
  { id: "default", name: "Pure White", color: "#FFFFFF" },
];

const FONT_SIZE_OPTIONS = [
  { label: "Small", value: "small", scale: 0.88 },
  { label: "Medium", value: "medium", scale: 1.0 },
  { label: "Large", value: "large", scale: 1.15 },
];

export const AppearanceView = ({ onBack, preferences, onUpdatePreference }) => {
  const { mode, setMode, accent, setAccent } = useThemeToggle();

  const appearance = preferences?.appearance || {
    theme: mode || "dark",
    accentColor: accent || "blue",
    fontSize: "medium",
    reduceAnimations: false,
  };

  const handleThemeChange = (newTheme) => {
    onUpdatePreference("appearance", { theme: newTheme });
    if (newTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setMode(prefersDark ? "dark" : "light");
    } else {
      setMode(newTheme);
    }
  };

  const handleAccentChange = (accentId) => {
    onUpdatePreference("appearance", { accentColor: accentId });
    setAccent(accentId);
  };

  const handleFontSizeChange = (size) => {
    onUpdatePreference("appearance", { fontSize: size });
    localStorage.setItem("bunkmate_fontSize_preset", size);
  };

  const handleReduceAnimationsChange = (checked) => {
    onUpdatePreference("appearance", { reduceAnimations: checked });
    if (checked) {
      document.body.classList.add("reduce-motion");
    } else {
      document.body.classList.remove("reduce-motion");
    }
  };

  const currentThemeMode = appearance.theme || (mode === "dark" ? "dark" : "light");

  return (
    <Box sx={{ minHeight: "100%", pb: 6, backgroundColor: SETTINGS_THEME.bg }}>
      <SettingsHeader title="Appearance" onBack={onBack} />

      {/* Theme Mode Segmented Control */}
      <SettingsSectionTitle>THEME MODE</SettingsSectionTitle>
      <SettingsCard sx={{ p: 2 }}>
        <SettingsSegmentedControl
          value={currentThemeMode}
          onChange={handleThemeChange}
          options={[
            { label: "Dark", value: "dark" },
            { label: "Light", value: "light" },
            { label: "System", value: "system" },
          ]}
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 2, px: 0.5 }}>
          {currentThemeMode === "dark" ? (
            <DarkModeOutlined sx={{ fontSize: 20, color: SETTINGS_THEME.accent }} />
          ) : currentThemeMode === "light" ? (
            <WbSunnyOutlined sx={{ fontSize: 20, color: "#FFA726" }} />
          ) : (
            <SettingsBrightnessOutlined sx={{ fontSize: 20, color: SETTINGS_THEME.textSecondary }} />
          )}
          <Typography sx={{ fontSize: "0.84rem", color: SETTINGS_THEME.textSecondary }}>
            {currentThemeMode === "dark"
              ? "Deep AMOLED dark theme active for optimal battery and eye comfort"
              : currentThemeMode === "light"
              ? "Bright daytime theme active"
              : "Automatically synchronizing with your operating system preference"}
          </Typography>
        </Box>
      </SettingsCard>

      {/* Accent Color Swatches */}
      <SettingsSectionTitle>ACCENT COLOR</SettingsSectionTitle>
      <SettingsCard sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <ColorLensOutlined sx={{ fontSize: 20, color: SETTINGS_THEME.accent }} />
          <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", color: "#FFFFFF" }}>
            Select App Accent
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "flex-start" }}>
          {ACCENT_OPTIONS.map((item) => {
            const isSelected = (appearance.accentColor || accent || "blue") === item.id;
            return (
              <Box
                key={item.id}
                onClick={() => handleAccentChange(item.id)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  width: 58,
                  gap: 0.6,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    backgroundColor: item.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: isSelected ? "3px solid #FFFFFF" : "2px solid transparent",
                    boxShadow: isSelected
                      ? `0 0 12px ${item.color}`
                      : "0 2px 6px rgba(0,0,0,0.3)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    "&:hover": {
                      transform: "scale(1.08)",
                    },
                  }}
                >
                  {isSelected && (
                    <Check
                      sx={{
                        fontSize: 20,
                        color: item.id === "default" ? "#000000" : "#FFFFFF",
                        strokeWidth: 3,
                      }}
                    />
                  )}
                </Box>
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? "#FFFFFF" : SETTINGS_THEME.textSecondary,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.name.split(" ")[0]}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </SettingsCard>

      {/* Font Size & Live Preview */}
      <SettingsSectionTitle>TYPOGRAPHY</SettingsSectionTitle>
      <SettingsCard sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <FormatSizeOutlined sx={{ fontSize: 20, color: SETTINGS_THEME.accent }} />
          <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", color: "#FFFFFF" }}>
            Reading Font Size
          </Typography>
        </Box>

        <SettingsSegmentedControl
          value={appearance.fontSize || "medium"}
          onChange={handleFontSizeChange}
          options={FONT_SIZE_OPTIONS}
          sx={{ mb: 2.5 }}
        />

        {/* Live Typography Preview Box */}
        <Box
          sx={{
            p: 2,
            backgroundColor: "#202024",
            borderRadius: "16px",
            border: `1px solid ${SETTINGS_THEME.divider}`,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "#7E828D",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              mb: 0.8,
            }}
          >
            LIVE PREVIEW
          </Typography>
          <Typography
            sx={{
              fontSize:
                appearance.fontSize === "small"
                  ? "0.85rem"
                  : appearance.fontSize === "large"
                  ? "1.1rem"
                  : "0.95rem",
              lineHeight: 1.55,
              color: "#FFFFFF",
              transition: "font-size 0.2s ease",
            }}
          >
            "Travel makes one modest. You see what a tiny place you occupy in the world."
          </Typography>
          <Typography
            sx={{
              fontSize:
                appearance.fontSize === "small"
                  ? "0.75rem"
                  : appearance.fontSize === "large"
                  ? "0.95rem"
                  : "0.82rem",
              color: SETTINGS_THEME.textSecondary,
              mt: 0.6,
            }}
          >
            — Gustave Flaubert • BunkMates Travel Companion
          </Typography>
        </Box>
      </SettingsCard>

      {/* Motion & Animations */}
      <SettingsSectionTitle>MOTION</SettingsSectionTitle>
      <SettingsCard sx={{ p: 0 }}>
        <SettingsSwitchRow
          icon={<MotionPhotosOffOutlined sx={{ fontSize: 20 }} />}
          title="Reduce Animations"
          subtitle="Minimize transition effects and decorative motion throughout the app"
          checked={appearance.reduceAnimations}
          onChange={handleReduceAnimationsChange}
          isLast
        />
      </SettingsCard>
    </Box>
  );
};

export default AppearanceView;
