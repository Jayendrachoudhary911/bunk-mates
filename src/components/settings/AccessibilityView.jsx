import React from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import {
  VisibilityOutlined,
  ContrastOutlined,
  TouchAppOutlined,
  ColorLensOutlined,
  FormatBoldOutlined,
  LayersClearOutlined,
  VibrationOutlined,
  VolumeUpOutlined,
  MotionPhotosOffOutlined,
} from "../../icons";
import {
  SettingsHeader,
  SettingsCard,
  SettingsSectionTitle,
  SettingsSwitchRow,
  SETTINGS_THEME,
} from "./SettingsComponents";

export const AccessibilityView = ({ preferences, onUpdatePreference, onBack }) => {
  const accessibility = preferences?.accessibility || {
    screenReaderOptimized: true,
    highContrast: false,
    largeTouchTargets: false,
    boldText: false,
    reduceTransparency: false,
    colorBlindMode: "off",
    reduceMotion: false,
    hapticFeedback: true,
    audioCues: true,
  };

  const handleToggle = (key, value) => {
    onUpdatePreference("accessibility", { [key]: value });
  };

  return (
    <Box sx={{ minHeight: "100%", pb: 6, backgroundColor: SETTINGS_THEME.bg }}>
      <SettingsHeader title="Accessibility" onBack={onBack} />

      {/* Vision Support */}
      <SettingsSectionTitle>VISION SUPPORT</SettingsSectionTitle>
      <SettingsCard sx={{ p: 0 }}>
        <SettingsSwitchRow
          icon={<VisibilityOutlined sx={{ fontSize: 20 }} />}
          title="Screen Reader Optimization"
          subtitle="Add descriptive ARIA accessibility labels and semantic landmarks"
          checked={accessibility.screenReaderOptimized}
          onChange={(checked) => handleToggle("screenReaderOptimized", checked)}
        />

        <SettingsSwitchRow
          icon={<ContrastOutlined sx={{ fontSize: 20 }} />}
          title="High Contrast Mode"
          subtitle="Increase contrast borders and contrast ratios across cards and buttons"
          checked={accessibility.highContrast}
          onChange={(checked) => handleToggle("highContrast", checked)}
        />

        <SettingsSwitchRow
          icon={<TouchAppOutlined sx={{ fontSize: 20 }} />}
          title="Large Touch Targets"
          subtitle="Enlarge clickable hitboxes and switch padding for easier tapping"
          checked={accessibility.largeTouchTargets}
          onChange={(checked) => handleToggle("largeTouchTargets", checked)}
        />

        <SettingsSwitchRow
          icon={<FormatBoldOutlined sx={{ fontSize: 20 }} />}
          title="Bold Text"
          subtitle="Increase font weight across headings, labels, and chat messages"
          checked={accessibility.boldText}
          onChange={(checked) => handleToggle("boldText", checked)}
        />

        <SettingsSwitchRow
          icon={<LayersClearOutlined sx={{ fontSize: 20 }} />}
          title="Reduce Transparency"
          subtitle="Replace translucent glass surfaces with solid, opaque backgrounds"
          checked={accessibility.reduceTransparency}
          onChange={(checked) => handleToggle("reduceTransparency", checked)}
        />

        {/* Color Blind Mode Selector */}
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
              <ColorLensOutlined sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: "0.98rem", color: "#FFFFFF" }}>
                Color Blind Preset
              </Typography>
              <Typography sx={{ fontSize: "0.82rem", color: SETTINGS_THEME.textSecondary }}>
                Adjust color palette for color vision deficiencies
              </Typography>
            </Box>
          </Box>

          <FormControl size="small">
            <Select
              value={accessibility.colorBlindMode || "off"}
              onChange={(e) => handleToggle("colorBlindMode", e.target.value)}
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
              <MenuItem value="off">Off (Default)</MenuItem>
              <MenuItem value="protanopia">Protanopia (Red-weak)</MenuItem>
              <MenuItem value="deuteranopia">Deuteranopia (Green-weak)</MenuItem>
              <MenuItem value="tritanopia">Tritanopia (Blue-weak)</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </SettingsCard>

      {/* Motion & Feedback */}
      <SettingsSectionTitle>MOTION & FEEDBACK</SettingsSectionTitle>
      <SettingsCard sx={{ p: 0 }}>
        <SettingsSwitchRow
          icon={<MotionPhotosOffOutlined sx={{ fontSize: 20 }} />}
          title="Reduce Motion"
          subtitle="Turn off non-essential micro-animations and screen shakes"
          checked={accessibility.reduceMotion}
          onChange={(checked) => handleToggle("reduceMotion", checked)}
        />

        <SettingsSwitchRow
          icon={<VibrationOutlined sx={{ fontSize: 20 }} />}
          title="Haptic Feedback"
          subtitle="Vibrate slightly when buttons, switches, or tabs are pressed"
          checked={accessibility.hapticFeedback}
          onChange={(checked) => handleToggle("hapticFeedback", checked)}
        />

        <SettingsSwitchRow
          icon={<VolumeUpOutlined sx={{ fontSize: 20 }} />}
          title="Audio Cues"
          subtitle="Play subtle sounds for chat sends, alerts, and reminder pings"
          checked={accessibility.audioCues}
          onChange={(checked) => handleToggle("audioCues", checked)}
          isLast
        />
      </SettingsCard>
    </Box>
  );
};

export default AccessibilityView;
