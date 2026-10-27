import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  LockOutlined,
  VpnKeyOutlined,
  DevicesOutlined,
  DeleteOutline,
  CheckCircle,
} from "@mui/icons-material";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { auth, firestore } from "../../firebase";
import {
  SettingsLayout,
  SettingsHeader,
  SettingsSection,
  SettingsGroup,
  SettingsRow,
  SETTINGS_THEME,
} from "./SettingsShared";

export default function AccountsSecurityView({ onBack }) {
  const user = auth.currentUser;
  const isGoogleUser = user?.providerData?.some(
    (p) => p.providerId === "google.com"
  );

  // Password Change Dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // 2FA Dialog
  const [twoFactorDialogOpen, setTwoFactorDialogOpen] = useState(false);

  // Linked Devices
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);

  useEffect(() => {
    loadLinkedDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLinkedDevices = async () => {
    if (!user) return;
    setLoadingDevices(true);
    try {
      const q = query(
        collection(firestore, "device_pairings"),
        where("authUid", "==", user.uid)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // If list is empty, display current browser session as current device
      if (list.length === 0) {
        list.push({
          id: "current_device",
          browser: navigator.userAgent.includes("Chrome")
            ? "Chrome Desktop"
            : "Mobile Browser",
          platform: navigator.platform || "Web",
          isCurrent: true,
          status: "active",
          createdAt: { toDate: () => new Date() },
        });
      }
      setDevices(list);
    } catch (err) {
      console.warn("Could not fetch device pairings:", err);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleRevokeDevice = async () => {
    if (!selectedDevice || selectedDevice.id === "current_device") return;
    try {
      await deleteDoc(doc(firestore, "device_pairings", selectedDevice.id));
      setDevices((prev) => prev.filter((d) => d.id !== selectedDevice.id));
      setRevokeDialogOpen(false);
      setSelectedDevice(null);
    } catch (e) {
      alert("Failed to revoke device session.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      // Reauthenticate user with current password
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPassword);

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/wrong-password") {
        setPasswordError("Incorrect current password.");
      } else if (err.code === "auth/requires-recent-login") {
        setPasswordError("Please log in again before changing password.");
      } else {
        setPasswordError(err.message || "Failed to update password.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <SettingsLayout>
      <SettingsHeader title="Accounts & Security" onBack={onBack} />

      {/* Password Settings */}
      <SettingsSection title="PASSWORD & AUTHENTICATION" sx={{ ml: 0.5, mt: 0 }} />
      <SettingsGroup sx={{ mb: 3 }}>
        <SettingsRow
          icon={LockOutlined}
          title="Change Password"
          subtitle={
            isGoogleUser
              ? "Signed in with Google. Passwords managed via Google Account."
              : "Update your login password and manage credentials"
          }
          onClick={
            isGoogleUser
              ? () =>
                  alert(
                    "You signed in with Google. Password changes must be performed in your Google Account settings."
                  )
              : () => setPasswordDialogOpen(true)
          }
        />

        <SettingsRow
          icon={VpnKeyOutlined}
          title="Two-Factor Authentication (2FA)"
          subtitle="Add an extra layer of protection to your BunkMates account"
          showDivider
          onClick={() => setTwoFactorDialogOpen(true)}
        />
      </SettingsGroup>

      {/* Linked Devices */}
      <SettingsSection title="LINKED DEVICES & ACTIVE SESSIONS" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ mb: 3 }}>
        {loadingDevices ? (
          <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={24} sx={{ color: SETTINGS_THEME.accent }} />
          </Box>
        ) : devices.length > 0 ? (
          devices.map((dev, idx) => (
            <SettingsRow
              key={dev.id}
              icon={DevicesOutlined}
              title={
                dev.browser || dev.platform || "Connected Web Session"
              }
              subtitle={
                dev.isCurrent
                  ? "This Device • Active Now"
                  : dev.status === "active"
                  ? "Active QR Session • Remote"
                  : "Signed in session"
              }
              trailing={
                dev.isCurrent ? (
                  <Chip
                    label="Current"
                    size="small"
                    sx={{
                      bgcolor: "rgba(41, 201, 154, 0.15)",
                      color: "#29C99A",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      borderRadius: "12px",
                    }}
                  />
                ) : (
                  <Button
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDevice(dev);
                      setRevokeDialogOpen(true);
                    }}
                    sx={{ textTransform: "none", fontSize: "0.8rem" }}
                  >
                    Revoke
                  </Button>
                )
              }
              showChevron={false}
              showDivider={idx < devices.length - 1}
            />
          ))
        ) : (
          <Box sx={{ p: 2.5, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: SETTINGS_THEME.textSecondary }}>
              No other active devices found.
            </Typography>
          </Box>
        )}
      </SettingsGroup>

      {/* Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: SETTINGS_THEME.card,
            color: SETTINGS_THEME.textPrimary,
            borderRadius: "24px",
            p: 1,
            width: "100%",
            maxWidth: 420,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Change Password</DialogTitle>
        <DialogContent>
          {passwordSuccess ? (
            <Alert
              icon={<CheckCircle fontSize="inherit" />}
              severity="success"
              sx={{ bgcolor: "rgba(41, 201, 154, 0.15)", color: "#29C99A", borderRadius: "16px" }}
            >
              Password updated successfully!
            </Alert>
          ) : (
            <Box component="form" onSubmit={handleChangePassword} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              {passwordError && (
                <Alert severity="error" sx={{ bgcolor: "rgba(240, 82, 82, 0.15)", color: "#F05252", borderRadius: "16px" }}>
                  {passwordError}
                </Alert>
              )}
              <TextField
                type="password"
                label="Current Password"
                fullWidth
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                InputLabelProps={{ sx: { color: SETTINGS_THEME.textSecondary } }}
                InputProps={{ sx: { color: "#FFFFFF", borderRadius: "14px", bgcolor: SETTINGS_THEME.surface } }}
              />
              <TextField
                type="password"
                label="New Password"
                fullWidth
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                InputLabelProps={{ sx: { color: SETTINGS_THEME.textSecondary } }}
                InputProps={{ sx: { color: "#FFFFFF", borderRadius: "14px", bgcolor: SETTINGS_THEME.surface } }}
              />
              <TextField
                type="password"
                label="Confirm New Password"
                fullWidth
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputLabelProps={{ sx: { color: SETTINGS_THEME.textSecondary } }}
                InputProps={{ sx: { color: "#FFFFFF", borderRadius: "14px", bgcolor: SETTINGS_THEME.surface } }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setPasswordDialogOpen(false)}
            sx={{ color: SETTINGS_THEME.textSecondary, textTransform: "none" }}
          >
            Close
          </Button>
          {!passwordSuccess && (
            <Button
              onClick={handleChangePassword}
              variant="contained"
              disabled={passwordLoading || !currentPassword || !newPassword}
              sx={{
                bgcolor: SETTINGS_THEME.accent,
                borderRadius: "14px",
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              {passwordLoading ? <CircularProgress size={18} color="inherit" /> : "Update Password"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 2FA Info Dialog */}
      <Dialog
        open={twoFactorDialogOpen}
        onClose={() => setTwoFactorDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: SETTINGS_THEME.card,
            color: SETTINGS_THEME.textPrimary,
            borderRadius: "24px",
            p: 1,
            width: "100%",
            maxWidth: 440,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: SETTINGS_THEME.textSecondary, lineHeight: 1.6, mb: 2 }}>
            Two-Factor Authentication (MFA) requires entering an authentication code sent via SMS or authenticator app each time you sign in from an unrecognized device.
          </Typography>
          <Alert severity="info" sx={{ bgcolor: "rgba(40, 127, 224, 0.15)", color: "#287FE0", borderRadius: "16px" }}>
            Firebase MFA enrollment requires phone verification setup on your project backend. Multi-factor enrollment is currently being configured for BunkMates cloud instances.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setTwoFactorDialogOpen(false)}
            variant="contained"
            sx={{ bgcolor: SETTINGS_THEME.accent, borderRadius: "14px", textTransform: "none" }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog
        open={revokeDialogOpen}
        onClose={() => setRevokeDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: SETTINGS_THEME.card,
            color: SETTINGS_THEME.textPrimary,
            borderRadius: "24px",
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Revoke Session</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: SETTINGS_THEME.textSecondary }}>
            Are you sure you want to disconnect this device? It will be immediately signed out and must be paired again via QR login.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRevokeDialogOpen(false)} sx={{ color: SETTINGS_THEME.textSecondary, textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleRevokeDevice}
            variant="contained"
            color="error"
            startIcon={<DeleteOutline />}
            sx={{ borderRadius: "14px", textTransform: "none", fontWeight: 700 }}
          >
            Revoke Access
          </Button>
        </DialogActions>
      </Dialog>
    </SettingsLayout>
  );
}
