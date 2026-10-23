// src/components/auth/QrLoginPanel.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  Link,
  LinearProgress,
  useTheme,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import {
  createQrLoginSession,
  subscribeToQrSession,
  cancelQrSession,
  exchangeQrLoginToken,
  listenToDeviceKillSwitch,
  QR_SESSION_TTL_MS,
} from "../../services/qrAuthService";

const springEase = [0.16, 1, 0.3, 1];

export default function QrLoginPanel({
  onSuccess,
  onBackToConventional,
  activeTheme,
  haptic,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const accentColor = activeTheme?.accent || "#88b7f0";
  const primaryBg = activeTheme?.light?.bg || "#D7E3FF";

  // Component state
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("creating"); // creating | waiting_scan (pending) | scanned | approved | completed | rejected | expired | error
  const [errorMessage, setErrorMessage] = useState("");
  const [timeLeftSec, setTimeLeftSec] = useState(Math.round(QR_SESSION_TTL_MS / 1000));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [approvedUser, setApprovedUser] = useState(null);

  // In-memory proof-of-possession secret (NEVER stored in state that serializes or DOM)
  const clientSecretRef = useRef(null);
  const sessionUnsubRef = useRef(null);
  const killSwitchUnsubRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const isCancelledRef = useRef(false);
  const isExchangingRef = useRef(false);

  // Clean up all timers and Firestore listeners
  const cleanupListeners = useCallback(() => {
    if (sessionUnsubRef.current) {
      sessionUnsubRef.current();
      sessionUnsubRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Initialize a new QR login session
  const initSession = useCallback(async () => {
    try {
      cleanupListeners();
      isCancelledRef.current = false;
      isExchangingRef.current = false;
      setStatus("creating");
      setErrorMessage("");
      setTimeLeftSec(Math.round(QR_SESSION_TTL_MS / 1000));

      const newSession = await createQrLoginSession();
      if (isCancelledRef.current) {
        cancelQrSession(newSession.sessionId);
        return;
      }

      setSession(newSession);
      clientSecretRef.current = newSession.clientSecret;
      setStatus("waiting_scan");

      // Start countdown timer
      const expiresAt = newSession.expiresAtMs;
      timerIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
        setTimeLeftSec(remaining);
        if (remaining <= 0) {
          clearInterval(timerIntervalRef.current);
          setStatus("expired");
        }
      }, 1000);

      // Subscribe to real-time session changes from mobile
      sessionUnsubRef.current = subscribeToQrSession(
        newSession.sessionId,
        async (updatedData) => {
          if (isCancelledRef.current) return;

          if (updatedData.notFound) {
            setStatus("expired");
            cleanupListeners();
            return;
          }

          const newStatus = updatedData.status;

          if (newStatus === "pending" || newStatus === "waiting_scan") {
            setStatus("waiting_scan");
          } else if (newStatus === "scanned") {
            setStatus("scanned");
          } else if (newStatus === "rejected") {
            setStatus("rejected");
            cleanupListeners();
          } else if (newStatus === "expired") {
            setStatus("expired");
            cleanupListeners();
          } else if (newStatus === "approved" && !isExchangingRef.current) {
            isExchangingRef.current = true;
            setStatus("approved");
            setApprovedUser(updatedData.user || updatedData.approvedBy || updatedData);

            try {
              // Execute trusted token exchange with proof-of-possession secret
              const result = await exchangeQrLoginToken({
                sessionId: newSession.sessionId,
                clientSecret: clientSecretRef.current,
              });

              if (result && result.success) {
                setStatus("completed");
                cleanupListeners();
                if (haptic) haptic(30);

                // Attach Remote Kill-Switch listener:
                if (result.approvedDevice?.id && result.uid) {
                  killSwitchUnsubRef.current = listenToDeviceKillSwitch(
                    result.uid,
                    result.approvedDevice.id,
                    () => {
                      console.warn("Session revoked remotely by phone.");
                      window.location.href = "/auth/login";
                    }
                  );
                }

                setTimeout(() => {
                  if (onSuccess) {
                    onSuccess(result.user);
                  }
                }, 800);
              }
            } catch (exchangeErr) {
              console.error("Token exchange failed:", exchangeErr);
              setStatus("error");
              setErrorMessage(
                exchangeErr.message || "Failed to finalize desktop authentication."
              );
              isExchangingRef.current = false;
            }
          }
        },
        (subErr) => {
          console.error("Real-time listener failed:", subErr);
          setStatus("error");
          setErrorMessage("Connection to BunkMates login server lost.");
        }
      );
    } catch (err) {
      console.error("Failed to create QR login session:", err);
      setStatus("error");
      setErrorMessage(err.message || "Could not generate QR session. Please check your network.");
    }
  }, [cleanupListeners, haptic, onSuccess]);

  // Mount effect
  useEffect(() => {
    initSession();
    return () => {
      isCancelledRef.current = true;
      cleanupListeners();
      if (session?.sessionId && status !== "completed") {
        cancelQrSession(session.sessionId);
      }
      clientSecretRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Manual Refresh Handler with cooldown
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    if (haptic) haptic(15);
    await initSession();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Cancel Handler
  const handleCancel = () => {
    if (haptic) haptic(15);
    isCancelledRef.current = true;
    cleanupListeners();
    if (session?.sessionId) {
      cancelQrSession(session.sessionId);
    }
    if (onBackToConventional) {
      onBackToConventional();
    }
  };

  // Format MM:SS for countdown timer
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: springEase }}
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: "100%",
        padding: "8px 0",
      }}
    >
      {/* Top Header */}
      <Box sx={{ width: "100%", mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
          <IconButton
            size="small"
            onClick={handleCancel}
            sx={{
              color: "rgba(255, 255, 255, 0.7)",
              bgcolor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.12)",
                color: "#ffffff",
              },
            }}
            aria-label="Back to conventional login"
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography
              sx={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.65)",
              }}
            >
              FAST & SECURE LOGIN
            </Typography>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Typography
                sx={{
                  fontSize: { xs: "1.45rem", sm: "1.7rem" },
                  fontWeight: 900,
                  color: "#ffffff",
                  letterSpacing: "-0.03em",
                }}
              >
                Log in with QR
              </Typography>
              <Box
                component="img"
                src="/logo.svg"
                alt="BunkMates"
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: "6px",
                  filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))",
                }}
              />
            </Stack>
          </Box>
        </Stack>

        <Typography
          sx={{
            fontSize: "0.82rem",
            color: "rgba(255, 255, 255, 0.65)",
            lineHeight: 1.4,
          }}
        >
          Open <b>BunkMates</b> on your phone and scan this code to authenticate instantly without typing your password.
        </Typography>
      </Box>

      {/* Main QR Card Container */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 320,
          mx: "auto",
          my: 1.5,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          p: 2.5,
          borderRadius: "28px",
          bgcolor: isDark ? "rgba(20, 20, 25, 0.6)" : "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid",
          borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
          boxShadow: isDark
            ? "inset 0 1px 1px rgba(255, 255, 255, 0.15), inset 0 -1px 1px rgba(255, 255, 255, 0.05), 0 20px 40px -10px rgba(0,0,0,0.5)"
            : "inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 16px 32px -8px rgba(0,0,0,0.08)",
        }}
      >
        {/* QR Canvas / State Overlays */}
        <Box
          sx={{
            position: "relative",
            width: 220,
            height: 220,
            borderRadius: "20px",
            overflow: "hidden",
            bgcolor: "#ffffff",
            p: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          }}
        >
          {status === "creating" ? (
            <Box
              className="shimmer"
              sx={{
                width: "100%",
                height: "100%",
                borderRadius: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(0,0,0,0.04)",
              }}
            >
              <Box
                component="img"
                src="/logo.svg"
                alt="BunkMates"
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "10px",
                  animation: "pulse 1.8s ease-in-out infinite",
                  "@keyframes pulse": {
                    "0%, 100%": { transform: "scale(1)", opacity: 0.85 },
                    "50%": { transform: "scale(1.08)", opacity: 1 },
                  },
                }}
              />
              <Typography variant="caption" sx={{ mt: 1.5, color: "#444", fontWeight: 700 }}>
                Generating Session...
              </Typography>
            </Box>
          ) : session?.qrPayload ? (
            <QRCodeSVG
              value={session.qrPayload}
              size={196}
              level="M"
              includeMargin={false}
              imageSettings={{
                src: "/logo.svg",
                x: undefined,
                y: undefined,
                height: 38,
                width: 38,
                excavate: true,
              }}
            />
          ) : null}

          {/* Active Overlay for Scanned / Approved / Expired / Error */}
          <AnimatePresence>
            {status !== "waiting_scan" && status !== "creating" && (
              <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(6px)" }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(10, 10, 15, 0.88)",
                  borderRadius: "20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px",
                  textAlign: "center",
                  color: "#ffffff",
                  zIndex: 3,
                }}
              >
                {status === "scanned" && (
                  <Stack spacing={1.5} alignItems="center">
                    <SmartphoneIcon sx={{ fontSize: 38, color: "#38bdf8" }} />
                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>
                      Scanned! Confirm on phone
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                      Please approve the sign-in request on your mobile device.
                    </Typography>
                  </Stack>
                )}

                {status === "approved" && (
                  <Stack spacing={1.5} alignItems="center">
                    <CheckCircleIcon sx={{ fontSize: 40, color: "#4ade80" }} />
                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>
                      Login Approved!
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                      {approvedUser?.displayName ? `Welcome back, ${approvedUser.displayName}!` : "Signing you in securely..."}
                    </Typography>
                  </Stack>
                )}

                {status === "completed" && (
                  <Stack spacing={1.5} alignItems="center">
                    <CheckCircleIcon sx={{ fontSize: 44, color: "#4ade80" }} />
                    <Typography sx={{ fontWeight: 800, fontSize: "1rem" }}>
                      Authenticated!
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                      Redirecting to your account...
                    </Typography>
                  </Stack>
                )}

                {status === "rejected" && (
                  <Stack spacing={1.5} alignItems="center">
                    <CancelOutlinedIcon sx={{ fontSize: 40, color: "#f87171" }} />
                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#f87171" }}>
                      Request Declined
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                      Login was rejected on your mobile device.
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleRefresh}
                      sx={{
                        borderRadius: "20px",
                        color: "#fff",
                        borderColor: "rgba(255,255,255,0.3)",
                        textTransform: "none",
                        mt: 1,
                      }}
                    >
                      Try Again
                    </Button>
                  </Stack>
                )}

                {status === "expired" && (
                  <Stack spacing={1.5} alignItems="center">
                    <HourglassEmptyIcon sx={{ fontSize: 38, color: "#facc15" }} />
                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#facc15" }}>
                      QR Expired
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                      Codes expire after 2 minutes for security.
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleRefresh}
                      startIcon={<RefreshIcon />}
                      sx={{
                        borderRadius: "20px",
                        bgcolor: primaryBg,
                        color: "#000",
                        textTransform: "none",
                        fontWeight: 700,
                        mt: 1,
                      }}
                    >
                      Refresh Code
                    </Button>
                  </Stack>
                )}

                {status === "error" && (
                  <Stack spacing={1.5} alignItems="center">
                    <ErrorOutlineIcon sx={{ fontSize: 40, color: "#f87171" }} />
                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#f87171" }}>
                      Session Error
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                      {errorMessage || "An unexpected error occurred."}
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleRefresh}
                      sx={{
                        borderRadius: "20px",
                        bgcolor: primaryBg,
                        color: "#000",
                        textTransform: "none",
                        fontWeight: 700,
                        mt: 1,
                      }}
                    >
                      Retry
                    </Button>
                  </Stack>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* Live Countdown & Progress Bar */}
        <Box sx={{ width: "100%", mt: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8, px: 0.5 }}>
            <Stack direction="row" spacing={0.8} alignItems="center">
              <LockOutlinedIcon sx={{ fontSize: 14, color: "rgba(255, 255, 255, 0.5)" }} />
              <Typography sx={{ fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.6)", fontWeight: 600 }}>
                {status === "waiting_scan"
                  ? "Expires in"
                  : status === "scanned"
                  ? "Connected"
                  : status === "approved" || status === "completed"
                  ? "Secure Token"
                  : "Session"}
              </Typography>
            </Stack>
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 800,
                color: timeLeftSec < 20 ? "#f87171" : timeLeftSec < 50 ? "#facc15" : accentColor,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatTime(timeLeftSec)}
            </Typography>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, (timeLeftSec / (QR_SESSION_TTL_MS / 1000)) * 100))}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: "rgba(255, 255, 255, 0.08)",
              "& .MuiLinearProgress-bar": {
                borderRadius: 2,
                backgroundColor: timeLeftSec < 20 ? "#f87171" : timeLeftSec < 50 ? "#facc15" : accentColor,
                transition: "transform 0.4s linear",
              },
            }}
          />
        </Box>
      </Box>

      {/* Action Controls & Footer */}
      <Box sx={{ width: "100%", pt: 1 }}>
        <Stack spacing={1.5} alignItems="center">
          <Button
            fullWidth
            onClick={handleRefresh}
            disabled={status === "creating" || status === "approved" || status === "completed" || isRefreshing}
            startIcon={
              <RefreshIcon
                sx={{
                  animation: isRefreshing ? "spin 0.8s linear infinite" : "none",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
            }
            sx={{
              borderRadius: "24px",
              py: 1.1,
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
              fontWeight: 700,
              fontSize: "0.82rem",
              textTransform: "none",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.12)",
                borderColor: "rgba(255, 255, 255, 0.3)",
              },
            }}
          >
            Refresh QR Code
          </Button>

          <Link
            component="button"
            type="button"
            onClick={handleCancel}
            sx={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.65)",
              textDecoration: "none",
              transition: "color 0.2s ease",
              "&:hover": {
                color: "#ffffff",
                textDecoration: "underline",
              },
            }}
          >
            Return to email & password login
          </Link>
        </Stack>
      </Box>
    </motion.div>
  );
}
