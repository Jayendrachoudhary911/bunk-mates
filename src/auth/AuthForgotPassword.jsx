import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LockResetIcon from "@mui/icons-material/LockReset";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

// Shield & Lock Custom Illustration
const RecoveryIllustration = ({ accentColor }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      mb: 1.5,
      position: "relative",
    }}
  >
    <Box
      sx={{
        width: 76,
        height: 76,
        borderRadius: "24px",
        border: `0px solid ${accentColor}50`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <LockResetIcon sx={{ fontSize: 40, color: accentColor || "#D7E3FF" }} />
    </Box>
  </Box>
);

export default function AuthForgotPassword({ haptic, activeTheme }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  // Profile Pill Detection
  const [matchedUser, setMatchedUser] = useState(null);
  const [searchingProfile, setSearchingProfile] = useState(false);

  // Rate Limiting / 72h Cooldown state
  const [cooldownRemaining, setCooldownRemaining] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const primaryBg = activeTheme?.light?.bg || "#D7E3FF";
  const primaryText = activeTheme?.light?.text || "#001B3F";
  const accentColor = activeTheme?.accent || "#88b7f0";

  const searchTimeoutRef = useRef(null);

  // Helper to sanitize email for firestore doc key
  const sanitizeEmailKey = (rawEmail) =>
    rawEmail.trim().toLowerCase().replace(/[.@#$[\]]/g, "_");

  // Firestore Rate Limiting: max 5 requests per 72 hours (wrapped in useCallback to satisfy hooks rule)
  const checkFirestoreRateLimit = useCallback(async (cleanEmail) => {
    try {
      const docKey = sanitizeEmailKey(cleanEmail);
      const resetRef = doc(db, "password_resets", docKey);
      const resetDoc = await getDoc(resetRef);

      if (resetDoc.exists()) {
        const data = resetDoc.data();
        const now = Date.now();
        const seventyTwoHoursMs = 72 * 60 * 60 * 1000;

        // Filter valid attempts within the last 72 hours
        const rawAttempts = Array.isArray(data.attempts) ? data.attempts : [];
        const recentAttempts = rawAttempts.filter(
          (ts) => now - ts < seventyTwoHoursMs
        );

        if (recentAttempts.length >= 5) {
          const oldestRecent = Math.min(...recentAttempts);
          const unlocksAt = oldestRecent + seventyTwoHoursMs;
          const remainingHours = Math.ceil((unlocksAt - now) / (60 * 60 * 1000));

          setIsBlocked(true);
          setCooldownRemaining(remainingHours > 0 ? remainingHours : 1);
          setError(
            `Request limit reached (5/5). For security, password reset is paused for this account. Please try again in ~${remainingHours} hours.`
          );
          return false;
        } else {
          setIsBlocked(false);
          setCooldownRemaining(null);
          return true;
        }
      } else {
        setIsBlocked(false);
        setCooldownRemaining(null);
        return true;
      }
    } catch (err) {
      console.warn("Rate limit check note:", err);
      return true;
    }
  }, []);

  // Debounced lookup for matched profile in Firestore
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || cleanEmail.length < 5) {
      setMatchedUser(null);
      setSearchingProfile(false);
      return;
    }

    setSearchingProfile(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("email", "==", cleanEmail)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setMatchedUser(userData);
        } else {
          setMatchedUser(null);
        }

        // Check 72h Firestore cooldown status for this email
        await checkFirestoreRateLimit(cleanEmail);
      } catch (err) {
        console.warn("User lookup optional note:", err);
      } finally {
        setSearchingProfile(false);
      }
    }, 450);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [email, checkFirestoreRateLimit]);

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (haptic) haptic(20);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    if (requestSent) {
      setMessage("Reset instructions already dispatched. Please check your inbox and spam folder.");
      return;
    }

    if (isBlocked) {
      setError(
        `Limit exceeded (5/5). Cooldown active for ~${cooldownRemaining || 72} hours.`
      );
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      // 1. Verify Firestore rate limit
      const canProceed = await checkFirestoreRateLimit(cleanEmail);
      if (!canProceed) {
        setLoading(false);
        return;
      }

      // 2. Send Firebase Password Reset Email
      await sendPasswordResetEmail(auth, cleanEmail);

      // 3. Record attempt timestamp in Firestore
      const now = Date.now();
      const seventyTwoHoursMs = 72 * 60 * 60 * 1000;
      const docKey = sanitizeEmailKey(cleanEmail);
      const resetRef = doc(db, "password_resets", docKey);
      const resetDoc = await getDoc(resetRef);

      let updatedAttempts = [now];
      if (resetDoc.exists()) {
        const rawAttempts = Array.isArray(resetDoc.data().attempts)
          ? resetDoc.data().attempts
          : [];
        updatedAttempts = [
          ...rawAttempts.filter((ts) => now - ts < seventyTwoHoursMs),
          now,
        ];
      }

      await setDoc(
        resetRef,
        {
          email: cleanEmail,
          attempts: updatedAttempts,
          lastAttemptTimestamp: now,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 4. Update UI State to prevent duplicate submissions
      setRequestSent(true);
      setMessage("Password reset email sent! Check your inbox and spam folder.");
    } catch (err) {
      console.error("Password reset error:", err);
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many requests from this device. Please try again later.");
      } else {
        setError(err.message || "Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      backgroundColor: "#0d0d12",
      color: "#ffffff",
      fontSize: "0.92rem",
      "& fieldset": {
        borderColor: "rgba(255, 255, 255, 0.16)",
        transition: "border-color 0.25s ease",
      },
      "&:hover fieldset": {
        borderColor: "rgba(255, 255, 255, 0.35)",
      },
      "&.Mui-focused fieldset": {
        borderColor: accentColor,
        borderWidth: "1.5px",
      },
    },
    "& input::placeholder": {
      color: "rgba(255, 255, 255, 0.3)",
      opacity: 1,
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ width: "100%" }}>
        {/* Cool Recovery Shield Illustration */}
        <RecoveryIllustration
          accentColor={accentColor}
          primaryBg={primaryBg}
        />

        {/* Header Titles */}
        <Box sx={{ mb: 2, textAlign: "center" }}>
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(255, 255, 255, 0.6)",
              mb: 0.3,
            }}
          >
            ACCOUNT RECOVERY
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: "1.65rem", sm: "1.85rem" },
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Reset Password
          </Typography>
          <Typography
            sx={{
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "0.84rem",
              mt: 0.8,
              lineHeight: 1.45,
              maxWidth: 320,
              mx: "auto",
            }}
          >
            Enter your registered email to receive secure instructions to reset
            your password.
          </Typography>
        </Box>

        {/* Form Container with Separated Labels */}
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <Stack spacing={1.8}>
<Box sx={{ mb: 2, mt: 2 }}>
  <Typography
    component="label"
    sx={{
      display: "flex",
      fontSize: "0.80rem",
      fontWeight: 600,
      letterSpacing: "0.02em",
      color: "rgba(255, 255, 255, 0.75)",
      mb: 0.8,
      ml: 0.6,
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <span>
      Email Address <span style={{ color: accentColor, fontWeight: 700 }}>*</span>
    </span>
    {searchingProfile && (
      <Typography
        component="span"
        sx={{
          fontSize: "0.72rem",
          fontWeight: 500,
          color: "rgba(255, 255, 255, 0.4)",
          letterSpacing: "normal",
        }}
      >
        Checking...
      </Typography>
    )}
  </Typography>

  <TextField
    placeholder="user@bunkmates.com"
    type="email"
    size="small"
    required
    fullWidth
    disabled={requestSent || isBlocked}
    value={email}
    onChange={(e) => {
      setEmail(e.target.value);
      if (error) setError("");
      if (message) setMessage("");
    }}
    autoComplete="email"
    sx={{
      ...inputStyle,
      "& .MuiOutlinedInput-root": {
        borderRadius: "14px",
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(8px)",
        height: 45,
        transition: "all 0.25s ease-in-out",
        "& fieldset": {
          borderColor: "rgba(255, 255, 255, 0.12)",
          borderWidth: "1px",
        },
        "&:hover fieldset": {
          borderColor: "rgba(255, 255, 255, 0.25)",
        },
        "&.Mui-focused fieldset": {
          borderColor: accentColor,
          borderWidth: "2px",
          boxShadow: `0 0 12px ${accentColor}25`,
        },
      },
      "& .MuiOutlinedInput-input": {
        color: "#ffffff",
        fontSize: "0.9rem",
        padding: "10px 14px",
        "&::placeholder": {
          color: "rgba(255, 255, 255, 0.3)",
          opacity: 1,
        },
      },
    }}
  />
</Box>

            {/* Smart User Profile Detection Pill */}
            <AnimatePresence>
              {matchedUser && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.2,
                      px: 1.5,
                      borderRadius: "16px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${accentColor}40`,
                      backdropFilter: "blur(10px)",
                      boxShadow: `0 4px 16px ${accentColor}15`,
                    }}
                  >
                    <Avatar
                      src={
                        matchedUser.photoURL ||
                        `https://api.dicebear.com/9.x/glass/svg?seed=${matchedUser.username || "avatar"}&radius=50`
                      }
                      sx={{
                        width: 38,
                        height: 38,
                        border: `1.5px solid ${accentColor}`,
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box display="flex" alignItems="center" gap={0.8}>
                        <Typography
                          sx={{
                            fontSize: "0.85rem",
                            fontWeight: 800,
                            color: "#ffffff",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {matchedUser.name || "BunkMate Member"}
                        </Typography>
                        <Chip
                          label="Verified"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "0.62rem",
                            fontWeight: 800,
                            backgroundColor: "rgba(74, 222, 128, 0.15)",
                            color: "#4ade80",
                            border: "1px solid rgba(74, 222, 128, 0.3)",
                            borderRadius: "6px",
                          }}
                        />
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "0.74rem",
                          color: "rgba(255, 255, 255, 0.55)",
                        }}
                      >
                        @{matchedUser.username || "bunker"}
                      </Typography>
                    </Box>
                    <CheckCircleOutlineIcon
                      sx={{ color: "#4ade80", fontSize: 20 }}
                    />
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Feedback Alert */}
            {message && (
              <Alert
                icon={<MarkEmailReadOutlinedIcon fontSize="small" />}
                severity="success"
                sx={{
                  backgroundColor: "rgba(34, 197, 94, 0.12)",
                  color: "#4ade80",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  borderRadius: "14px",
                  fontSize: "0.82rem",
                  "& .MuiAlert-icon": { color: "#4ade80" },
                }}
              >
                {message}
              </Alert>
            )}

            {/* Error Feedback Alert */}
            {error && (
              <Alert
                severity="error"
                sx={{
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  color: "#f87171",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "14px",
                  fontSize: "0.82rem",
                  "& .MuiAlert-icon": { color: "#f87171" },
                }}
              >
                {error}
              </Alert>
            )}
          </Stack>
        </form>
      </Box>

      {/* Bottom Action Buttons (Neatly Positioned at Bottom) */}
      <Box sx={{ pt: 2, width: "100%" }}>
        <Stack spacing={1.2}>
          <Button
            onClick={handleSubmit}
            disabled={loading || isBlocked || requestSent}
            fullWidth
            sx={{
              backgroundColor: requestSent ? "rgba(74, 222, 128, 0.2)" : primaryBg,
              color: requestSent ? "#4ade80" : primaryText,
              border: requestSent ? "1px solid rgba(74, 222, 128, 0.4)" : "none",
              borderRadius: "28px",
              py: 1.4,
              fontWeight: 800,
              fontSize: "0.85rem",
              letterSpacing: "0.05em",
              boxShadow: requestSent ? "none" : `0 4px 14px ${primaryBg}30`,
              transition: "all 0.25s ease",
              "&:hover": {
                backgroundColor: requestSent
                  ? "rgba(74, 222, 128, 0.25)"
                  : accentColor,
                transform: isBlocked || requestSent ? "none" : "translateY(-1px)",
                boxShadow: requestSent ? "none" : `0 6px 20px ${accentColor}50`,
              },
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: primaryText }} />
            ) : requestSent ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
                <span>REQUEST SENT</span>
              </Box>
            ) : (
              "SEND RESET LINK"
            )}
          </Button>

          <Button
            fullWidth
            startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              if (haptic) haptic(10);
              navigate("/auth/login");
            }}
            sx={{
              color: "rgba(255, 255, 255, 0.6)",
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 0px rgba(0,0,0,0.1)',
              textTransform: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
              borderRadius: "28px",
              py: 1.1,
              "&:hover": {
                color: "#ffffff",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
              },
            }}
          >
            Back to Login
          </Button>
        </Stack>
      </Box>
    </motion.div>
  );
}