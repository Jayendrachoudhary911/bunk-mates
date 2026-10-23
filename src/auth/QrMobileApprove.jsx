// src/auth/QrMobileApprove.jsx
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Stack,
  Avatar,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
} from "@mui/material";
import LaptopMacIcon from "@mui/icons-material/LaptopMac";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import SecurityIcon from "@mui/icons-material/Security";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DevicesIcon from "@mui/icons-material/Devices";
import { auth, db } from "../firebase";
import { useUser } from "../contexts/UserContext";
import {
  recordScan,
  approveQrSession,
  rejectQrSession,
  parseQRLoginPayload,
  DEVICE_PAIRING_COLLECTION,
  LEGACY_QR_COLLECTION,
} from "../services/qrAuthService";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

export default function QrMobileApprove() {
  const [searchParams] = useSearchParams();
  const rawParam = searchParams.get("sessionId") || searchParams.get("session_id") || "";
  const { sessionId } = parseQRLoginPayload(rawParam);

  const navigate = useNavigate();
  const { user: currentUser, loading: userLoading } = useUser();

  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState("loading"); // loading | ready | approved | rejected | expired | invalid
  const [errorMessage, setErrorMessage] = useState("");

  // Frame-1 Synchronous Lock: Prevents duplicate scan triggers
  const hasScannedRef = useRef(false);

  // Load session and record scan
  useEffect(() => {
    if (!sessionId) {
      setStatus("invalid");
      setErrorMessage("No login session ID was found in the scanned QR code.");
      setLoading(false);
      return;
    }

    let activeCollection = DEVICE_PAIRING_COLLECTION;
    let sessionRef = doc(db, activeCollection, sessionId);

    const initialize = async () => {
      try {
        let snap = await getDoc(sessionRef);
        if (!snap.exists()) {
          activeCollection = LEGACY_QR_COLLECTION;
          sessionRef = doc(db, activeCollection, sessionId);
          snap = await getDoc(sessionRef);
        }

        if (!snap.exists()) {
          setStatus("invalid");
          setErrorMessage("This QR login request does not exist or has been deleted.");
          setLoading(false);
          return;
        }

        const data = snap.data();
        setSessionData(data);

        // Check expiration (10 min TTL)
        const expiry = data.expiresAt || data.expiresAtMs;
        if (expiry && Date.now() > expiry) {
          setStatus("expired");
          setLoading(false);
          return;
        }

        if (data.consumed || data.status === "consumed" || data.status === "completed") {
          setStatus("expired");
          setErrorMessage("This login session has already been used.");
          setLoading(false);
          return;
        }

        if (data.status === "rejected") {
          setStatus("rejected");
          setLoading(false);
          return;
        }

        if (data.status === "approved") {
          setStatus("approved");
          setLoading(false);
          return;
        }

        // Frame-1 Lock & Status Update to "scanned"
        if (!hasScannedRef.current) {
          hasScannedRef.current = true;
          await recordScan(sessionId, {
            label: navigator.userAgent.includes("iPhone")
              ? "iPhone"
              : navigator.userAgent.includes("Android")
              ? "Android Device"
              : "Mobile Device",
          });
        }

        setStatus("ready");
      } catch (err) {
        console.error("Failed to load QR session:", err);
        setStatus("invalid");
        setErrorMessage("Could not connect to authentication server.");
      } finally {
        setLoading(false);
      }
    };

    initialize();

    // Listen for updates on the session
    const unsubscribe = onSnapshot(sessionRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSessionData(data);
        if (data.status === "rejected") setStatus("rejected");
        if (data.status === "consumed" || data.status === "completed") setStatus("approved");
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  // Handle Approve
  const handleApprove = async () => {
    const activeUser = currentUser || auth.currentUser;
    if (!activeUser) {
      navigate("/auth/login", { state: { returnTo: `/qr-login?sessionId=${sessionId}` } });
      return;
    }

    try {
      setActionLoading(true);

      // 1. Fetch user's full profile from Firestore if available
      let userProfile = null;
      try {
        const userDocSnap = await getDoc(doc(db, "users", activeUser.uid));
        if (userDocSnap.exists()) {
          userProfile = userDocSnap.data();
        }
      } catch (profileErr) {
        console.warn("Could not fetch user profile for sharing:", profileErr);
      }

      // 2. Fetch fresh auth ID token from active Firebase session
      let idToken = null;
      try {
        if (auth.currentUser && typeof auth.currentUser.getIdToken === "function") {
          idToken = await auth.currentUser.getIdToken(true);
        }
      } catch (tokenErr) {
        console.warn("Could not retrieve auth token for sharing:", tokenErr);
      }

      const reqMeta = sessionData?.requesterMetadata || sessionData?.deviceInfo || {};
      const devName = reqMeta.deviceName || `${reqMeta.browser || "Chrome"} on ${reqMeta.os || "Windows"}`;

      // Extract full authUser JSON representation (identical to Firebase DevTools record)
      const authUserJson = (auth.currentUser && typeof auth.currentUser.toJSON === "function")
        ? auth.currentUser.toJSON()
        : null;

      const authUserPayload = {
        apiKey: "AIzaSyCP_l2uREbRMcV6aHhB8yZXK7NdGNltxpA",
        appName: "[DEFAULT]",
        createdAt: String(authUserJson?.createdAt || activeUser.metadata?.createdAt || Date.now()),
        lastLoginAt: String(Date.now()),
        displayName: activeUser.displayName || userProfile?.name || userProfile?.displayName || "BunkMate User",
        email: activeUser.email || userProfile?.email || "",
        emailVerified: activeUser.emailVerified ?? true,
        isAnonymous: activeUser.isAnonymous ?? false,
        phoneNumber: activeUser.phoneNumber || null,
        photoURL: activeUser.photoURL || userProfile?.photoURL || "",
        providerData: (activeUser.providerData && activeUser.providerData.length > 0)
          ? activeUser.providerData.map((p) => ({
              displayName: p.displayName || activeUser.displayName || "",
              email: p.email || activeUser.email || "",
              phoneNumber: p.phoneNumber || null,
              photoURL: p.photoURL || activeUser.photoURL || "",
              providerId: p.providerId || "google.com",
              uid: p.uid || activeUser.uid || "",
            }))
          : [
              {
                displayName: activeUser.displayName || "",
                email: activeUser.email || "",
                phoneNumber: null,
                photoURL: activeUser.photoURL || "",
                providerId: "google.com",
                uid: activeUser.uid || "",
              },
            ],
        stsTokenManager: {
          refreshToken:
            authUserJson?.stsTokenManager?.refreshToken ||
            activeUser.refreshToken ||
            "bunkmates_auth_refresh_token",
          accessToken:
            idToken || authUserJson?.stsTokenManager?.accessToken || "",
          expirationTime: Number(
            authUserJson?.stsTokenManager?.expirationTime ||
              Date.now() + 3600 * 1000
          ),
        },
        tenantId: null,
        uid: activeUser.uid,
        _redirectEventId: null,
      };

      // 3. Package complete Android-compliant handshake payload with full credentials
      const sharedSession = {
        uid: activeUser.uid || activeUser.id,
        email: activeUser.email || userProfile?.email || "",
        displayName: activeUser.displayName || userProfile?.name || userProfile?.displayName || "BunkMate User",
        photoURL: activeUser.photoURL || userProfile?.photoURL || "",
        username: userProfile?.username || (activeUser.displayName ? activeUser.displayName.toLowerCase().replace(/\s+/g, "") : "bunkmate"),
        userData: {
          username: userProfile?.username || "",
          role: userProfile?.role || "user",
        },
        idToken,
        customToken: null,
        deviceName: devName,
        authUser: authUserPayload,
        credentials: {
          authUser: authUserPayload,
          idToken,
          token: idToken,
        },
      };

      // 4. Save to Firestore `device_pairings/{sessionId}` and register device
      await approveQrSession(sessionId, activeUser, sharedSession);

      setStatus("approved");
    } catch (err) {
      console.error("Failed to approve login:", err);
      setErrorMessage(err.message || "Failed to approve login request.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    try {
      setActionLoading(true);
      await rejectQrSession(sessionId);
      setStatus("rejected");
    } catch (err) {
      console.error("Failed to reject login:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const activeUser = currentUser || auth.currentUser;
  const requester = sessionData?.requesterMetadata || sessionData?.deviceInfo || {};

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        bgcolor: "#000000",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 3 },
        boxSizing: "border-box",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 440,
          bgcolor: "rgba(22, 22, 28, 0.75)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "32px",
          p: { xs: 3, sm: 4 },
          boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 24px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header Branding */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              component="img"
              src="/logo.svg"
              alt="BunkMates"
              sx={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))",
              }}
            />
            <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: "-0.5px", color: "#ffffff" }}>
              BunkMates
            </Typography>
          </Stack>
          <IconButton size="small" onClick={() => navigate("/")} sx={{ color: "rgba(255,255,255,0.5)" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Content based on status */}
        {loading || userLoading ? (
          <Box sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <CircularProgress size={32} sx={{ color: "#38bdf8" }} />
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
              Verifying QR session handshake...
            </Typography>
          </Box>
        ) : status === "invalid" || status === "expired" ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CancelOutlinedIcon sx={{ fontSize: 48, color: "#f87171", mb: 2 }} />
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
              {status === "expired" ? "Session Expired" : "Invalid Request"}
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 3 }}>
              {errorMessage || "This login request is no longer valid. Please refresh the QR code on your computer."}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate("/")}
              sx={{ borderRadius: "20px", textTransform: "none", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}
            >
              Go to Home
            </Button>
          </Box>
        ) : status === "approved" ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 52, color: "#4ade80", mb: 2 }} />
            <Typography variant="h5" fontWeight={900} sx={{ mb: 1 }}>
              Login Approved!
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 3 }}>
              Your computer is now authenticated and logging in automatically. You can safely close this screen.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate("/")}
              sx={{
                borderRadius: "24px",
                py: 1.2,
                bgcolor: "#ffffff",
                color: "#000000",
                fontWeight: 800,
                textTransform: "none",
                "&:hover": { bgcolor: "#eeeeee" },
              }}
            >
              Back to BunkMates
            </Button>
          </Box>
        ) : status === "rejected" ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CancelOutlinedIcon sx={{ fontSize: 48, color: "#f87171", mb: 2 }} />
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1, color: "#f87171" }}>
              Request Declined
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 3 }}>
              You declined the desktop login request. No access was granted to that computer.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate("/")}
              sx={{ borderRadius: "20px", textTransform: "none", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}
            >
              Close
            </Button>
          </Box>
        ) : !activeUser ? (
          // Mobile device user is not logged in
          <Box sx={{ textAlign: "center", py: 3 }}>
            <SecurityIcon sx={{ fontSize: 44, color: "#facc15", mb: 2 }} />
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
              Log In to Approve
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 3 }}>
              You must be logged in to your BunkMates account on this mobile device to approve a computer login.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate("/auth/login", { state: { returnTo: `/qr-login?sessionId=${sessionId}` } })}
              sx={{
                borderRadius: "24px",
                py: 1.3,
                bgcolor: "#ffffff",
                color: "#000000",
                fontWeight: 800,
                textTransform: "none",
              }}
            >
              Log In on Mobile
            </Button>
          </Box>
        ) : (
          // Phase 3: Phone Approval Drawer
          <Box>
            <Box sx={{ textAlign: "center", mb: 2.5 }}>
              <Box
                sx={{
                  display: "inline-flex",
                  p: 1.8,
                  borderRadius: "50%",
                  bgcolor: "rgba(56, 189, 248, 0.12)",
                  color: "#38bdf8",
                  mb: 1.2,
                }}
              >
                <LaptopMacIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: "-0.5px" }}>
                Approve Desktop Login?
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.65)" sx={{ mt: 0.5 }}>
                A desktop computer is requesting access to your BunkMates account.
              </Typography>
            </Box>

            {/* CARD A: Active Phone Account (Matching Android Spec Phase 3) */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "20px",
                bgcolor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                mb: 2,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Phone Account
                </Typography>
                <Chip
                  size="small"
                  label="This Phone's Account"
                  avatar={
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "#4ade80",
                        boxShadow: "0 0 6px #4ade80",
                      }}
                    />
                  }
                  sx={{
                    bgcolor: "rgba(74, 222, 128, 0.12)",
                    color: "#4ade80",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    border: "1px solid rgba(74, 222, 128, 0.25)",
                  }}
                />
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  src={activeUser.photoURL}
                  sx={{ width: 44, height: 44, border: "2px solid rgba(255,255,255,0.2)" }}
                >
                  {activeUser.displayName?.charAt(0) || "U"}
                </Avatar>
                <Box sx={{ overflow: "hidden" }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#ffffff", lineHeight: 1.2 }}>
                    {activeUser.displayName || "BunkMate User"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", display: "block", textOverflow: "ellipsis", overflow: "hidden" }}>
                    {activeUser.email}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* CARD B: Requesting Device Metadata (Matching Android Spec Phase 3) */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "20px",
                bgcolor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                mb: 2.5,
              }}
            >
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", mb: 1.5 }}>
                Requesting Device
              </Typography>

              <Stack spacing={1.2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DevicesIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.5)" }} />
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                      Device & OS
                    </Typography>
                  </Stack>
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#fff" }}>
                    {requester.os || "Windows 11"} • {requester.browser || "Chrome"}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocationOnOutlinedIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.5)" }} />
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                      Location
                    </Typography>
                  </Stack>
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#fff" }}>
                    {requester.location || "Patna, India"}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTimeIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.5)" }} />
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                      Requested
                    </Typography>
                  </Stack>
                  <Typography variant="caption" fontWeight={700} sx={{ color: "rgba(255,255,255,0.7)" }}>
                    Just now
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            {/* Security Notice */}
            <Alert
              severity="warning"
              icon={<SecurityIcon fontSize="inherit" />}
              sx={{
                mb: 3,
                bgcolor: "rgba(245, 158, 11, 0.1)",
                color: "#fde68a",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                borderRadius: "16px",
                fontSize: "0.78rem",
                "& .MuiAlert-icon": { color: "#f59e0b" },
              }}
            >
              Only approve this request if you personally scanned this QR code on your computer.
            </Alert>

            {/* Action Buttons: Exact wording [ Approve & Log In ] / [ Decline ] */}
            <Stack spacing={1.5}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleApprove}
                disabled={actionLoading}
                startIcon={actionLoading ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
                sx={{
                  py: 1.4,
                  borderRadius: "28px",
                  bgcolor: "#ffffff",
                  color: "#000000",
                  fontWeight: 900,
                  fontSize: "0.92rem",
                  textTransform: "none",
                  boxShadow: "0 4px 20px rgba(255,255,255,0.15)",
                  "&:hover": { bgcolor: "#f3f4f6" },
                }}
              >
                {actionLoading ? "Authorizing Handshake..." : "Approve & Log In"}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                onClick={handleReject}
                disabled={actionLoading}
                sx={{
                  py: 1.2,
                  borderRadius: "28px",
                  color: "#f87171",
                  borderColor: "rgba(248, 113, 113, 0.3)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#f87171",
                    bgcolor: "rgba(248, 113, 113, 0.08)",
                  },
                }}
              >
                Decline
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

