// src/pages/ResetPassword.js
import React, { useState, useEffect } from "react";
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

const smoothEase = [0.16, 1, 0.3, 1];

const containerVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.38,
      ease: smoothEase,
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.22, ease: "easeIn" },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: smoothEase },
  },
};

// Password criteria checks
const checkPasswordRules = (pwd) => ({
  length: pwd.length >= 8,
  uppercase: /[A-Z]/.test(pwd),
  number: /[0-9]/.test(pwd),
  symbol: /[^A-Za-z0-9]/.test(pwd),
});

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
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <LockResetIcon sx={{ fontSize: 40, color: accentColor || "#D7E3FF" }} />
    </motion.div>
  </Box>
);

export default function ResetPassword({ haptic, activeTheme }) {
  const navigate = useNavigate();
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

  const primaryBg = activeTheme?.light?.bg || "#D7E3FF";
  const primaryText = activeTheme?.light?.text || "#001B3F";
  const accentColor = activeTheme?.accent || "#88b7f0";

  const passwordRules = checkPasswordRules(newPassword);
  const isPasswordStrong = Object.values(passwordRules).every(Boolean);
  const doPasswordsMatch = newPassword && newPassword === confirmPassword;

  useEffect(() => {
    async function verifyCodeAndFetchUser() {
      if (!oobCode) {
        setError("Missing password reset link code.");
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
          setMatchedUser({
            name: "BunkMate Member",
            username: "bunker",
            photoURL: null,
          });
        }
      } catch (err) {
        console.error("Reset code verification error:", err);
        setError("Invalid or expired password reset link.");
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
      setMessage("Password has been reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/auth/login");
      }, 2500);
    } catch (err) {
      console.error("Password reset execution error:", err);
      setError(err.message || "Failed to reset password. Please request a new link.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      backgroundColor: "#0d0d12",
      color: "#ffffff",
      fontSize: "0.88rem",
      transition: "box-shadow 0.25s ease, border-color 0.25s ease",
      "& fieldset": {
        borderColor: "rgba(255, 255, 255, 0.15)",
        transition: "border-color 0.25s ease",
      },
      "&:hover fieldset": {
        borderColor: "rgba(255, 255, 255, 0.35)",
      },
      "&.Mui-focused": {
        boxShadow: `0 0 0 3px ${accentColor}25`,
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
      <Box sx={{ width: "100%", overflowY: "auto", maxHeight: "58vh", pr: 0.5 }}>
        <motion.div variants={itemVariants}>
          <RecoveryIllustration accentColor={accentColor} />
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
              SECURE UPDATE
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
              Set New Password
            </Typography>
          </Box>
        </motion.div>

        {verifyingCode ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} sx={{ color: accentColor }} />
          </Box>
        ) : (
          <>
            {/* User Profile Info Card */}
            {matchedUser && (
              <motion.div variants={itemVariants}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.2,
                    px: 1.5,
                    mb: 2,
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
                        fontSize: "0.74rem",
                        color: "rgba(255, 255, 255, 0.55)",
                      }}
                    >
                      {userEmail}
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} id="reset-password-form" style={{ width: "100%" }}>
              <Stack spacing={1.25}>
                {/* New Password Field */}
                <motion.div variants={itemVariants}>
                  <Box sx={{ mb: 1 }}>
                    <Typography
                      component="label"
                      sx={{
                        display: "block",
                        fontSize: "0.80rem",
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                        color: "rgba(255, 255, 255, 0.75)",
                        mb: 0.8,
                        ml: 0.6,
                      }}
                    >
                      New Password <span style={{ color: accentColor, fontWeight: 700 }}>*</span>
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
                      autoComplete="new-password"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (haptic) haptic(10);
                                setShowPassword(!showPassword);
                              }}
                              edge="end"
                              sx={{
                                color: "rgba(255, 255, 255, 0.4)",
                                p: 0.6,
                                borderRadius: "8px",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  color: "#ffffff",
                                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                                  transform: "scale(1.05)",
                                },
                              }}
                            >
                              <AnimatePresence mode="wait" initial={false}>
                                {showPassword ? (
                                  <motion.div
                                    key="hide-pwd"
                                    initial={{ opacity: 0, scale: 0.75, rotate: -15 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 0.75, rotate: 15 }}
                                    transition={{ duration: 0.15 }}
                                    style={{ display: "flex", alignItems: "center" }}
                                  >
                                    <VisibilityOffIcon sx={{ fontSize: 18 }} />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="show-pwd"
                                    initial={{ opacity: 0, scale: 0.75, rotate: 15 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 0.75, rotate: -15 }}
                                    transition={{ duration: 0.15 }}
                                    style={{ display: "flex", alignItems: "center" }}
                                  >
                                    <VisibilityIcon sx={{ fontSize: 18 }} />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        ...inputStyle,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "14px",
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          backdropFilter: "blur(8px)",
                          height: 45,
                          transition: "all 0.25s ease-in-out",
                          "& fieldset": { borderColor: "rgba(255, 255, 255, 0.12)", borderWidth: "1px" },
                          "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.25)" },
                          "&.Mui-focused fieldset": { borderColor: accentColor, borderWidth: "2px", boxShadow: `0 0 12px ${accentColor}25` },
                        },
                        "& .MuiOutlinedInput-input": {
                          color: "#ffffff",
                          fontSize: "0.9rem",
                          padding: "10px 14px",
                          "&::placeholder": { color: "rgba(255, 255, 255, 0.3)", opacity: 1 },
                        },
                      }}
                    />

                    {/* Password Validator Checklist */}
                    <AnimatePresence>
                      {newPassword && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -4 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -4 }}
                          transition={{ duration: 0.25, ease: smoothEase }}
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
                                  fontSize: "0.7rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  color: rule.met ? "#4ade80" : "rgba(255, 255, 255, 0.4)",
                                  transition: "color 0.2s ease",
                                }}
                              >
                                {rule.met ? (
                                  <CheckCircleRoundedIcon sx={{ fontSize: "12px", color: "#4ade80" }} />
                                ) : (
                                  <RadioButtonUncheckedRoundedIcon sx={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.35)" }} />
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

                {/* Confirm Password Field */}
                <motion.div variants={itemVariants}>
                  <Box sx={{ mb: 1 }}>
                    <Typography
                      component="label"
                      sx={{
                        display: "block",
                        fontSize: "0.80rem",
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                        color: "rgba(255, 255, 255, 0.75)",
                        mb: 0.8,
                        ml: 0.6,
                      }}
                    >
                      Confirm Password <span style={{ color: accentColor, fontWeight: 700 }}>*</span>
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
                      autoComplete="new-password"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (haptic) haptic(10);
                                setShowConfirm(!showConfirm);
                              }}
                              edge="end"
                              sx={{
                                color: "rgba(255, 255, 255, 0.4)",
                                p: 0.6,
                                borderRadius: "8px",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  color: "#ffffff",
                                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                                  transform: "scale(1.05)",
                                },
                              }}
                            >
                              <AnimatePresence mode="wait" initial={false}>
                                {showConfirm ? (
                                  <motion.div
                                    key="hide-confirm"
                                    initial={{ opacity: 0, scale: 0.75, rotate: -15 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 0.75, rotate: 15 }}
                                    transition={{ duration: 0.15 }}
                                    style={{ display: "flex", alignItems: "center" }}
                                  >
                                    <VisibilityOffIcon sx={{ fontSize: 18 }} />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="show-confirm"
                                    initial={{ opacity: 0, scale: 0.75, rotate: 15 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 0.75, rotate: -15 }}
                                    transition={{ duration: 0.15 }}
                                    style={{ display: "flex", alignItems: "center" }}
                                  >
                                    <VisibilityIcon sx={{ fontSize: 18 }} />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        ...inputStyle,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "14px",
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          backdropFilter: "blur(8px)",
                          height: 45,
                          transition: "all 0.25s ease-in-out",
                          "& fieldset": { borderColor: "rgba(255, 255, 255, 0.12)", borderWidth: "1px" },
                          "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.25)" },
                          "&.Mui-focused fieldset": { borderColor: accentColor, borderWidth: "2px", boxShadow: `0 0 12px ${accentColor}25` },
                        },
                        "& .MuiOutlinedInput-input": {
                          color: "#ffffff",
                          fontSize: "0.9rem",
                          padding: "10px 14px",
                          "&::placeholder": { color: "rgba(255, 255, 255, 0.3)", opacity: 1 },
                        },
                      }}
                    />

                    {/* Password Matcher Indicator */}
                    <AnimatePresence>
                      {confirmPassword && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -4 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -4 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Typography
                            sx={{
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              mt: 0.6,
                              ml: 0.6,
                              color: doPasswordsMatch ? "#4ade80" : "#f87171",
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            {doPasswordsMatch ? "✓ Passwords match" : "✕ Passwords do not match"}
                          </Typography>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Box>
                </motion.div>

                {/* Success Banner */}
                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -6 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -6 }}
                      transition={{ duration: 0.25, ease: smoothEase }}
                    >
                      <Alert
                        icon={<CheckCircleOutlineIcon fontSize="small" />}
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

                {/* Error Banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -6 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -6 }}
                      transition={{ duration: 0.25, ease: smoothEase }}
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
          </>
        )}
      </Box>

      {/* Bottom Action Buttons */}
      <Box sx={{ pt: 1.5, width: "100%" }}>
        <Stack spacing={1.1}>
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            style={{ willChange: "transform" }}
          >
            <Button
              type="submit"
              form="reset-password-form"
              disabled={loading || verifyingCode || !!message}
              fullWidth
              sx={{
                backgroundColor: primaryBg,
                color: primaryText,
                borderRadius: "28px",
                py: 1.35,
                fontWeight: 800,
                fontSize: "0.85rem",
                letterSpacing: "0.05em",
                boxShadow: `0 4px 18px ${primaryBg}35`,
                transition: "background-color 0.25s ease, box-shadow 0.25s ease",
                "&:hover": {
                  backgroundColor: accentColor,
                  boxShadow: `0 6px 24px ${accentColor}55`,
                },
              }}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: primaryText }} />
              ) : (
                "UPDATE PASSWORD"
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
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 0px rgba(0,0,0,0.1)",
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