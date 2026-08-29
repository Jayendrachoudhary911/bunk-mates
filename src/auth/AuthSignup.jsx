import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Divider,
  CircularProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import { motion } from "framer-motion";
import { GoogleColoredIcon } from "./AuthWelcome";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const containerVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.05,
      delayChildren: 0.03,
    },
  },
  exit: {
    opacity: 0,
    y: -14,
    filter: "blur(4px)",
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// Password criteria checks
const checkPasswordRules = (pwd) => ({
  length: pwd.length >= 8,
  uppercase: /[A-Z]/.test(pwd),
  number: /[0-9]/.test(pwd),
  symbol: /[^A-Za-z0-9]/.test(pwd),
});

export default function AuthSignup({
  onEmailSignup,
  onGoogleLogin,
  loading,
  error,
  haptic,
  activeTheme,
}) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const primaryBg = activeTheme?.light?.bg || "#D7E3FF";
  const primaryText = activeTheme?.light?.text || "#001B3F";
  const accentColor = activeTheme?.accent || "#88b7f0";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [validationError, setValidationError] = useState("");

  const passwordRules = checkPasswordRules(formData.password);
  const isPasswordStrong = Object.values(passwordRules).every(Boolean);
  const doPasswordsMatch =
    formData.password && formData.password === formData.confirmPassword;

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationError("");

    if (name === "username") {
      const cleanUsername = value.replace(/^@/, "").trim();
      if (cleanUsername.length >= 3) {
        setCheckingUsername(true);
        try {
          const q = query(
            collection(db, "users"),
            where("username", "==", cleanUsername)
          );
          const snap = await getDocs(q);
          setUsernameAvailable(snap.empty);
        } catch {
          setUsernameAvailable(true);
        } finally {
          setCheckingUsername(false);
        }
      } else {
        setUsernameAvailable(null);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (haptic) haptic(20);

    if (!isPasswordStrong) {
      setValidationError("Please meet all password security requirements.");
      return;
    }
    if (!doPasswordsMatch) {
      setValidationError("Passwords do not match!");
      return;
    }
    if (usernameAvailable === false) {
      setValidationError("Username is already taken. Please choose another.");
      return;
    }

    if (onEmailSignup) {
      onEmailSignup(formData);
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

  const displayError = validationError || error;

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
      }}
    >
      <Box sx={{ width: "100%", overflowY: "auto", maxHeight: "58vh", pr: 0.5 }}>
        {/* Signup Form */}
        <form onSubmit={handleSubmit} id="signup-form" style={{ width: "100%" }}>
          <Stack spacing={1.25}>
            {/* Full Name */}
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
                  Full Name <span style={{ color: accentColor, fontWeight: 700 }}>*</span>
                </Typography>
                <TextField
                  name="name"
                  placeholder="Original Bunker"
                  size="small"
                  required
                  fullWidth
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
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
              </Box>
            </motion.div>

            {/* Mobile Number */}
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
                  Mobile Number <span style={{ color: accentColor, fontWeight: 700 }}>*</span>
                </Typography>
                <TextField
                  name="mobile"
                  placeholder="+91 9876543210"
                  size="small"
                  required
                  fullWidth
                  value={formData.mobile}
                  onChange={handleChange}
                  autoComplete="tel"
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
              </Box>
            </motion.div>

            {/* Email Address */}
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
                  Email Address <span style={{ color: accentColor, fontWeight: 700 }}>*</span>
                </Typography>
                <TextField
                  name="email"
                  placeholder="user@bunkmates.com"
                  type="email"
                  size="small"
                  required
                  fullWidth
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
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
              </Box>
            </motion.div>

            {/* Username */}
            <motion.div variants={itemVariants}>
              <Box sx={{ mb: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8, px: 0.6 }}>
                  <Typography
                    component="label"
                    sx={{
                      fontSize: "0.80rem",
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                      color: "rgba(255, 255, 255, 0.75)",
                    }}
                  >
                    Username <span style={{ color: accentColor, fontWeight: 700 }}>*</span>
                  </Typography>
                  {checkingUsername ? (
                    <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem" }}>
                      Checking availability...
                    </Typography>
                  ) : usernameAvailable === false ? (
                    <Typography sx={{ color: "#f87171", fontSize: "0.72rem", fontWeight: 700 }}>
                      Username taken
                    </Typography>
                  ) : usernameAvailable === true ? (
                    <Typography sx={{ color: "#4ade80", fontSize: "0.72rem", fontWeight: 700 }}>
                      Username available
                    </Typography>
                  ) : null}
                </Box>
                <TextField
                  name="username"
                  placeholder="@user_bunker"
                  size="small"
                  required
                  fullWidth
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
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
              </Box>
            </motion.div>

            {/* Password */}
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
                  Password <span style={{ color: accentColor, fontWeight: 700 }}>*</span>
                </Typography>
                <TextField
                  name="password"
                  placeholder="••••••••"
                  size="small"
                  type={showPassword ? "text" : "password"}
                  required
                  fullWidth
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{
                            color: "rgba(255, 255, 255, 0.4)",
                            p: 0.6,
                            borderRadius: "8px",
                            transition: "all 0.2s ease",
                            "&:hover": { 
                              color: "#ffffff", 
                              backgroundColor: "rgba(255, 255, 255, 0.08)",
                              transform: "scale(1.05)" 
                            },
                          }}
                        >
                          {showPassword ? (
                            <VisibilityOffIcon sx={{ fontSize: 18 }} />
                          ) : (
                            <VisibilityIcon sx={{ fontSize: 18 }} />
                          )}
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
                {formData.password && (
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
                          <CheckCircleRoundedIcon sx={{ fontSize: "12px" }} />
                        ) : (
                          <RadioButtonUncheckedRoundedIcon sx={{ fontSize: "12px" }} />
                        )}
                        {rule.label}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            </motion.div>

            {/* Confirm Password */}
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
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowConfirm(!showConfirm)}
                          edge="end"
                          sx={{
                            color: "rgba(255, 255, 255, 0.4)",
                            p: 0.6,
                            borderRadius: "8px",
                            transition: "all 0.2s ease",
                            "&:hover": { 
                              color: "#ffffff", 
                              backgroundColor: "rgba(255, 255, 255, 0.08)",
                              transform: "scale(1.05)" 
                            },
                          }}
                        >
                          {showConfirm ? (
                            <VisibilityOffIcon sx={{ fontSize: 18 }} />
                          ) : (
                            <VisibilityIcon sx={{ fontSize: 18 }} />
                          )}
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
                {formData.confirmPassword && (
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
                )}
              </Box>
            </motion.div>

            {displayError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                <Typography
                  sx={{
                    color: "#f87171",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    textAlign: "center",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    borderRadius: "10px",
                    py: 0.75,
                    px: 1.5,
                  }}
                >
                  {displayError}
                </Typography>
              </motion.div>
            )}
          </Stack>
        </form>
      </Box>

      {/* Buttons Positioned Neatly at Bottom */}
      <Box sx={{ pt: 0.8, width: "100%" }}>
        <Stack spacing={1.1}>
          {/* JOIN CLAN BUTTON */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
          >
            <Button
              type="submit"
              form="signup-form"
              disabled={loading}
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
                transition: "background-color 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  backgroundColor: accentColor,
                  boxShadow: `0 6px 24px ${accentColor}55`,
                },
              }}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: primaryText }} />
              ) : (
                "JOIN CLAN"
              )}
            </Button>
          </motion.div>

          {/* Divider */}
          <motion.div variants={itemVariants}>
            <Divider
              sx={{
                my: 0.15,
                color: "rgba(255, 255, 255, 0.35)",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                "&::before, &::after": {
                  borderColor: "rgba(255, 255, 255, 0.12)",
                },
              }}
            >
              OR
            </Divider>
          </motion.div>

          {/* LOGIN WITH EMAIL */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
          >
            <Button
              fullWidth
              startIcon={<MailOutlineIcon sx={{ fontSize: 18 }} />}
              onClick={() => {
                if (haptic) haptic(15);
                navigate("/auth/login");
              }}
              sx={{
                backgroundColor: "#000000",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.22)",
                borderRadius: "28px",
                py: 1.2,
                fontWeight: 800,
                fontSize: "0.82rem",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                transition: "border-color 0.25s ease, background-color 0.25s ease",
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.6)",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                },
              }}
            >
              Login with Email
            </Button>
          </motion.div>

          {/* CONTINUE WITH GOOGLE */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
          >
            <Button
              fullWidth
              onClick={() => {
                if (haptic) haptic(15);
                if (onGoogleLogin) onGoogleLogin();
              }}
              disabled={loading}
              sx={{
                backgroundColor: primaryBg,
                color: primaryText,
                borderRadius: "28px",
                py: 1.2,
                fontWeight: 800,
                fontSize: "0.82rem",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                boxShadow: `0 4px 18px ${primaryBg}35`,
                transition: "background-color 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  backgroundColor: accentColor,
                  boxShadow: `0 6px 24px ${accentColor}55`,
                },
              }}
            >
              <GoogleColoredIcon />
              Continue with Google
            </Button>
          </motion.div>
        </Stack>
      </Box>
    </motion.div>
  );
}