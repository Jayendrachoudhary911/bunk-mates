import React from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import {
  LanguageOutlined,
  PublicOutlined,
  CalendarTodayOutlined,
  AccessTimeOutlined,
  DateRangeOutlined,
} from "../../icons";
import {
  SettingsHeader,
  SettingsCard,
  SettingsSectionTitle,
  SettingsSegmentedControl,
  SETTINGS_THEME,
} from "./SettingsComponents";

const LANGUAGES = [
  { code: "en-IN", name: "English (India)" },
  { code: "en-US", name: "English (US)" },
  { code: "en-GB", name: "English (UK)" },
  { code: "hi-IN", name: "Hindi (हिन्दी)" },
  { code: "es-ES", name: "Spanish (Español)" },
  { code: "fr-FR", name: "French (Français)" },
  { code: "de-DE", name: "German (Deutsch)" },
  { code: "ja-JP", name: "Japanese (日本語)" },
];

const REGIONS = [
  { code: "IN", name: "India (+91)" },
  { code: "US", name: "United States (+1)" },
  { code: "GB", name: "United Kingdom (+44)" },
  { code: "AE", name: "United Arab Emirates (+971)" },
  { code: "SG", name: "Singapore (+65)" },
  { code: "AU", name: "Australia (+61)" },
  { code: "CA", name: "Canada (+1)" },
  { code: "DE", name: "Germany (+49)" },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (e.g. 23/10/2026)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (e.g. 10/23/2026)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (e.g. 2026-10-23)" },
];

