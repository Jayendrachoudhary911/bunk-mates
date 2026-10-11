// src/pages/Signup.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  IconButton,
  InputAdornment,
  Divider,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { motion } from "framer-motion";

import { auth, googleProvider, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import { M3_EXPRESSIVE_PALETTE } from "../theme/palette";

const GoogleColoredIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.55 10.78l7.98-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const paletteKeys = ["blue", "purple", "emerald", "amber", "orange"];

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);

  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  const activeTheme = useMemo(() => {
    const key = paletteKeys[colorIndex % paletteKeys.length];
    return M3_EXPRESSIVE_PALETTE[key];
  }, [colorIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % paletteKeys.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "username" && value.length >= 3) {
      setCheckingUsername(true);
      const q = query(collection(db, "users"), where("username", "==", value));
      const snap = await getDocs(q);
      setUsernameAvailable(snap.empty);
      setCheckingUsername(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setSnackbar({ open: true, message: "Passwords do not match!" });
      return;
    }
    if (usernameAvailable === false) {
      setSnackbar({ open: true, message: "Username already taken!" });
      return;
    }

    try {
      setLoading(true);
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
        username: formData.username,
        mobile: formData.mobile,
        email: formData.email,
        type: "Regular",
        photoURL: avatarUrl,
      });

      setSnackbar({ open: true, message: "Welcome to the Clan!" });
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setSnackbar({ open: true, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const avatarUrl =
        user.photoURL ||
        `https://api.dicebear.com/9.x/glass/svg?seed=${user.uid}&radius=50`;

      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName,
        username: user.displayName?.toLowerCase().replace(/\s+/g, "_") || "user",
        mobile: "",
        email: user.email,
        type: "Regular",
        photoURL: avatarUrl,
      });

      setSnackbar({ open: true, message: "Signed up with Google!" });
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setSnackbar({ open: true, message: err.message });
    } finally {
      setLoading(false);
    }
  };

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
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* ================= TOP HERO SECTION ================= */}
        <motion.div
          animate={{ backgroundColor: activeTheme.light.bg }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{
            padding: "40px 32px 30px",
            borderBottomLeftRadius: "36px",
            borderBottomRightRadius: "36px",
          }}
        >
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: activeTheme.light.text,
              opacity: 0.8,
            }}
          >
            JOIN TO
          </Typography>
          <Typography
            sx={{
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: activeTheme.light.text,
            }}
          >
            BunkMates
          </Typography>
        </motion.div>

        {/* ================= FORM BODY ================= */}
        <Box
          component="form"
          onSubmit={handleSignup}
          sx={{
            flex: 1,
            p: { xs: 3, sm: 3.5 },
            backgroundColor: "#000000",
            overflowY: "auto",
          }}
        >
          <Stack spacing={1.8}>
            <TextField
              name="name"
              label="Name *"
              placeholder="Original Bunker"
              size="small"
              required
              fullWidth
              onChange={handleChange}
              sx={inputStyle}
            />

            <TextField
              name="mobile"
              label="Mobile *"
              placeholder="+91 9876543210"
              size="small"
              required
              fullWidth
              onChange={handleChange}
              sx={inputStyle}
            />

            <TextField
              name="email"
              label="Email *"
              placeholder="user@bunkmates.com"
              type="email"
              size="small"
              required
              fullWidth
              onChange={handleChange}
              sx={inputStyle}
            />

            <TextField
              name="username"
              label="Username *"
              placeholder="@user_bunker"
              size="small"
              required
              fullWidth
              onChange={handleChange}
              helperText={
                checkingUsername
                  ? "Checking..."
                  : usernameAvailable === false
                  ? "Username taken"
                  : ""
              }
              sx={inputStyle}
            />

            <TextField
              name="password"
              label="Password *"
              size="small"
              type={showPassword ? "text" : "password"}
              required
              fullWidth
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword(!showPassword)}
                      sx={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputStyle}
            />

            <TextField
              name="confirmPassword"
              label="Confirm Password *"
              size="small"
              type={showConfirm ? "text" : "password"}
              required
              fullWidth
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowConfirm(!showConfirm)}
                      sx={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputStyle}
            />

            {/* JOIN BUTTON */}
            <Button
              type="submit"
              disabled={loading}
              fullWidth
              sx={{
                mt: 1,
                backgroundColor: activeTheme.light.bg,
                color: activeTheme.light.text,
                borderRadius: "28px",
                py: 1.4,
                fontWeight: 800,
                fontSize: 14,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                "&:hover": { backgroundColor: activeTheme.accent },
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : "JOIN CLAN"}
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

            {/* LOGIN REDIRECT */}
            <Button
              fullWidth
              startIcon={<MailOutlineIcon />}
              onClick={() => navigate("/login")}
              sx={{
                backgroundColor: "transparent",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "28px",
                py: 1.2,
                fontWeight: 700,
                fontSize: 13,
                textTransform: "uppercase",
                "&:hover": { borderColor: "#ffffff" },
              }}
            >
              Login with Email
            </Button>

            {/* GOOGLE SIGNUP */}
            <Button
              fullWidth
              startIcon={<GoogleColoredIcon />}
              onClick={handleGoogleSignup}
              sx={{
                backgroundColor: activeTheme.light.bg,
                color: activeTheme.light.text,
                borderRadius: "28px",
                py: 1.2,
                fontWeight: 700,
                fontSize: 13,
                textTransform: "uppercase",
                "&:hover": { backgroundColor: activeTheme.accent },
              }}
            >
              Continue with Google
            </Button>
          </Stack>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}