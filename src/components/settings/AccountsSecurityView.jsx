import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import {
  LockOutlined,
  VerifiedUserOutlined,
  DeleteForeverOutlined,
  WarningAmber,
  CheckCircle,
} from "../../icons";
import {
  SettingsHeader,
  SettingsCard,
  SettingsSectionTitle,
  SettingsRow,
  SETTINGS_THEME,
} from "./SettingsComponents";
import { auth, db } from "../../firebase";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";

export const AccountsSecurityView = ({ onBack, onNavigateLinkedDevices }) => {
  const currentUser = auth.currentUser;
  const isPasswordUser = currentUser?.providerData?.some(
    (p) => p.providerId === "password"
  );
  const isGoogleUser = currentUser?.providerData?.some(
    (p) => p.providerId === "google.com"
  );

  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });

  // Delete account state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleOpenPasswordDialog = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMsg({ type: "", text: "" });
    setPasswordDialogOpen(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });

    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match." });
      return;
    }

    setPasswordLoading(true);
    try {
      if (currentUser?.email && currentPassword) {
        const cred = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, cred);
      }
      await updatePassword(currentUser, newPassword);
      setPasswordMsg({ type: "success", text: "Password updated successfully!" });
      setTimeout(() => setPasswordDialogOpen(false), 1500);
    } catch (err) {
      console.error("Password update error:", err);
      setPasswordMsg({
        type: "error",
        text: err.code === "auth/wrong-password"
          ? "Incorrect current password."
          : err.message || "Failed to update password. Please re-login and try again.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setDeleteLoading(true);
    try {
      const uid = currentUser.uid;
      // Delete Firestore document
      await deleteDoc(doc(db, "users", uid)).catch(() => {});
      // Delete Auth user
      await deleteUser(currentUser);
      window.location.href = "/login";
    } catch (err) {
      console.error("Delete account error:", err);
      alert("Failed to delete account. You may need to log out and log back in to verify credentials.");
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100%", pb: 6, backgroundColor: SETTINGS_THEME.bg }}>
      <SettingsHeader title="Accounts & Security" onBack={onBack} />

      {/* Password & Authentication */}
      <SettingsSectionTitle>PASSWORD & AUTHENTICATION</SettingsSectionTitle>
      <SettingsCard sx={{ p: 0 }}>
        {isPasswordUser ? (
          <SettingsRow
            icon={<LockOutlined sx={{ fontSize: 20 }} />}
            title="Change Password"
            subtitle="Update your BunkMates account password"
            onClick={handleOpenPasswordDialog}
          />
        ) : isGoogleUser ? (
          <SettingsRow
            icon={<LockOutlined sx={{ fontSize: 20 }} />}
            title="Sign-in Provider"
            subtitle="Managed securely via Google Authentication"
            trailing={
              <Chip
                label="Google Account"
                size="small"
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              />
            }
          />
        ) : (
          <SettingsRow
            icon={<LockOutlined sx={{ fontSize: 20 }} />}
            title="Account Password"
            subtitle="Password-less authentication active"
          />
        )}

        <SettingsRow
          icon={<VerifiedUserOutlined sx={{ fontSize: 20 }} />}
          title="Two-Factor Authentication (2FA)"
          subtitle="Additional security layer for your account"
          isLast
          trailing={
            <Chip
              label="Standard Auth"
              size="small"
              sx={{
                backgroundColor: "rgba(41, 201, 154, 0.15)",
                color: SETTINGS_THEME.success,
                fontWeight: 600,
                fontSize: "0.72rem",
              }}
            />
          }
        />
      </SettingsCard>

      {/* Devices & Sessions */}
      <SettingsSectionTitle>DEVICES & SESSIONS</SettingsSectionTitle>
      <SettingsCard sx={{ p: 0 }}>
        <SettingsRow
          icon={<CheckCircle sx={{ fontSize: 20, color: SETTINGS_THEME.success }} />}
          title="Linked Devices"
          subtitle="Manage active web browser sessions and mobile QR logins"
          onClick={onNavigateLinkedDevices}
          isLast
        />
      </SettingsCard>

      {/* Account Deletion */}
      <SettingsSectionTitle>DANGER ZONE</SettingsSectionTitle>
      <SettingsCard sx={{ p: 0 }}>
        <SettingsRow
          icon={<DeleteForeverOutlined sx={{ fontSize: 20, color: SETTINGS_THEME.error }} />}
          iconBg="rgba(240, 82, 82, 0.15)"
          title="Delete Account"
          subtitle="Permanently delete your profile, trips, and cloud data"
          destructive
          isLast
          onClick={() => setDeleteDialogOpen(true)}
        />
      </SettingsCard>

      {/* Password Change Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => !passwordLoading && setPasswordDialogOpen(false)}
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
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.2rem" }}>Change Password</DialogTitle>
        <DialogContent>
          {passwordMsg.text && (
            <Alert
              severity={passwordMsg.type === "success" ? "success" : "error"}
              sx={{ mb: 2, borderRadius: "12px" }}
            >
              {passwordMsg.text}
            </Alert>
          )}

          <TextField
            margin="dense"
            label="Current Password"
            type="password"
            fullWidth
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={passwordLoading}
            sx={{
              mb: 1.5,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#202024",
                borderRadius: "14px",
                color: "#FFFFFF",
              },
            }}
          />

          <TextField
            margin="dense"
            label="New Password"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={passwordLoading}
            sx={{
              mb: 1.5,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#202024",
                borderRadius: "14px",
                color: "#FFFFFF",
              },
            }}
          />

          <TextField
            margin="dense"
            label="Confirm New Password"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={passwordLoading}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#202024",
                borderRadius: "14px",
                color: "#FFFFFF",
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setPasswordDialogOpen(false)}
            disabled={passwordLoading}
            sx={{ color: SETTINGS_THEME.textSecondary, textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={passwordLoading}
            sx={{
              backgroundColor: SETTINGS_THEME.accent,
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "14px",
              px: 3,
            }}
          >
            {passwordLoading ? <CircularProgress size={20} color="inherit" /> : "Update Password"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteLoading && setDeleteDialogOpen(false)}
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
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmber sx={{ color: SETTINGS_THEME.error }} /> Delete Account?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: SETTINGS_THEME.textSecondary, fontSize: "0.92rem", lineHeight: 1.5 }}>
            This action is <strong>permanent</strong>. All your trips, chat records, notes, and budgets
            will be erased and cannot be recovered.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteLoading}
            sx={{ color: SETTINGS_THEME.textSecondary, textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteAccount}
            disabled={deleteLoading}
            sx={{
              backgroundColor: SETTINGS_THEME.error,
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "14px",
              px: 3,
              "&:hover": {
                backgroundColor: "#D32F2F",
              },
            }}
          >
            {deleteLoading ? <CircularProgress size={20} color="inherit" /> : "Delete Forever"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountsSecurityView;
