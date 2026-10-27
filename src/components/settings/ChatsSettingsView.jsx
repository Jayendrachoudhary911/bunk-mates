import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
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
import {
  isInAppNotificationsEnabled,
  setInAppNotificationsEnabled,
} from "../../utils/chatFeaturesService";

const WALLPAPERS = [
  { id: "none", name: "Default Dark", preview: "#121212" },
  { id: "wp1", name: "Midnight", preview: "#0A0E17" },
  { id: "wp2", name: "Deep Indigo", preview: "#111827" },
  { id: "wp3", name: "Charcoal", preview: "#1A1A1A" },
  { id: "wp4", name: "Forest", preview: "#0B1D15" },
];

export default function ChatsSettingsView({
  onBack,
  preferences,
  onUpdatePreferences,
}) {
  const chats = preferences.chats || {};
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [inAppNotifs, setInAppNotifs] = useState(() => isInAppNotificationsEnabled());

  const updateField = (field, value) => {
    onUpdatePreferences({
      ...preferences,
      chats: {
        ...chats,
        [field]: value,
      },
    });
  };

  const handleResetChatSettings = () => {
    onUpdatePreferences({
      ...preferences,
      chats: {
        wallpaper: "none",
        enterIsSend: false,
        linkPreviews: true,
        readReceipts: true,
        typingIndicator: true,
        disappearingMessages: "off",
        mediaAutoDownload: true,
        saveToGallery: false,
        keepChatsArchived: true,
      },
    });
    setResetDialogOpen(false);
    alert("Chat preferences reset to default.");
  };

  return (
    <SettingsLayout>
      <SettingsHeader title="Chats" onBack={onBack} />

      {/* Chat Wallpaper */}
      <SettingsSection title="CHAT WALLPAPER" sx={{ ml: 0.5, mt: 0 }} />
      <SettingsGroup sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 1 }}>
          {WALLPAPERS.map((wp) => {
            const isSelected = (chats.wallpaper || "none") === wp.id;
            return (
              <Box
                key={wp.id}
                component="button"
                onClick={() => updateField("wallpaper", wp.id)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.8,
                  bgcolor: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Box
                  sx={{
                    width: 58,
                    height: 84,
                    borderRadius: "14px",
                    bgcolor: wp.preview,
                    border: isSelected
                      ? `2px solid ${SETTINGS_THEME.accent}`
                      : "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: isSelected ? `0 0 12px ${SETTINGS_THEME.accent}80` : "none",
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: isSelected ? "#FFFFFF" : SETTINGS_THEME.textSecondary,
                    fontWeight: isSelected ? 700 : 500,
                  }}
                >
                  {wp.name}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </SettingsGroup>

      {/* Messaging Behavior */}
      <SettingsSection title="MESSAGING & INPUT" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ mb: 3 }}>
        <SettingsSwitchRow
          title="Enter is Send"
          subtitle="Pressing Enter on keyboard immediately sends your message"
          checked={Boolean(chats.enterIsSend)}
          onChange={(v) => updateField("enterIsSend", v)}
          showDivider
        />

        <SettingsSwitchRow
          title="Link Previews"
          subtitle="Generate rich preview cards for shared web URLs"
          checked={Boolean(chats.linkPreviews)}
          onChange={(v) => updateField("linkPreviews", v)}
        />
      </SettingsGroup>

      {/* Privacy & Receipts */}
      <SettingsSection title="PRIVACY & RECEIPTS" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ mb: 3 }}>
        <SettingsSwitchRow
          title="Read Receipts"
          subtitle="Let others know when you have viewed their incoming messages"
          checked={Boolean(chats.readReceipts)}
          onChange={(v) => updateField("readReceipts", v)}
          showDivider
        />

        <SettingsSwitchRow
          title="Typing Indicator"
          subtitle="Broadcast typing status while composing in real-time"
          checked={Boolean(chats.typingIndicator)}
          onChange={(v) => updateField("typingIndicator", v)}
        />
      </SettingsGroup>

      {/* In-App Notifications */}
      <SettingsSection title="IN-APP NOTIFICATIONS" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ mb: 3 }}>
        <SettingsSwitchRow
          title="In-App Notifications"
          subtitle="Display real-time notification alerts while using the app (excludes your currently active chat)"
          checked={inAppNotifs}
          onChange={(v) => {
            setInAppNotifs(v);
            setInAppNotificationsEnabled(v);
            updateField("inAppNotifications", v);
          }}
        />
      </SettingsGroup>

      {/* Disappearing Messages */}
      <SettingsSection title="DISAPPEARING MESSAGES" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 1.5, mb: 3 }}>
        <SettingsSegmentedControl
          value={chats.disappearingMessages || "off"}
          onChange={(val) => updateField("disappearingMessages", val)}
          options={[
            { label: "Off", value: "off" },
            { label: "24 Hours", value: "24h" },
            { label: "7 Days", value: "7d" },
            { label: "90 Days", value: "90d" },
          ]}
        />
      </SettingsGroup>

      {/* Media & Storage */}
      <SettingsSection title="MEDIA & ARCHIVE" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ mb: 3 }}>
        <SettingsSwitchRow
          title="Media Auto-Download"
          subtitle="Automatically download photos and audio clips over Wi-Fi & data"
          checked={Boolean(chats.mediaAutoDownload)}
          onChange={(v) => updateField("mediaAutoDownload", v)}
          showDivider
        />

        <SettingsSwitchRow
          title="Keep Chats Archived"
          subtitle="Archived chats remain hidden when a new message arrives"
          checked={Boolean(chats.keepChatsArchived)}
          onChange={(v) => updateField("keepChatsArchived", v)}
        />
      </SettingsGroup>

      {/* Storage Management */}
      <SettingsSection title="MANAGEMENT & ACTIONS" sx={{ ml: 0.5 }} />
      <SettingsGroup>
        <SettingsRow
          title="Clear All Cached Messages"
          subtitle="Clear local chat storage without deleting conversations"
          onClick={() => setClearDialogOpen(true)}
          showChevron={false}
          showDivider
        />

        <SettingsRow
          title="Reset Chat Settings"
          subtitle="Restore all chat toggles back to default values"
          onClick={() => setResetDialogOpen(true)}
          showChevron={false}
          danger
        />
      </SettingsGroup>

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: SETTINGS_THEME.card,
            color: SETTINGS_THEME.textPrimary,
            borderRadius: "24px",
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Reset Chat Settings?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: SETTINGS_THEME.textSecondary }}>
            This will reset wallpaper, typing indicators, and read receipts to their default values. Your conversation messages will NOT be deleted.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResetDialogOpen(false)} sx={{ color: SETTINGS_THEME.textSecondary, textTransform: "none" }}>
            Cancel
          </Button>
          <Button onClick={handleResetChatSettings} variant="contained" color="error" sx={{ borderRadius: "14px", textTransform: "none" }}>
            Reset Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Cache Confirmation Dialog */}
      <Dialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: SETTINGS_THEME.card,
            color: SETTINGS_THEME.textPrimary,
            borderRadius: "24px",
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Clear Cached Messages?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: SETTINGS_THEME.textSecondary }}>
            This will free up local browser storage by clearing offline message caches.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setClearDialogOpen(false)} sx={{ color: SETTINGS_THEME.textSecondary, textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              sessionStorage.clear();
              setClearDialogOpen(false);
              alert("Local message caches cleared.");
            }}
            variant="contained"
            sx={{ bgcolor: SETTINGS_THEME.accent, borderRadius: "14px", textTransform: "none" }}
          >
            Clear Cache
          </Button>
        </DialogActions>
      </Dialog>
    </SettingsLayout>
  );
}