export const LanguageRegionView = ({ onBack, preferences, onUpdatePreference }) => {
  const locale = preferences?.locale || {
    language: "en-IN",
    region: "IN",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    firstDayOfWeek: "monday",
  };

  const handleUpdate = (key, value) => {
    onUpdatePreference("locale", { [key]: value });
  };

  // Live formatted time and date preview
  const now = new Date();
  const formatTime = () => {
    return locale.timeFormat === "12h"
      ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
      : now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const formatDate = () => {
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();

    if (locale.dateFormat === "MM/DD/YYYY") return `${month}/${day}/${year}`;
    if (locale.dateFormat === "YYYY-MM-DD") return `${year}-${month}-${day}`;
    return `${day}/${month}/${year}`;
  };

  return (
    <Box sx={{ minHeight: "100%", pb: 6, backgroundColor: SETTINGS_THEME.bg }}>
      <SettingsHeader title="Language & Region" onBack={onBack} />

      {/* Live Locale Preview Card */}
      <SettingsSectionTitle>LOCALE PREVIEW</SettingsSectionTitle>
      <SettingsCard sx={{ p: 2.5, backgroundColor: "#18181C" }}>
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "#7E828D",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            mb: 1,
          }}
        >
          SYSTEM FORMATTED PREVIEW
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color: "#FFFFFF" }}>
              {formatTime()}
            </Typography>
            <Typography sx={{ color: SETTINGS_THEME.textSecondary, fontSize: "0.9rem" }}>
              {formatDate()} • {now.toLocaleDateString([], { weekday: "long" })}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: "rgba(40, 127, 224, 0.15)",
              color: SETTINGS_THEME.accent,
              px: 1.5,
              py: 0.8,
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "0.85rem",
            }}
          >
            {locale.region || "IN"}
          </Box>
        </Box>
      </SettingsCard>

      {/* Locale Configuration */}
      <SettingsSectionTitle>APP LOCALE</SettingsSectionTitle>
      <SettingsCard sx={{ p: 0 }}>
        {/* App Language */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 2,
            px: 2,
            borderBottom: `1px solid ${SETTINGS_THEME.divider}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: SETTINGS_THEME.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
              }}
            >
              <LanguageOutlined sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: "0.98rem", color: "#FFFFFF" }}>
                App Language
              </Typography>
              <Typography sx={{ fontSize: "0.82rem", color: SETTINGS_THEME.textSecondary }}>
                Primary user interface language
              </Typography>
            </Box>
          </Box>

          <FormControl size="small">
            <Select
              value={locale.language || "en-IN"}
              onChange={(e) => handleUpdate("language", e.target.value)}
              sx={{
                color: "#FFFFFF",
                backgroundColor: "#202024",
                borderRadius: "12px",
                fontSize: "0.85rem",
                fontWeight: 600,
                "& fieldset": { borderColor: SETTINGS_THEME.divider },
                "& .MuiSvgIcon-root": { color: "#FFFFFF" },
              }}
            >
              {LANGUAGES.map((l) => (
                <MenuItem key={l.code} value={l.code}>
                  {l.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Region */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 2,
            px: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: SETTINGS_THEME.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
              }}
            >
              <PublicOutlined sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: "0.98rem", color: "#FFFFFF" }}>
                Region & Country
              </Typography>
              <Typography sx={{ fontSize: "0.82rem", color: SETTINGS_THEME.textSecondary }}>
                Formatting numbers and phone prefixes
              </Typography>
            </Box>
          </Box>

          <FormControl size="small">
            <Select
              value={locale.region || "IN"}
              onChange={(e) => handleUpdate("region", e.target.value)}
              sx={{
                color: "#FFFFFF",
                backgroundColor: "#202024",
                borderRadius: "12px",
                fontSize: "0.85rem",
                fontWeight: 600,
                "& fieldset": { borderColor: SETTINGS_THEME.divider },
                "& .MuiSvgIcon-root": { color: "#FFFFFF" },
              }}
            >
              {REGIONS.map((r) => (
                <MenuItem key={r.code} value={r.code}>
                  {r.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </SettingsCard>

      {/* Date & Time Formatting */}
      <SettingsSectionTitle>DATE & TIME FORMAT</SettingsSectionTitle>
      <SettingsCard sx={{ p: 2.5 }}>
        {/* Time Format */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <AccessTimeOutlined sx={{ fontSize: 20, color: SETTINGS_THEME.accent }} />
          <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", color: "#FFFFFF" }}>
            Time Display Mode
          </Typography>
        </Box>

        <SettingsSegmentedControl
          value={locale.timeFormat || "24h"}
          onChange={(val) => handleUpdate("timeFormat", val)}
          options={[
            { label: "12-Hour (1:30 PM)", value: "12h" },
            { label: "24-Hour (13:30)", value: "24h" },
          ]}
          sx={{ mb: 3 }}
        />

        {/* Date Format */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <CalendarTodayOutlined sx={{ fontSize: 20, color: SETTINGS_THEME.accent }} />
          <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", color: "#FFFFFF" }}>
            Date Format
          </Typography>
        </Box>

        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <Select
            value={locale.dateFormat || "DD/MM/YYYY"}
            onChange={(e) => handleUpdate("dateFormat", e.target.value)}
            sx={{
              color: "#FFFFFF",
              backgroundColor: "#202024",
              borderRadius: "14px",
              fontSize: "0.88rem",
              fontWeight: 600,
              "& fieldset": { borderColor: SETTINGS_THEME.divider },
              "& .MuiSvgIcon-root": { color: "#FFFFFF" },
            }}
          >
            {DATE_FORMATS.map((df) => (
              <MenuItem key={df.value} value={df.value}>
                {df.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* First Day of Week */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <DateRangeOutlined sx={{ fontSize: 20, color: SETTINGS_THEME.accent }} />
          <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", color: "#FFFFFF" }}>
            First Day of Week
          </Typography>
        </Box>

        <SettingsSegmentedControl
          value={locale.firstDayOfWeek || "monday"}
          onChange={(val) => handleUpdate("firstDayOfWeek", val)}
          options={[
            { label: "Monday", value: "monday" },
            { label: "Sunday", value: "sunday" },
          ]}
        />
      </SettingsCard>
    </Box>
  );
};

export default LanguageRegionView;
