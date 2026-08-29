import React, { useState, useEffect, useMemo } from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { Box, Typography, Snackbar, Alert, useMediaQuery } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

import AuthWelcome from "./AuthWelcome";
import AuthLogin from "./AuthLogin";
import AuthSignup from "./AuthSignup";
import AuthContinue from "./AuthContinue";
import AuthForgotPassword from "./AuthForgotPassword";

import { auth, googleProvider, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { M3_EXPRESSIVE_PALETTE } from "../theme/palette";

const slogans = [
  "Explore\nTogether\nAlways",
  "Squad Trips\nSimplified\nTogether",
  "Adventure\nStarts\nHere",
  "Travel Smarter\nBuild Memories\nEverywhere",
];

const paletteKeys = ["blue", "purple", "emerald", "amber", "orange"];

const haptic = (strength = 15) => {
  if (typeof window !== "undefined" && navigator.vibrate) {
    navigator.vibrate(strength);
  }
};

const springTransition = {
  type: "spring",
  stiffness: 230,
  damping: 27,
  mass: 0.9,
};

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width:960px)");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sloganIndex, setSloganIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Dynamic M3 Expressive Theme Palette
  const activeTheme = useMemo(() => {
    const key = paletteKeys[colorIndex % paletteKeys.length];
    return M3_EXPRESSIVE_PALETTE[key] || M3_EXPRESSIVE_PALETTE.blue;
  }, [colorIndex]);

  // Slogan & Palette smooth cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setSloganIndex((prev) => (prev + 1) % slogans.length);
      setColorIndex((prev) => (prev + 1) % paletteKeys.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Determine current active subroute
  const pathname = location.pathname.toLowerCase();
  const isSignup = pathname.includes("/signup");
  const isLogin = pathname.includes("/login");
  const isContinue = pathname.includes("/continue");
  const isForgotPassword = pathname.includes("/forgot-password");
  const isWelcome = !isSignup && !isLogin && !isContinue && !isForgotPassword;
  const isFormPage = isLogin || isSignup || isForgotPassword;

  /* ---------------- FIREBASE AUTH HANDLERS ---------------- */

  const handleGoogleLogin = async () => {
    try {
      haptic(25);
      setLoading(true);
      setError("");
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const avatarUrl =
        user.photoURL ||
        `https://api.dicebear.com/9.x/glass/svg?seed=${user.uid}&radius=50`;

      try {
        await setDoc(
          doc(db, "users", user.uid),
          {
            name: user.displayName || "Original Bunker",
            username:
              user.displayName?.toLowerCase().replace(/\s+/g, "_") ||
              `user_${user.uid.slice(0, 5)}`,
            email: user.email,
            photoURL: avatarUrl,
            lastLogin: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (dbErr) {
        console.warn("Firestore sync warning:", dbErr);
      }

      setSnackbar({
        open: true,
        message: "Signed in successfully with Google!",
        severity: "success",
      });
      navigate("/auth/continue");
    } catch (err) {
      console.error("Google sign in error:", err);
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (email, password) => {
    try {
      haptic(25);
      setLoading(true);
      setError("");
      await signInWithEmailAndPassword(auth, email, password);
      setSnackbar({
        open: true,
        message: "Logged in successfully!",
        severity: "success",
      });
      navigate("/auth/continue");
    } catch (err) {
      console.error("Email login error:", err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Invalid email or password. Please check your credentials.");
      } else {
        setError(err.message || "Login failed. Please check your details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (formData) => {
    try {
      haptic(25);
      setLoading(true);
      setError("");

      const userCred = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const avatarUrl = `https://api.dicebear.com/9.x/glass/svg?seed=${userCred.user.uid}&radius=50`;

      await updateProfile(userCred.user, {
        displayName: formData.name,
        photoURL: avatarUrl,
      });

      await setDoc(doc(db, "users", userCred.user.uid), {
        name: formData.name,
        username: formData.username.replace(/^@/, "").trim(),
        mobile: formData.mobile,
        email: formData.email,
        type: "Regular",
        photoURL: avatarUrl,
        createdAt: new Date().toISOString(),
      });

      setSnackbar({
        open: true,
        message: "Account created! Welcome to the clan.",
        severity: "success",
      });
      navigate("/auth/continue");
    } catch (err) {
      console.error("Signup error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Email is already in use. Please login instead.");
      } else {
        setError(err.message || "Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const pageBgColor = isFormPage ? activeTheme.light.bg : "#000000";

  return (
    <motion.div
      animate={{ backgroundColor: pageBgColor }}
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
      {/* Subtle ambient lighting orb in background */}
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

      {/* ========================================================================= */}
      {/* 1. DESKTOP MODE: TWO DEDICATED SIDE-BY-SIDE COLUMNS (Left Hero, Right Form) */}
      {/* ========================================================================= */}
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
          {/* DESKTOP LEFT SECTION: HERO & ROTATING TYPOGRAPHY */}
          <motion.div
            layout
            animate={{
              backgroundColor: isFormPage
                ? "transparent"
                : activeTheme.light.bg,
              borderRadius: isFormPage ? 0 : 36,
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
            {/* Top Brand Logo & Subtitle */}
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

            {/* Main Rotating Slogan / Join Header */}
            <AnimatePresence mode="wait">
              {isSignup ? (
                <motion.div
                  key="desktop-signup-title"
                  initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
                  transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <Typography
                    sx={{
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: activeTheme.light.text,
                      opacity: 0.8,
                      mb: 0.5,
                    }}
                  >
                    JOIN TO
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: { md: "3.4rem", lg: "4.2rem" },
                      fontWeight: 900,
                      letterSpacing: "-0.035em",
                      color: activeTheme.light.text,
                      lineHeight: 1.05,
                    }}
                  >
                    BunkMates
                  </Typography>
                </motion.div>
              ) : isForgotPassword ? (
                <motion.div
                  key="desktop-recovery-title"
                  initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
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
                    }}
                  >
                    {"We've Got\nYour Back"}
                  </Typography>
                </motion.div>
              ) : (
                <motion.div
                  key={sloganIndex}
                  initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(5px)" }}
                  transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <Typography
                    sx={{
                      fontSize: { md: "3.6rem", lg: "4.4rem" },
                      fontWeight: 900,
                      lineHeight: 1.04,
                      letterSpacing: "-0.04em",
                      color: activeTheme.light.text,
                      whiteSpace: "pre-line",
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    }}
                  >
                    {slogans[sloganIndex]}
                  </Typography>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Slogan Footer */}
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

          {/* DESKTOP RIGHT SECTION: INTERACTIVE FORM & BUTTONS */}
          <motion.div
            layout
            animate={{
              backgroundColor: isFormPage ? "#000000" : "transparent",
              borderRadius: isFormPage ? 36 : 28,
              boxShadow: isFormPage
                ? "0 25px 60px -15px rgba(0, 0, 0, 0.75)"
                : "none",
              border: isFormPage
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid transparent",
            }}
            transition={{
              borderRadius: springTransition,
              boxShadow: { duration: 0.4 },
              backgroundColor: { duration: 0.4 },
              border: { duration: 0.3 },
            }}
            style={{
              width: 440,
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              justifyContent: isWelcome || isContinue ? "center" : "space-between",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route
                  path="welcome"
                  element={
                    <AuthWelcome
                      onGoogleLogin={handleGoogleLogin}
                      loading={loading}
                      haptic={haptic}
                      activeTheme={activeTheme}
                    />
                  }
                />
                <Route
                  path="login"
                  element={
                    <AuthLogin
                      onEmailLogin={handleEmailLogin}
                      onGoogleLogin={handleGoogleLogin}
                      loading={loading}
                      error={error}
                      haptic={haptic}
                      activeTheme={activeTheme}
                    />
                  }
                />
                <Route
                  path="signup"
                  element={
                    <AuthSignup
                      onEmailSignup={handleEmailSignup}
                      onGoogleLogin={handleGoogleLogin}
                      loading={loading}
                      error={error}
                      haptic={haptic}
                      activeTheme={activeTheme}
                    />
                  }
                />
                <Route
                  path="continue"
                  element={
                    <AuthContinue
                      haptic={haptic}
                      activeTheme={activeTheme}
                    />
                  }
                />
                <Route
                  path="forgot-password"
                  element={
                    <AuthForgotPassword
                      haptic={haptic}
                      activeTheme={activeTheme}
                    />
                  }
                />
                <Route index element={<Navigate to="/auth/welcome" replace />} />
                <Route path="*" element={<Navigate to="/auth/welcome" replace />} />
              </Routes>
            </AnimatePresence>
          </motion.div>
        </Box>
      ) : (
        /* ========================================================================= */
        /* 2. MOBILE MODE: CENTERED FRAME WITH TOP ACCENT HERO & OVERLAPPING BOTTOM  */
        /* ========================================================================= */
        <Box
          sx={{
            width: "100%",
            maxWidth: 440,
            height: "100vh",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: isFormPage ? activeTheme.light.bg : "#000000",
            overflow: "hidden",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* MOBILE TOP HERO SECTION */}
          <motion.div
            layout
            animate={{
              backgroundColor: isWelcome || isContinue ? activeTheme.light.bg : 'transparent',
              flex: isWelcome
                ? 1.15
                : isContinue
                ? 0.7
                : isSignup
                ? 0.18
                : isForgotPassword
                ? 0.22
                : 0.38,
              minHeight: isWelcome
                ? 340
                : isContinue
                ? 350
                : isSignup
                ? 95
                : isForgotPassword
                ? 110
                : 170,
              borderBottomLeftRadius: isFormPage ? 0 : 36,
              borderBottomRightRadius: isFormPage ? 0 : 36,
              paddingTop: isSignup || isForgotPassword ? 24 : isWelcome ? 52 : 36,
              paddingBottom: isSignup || isForgotPassword ? 14 : isWelcome ? 36 : 24,
            }}
            transition={{
              backgroundColor: { duration: 0.8, ease: "easeInOut" },
              flex: springTransition,
              minHeight: springTransition,
              borderBottomLeftRadius: springTransition,
              borderBottomRightRadius: springTransition,
            }}
            style={{
              paddingLeft: "32px",
              paddingRight: "32px",
              display: "flex",
              flexDirection: "column",
              justifyContent: isSignup || isForgotPassword ? "center" : "flex-end",
              position: "relative",
              zIndex: 1,
              overflow: "hidden",
            }}
          >
            <AnimatePresence mode="wait">
              {isSignup ? (
                <motion.div
                  key="mobile-signup-title"
                  initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(3px)" }}
                  transition={{ duration: 0.35 }}
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
                    JOIN TO
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "1.8rem",
                      fontWeight: 900,
                      letterSpacing: "-0.03em",
                      color: activeTheme.light.text,
                      lineHeight: 1.1,
                    }}
                  >
                    BunkMates
                  </Typography>
                </motion.div>
              ) : isForgotPassword ? (
                <motion.div
                  key="mobile-recovery-title"
                  initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(3px)" }}
                  transition={{ duration: 0.35 }}
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
              ) : (
                <motion.div
                  key={sloganIndex}
                  initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
                  transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <Typography
                    sx={{
                      fontSize: isWelcome
                        ? "2.35rem"
                        : isContinue
                        ? "2rem"
                        : "2.35rem",
                      fontWeight: 900,
                      lineHeight: 1.06,
                      letterSpacing: "-0.035em",
                      color: activeTheme.light.text,
                      whiteSpace: "pre-line",
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    }}
                  >
                    {slogans[sloganIndex]}
                  </Typography>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* MOBILE BOTTOM SHEET SECTION (Black container elevated over hero on form pages) */}
          <motion.div
            layout
            animate={{
              borderTopLeftRadius: isFormPage ? 36 : 0,
              borderTopRightRadius: isFormPage ? 36 : 0,
              marginTop: isFormPage ? isLogin ? 90 : isForgotPassword ? 285 : -20 : 0,
              boxShadow: "none",
              borderTop: isFormPage
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid transparent",
            }}
            transition={{
              borderTopLeftRadius: springTransition,
              borderTopRightRadius: springTransition,
              marginTop: springTransition,
              boxShadow: { duration: 0.35 },
            }}
            style={{
              flex: 1,
              backgroundColor: "#000000",
              paddingLeft: "26px",
              paddingRight: "26px",
              paddingTop: "24px",
              paddingBottom: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: isWelcome || isContinue ? "center" : "space-between",
              overflowY: "auto",
              position: "relative",
              zIndex: 2,
            }}
          >
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route
                  path="welcome"
                  element={
                    <AuthWelcome
                      onGoogleLogin={handleGoogleLogin}
                      loading={loading}
                      haptic={haptic}
                      activeTheme={activeTheme}
                    />
                  }
                />
                <Route
                  path="login"
                  element={
                    <AuthLogin
                      onEmailLogin={handleEmailLogin}
                      onGoogleLogin={handleGoogleLogin}
                      loading={loading}
                      error={error}
                      haptic={haptic}
                      activeTheme={activeTheme}
                    />
                  }
                />
                <Route
                  path="signup"
                  element={
                    <AuthSignup
                      onEmailSignup={handleEmailSignup}
                      onGoogleLogin={handleGoogleLogin}
                      loading={loading}
                      error={error}
                      haptic={haptic}
                      activeTheme={activeTheme}
                    />
                  }
                />
                <Route
                  path="continue"
                  element={
                    <AuthContinue
                      haptic={haptic}
                      activeTheme={activeTheme}
                    />
                  }
                />
                <Route
                  path="forgot-password"
                  element={
                    <AuthForgotPassword
                      haptic={haptic}
                      activeTheme={activeTheme}
                    />
                  }
                />
                <Route index element={<Navigate to="/auth/welcome" replace />} />
                <Route path="*" element={<Navigate to="/auth/welcome" replace />} />
              </Routes>
            </AnimatePresence>
          </motion.div>
        </Box>
      )}

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            width: "100%",
            borderRadius: "14px",
            backgroundColor: "#12121293",
            backdropFilter: "blur(15px)",
            color: "#ffffff",
            border: "0px solid rgba(255, 255, 255, 0.15)",
            "& .MuiAlert-icon": { color: activeTheme.accent },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </motion.div>
  );
}
