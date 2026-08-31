// src/auth/ResetPassword.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  CircularProgress,
  IconButton,
  InputAdornment,
  Avatar,
  Chip,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { M3_EXPRESSIVE_PALETTE } from "../theme/palette";

const containerVariants = {
  hidden: { opacity: 0, scale: 0.96, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    filter: "blur(4px)",
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const springTransition = {
  type: "spring",
  stiffness: 230,
  damping: 27,
  mass: 0.9,
};

// Password criteria checks
const checkPasswordRules = (pwd) => ({
  length: pwd.length >= 8,
  uppercase: /[A-Z]/.test(pwd),
  number: /[0-9]/.test(pwd),
  symbol: /[^A-Za-z0-9]/.test(pwd),
});

export default function ResetPassword({ haptic, activeTheme: propActiveTheme }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery("(min-width:960px)");
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  const [matchedUser, setMatchedUser] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeTheme = propActiveTheme || M3_EXPRESSIVE_PALETTE.amber;

  const passwordRules = checkPasswordRules(newPassword);
  const isPasswordStrong = Object.values(passwordRules).every(Boolean);
  const doPasswordsMatch = newPassword && newPassword === confirmPassword;

  useEffect(() => {
    async function verifyCodeAndFetchUser() {
      if (!oobCode) {
        setError("Missing password reset verification code.");
        setVerifyingCode(false);
        return;
      }
      try {
        const email = await verifyPasswordResetCode(auth, oobCode);
        setUserEmail(email);

        const usersSnapshot = await getDocs(collection(db, "users"));
        let foundUser = null;
        usersSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.email === email) {
            foundUser = { uid: docSnap.id, ...data };
          }
        });

        if (foundUser) {
          setMatchedUser({
            name: foundUser.name || foundUser.displayName || "BunkMate Member",
            username: foundUser.username || foundUser.displayName || "bunker",
            photoURL: foundUser.photoURL || null,
          });
        } else {
          setMatchedUser(null);
          setError("No account data could be found in our database for this reset link.");
        }
      } catch (err) {
        console.error("Reset code verification error:", err);
        setError("Invalid or expired password reset link.");
        setMatchedUser(null);
      } finally {
        setVerifyingCode(false);
      }
    }
    verifyCodeAndFetchUser();
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (haptic) haptic(20);

    if (!isPasswordStrong) {
      setError("Please meet all password security requirements.");
      return;
    }
    if (!doPasswordsMatch) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setMessage("Password has been reset successfully! Redirecting...");
      setTimeout(() => {
        navigate("/auth/login");
      }, 2500);
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      backdropFilter: "blur(8px)",
      color: "#ffffff",
      fontSize: "0.9rem",
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
        borderColor: activeTheme.accent,
        borderWidth: "2px",
        boxShadow: `0 0 12px ${activeTheme.accent}25`,
      },
    },
    "& input::placeholder": {
      color: "rgba(255, 255, 255, 0.3)",
      opacity: 1,
    },
  };

  const formContent = (
    <Stack spacing={2.2}>
      {/* Header Icon & Titles */}
      <motion.div variants={itemVariants} style={{ textAlign: "center" }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: "16px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mx: "auto",
            mb: 1.5,
          }}
        >
          <LockResetIcon sx={{ fontSize: 26, color: activeTheme.accent }} />
        </Box>
        <Typography
          sx={{
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(255, 255, 255, 0.5)",
            mb: 0.3,
          }}
        >
          Account Recovery
        </Typography>
        <Typography
          sx={{
            fontSize: "1.55rem",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.02em",
          }}
        >
          Reset Password
        </Typography>
        <Typography
          sx={{
            fontSize: "0.78rem",
            color: "rgba(255, 255, 255, 0.6)",
            mt: 0.5,
            px: 1,
          }}
        >
          Enter your registered email and secure your new credentials.
        </Typography>
      </motion.div>

      {verifyingCode ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={32} sx={{ color: activeTheme.accent }} />
        </Box>
      ) : !matchedUser ? (
        // Only show error and fallback button if user data is NOT fetched properly from DB
        <motion.div variants={itemVariants}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="error" sx={{ borderRadius: "12px", backgroundColor: "rgba(239, 68, 68, 0.12)", color: "#f87171" }}>
              {error || "Account data not found in database."}
            </Alert>
            <Button
              fullWidth
              startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate("/auth/login")}
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                borderRadius: "28px",
                py: 1.1,
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { color: "#ffffff", backgroundColor: "rgba(255, 255, 255, 0.08)" },
              }}
            >
              Back to Login
            </Button>
          </Stack>
        </motion.div>
      ) : (
        // Textfields and form fields ONLY render when matchedUser data is properly fetched from DB
        <>
          {/* User Profile Card */}
          <motion.div variants={itemVariants}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.2,
                px: 1.5,
                borderRadius: "16px",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: `1px solid ${activeTheme.accent}30`,
                backdropFilter: "blur(10px)",
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
                  border: `1.5px solid ${activeTheme.accent}`,
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
                    {matchedUser.name}
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
                    fontSize: "0.72rem",
                    color: "rgba(255, 255, 255, 0.5)",
                  }}
                >
                  {userEmail}
                </Typography>
              </Box>
            </Box>
          </motion.div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} id="reset-form">
            <Stack spacing={1.6}>
              {/* New Password */}
              <motion.div variants={itemVariants}>
                <Box>
                  <Typography
                    component="label"
                    sx={{
                      display: "block",
                      fontSize: "0.76rem",
                      fontWeight: 600,
                      color: "rgba(255, 255, 255, 0.75)",
                      mb: 0.5,
                      ml: 0.5,
                    }}
                  >
                    New Password <span style={{ color: activeTheme.accent }}>*</span>
                  </Typography>
                  <TextField
                    name="newPassword"
                    placeholder="••••••••"
                    size="small"
                    type={showPassword ? "text" : "password"}
                    required
                    fullWidth
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error) setError("");
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: "rgba(255, 255, 255, 0.4)" }}
                          >
                            {showPassword ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={inputStyle}
                  />

                  {/* Validator Checklist */}
                  <AnimatePresence>
                    {newPassword && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Box sx={{ mt: 1, px: 0.6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px" }}>
                          {[
                            { label: "8+ characters", met: passwordRules.length },
                            { label: "1 uppercase letter", met: passwordRules.uppercase },
                            { label: "1 number", met: passwordRules.number },
                            { label: "1 symbol", met: passwordRules.symbol },
                          ].map((rule, idx) => (
                            <Typography
                              key={idx}
                              sx={{
                                fontSize: "0.68rem",
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: rule.met ? "#4ade80" : "rgba(255, 255, 255, 0.4)",
                              }}
                            >
                              {rule.met ? (
                                <CheckCircleRoundedIcon sx={{ fontSize: "11px", color: "#4ade80" }} />
                              ) : (
                                <RadioButtonUncheckedRoundedIcon sx={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.35)" }} />
                              )}
                              {rule.label}
                            </Typography>
                          ))}
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>
              </motion.div>

              {/* Confirm Password */}
              <motion.div variants={itemVariants}>
                <Box>
                  <Typography
                    component="label"
                    sx={{
                      display: "block",
                      fontSize: "0.76rem",
                      fontWeight: 600,
                      color: "rgba(255, 255, 255, 0.75)",
                      mb: 0.5,
                      ml: 0.5,
                    }}
                  >
                    Confirm Password <span style={{ color: activeTheme.accent }}>*</span>
                  </Typography>
                  <TextField
                    name="confirmPassword"
                    placeholder="••••••••"
                    size="small"
                    type={showConfirm ? "text" : "password"}
                    required
                    fullWidth
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError("");
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => setShowConfirm(!showConfirm)}
                            edge="end"
                            sx={{ color: "rgba(255, 255, 255, 0.4)" }}
                          >
                            {showConfirm ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={inputStyle}
                  />

                  {/* Matcher indicator */}
                  <AnimatePresence>
                    {confirmPassword && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            mt: 0.5,
                            ml: 0.5,
                            color: doPasswordsMatch ? "#4ade80" : "#f87171",
                          }}
                        >
                          {doPasswordsMatch ? "✓ Passwords match" : "✕ Passwords do not match"}
                        </Typography>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>
              </motion.div>

              {/* Banners */}
              {message && (
                <Alert icon={<CheckCircleOutlineIcon fontSize="small" />} severity="success" sx={{ borderRadius: "12px", backgroundColor: "rgba(34, 197, 94, 0.12)", color: "#4ade80" }}>
                  {message}
                </Alert>
              )}
              {error && (
                <Alert severity="error" sx={{ borderRadius: "12px", backgroundColor: "rgba(239, 68, 68, 0.12)", color: "#f87171" }}>
                  {error}
                </Alert>
              )}
            </Stack>
          </form>

          {/* Action Buttons */}
          <motion.div variants={itemVariants}>
            <Stack spacing={1.2} sx={{ mt: 1.5 }}>
              <Button
                type="submit"
                form="reset-form"
                disabled={loading || !!message}
                fullWidth
                sx={{
                  backgroundColor: activeTheme.accent,
                  color: "#000000",
                  borderRadius: "28px",
                  py: 1.3,
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  letterSpacing: "0.05em",
                  boxShadow: `0 4px 18px ${activeTheme.accent}35`,
                  "&:hover": { backgroundColor: "#f59e0b" },
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: "#000000" }} /> : "UPDATE PASSWORD"}
              </Button>

              <Button
                fullWidth
                startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
                onClick={() => navigate("/auth/login")}
                sx={{
                  color: "rgba(255, 255, 255, 0.7)",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  borderRadius: "28px",
                  py: 1.05,
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": { color: "#ffffff", backgroundColor: "rgba(255, 255, 255, 0.08)" },
                }}
              >
                Back to Login
              </Button>
            </Stack>
          </motion.div>
        </>
      )}
    </Stack>
  );

  return (
    <motion.div
      animate={{ backgroundColor: isDesktop ? activeTheme.light.bg : "#000000" }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: isDesktop ? "32px" : 0,
        boxSizing: "border-box",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.28, 0.15],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "10%",
          left: "20%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${activeTheme.accent} 0%, transparent 70%)`,
          pointerEvents: "none",
          filter: "blur(60px)",
          zIndex: 0,
        }}
      />

      {isDesktop ? (
        <Box
          sx={{
            width: "100%",
            maxWidth: 1180,
            height: "88vh",
            minHeight: 680,
            maxHeight: 880,
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            gap: 4,
            position: "relative",
            zIndex: 1,
          }}
        >
          <motion.div
            layout
            animate={{
              backgroundColor: activeTheme.light.bg,
              borderRadius: 36,
            }}
            transition={{
              backgroundColor: { duration: 0.8, ease: "easeInOut" },
              borderRadius: springTransition,
            }}
            style={{
              flex: 1.2,
              padding: "64px 56px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: activeTheme.light.text,
                  opacity: 0.85,
                  mb: 0.5,
                }}
              >
                BUNKMATES
              </Typography>
              <Typography
                sx={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: activeTheme.light.text,
                  opacity: 0.65,
                }}
              >
                Plan. Connect. Travel together.
              </Typography>
            </Box>

            <motion.div
              initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Typography
                sx={{
                  fontSize: "1rem",
                  fontWeight: 800,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: activeTheme.light.text,
                  opacity: 0.8,
                  mb: 0.5,
                }}
              >
                ACCOUNT RECOVERY
              </Typography>
              <Typography
                sx={{
                  fontSize: { md: "3.2rem", lg: "3.8rem" },
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  color: activeTheme.light.text,
                  lineHeight: 1.05,
                  whiteSpace: "pre-line",
                }}
              >
                {"We've Got\nYour Back"}
              </Typography>
            </motion.div>

            <Box>
              <Typography
                sx={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: activeTheme.light.text,
                  opacity: 0.6,
                }}
              >
                Seamless group experiences & real-time clan adventures.
              </Typography>
            </Box>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{
              width: 440,
              padding: "32px",
              backgroundColor: "#000000",
              borderRadius: 36,
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              overflowY: "auto",
              position: "relative",
            }}
          >
            {formContent}
          </motion.div>
        </Box>
      ) : (
        <Box
          sx={{
            width: "100%",
            maxWidth: 440,
            height: "100vh",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: activeTheme.light.bg,
            overflow: "hidden",
            position: "relative",
            zIndex: 1,
          }}
        >
          <motion.div
            layout
            animate={{
              backgroundColor: activeTheme.light.bg,
              flex: 0.22,
              minHeight: 110,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              paddingTop: 24,
              paddingBottom: 14,
            }}
            style={{
              paddingLeft: "32px",
              paddingRight: "32px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              position: "relative",
              zIndex: 1,
              overflow: "hidden",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: activeTheme.light.text,
                opacity: 0.85,
                mb: 0.2,
              }}
            >
              ACCOUNT RECOVERY
            </Typography>
            <Typography
              sx={{
                fontSize: "1.75rem",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                color: activeTheme.light.text,
                lineHeight: 1.1,
              }}
            >
              BunkMates
            </Typography>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{
              flex: 1,
              backgroundColor: "#000000",
              borderTopLeftRadius: 36,
              borderTopRightRadius: 36,
              marginTop: 285,
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              paddingLeft: "26px",
              paddingRight: "26px",
              paddingTop: "24px",
              paddingBottom: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflowY: "auto",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 2,
            }}
          >
            {formContent}
          </motion.div>
        </Box>
      )}
    </motion.div>
  );  
}