import React from "react";
import { Box, Typography, Card, MenuItem, Select, FormControl } from "@mui/material";
import {
  SettingsLayout,
  SettingsHeader,
  SettingsSection,
  SettingsGroup,
  SettingsSegmentedControl,
  SETTINGS_THEME,
} from "./SettingsShared";

const LANGUAGES = [
  { code: "en-IN", label: "English (India)" },
  { code: "en-US", label: "English (United States)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "hi-IN", label: "Hindi (हिन्दी)" },
  { code: "es-ES", label: "Spanish (Español)" },
  { code: "fr-FR", label: "French (Français)" },
  { code: "de-DE", label: "German (Deutsch)" },
  { code: "ja-JP", label: "Japanese (日本語)" },
];

const REGIONS = [
  { code: "IN", label: "India (₹ INR)" },
  { code: "US", label: "United States ($ USD)" },
  { code: "GB", label: "United Kingdom (£ GBP)" },
  { code: "EU", label: "European Union (€ EUR)" },
  { code: "JP", label: "Japan (¥ JPY)" },
  { code: "AU", label: "Australia ($ AUD)" },
  { code: "CA", label: "Canada ($ CAD)" },
];

export default function LanguageRegionView({
  onBack,
  preferences,
  onUpdatePreferences,
}) {
  const locale = preferences.locale || {};

  const updateField = (field, value) => {
    onUpdatePreferences({
      ...preferences,
      locale: {
        ...locale,
        [field]: value,
      },
    });
  };

  // Live formatted date string preview
  const now = new Date();
  const formatTime = (timeFormat) => {
    return timeFormat === "24h"
      ? now.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit" })
      : now.toLocaleTimeString([], { hour12: true, hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateFormat) => {
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();

    if (dateFormat === "MM/DD/YYYY") return `${month}/${day}/${year}`;
    if (dateFormat === "YYYY-MM-DD") return `${year}-${month}-${day}`;
    return `${day}/${month}/${year}`;
  };

  return (
    <SettingsLayout>
      <SettingsHeader title="Language & Region" onBack={onBack} />

      {/* Locale Selectors */}
      <SettingsSection title="APP LOCALE" sx={{ ml: 0.5, mt: 0 }} />
      <SettingsGroup sx={{ p: 2, mb: 3 }}>
        <Typography variant="body2" sx={{ color: SETTINGS_THEME.textSecondary, mb: 0.8 }}>
          App Language
        </Typography>
        <FormControl fullWidth sx={{ mb: 2.5 }}>
          <Select
            value={locale.language || "en-IN"}
            onChange={(e) => updateField("language", e.target.value)}
            sx={{
              bgcolor: SETTINGS_THEME.surface,
              color: "#FFFFFF",
              borderRadius: "14px",
              "& .MuiSelect-icon": { color: "#FFFFFF" },
              "& fieldset": { borderColor: "rgba(255, 255, 255, 0.08)" },
            }}
          >
            {LANGUAGES.map((l) => (
              <MenuItem key={l.code} value={l.code}>
                {l.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="body2" sx={{ color: SETTINGS_THEME.textSecondary, mb: 0.8 }}>
          Region
        </Typography>
        <FormControl fullWidth>
          <Select
            value={locale.region || "IN"}
            onChange={(e) => updateField("region", e.target.value)}
            sx={{
              bgcolor: SETTINGS_THEME.surface,
              color: "#FFFFFF",
              borderRadius: "14px",
              "& .MuiSelect-icon": { color: "#FFFFFF" },
              "& fieldset": { borderColor: "rgba(255, 255, 255, 0.08)" },
            }}
          >
            {REGIONS.map((r) => (
              <MenuItem key={r.code} value={r.code}>
                {r.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </SettingsGroup>

      {/* System Formats */}
      <SettingsSection title="DATE & TIME FORMATS" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 2, mb: 3 }}>
        <Typography variant="body2" sx={{ color: SETTINGS_THEME.textSecondary, mb: 0.8 }}>
          Date Format
        </Typography>
        <Box sx={{ mb: 2.5 }}>
          <SettingsSegmentedControl
            value={locale.dateFormat || "DD/MM/YYYY"}
            onChange={(v) => updateField("dateFormat", v)}
            options={[
              { label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
              { label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
              { label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
            ]}
          />
        </Box>

        <Typography variant="body2" sx={{ color: SETTINGS_THEME.textSecondary, mb: 0.8 }}>
          Time Format
        </Typography>
        <Box sx={{ mb: 2.5 }}>
          <SettingsSegmentedControl
            value={locale.timeFormat || "12h"}
            onChange={(v) => updateField("timeFormat", v)}
            options={[
              { label: "12-Hour (AM/PM)", value: "12h" },
              { label: "24-Hour", value: "24h" },
            ]}
          />
        </Box>

        <Typography variant="body2" sx={{ color: SETTINGS_THEME.textSecondary, mb: 0.8 }}>
          First Day of the Week
        </Typography>
        <SettingsSegmentedControl
          value={locale.firstDayOfWeek || "monday"}
          onChange={(v) => updateField("firstDayOfWeek", v)}
          options={[
            { label: "Monday", value: "monday" },
            { label: "Sunday", value: "sunday" },
          ]}
        />
      </SettingsGroup>

      {/* Live Formatted Preview */}
      <Card
        sx={{
          bgcolor: SETTINGS_THEME.surface,
          p: 2.2,
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: SETTINGS_THEME.accent,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1px",
            mb: 0.8,
            display: "block",
          }}
        >
          Live Format Preview
        </Typography>
        <Typography sx={{ color: SETTINGS_THEME.textPrimary, fontWeight: 700, fontSize: "1.1rem" }}>
          {formatDate(locale.dateFormat || "DD/MM/YYYY")} • {formatTime(locale.timeFormat || "12h")}
        </Typography>
        <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary, mt: 0.3, display: "block" }}>
          Calendar week starts on: {locale.firstDayOfWeek === "sunday" ? "Sunday" : "Monday"}
        </Typography>
      </Card>
    </SettingsLayout>
  );
}
