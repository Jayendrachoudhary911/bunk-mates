import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import {
  VisibilityOutlined,
  LocationOnOutlined,
  DownloadOutlined,
  DeleteSweepOutlined,
} from "@mui/icons-material";
import { auth } from "../../firebase";
import { exportUserData } from "../../services/settingsService";
import {
  SettingsLayout,
  SettingsHeader,
  SettingsSection,
  SettingsGroup,
  SettingsRow,
  SettingsSwitchRow,
  SettingsSegmentedControl,
  SETTINGS_THEME,
} from "./SettingsShared";

export default function PrivacyDataView({
  onBack,
  preferences,
  onUpdatePreferences,
  userProfile,
}) {
  const privacy = preferences.privacy || {};
  const [downloading, setDownloading] = useState(false);
  const [clearHistoryOpen, setClearHistoryOpen] = useState(false);

  const updateField = (field, value) => {
    onUpdatePreferences({
      ...preferences,
      privacy: {
        ...privacy,
        [field]: value,
      },
    });
  };

  const handleExportData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setDownloading(true);
    try {
      const data = await exportUserData(user.uid, userProfile);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bunkmates_data_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to export your data. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleClearSearchHistory = () => {
    localStorage.removeItem("bunkmates_recent_searches");
    localStorage.removeItem("bunkmate_search_history");
    sessionStorage.removeItem("bunkmate_search_cache");
    setClearHistoryOpen(false);
    alert("Search history cleared.");
  };

  return (
    <SettingsLayout>
      <SettingsHeader title="Privacy & Data" onBack={onBack} />

      {/* Profile Visibility */}
      <SettingsSection title="PROFILE PRIVACY" sx={{ ml: 0.5, mt: 0 }} />
      <SettingsGroup sx={{ p: 1.5, mb: 3 }}>
        <Typography variant="body2" sx={{ color: SETTINGS_THEME.textPrimary, fontWeight: 600, mb: 1, ml: 0.5 }}>
          Profile Visibility
        </Typography>
        <SettingsSegmentedControl
          value={privacy.profileVisibility || "public"}
          onChange={(val) => updateField("profileVisibility", val)}
          options={[
            { label: "Public", value: "public" },
            { label: "Private", value: "private" },
          ]}
        />
        <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary, mt: 1, ml: 0.5, display: "block" }}>
          {privacy.profileVisibility === "private"
            ? "Only accepted friends and fellow trip participants can view your travel stats and profile."
            : "Your public profile and travel badges can be discovered by BunkMates members."}
        </Typography>
      </SettingsGroup>

      {/* Location & Status */}
      <SettingsSection title="LOCATION & ACTIVITY" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ mb: 3 }}>
        <SettingsSwitchRow
          icon={LocationOnOutlined}
          title="Share Live Location"
          subtitle="Share real-time coordinate updates with active trip members"
          checked={Boolean(privacy.shareLiveLocation)}
          onChange={(v) => updateField("shareLiveLocation", v)}
          showDivider
        />

        <SettingsSwitchRow
          icon={VisibilityOutlined}
          title="Activity Status"
          subtitle="Show other users when you are currently active in chat"
          checked={Boolean(privacy.activityStatus)}
          onChange={(v) => updateField("activityStatus", v)}
          showDivider
        />

        <SettingsSwitchRow
          title="Hide Past Trips"
          subtitle="Keep completed travels confidential on your public profile"
          checked={Boolean(privacy.hidePastTrips)}
          onChange={(v) => updateField("hidePastTrips", v)}
        />
      </SettingsGroup>

      {/* Data Controls */}
      <SettingsSection title="DATA & STORAGE" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ mb: 3 }}>
        <SettingsSwitchRow
          title="Analytics Collection"
          subtitle="Allow non-identifying telemetry to help improve BunkMates features"
          checked={Boolean(privacy.analyticsCollection)}
          onChange={(v) => updateField("analyticsCollection", v)}
          showDivider
        />

        <SettingsRow
          icon={DownloadOutlined}
          title="Download My Data"
          subtitle="Export a copy of your personal trips, notes, and profile as JSON"
          trailing={downloading ? <CircularProgress size={18} color="inherit" /> : null}
          onClick={handleExportData}
          showChevron={!downloading}
          showDivider
        />

        <SettingsRow
          icon={DeleteSweepOutlined}
          title="Clear Search History"
          subtitle="Remove destination queries and cached location keywords"
          onClick={() => setClearHistoryOpen(true)}
          showChevron
        />
      </SettingsGroup>

      {/* Privacy Notice Box */}
      <Box
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
            mb: 0.5,
            display: "block",
          }}
        >
          Our Privacy Commitment
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: SETTINGS_THEME.textSecondary,
            lineHeight: 1.5,
            display: "block",
          }}
        >
          BunkMates prioritizes your travel privacy. We do not sell personal details to advertisers. Location sharing is strictly opt-in and restricted to your designated trip companions.
        </Typography>
      </Box>

      {/* Clear Search Dialog */}
      <Dialog
        open={clearHistoryOpen}
        onClose={() => setClearHistoryOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: SETTINGS_THEME.card,
            color: SETTINGS_THEME.textPrimary,
            borderRadius: "24px",
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Clear Search History?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: SETTINGS_THEME.textSecondary }}>
            This will permanently remove your stored search suggestions and recently visited destinations on this device.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setClearHistoryOpen(false)} sx={{ color: SETTINGS_THEME.textSecondary, textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleClearSearchHistory}
            variant="contained"
            color="error"
            sx={{ borderRadius: "14px", textTransform: "none", fontWeight: 700 }}
          >
            Clear History
          </Button>
        </DialogActions>
      </Dialog>
    </SettingsLayout>
  );
}
