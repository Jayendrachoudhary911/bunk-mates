// src/pages/Login.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Divider,
  CircularProgress,
  Avatar,
  IconButton,
  InputAdornment,
  Link,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { motion, AnimatePresence } from "framer-motion";

import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useAuth } from "../hooks/useAuth";
import { useUserRealtime } from "../hooks/useUserRealtime";
import { M3_EXPRESSIVE_PALETTE } from "../theme/palette";

/* ---------------- THEME & GOOGLE ICON ---------------- */

const theme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#09090b" },
    primary: { main: "#ffffff" },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
});

const GoogleColoredIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.55 10.78l7.98-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const haptic = (strength = 20) => {
  if (navigator.vibrate) navigator.vibrate(strength);
};

const slogans = [
  "Explore\nTogether\nAlways",
  "Squad Trips\nSimplified\nTogether",
  "Adventure\nStarts\nHere",
  "Travel Smarter\nBuild Memories\nEverywhere",
];

const paletteKeys = ["blue", "purple", "emerald", "amber", "orange"];

export default function Login() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const userDoc = useUserRealtime();

  const [page, setPage] = useState("main"); // "main" | "email"
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [sloganIndex, setSloganIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);

  const [form, setForm] = useState({ email: "", password: "" });

  const activeTheme = useMemo(() => {
    const key = paletteKeys[colorIndex % paletteKeys.length];
    return M3_EXPRESSIVE_PALETTE[key];
  }, [colorIndex]);

  // Slogan and color cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setSloganIndex((prev) => (prev + 1) % slogans.length);
      setColorIndex((prev) => (prev + 1) % paletteKeys.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      haptic(25);
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setSuccess(true);
    } catch {
      setError("Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      haptic(25);
      setLoading(true);
      setError("");
      await signInWithEmailAndPassword(auth, form.email, form.password);
      setSuccess(true);
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // Reusable styled input sx
  const inputStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      backgroundColor: "#0d0d11",
      color: "#fff",
      "& fieldset": { borderColor: "rgba(255, 255, 255, 0.15)" },
      "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
      "&.Mui-focused fieldset": { borderColor: activeTheme.accent },
    },
    "& .MuiInputLabel-root": {
      color: "rgba(255, 255, 255, 0.5)",
      "&.Mui-focused": { color: activeTheme.accent },
    },
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#09090b",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: { xs: 0, sm: 2 },
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 440,
            minHeight: { xs: "100vh", sm: "92vh" },
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#000000",
            borderRadius: { xs: 0, sm: "36px" },
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {/* ================= TOP HERO SECTION ================= */}
          <motion.div
            animate={{ backgroundColor: activeTheme.light.bg }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{
              flex: page === "email" ? 0.7 : 1,
              borderBottomLeftRadius: "40px",
              borderBottomRightRadius: "40px",
              padding: "48px 36px 40px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              transition: "flex 0.4s ease",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={sloganIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: 38, sm: 44 },
                    fontWeight: 900,
                    lineHeight: 1.08,
                    letterSpacing: "-0.03em",
                    color: activeTheme.light.text,
                    whiteSpace: "pre-line",
                  }}
                >
                  {slogans[sloganIndex]}
                </Typography>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* ================= BOTTOM SHEET SECTION ================= */}
          <Box
            sx={{
              flex: 1.2,
              backgroundColor: "#000000",
              p: { xs: 3.5, sm: 4 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <AnimatePresence mode="wait">
              {/* ---------------- 1. SUCCESS / CONTINUE SCREEN ---------------- */}
              {success ? (
                <motion.div
                  key="success-screen"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <Stack spacing={3} alignItems="center" textAlign="center">
                    <Avatar
                      src={
                        userDoc?.photoURL ||
                        currentUser?.photoURL ||
                        `https://api.dicebear.com/9.x/glass/svg?seed=${currentUser?.uid || "avatar"}&radius=50`
                      }
                      sx={{
                        width: 84,
                        height: 84,
                        border: `3px solid ${activeTheme.accent}`,
                        boxShadow: `0 0 24px ${activeTheme.accent}40`,
                      }}
                    />

                    <Box>
                      <Typography variant="h6" fontWeight={800} color="#fff">
                        Hey, {userDoc?.name || currentUser?.displayName || "Original Bunker"}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mt: 0.5 }}>
                        You're in. Bags packed. Vibes set.
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
                        Signed in as
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="#fff">
                        {currentUser?.email || "user@bunkmates.com"}
                      </Typography>
                    </Box>

                    <Button
                      fullWidth
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate("/")}
                      sx={{
                        backgroundColor: activeTheme.light.bg,
                        color: activeTheme.light.text,
                        borderRadius: "28px",
                        py: 1.6,
                        fontWeight: 700,
                        textTransform: "none",
                        fontSize: 16,
                        "&:hover": { backgroundColor: activeTheme.accent },
                      }}
                    >
                      Let's Plan a Bunk
                    </Button>
                  </Stack>
                </motion.div>
              ) : page === "main" ? (
                /* ---------------- 2. WELCOME SCREEN ---------------- */
                <motion.div
                  key="welcome-screen"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <Stack spacing={2.5}>
                    <Box sx={{ mb: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.7)",
                        }}
                      >
                        WELCOME TO
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 32,
                          fontWeight: 900,
                          color: "#ffffff",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        BunkMates
                      </Typography>
                    </Box>

                    {/* LOGIN WITH EMAIL */}
                    <Button
                      fullWidth
                      startIcon={<MailOutlineIcon />}
                      onClick={() => {
                        haptic(10);
                        setPage("email");
                      }}
                      sx={{
                        backgroundColor: activeTheme.light.bg,
                        color: activeTheme.light.text,
                        borderRadius: "28px",
                        py: 1.5,
                        fontWeight: 700,
                        fontSize: 14,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        "&:hover": { backgroundColor: activeTheme.accent },
                      }}
                    >
                      Login with Email
                    </Button>

                    {/* CREATE NEW ACCOUNT */}
                    <Button
                      fullWidth
                      startIcon={<MailOutlineIcon />}
                      onClick={() => {
                        haptic(10);
                        navigate("/signup");
                      }}
                      sx={{
                        backgroundColor: "transparent",
                        color: "#ffffff",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "28px",
                        py: 1.5,
                        fontWeight: 700,
                        fontSize: 14,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        "&:hover": {
                          borderColor: "#ffffff",
                          backgroundColor: "rgba(255,255,255,0.05)",
                        },
                      }}
                    >
                      Create New Account
                    </Button>

                    <Divider
                      sx={{
                        my: 0.5,
                        color: "rgba(255,255,255,0.3)",
                        fontSize: 11,
                        fontWeight: 600,
                        "&::before, &::after": { borderColor: "rgba(255, 255, 255, 0.12)" },
                      }}
                    >
                      OR
                    </Divider>

                    {/* CONTINUE WITH GOOGLE */}
                    <Button
                      fullWidth
                      startIcon={<GoogleColoredIcon />}
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      sx={{
                        backgroundColor: activeTheme.light.bg,
                        color: activeTheme.light.text,
                        borderRadius: "28px",
                        py: 1.5,
                        fontWeight: 700,
                        fontSize: 14,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        "&:hover": { backgroundColor: activeTheme.accent },
                      }}
                    >
                      Continue with Google
                    </Button>
                  </Stack>
                </motion.div>
              ) : (
                /* ---------------- 3. LOGIN SCREEN ---------------- */
                <motion.div
                  key="login-screen"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <Stack spacing={2}>
                    <Box sx={{ mb: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.7)",
                        }}
                      >
                        LOGIN TO
                      </Typography>
                      <Typography variant="h5" fontWeight={900} color="#fff">
                        BunkMates
                      </Typography>
                    </Box>

                    <form onSubmit={handleEmailLogin}>
                      <Stack spacing={1.8}>
                        <TextField
                          label="Email *"
                          type="email"
                          size="small"
                          required
                          fullWidth
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          sx={inputStyle}
                        />

                        <TextField
                          label="Password *"
                          size="small"
                          type={showPassword ? "text" : "password"}
                          required
                          fullWidth
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  onClick={() => setShowPassword(!showPassword)}
                                  sx={{ color: "rgba(255,255,255,0.5)" }}
                                >
                                  {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={inputStyle}
                        />

                        <Box display="flex" justifyContent="flex-end">
                          <Link
                            component="button"
                            type="button"
                            onClick={() => navigate("/forgot-password")}
                            sx={{
                              fontSize: 12,
                              color: "rgba(255,255,255,0.6)",
                              textDecoration: "none",
                              "&:hover": { color: "#fff", textDecoration: "underline" },
                            }}
                          >
                            Forgot password?
                          </Link>
                        </Box>

                        {error && (
                          <Typography color="#ef4444" textAlign="center" fontSize={13}>
                            {error}
                          </Typography>
                        )}

                        <Button
                          type="submit"
                          disabled={loading}
                          fullWidth
                          sx={{
                            backgroundColor: activeTheme.light.bg,
                            color: activeTheme.light.text,
                            borderRadius: "28px",
                            py: 1.4,
                            fontWeight: 800,
                            letterSpacing: "0.04em",
                            "&:hover": { backgroundColor: activeTheme.accent },
                          }}
                        >
                          {loading ? <CircularProgress size={22} color="inherit" /> : "LOGIN"}
                        </Button>

                        <Divider
                          sx={{
                            my: 0.5,
                            color: "rgba(255,255,255,0.3)",
                            fontSize: 10,
                            "&::before, &::after": { borderColor: "rgba(255, 255, 255, 0.12)" },
                          }}
                        >
                          OR
                        </Divider>

                        <Button
                          fullWidth
                          startIcon={<MailOutlineIcon />}
                          onClick={() => navigate("/signup")}
                          sx={{
                            backgroundColor: "transparent",
                            color: "#ffffff",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "28px",
                            py: 1.2,
                            fontWeight: 700,
                            fontSize: 13,
                            "&:hover": { borderColor: "#fff" },
                          }}
                        >
                          Create New Account
                        </Button>

                        <Button
                          fullWidth
                          startIcon={<GoogleColoredIcon />}
                          onClick={handleGoogleLogin}
                          sx={{
                            backgroundColor: activeTheme.light.bg,
                            color: activeTheme.light.text,
                            borderRadius: "28px",
                            py: 1.2,
                            fontWeight: 700,
                            fontSize: 13,
                            "&:hover": { backgroundColor: activeTheme.accent },
                          }}
                        >
                          Continue with Google
                        </Button>

                        <Button
                          size="small"
                          onClick={() => setPage("main")}
                          sx={{ color: "rgba(255,255,255,0.4)", textTransform: "none" }}
                        >
                          ← Back
                        </Button>
                      </Stack>
                    </form>
                  </Stack>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}