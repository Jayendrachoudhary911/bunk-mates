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

const smoothEase = [0.16, 1, 0.3, 1];

const containerVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.38,
      ease: smoothEase,
      staggerChildren: 0.06,
      delayChildren: 0.03,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.22, ease: "easeIn" },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: smoothEase },
  },
};

// Shield & Lock Custom Illustration with gentle float
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
    <motion.div
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      style={{
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
    </motion.div>
  </Box>
);

export default function AuthForgotPassword({ haptic, activeTheme }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  const [matchedUser, setMatchedUser] = useState(null);
  const [searchingProfile, setSearchingProfile] = useState(false);

  const [cooldownRemaining, setCooldownRemaining] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const primaryBg = activeTheme?.light?.bg || "#D7E3FF";
  const primaryText = activeTheme?.light?.text || "#001B3F";
  const accentColor = activeTheme?.accent || "#88b7f0";

  const searchTimeoutRef = useRef(null);

  const sanitizeEmailKey = (rawEmail) =>
    rawEmail.trim().toLowerCase().replace(/[.@#$[\]]/g, "_");

  const checkFirestoreRateLimit = useCallback(async (cleanEmail) => {
    try {
      const docKey = sanitizeEmailKey(cleanEmail);
      const resetRef = doc(db, "password_resets", docKey);
      const resetDoc = await getDoc(resetRef);

      if (resetDoc.exists()) {
        const data = resetDoc.data();
        const now = Date.now();
        const seventyTwoHoursMs = 72 * 60 * 60 * 1000;

        const rawAttempts = Array.isArray(data.attempts) ? data.attempts : [];
        const recentAttempts = rawAttempts.filter(
          (ts) => now - ts < seventyTwoHoursMs
        );

        if (recentAttempts.length >= 5) {
          const oldestAttempt = Math.min(...recentAttempts);
          const hoursLeft = Math.ceil(
            (seventyTwoHoursMs - (now - oldestAttempt)) / (1000 * 60 * 60)
          );
          setCooldownRemaining(hoursLeft);
          setIsBlocked(true);
          setError(
            `Password reset limit reached (5 attempts per 72 hours). Please retry in ~${hoursLeft} hours or contact support.`
          );
          return false;
        }
      }
      setIsBlocked(false);
      return true;
    } catch (err) {
      console.warn("Rate limit check warning:", err);
      return true;
    }
  }, []);

  useEffect(() => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || cleanEmail.length < 5) {
      setMatchedUser(null);
      setSearchingProfile(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingProfile(true);
      try {
        const q = query(
          collection(db, "users"),
          where("email", "==", cleanEmail)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setMatchedUser({
            name: userData.name || "BunkMate Member",
            username: userData.username || "bunker",
            photoURL: userData.photoURL || null,
          });
          await checkFirestoreRateLimit(cleanEmail);
        } else {
          setMatchedUser(null);
        }
      } catch (err) {
        console.warn("Profile search error:", err);
        setMatchedUser(null);
      } finally {
        setSearchingProfile(false);
      }
    }, 450);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [email, checkFirestoreRateLimit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (haptic) haptic(20);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your registered email address.");
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
      const canProceed = await checkFirestoreRateLimit(cleanEmail);
      if (!canProceed) {
        setLoading(false);
        return;
      }

      await sendPasswordResetEmail(auth, cleanEmail);

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
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "space-between",
        willChange: "transform, opacity",
      }}
    >
      <Box sx={{ width: "100%" }}>
        <motion.div variants={itemVariants}>
          <RecoveryIllustration
            accentColor={accentColor}
            primaryBg={primaryBg}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
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
        </motion.div>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <Stack spacing={1.8}>
            <motion.div variants={itemVariants}>
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
            </motion.div>

            <AnimatePresence>
              {matchedUser && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.3, ease: smoothEase }}
                  style={{ overflow: "hidden" }}
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

            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: smoothEase }}
                  style={{ overflow: "hidden" }}
                >
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
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: smoothEase }}
                  style={{ overflow: "hidden" }}
                >
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
                </motion.div>
              )}
            </AnimatePresence>
          </Stack>
        </form>
      </Box>

      <Box sx={{ pt: 2, width: "100%" }}>
        <Stack spacing={1.2}>
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: isBlocked || requestSent ? 1 : 1.015 }}
            whileTap={{ scale: isBlocked || requestSent ? 1 : 0.985 }}
            style={{ willChange: "transform" }}
          >
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
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            style={{ willChange: "transform" }}
          >
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
                transition: "color 0.25s ease, background-color 0.25s ease",
                "&:hover": {
                  color: "#ffffff",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                },
              }}
            >
              Back to Login
            </Button>
          </motion.div>
        </Stack>
      </Box>
    </motion.div>
  );
}