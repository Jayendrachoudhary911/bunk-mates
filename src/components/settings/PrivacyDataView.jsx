import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import {
  LockOutlined,
  MyLocationOutlined,
  HistoryToggleOffOutlined,
  VisibilityOffOutlined,
  CloudDownloadOutlined,
  DeleteSweepOutlined,
  ShieldOutlined,
} from "../../icons";
import {
  SettingsHeader,
  SettingsCard,
  SettingsSectionTitle,
  SettingsSwitchRow,
  SettingsRow,
  SETTINGS_THEME,
} from "./SettingsComponents";
import { auth, db } from "../../firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export const PrivacyDataView = ({ onBack, preferences, onUpdatePreference }) => {
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [clearHistoryDialogOpen, setClearHistoryDialogOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const privacy = preferences?.privacy || {
    profileVisibility: "public",
    shareLiveLocation: false,
    activityStatus: true,
    hidePastTrips: false,
    analyticsCollection: true,
  };

  const handleToggle = (key, value) => {
    onUpdatePreference("privacy", { [key]: value });
  };

  const handleDownloadMyData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setDownloadLoading(true);

    try {
      // 1. Fetch user profile
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const profileData = userDoc.exists() ? userDoc.data() : {};

      // 2. Fetch user's trips
      const tripsQuery = query(
        collection(db, "trips"),
        where("members", "array-contains", user.uid)
      );
      const tripsSnap = await getDocs(tripsQuery);
      const tripsData = tripsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // 3. Construct export payload
      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          profile: profileData,
        },
        trips: tripsData,
        settings: preferences,
      };

      // 4. Trigger JSON download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bunkmates_data_export_${user.uid.slice(0, 8)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSnackbarMessage("Your data export has been downloaded successfully!");
    } catch (err) {
      console.error("Export error:", err);
      setSnackbarMessage("Failed to export data. Please try again.");
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleClearSearchHistory = () => {
    try {
      localStorage.removeItem("bunkmates_search_history");
      localStorage.removeItem("bunkmates_recent_destinations");
      setClearHistoryDialogOpen(false);
      setSnackbarMessage("Search and destination history cleared.");
    } catch (_) {
      setClearHistoryDialogOpen(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100%", pb: 6, backgroundColor: SETTINGS_THEME.bg }}>
      <SettingsHeader title="Privacy & Data" onBack={onBack} />

      {/* Profile Privacy */}
      <SettingsSectionTitle>PROFILE PRIVACY</SettingsSectionTitle>
      <SettingsCard sx={{ p: 0 }}>
        <SettingsSwitchRow
          icon={<LockOutlined sx={{ fontSize: 20 }} />}
          title="Private Profile"
          subtitle="Only mutual trip mates and approved friends can see your profile details"
          checked={privacy.profileVisibility === "private"}
          onChange={(checked) =>
            handleToggle("profileVisibility", checked ? "private" : "public")
          }
          isLast
        />
      </SettingsCard>

      {/* Location Services */}
      <SettingsSectionTitle>LOCATION & ACTIVITY</SettingsSectionTitle>
      <SettingsCard sx={{ p: 0 }}>
        <SettingsSwitchRow
          icon={<MyLocationOutlined sx={{ fontSize: 20 }} />}
          title="Share Live Location"
          subtitle="Share real-time GPS location with fellow members on active trips"
          checked={privacy.shareLiveLocation}
          onChange={(checked) => handleToggle("shareLiveLocation", checked)}
        />

        <SettingsSwitchRow
          icon={<HistoryToggleOffOutlined sx={{ fontSize: 20 }} />}
          title="Activity Status"
          subtitle="Allow bunkmates to see when you are currently online in group chats"
          checked={privacy.activityStatus}
          onChange={(checked) => handleToggle("activityStatus", checked)}
        />

        <SettingsSwitchRow
          icon={<VisibilityOffOutlined sx={{ fontSize: 20 }} />}
          title="Hide Past Trips"
          subtitle="Completed trips will only be visible to you and past co-travelers"
          checked={privacy.hidePastTrips}
          onChange={(checked) => handleToggle("hidePastTrips", checked)}
          isLast
        />
      </SettingsCard>

      {/* Data Privacy & Management */}
      <SettingsSectionTitle>DATA & ARCHIVES</SettingsSectionTitle>
      <SettingsCard sx={{ p: 0 }}>
        <SettingsSwitchRow
          icon={<ShieldOutlined sx={{ fontSize: 20 }} />}
          title="Analytics & Telemetry"
          subtitle="Help improve BunkMates by sharing anonymous crash logs and feature usage"
          checked={privacy.analyticsCollection}
          onChange={(checked) => handleToggle("analyticsCollection", checked)}
        />

        <SettingsRow
          icon={<CloudDownloadOutlined sx={{ fontSize: 20 }} />}
          title="Download My Data"
          subtitle="Export a complete copy of your profile, trips, budgets, and settings"
          trailing={
            downloadLoading ? (
              <CircularProgress size={20} sx={{ color: SETTINGS_THEME.accent }} />
            ) : null
          }
          onClick={handleDownloadMyData}
        />

        <SettingsRow
          icon={<DeleteSweepOutlined sx={{ fontSize: 20 }} />}
          title="Clear Search History"
          subtitle="Wipe your recent destination searches and local route cache"
          isLast
          onClick={() => setClearHistoryDialogOpen(true)}
        />
      </SettingsCard>

      {/* Privacy Statement Card */}
      <SettingsCard sx={{ p: 2.5, backgroundColor: "rgba(22, 22, 22, 0.7)" }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "0.95rem",
            color: "#FFFFFF",
            mb: 0.8,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <ShieldOutlined sx={{ fontSize: 18, color: SETTINGS_THEME.accent }} /> BunkMates Privacy
          Commitment
        </Typography>
        <Typography sx={{ color: SETTINGS_THEME.textSecondary, fontSize: "0.82rem", lineHeight: 1.5 }}>
          Your trip documents, expenses, and chats belong to you. We never sell your personal data or
          track your exact location outside active trip coordination. All cloud synchronizations are
          encrypted in transit and at rest.
        </Typography>
      </SettingsCard>

      {/* Clear Search History Confirmation Dialog */}
      <Dialog
        open={clearHistoryDialogOpen}
        onClose={() => setClearHistoryDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#161616",
            color: "#FFFFFF",
            borderRadius: "24px",
            border: `1px solid ${SETTINGS_THEME.divider}`,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.2rem" }}>
          Clear Search History?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: SETTINGS_THEME.textSecondary, fontSize: "0.9rem" }}>
            This will remove all recent destination searches and temporary location suggestions from
            this device. Your saved trips and notes will not be affected.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setClearHistoryDialogOpen(false)}
            sx={{ color: SETTINGS_THEME.textSecondary, textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleClearSearchHistory}
            sx={{
              backgroundColor: SETTINGS_THEME.accent,
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "14px",
              px: 3,
            }}
          >
            Clear History
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={3000}
        onClose={() => setSnackbarMessage("")}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default PrivacyDataView;
