import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import {
  ComputerOutlined,
  SmartphoneOutlined,
  QrCodeScannerOutlined,
  DeleteOutline,
  CheckCircle,
} from "../../icons";
import {
  SettingsHeader,
  SettingsCard,
  SettingsSectionTitle,
  SETTINGS_THEME,
} from "./SettingsComponents";
import { auth, db } from "../../firebase";
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";

export const LinkedDevicesView = ({ onBack, onOpenScanner }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "device_pairings"),
      where("approvedUid", "==", currentUid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setSessions(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to device pairings:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUid]);

  const handleConfirmRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await deleteDoc(doc(db, "device_pairings", revokeTarget.id));
      setSnackbarMessage("Session revoked successfully.");
      setRevokeTarget(null);
    } catch (err) {
      console.error("Failed to revoke session:", err);
      setSnackbarMessage("Failed to revoke session. Please try again.");
    } finally {
      setRevoking(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100%", pb: 6, backgroundColor: SETTINGS_THEME.bg }}>
      <SettingsHeader title="Linked Devices" onBack={onBack} />

      {/* Current Device Card */}
      <SettingsSectionTitle>THIS DEVICE</SettingsSectionTitle>
      <SettingsCard sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: "rgba(40, 127, 224, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: SETTINGS_THEME.accent,
              }}
            >
              <ComputerOutlined sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.98rem", color: "#FFFFFF" }}>
                  Active Web Session
                </Typography>
                <Chip
                  icon={<CheckCircle sx={{ fontSize: "14px !important", color: "#29C99A !important" }} />}
                  label="Current"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    backgroundColor: "rgba(41, 201, 154, 0.15)",
                    color: SETTINGS_THEME.success,
                  }}
                />
              </Box>
              <Typography sx={{ color: SETTINGS_THEME.textSecondary, fontSize: "0.82rem", mt: 0.3 }}>
                {navigator.userAgent.includes("Windows")
                  ? "Windows Desktop"
                  : navigator.userAgent.includes("Mac")
                  ? "macOS Browser"
                  : "Web Client"}{" "}
                • Online Now
              </Typography>
            </Box>
          </Box>
        </Box>
      </SettingsCard>

      {/* Link a New Device Action */}
      {onOpenScanner && (
        <Box sx={{ px: 2, mb: 3 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={onOpenScanner}
            startIcon={<QrCodeScannerOutlined />}
            sx={{
              py: 1.5,
              borderRadius: "16px",
              backgroundColor: SETTINGS_THEME.accent,
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "0.95rem",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#1D6ECB",
              },
            }}
          >
            Scan QR to Link New Device
          </Button>
        </Box>
      )}

      {/* Other Paired Devices */}
      <SettingsSectionTitle>OTHER LINKED SESSIONS</SettingsSectionTitle>
      <SettingsCard sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} sx={{ color: SETTINGS_THEME.accent }} />
          </Box>
        ) : sessions.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography sx={{ color: SETTINGS_THEME.textSecondary, fontSize: "0.9rem" }}>
              No other active linked devices found.
            </Typography>
            <Typography sx={{ color: "#7E828D", fontSize: "0.78rem", mt: 0.5 }}>
              Use the QR Scanner on your phone to pair your desktop browser.
            </Typography>
          </Box>
        ) : (
          sessions.map((session, idx) => (
            <Box
              key={session.id}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                py: 2,
                px: 2.5,
                borderBottom:
                  idx === sessions.length - 1 ? "none" : `1px solid ${SETTINGS_THEME.divider}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
                  <SmartphoneOutlined sx={{ fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", color: "#FFFFFF" }}>
                    {session.deviceInfo?.browser || "Web Browser Pair"}
                  </Typography>
                  <Typography sx={{ color: SETTINGS_THEME.textSecondary, fontSize: "0.8rem", mt: 0.2 }}>
                    Session: {session.id.slice(0, 16)}...
                  </Typography>
                </Box>
              </Box>

              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteOutline />}
                onClick={() => setRevokeTarget(session)}
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  borderColor: "rgba(240, 82, 82, 0.4)",
                  "&:hover": {
                    borderColor: SETTINGS_THEME.error,
                    backgroundColor: "rgba(240, 82, 82, 0.08)",
                  },
                }}
              >
                Revoke
              </Button>
            </Box>
          ))
        )}
      </SettingsCard>

      {/* Revoke Confirmation Dialog */}
      <Dialog
        open={Boolean(revokeTarget)}
        onClose={() => !revoking && setRevokeTarget(null)}
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
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.15rem" }}>
          Revoke Device Session?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: SETTINGS_THEME.textSecondary, fontSize: "0.9rem" }}>
            This will log out the selected paired browser session immediately.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setRevokeTarget(null)}
            disabled={revoking}
            sx={{ color: SETTINGS_THEME.textSecondary, textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmRevoke}
            disabled={revoking}
            sx={{
              borderRadius: "14px",
              textTransform: "none",
              fontWeight: 700,
              px: 3,
            }}
          >
            {revoking ? <CircularProgress size={18} color="inherit" /> : "Revoke Session"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={2500}
        onClose={() => setSnackbarMessage("")}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default LinkedDevicesView;
