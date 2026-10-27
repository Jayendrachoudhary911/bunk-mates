import React, { useState } from "react";
import { Box, Typography, Button, TextField, Alert, Chip, Switch } from "@mui/material";
import {
  NotificationsActiveOutlined,
  ChatBubbleOutline,
  LuggageOutlined,
  AlarmOutlined,
  BedtimeOutlined,
} from "@mui/icons-material";
import {
  SettingsLayout,
  SettingsHeader,
  SettingsSection,
  SettingsGroup,
  SettingsSwitchRow,
  SETTINGS_THEME,
} from "./SettingsShared";

export default function NotificationsSettingsView({
  onBack,
  preferences,
  onUpdatePreferences,
}) {
  const notifications = preferences.notifications || {};
  const [testAlert, setTestAlert] = useState("");

  const updateField = (field, value) => {
    onUpdatePreferences({
      ...preferences,
      notifications: {
        ...notifications,
        [field]: value,
      },
    });
  };

  // Determine if quiet hours currently active
  const isQuietHoursActive = () => {
    if (!notifications.quietHoursEnabled) return false;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [fromH, fromM] = (notifications.quietHoursFrom || "22:00").split(":").map(Number);
    const [untilH, untilM] = (notifications.quietHoursUntil || "07:00").split(":").map(Number);
    const fromMins = fromH * 60 + fromM;
    const untilMins = untilH * 60 + untilM;

    if (fromMins < untilMins) {
      return currentMins >= fromMins && currentMins < untilMins;
    } else {
      // Crosses midnight
      return currentMins >= fromMins || currentMins < untilMins;
    }
  };

  const isDndActive = isQuietHoursActive();

  const handleTestNotification = (type) => {
    const messages = {
      trip: "✈️ Trip Update: Goa Getaway starts in 2 days! Check the itinerary.",
      chat: "💬 New Message from Alex: 'I booked the rental car!'",
      reminder: "🎒 Packing Reminder: Don't forget your passport and sunscreen!",
      promo: "🎉 Weekend Deal: 20% off selected homestays in Manali.",
    };

    const text = messages[type] || "Test notification received.";
    setTestAlert(text);

    // If browser notifications are permitted, trigger real notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("BunkMates Alert", {
        body: text,
        icon: "/logo.svg",
      });
    } else if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  };

  return (
    <SettingsLayout>
      <SettingsHeader title="Notifications" onBack={onBack} />

      {testAlert && (
        <Alert
          severity="info"
          sx={{
            bgcolor: "rgba(40, 127, 224, 0.15)",
            color: "#287FE0",
            border: "1px solid #287FE0",
            borderRadius: "16px",
            mb: 3,
          }}
          onClose={() => setTestAlert("")}
        >
          {testAlert}
        </Alert>
      )}

      {/* Master Push Toggle */}
      <SettingsSection title="GLOBAL CONTROLS" sx={{ ml: 0.5, mt: 0 }} />
      <SettingsGroup sx={{ mb: 3 }}>
        <SettingsSwitchRow
          icon={NotificationsActiveOutlined}
          title="All Push Notifications"
          subtitle="Master toggle for all device push alerts from BunkMates"
          checked={Boolean(notifications.pushEnabled)}
          onChange={(v) => updateField("pushEnabled", v)}
        />
      </SettingsGroup>

      {/* Category Toggles */}
      <SettingsSection title="NOTIFICATION CATEGORIES" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ mb: 3 }}>
        <SettingsSwitchRow
          icon={LuggageOutlined}
          title="Trip Updates"
          subtitle="Itinerary adjustments, flight alerts, and member invitations"
          checked={Boolean(notifications.tripUpdates)}
          disabled={!notifications.pushEnabled}
          onChange={(v) => updateField("tripUpdates", v)}
          showDivider
        />

        <SettingsSwitchRow
          icon={ChatBubbleOutline}
          title="Messages & Chat"
          subtitle="Direct messages, group mentions, and travel chat pings"
          checked={Boolean(notifications.messagesChat)}
          disabled={!notifications.pushEnabled}
          onChange={(v) => updateField("messagesChat", v)}
          showDivider
        />

        <SettingsSwitchRow
          icon={AlarmOutlined}
          title="Packing & Schedule Reminders"
          subtitle="Upcoming checklist deadlines and scheduled travel reminders"
          checked={Boolean(notifications.reminders)}
          disabled={!notifications.pushEnabled}
          onChange={(v) => updateField("reminders", v)}
          showDivider
        />

        <SettingsSwitchRow
          title="Local Recommendations"
          subtitle="Curated restaurant and activity tips for your active destination"
          checked={Boolean(notifications.recommendations)}
          disabled={!notifications.pushEnabled}
          onChange={(v) => updateField("recommendations", v)}
          showDivider
        />

        <SettingsSwitchRow
          title="Promotions & Deals"
          subtitle="Occasional discounts and seasonal trip companion offers"
          checked={Boolean(notifications.promotions)}
          disabled={!notifications.pushEnabled}
          onChange={(v) => updateField("promotions", v)}
        />
      </SettingsGroup>

      {/* Quiet Hours (DND) */}
      <SettingsSection title="QUIET HOURS (DO NOT DISTURB)" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: notifications.quietHoursEnabled ? 2 : 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <BedtimeOutlined sx={{ color: SETTINGS_THEME.textSecondary }} />
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body1" sx={{ color: SETTINGS_THEME.textPrimary, fontWeight: 600 }}>
                  Silence During Quiet Hours
                </Typography>
                {isDndActive && (
                  <Chip
                    label="Active Now"
                    size="small"
                    sx={{
                      bgcolor: "rgba(139, 92, 246, 0.2)",
                      color: "#A78BFA",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      height: 22,
                    }}
                  />
                )}
              </Box>
              <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary }}>
                Mute push sounds and banners while sleeping
              </Typography>
            </Box>
          </Box>
          <Switch
            checked={Boolean(notifications.quietHoursEnabled)}
            onChange={(e) => updateField("quietHoursEnabled", e.target.checked)}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "#FFFFFF",
                "& + .MuiSwitch-track": {
                  backgroundColor: SETTINGS_THEME.accent,
                  opacity: 1,
                },
              },
              "& .MuiSwitch-track": {
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                opacity: 1,
                borderRadius: 16,
              },
            }}
          />
        </Box>

        {notifications.quietHoursEnabled && (
          <Box sx={{ display: "flex", gap: 2, pt: 1, borderTop: `1px solid ${SETTINGS_THEME.divider}` }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary, mb: 0.5, display: "block" }}>
                Silence From
              </Typography>
              <TextField
                type="time"
                fullWidth
                value={notifications.quietHoursFrom || "22:00"}
                onChange={(e) => updateField("quietHoursFrom", e.target.value)}
                InputProps={{
                  sx: {
                    bgcolor: SETTINGS_THEME.surface,
                    color: "#FFFFFF",
                    borderRadius: "14px",
                    "& fieldset": { borderColor: "rgba(255, 255, 255, 0.08)" },
                  },
                }}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary, mb: 0.5, display: "block" }}>
                Silence Until
              </Typography>
              <TextField
                type="time"
                fullWidth
                value={notifications.quietHoursUntil || "07:00"}
                onChange={(e) => updateField("quietHoursUntil", e.target.value)}
                InputProps={{
                  sx: {
                    bgcolor: SETTINGS_THEME.surface,
                    color: "#FFFFFF",
                    borderRadius: "14px",
                    "& fieldset": { borderColor: "rgba(255, 255, 255, 0.08)" },
                  },
                }}
              />
            </Box>
          </Box>
        )}
      </SettingsGroup>

      {/* Test Sandbox */}
      <SettingsSection title="TEST NOTIFICATIONS SANDBOX" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary, mb: 1.5, display: "block" }}>
          Verify your device banner sound and preview delivery:
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleTestNotification("trip")}
            sx={{
              borderRadius: "14px",
              color: SETTINGS_THEME.textPrimary,
              borderColor: "rgba(255, 255, 255, 0.15)",
              textTransform: "none",
            }}
          >
            Trip Alert
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleTestNotification("chat")}
            sx={{
              borderRadius: "14px",
              color: SETTINGS_THEME.textPrimary,
              borderColor: "rgba(255, 255, 255, 0.15)",
              textTransform: "none",
            }}
          >
            Chat Message
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleTestNotification("reminder")}
            sx={{
              borderRadius: "14px",
              color: SETTINGS_THEME.textPrimary,
              borderColor: "rgba(255, 255, 255, 0.15)",
              textTransform: "none",
            }}
          >
            Packing Reminder
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleTestNotification("promo")}
            sx={{
              borderRadius: "14px",
              color: SETTINGS_THEME.textPrimary,
              borderColor: "rgba(255, 255, 255, 0.15)",
              textTransform: "none",
            }}
          >
            Deals Alert
          </Button>
        </Box>
      </SettingsGroup>
    </SettingsLayout>
  );
}
