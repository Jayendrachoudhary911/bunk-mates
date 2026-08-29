import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
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
  Link,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleColoredIcon } from "./AuthWelcome";

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

export default function AuthLogin({
  onEmailLogin,
  onGoogleLogin,
  loading,
  error,
  haptic,
  activeTheme,
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const primaryBg = activeTheme?.light?.bg || "#D7E3FF";
  const primaryText = activeTheme?.light?.text || "#001B3F";
  const accentColor = activeTheme?.accent || "#88b7f0";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (haptic) haptic(20);
    if (onEmailLogin) {
      onEmailLogin(email, password);
    }
  };

  const inputStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      backgroundColor: "#0d0d12",
      color: "#ffffff",
      fontSize: "0.9rem",
      transition: "box-shadow 0.25s ease, border-color 0.25s ease",
      "& fieldset": {
        borderColor: "rgba(255, 255, 255, 0.16)",
        transition: "border-color 0.25s ease",
      },
      "&:hover fieldset": {
        borderColor: "rgba(255, 255, 255, 0.38)",
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
      <Box sx={{ width: "100%" }}>
        {/* Header Titles */}
        <motion.div variants={itemVariants}>
          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.65)",
                mb: 0.3,
              }}
            >
              LOGIN TO
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: "1.85rem", sm: "2.1rem" },
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              BunkMates
            </Typography>
          </Box>
        </motion.div>

        {/* Login Form with Separate Labels */}
        <form onSubmit={handleSubmit} id="login-form" style={{ width: "100%" }}>
          <Stack spacing={1.6}>
            {/* Email Field */}
            <motion.div variants={itemVariants}>
              <Box sx={{ mb: 2, mt: 2 }}>
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
                  placeholder="user@bunkmates.com"
                  type="email"
                  size="small"
                  required
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

            {/* Password Field */}
            <motion.div variants={itemVariants}>
              <Box sx={{ mb: 2 }}>
                <Typography
                  component="label"
                  sx={{
                    display: "block",
                    fontSize: "0.80rem",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    color: "rgba(255, 255, 255, 0.75)",
                    mb: 0.8,
                    ml: 0.6
                  }}
                >
                  Password <span style={{ color: accentColor, fontWeight: 700 }}>*</span>
                </Typography>
                <TextField
                  placeholder="••••••••"
                  size="small"
                  type={showPassword ? "text" : "password"}
                  required
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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
                                key="hide"
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
                                key="show"
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

            {/* Forgot password */}
            <motion.div variants={itemVariants}>
              <Box display="flex" justifyContent="flex-end" sx={{ mt: -0.2 }}>
                <Link
                  component={RouterLink}
                  to="/auth/forgot-password"
                  onClick={() => haptic && haptic(10)}
                  sx={{
                    fontSize: "0.78rem",
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
                  Forgot password?
                </Link>
              </Box>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: smoothEase }}
                  style={{ overflow: "hidden" }}
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
                    {error}
                  </Typography>
                </motion.div>
              )}
            </AnimatePresence>
          </Stack>
        </form>
      </Box>

      {/* Buttons Positioned Neatly at Bottom */}
      <Box sx={{ pt: 2, width: "100%" }}>
        <Stack spacing={1.2}>
          {/* LOGIN BUTTON */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            style={{ willChange: "transform" }}
          >
            <Button
              type="submit"
              form="login-form"
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
                "LOGIN"
              )}
            </Button>
          </motion.div>

          {/* Divider */}
          <motion.div variants={itemVariants}>
            <Divider
              sx={{
                my: 0.2,
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

          {/* CREATE NEW ACCOUNT BUTTON */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            style={{ willChange: "transform" }}
          >
            <Button
              fullWidth
              startIcon={<MailOutlineIcon sx={{ fontSize: 18 }} />}
              onClick={() => {
                if (haptic) haptic(15);
                navigate("/auth/signup");
              }}
              sx={{
                backgroundColor: "#ffffff11",
                color: "#ffffff",
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.11), 0 1px 0px rgba(0,0,0,0.1)',
                borderRadius: "28px",
                py: 1.25,
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
              Create New Account
            </Button>
          </motion.div>

          {/* CONTINUE WITH GOOGLE */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            style={{ willChange: "transform" }}
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
                py: 1.25,
                fontWeight: 800,
                fontSize: "0.82rem",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                boxShadow: `0 4px 18px ${primaryBg}35`,
                transition: "background-color 0.25s ease, box-shadow 0.25s ease",
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
