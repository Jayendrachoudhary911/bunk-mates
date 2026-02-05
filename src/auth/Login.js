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
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import GoogleIcon from "@mui/icons-material/Google";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Link from "@mui/material/Link";

import { motion, AnimatePresence } from "framer-motion";

import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useAuth } from "../hooks/useAuth";
import { useUserRealtime } from "../hooks/useUserRealtime";

/* ---------------- THEME ---------------- */

const theme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#000" },
    primary: { main: "#ffffff" },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
});

/* ---------------- HAPTIC ---------------- */

const haptic = (strength = 20) => {
  if (navigator.vibrate) navigator.vibrate(strength);
};

/* ---------------- SEASON ENGINE ---------------- */

const getSeason = () => {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 6) return "summer";
  if (m >= 7 && m <= 9) return "monsoon";
  if (m >= 10 && m <= 11) return "autumn";
  return "winter";
};

const seasonalLines = {
  summer: [
    "Summer Trips Loading",
    "Sun Sand Squad",
    "Beach Days Calling",
    "Heat Waves Memories",
    "Summer Squad Mode",
  ],

  monsoon: [
    "Rain Roads Calling",
    "Cloudy Trips Mood",
    "Monsoon Memories Flow",
    "Stormy Drives Vibes",
    "Rainy Adventures Begin",
  ],

  autumn: [
    "Golden Hour Trips",
    "Cozy Travel Season",
    "Fall Colors Calling",
    "Autumn Squad Energy",
    "Chill Weather Travels",
  ],

  winter: [
    "Cold Air Adventures",
    "Snow Squad Energy",
    "Winter Trips Mode",
    "Mountain Vibes Activated",
    "Cold Roads Calling",
  ],
};

const coreSlogans = [
  "Plan Travel Repeat",
  "Squad Trips Simplified",
  "Travel Smarter Together",
  "Build Memories Together",
  "Trips Without Chaos",
  "Explore Together Always",
  "Friends Trips Memories",
  "Adventure Starts Here",
  "Your Trip Companion",
  "Moments Over Maps",
];

// Fallback avatar generator (consistent seed-based DiceBear gradient)
const getGradientAvatar = (seed) => {
  const s = seed || Math.random().toString(36).substring(2, 10);
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(
    s
  )}&backgroundType=gradientLinear&radius=50&size=150`;
};

// CTA options for the success button — rotate on each page load
const ctaOptions = [
  "Let's Hit the Road",
  "Start the Adventure",
  "Let's Roll",
  "Trip Time!",
  "Onward 🚀",
  "Time to Explore",
  "Let's Go Places",
  "Ready, Set, Trip",
];

/* ---------------- TYPEWRITER ---------------- */

const useTypewriter = (text, speed = 45) => {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      setDisplay(text.slice(0, index + 1));
      index++;

      if (index === text.length) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return display;
};

/* ---------------- PAGE MOTION ---------------- */

const screenMotion = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -30, transition: { duration: 0.35 } },
};

const GRADIENT_VARIANTS = [
  // 🔥 Red / Orange dominant
  `
    radial-gradient(
        circle at 70% 10%,
        #ff8d1a 0%,
        #ff0000 12%,
        #000000 38%,
        #000000 62%,
        #000000 100%
      )
  `,

  // 💜 Purple / Pink
  `
    radial-gradient(
        circle at 70% 10%,
        #a848ec 0%,
        #8402ff 12%,
        #000000 38%,
        #000000 62%,
        #000000 100%
      )
  `,

  // 🔵 Blue / Cyan
  `
    radial-gradient(
        circle at 70% 10%,
        #22d3ee 0%,
        #3b83f6 12%,
        #000000 38%,
        #000000 62%,
        #000000 100%
      )
  `,

  // 🌅 Warm sunset (gold / orange)
  `
    radial-gradient(circle at 50% 10%,
      rgba(251,191,36,0.20) 0%,
      rgba(251,191,36,0.12) 22%,
      rgba(0,0,0,0) 42%),
    radial-gradient(circle at 20% 30%,
      rgba(249,115,22,0.18) 0%,
      rgba(249,115,22,0.10) 20%,
      rgba(0,0,0,0) 40%),
    linear-gradient(180deg,#000000,#000000)
  `,
];

/* ---------------- MAIN ---------------- */

export default function Login() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const userDoc = useUserRealtime();

  // Pick a random CTA from `ctaOptions` once per mount
  const ctaText = useMemo(() => {
    return ctaOptions[Math.floor(Math.random() * ctaOptions.length)];
  }, []);

  const [page, setPage] = useState("main");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [currentLine, setCurrentLine] = useState("");
  const season = useMemo(getSeason, []);
  const typedText = useTypewriter(currentLine);
  const [showPassword, setShowPassword] = useState(false);

  const [bgGradient, setBgGradient] = useState("");

    useEffect(() => {
      const random =
        GRADIENT_VARIANTS[
          Math.floor(Math.random() * GRADIENT_VARIANTS.length)
        ];
      setBgGradient(random);
    }, []);


  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  /* ---------------- SLOGAN ROTATION ---------------- */

useEffect(() => {
  const season = getSeason();

  const pool = [
    ...seasonalLines[season],
    ...coreSlogans,
  ];

  let index = 0;

  const rotate = () => {
    setCurrentLine(pool[index % pool.length]);
    index++;
  };

  rotate();

  const interval = setInterval(rotate, 2300);

  return () => clearInterval(interval);
}, []);


  /* ---------------- AUTH ---------------- */

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

      await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      setSuccess(true);
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          position: "relative",
          overflow: "hidden",
          width: "100vw",
        }}
      >
        {/* ---------------- ANIMATED BACKGROUND ---------------- */}

        <motion.div
          transition={{
            repeat: Infinity,
            duration: 18,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            inset: 0,
            background:
              bgGradient,
            backgroundSize: "140% 140%",
            animation: "darkRadialGlow 24s ease-in-out infinite",
          }}
        />

        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            position: "relative",
            flexDirection: "column",
            p: 0,
          }}
        >

<Box height={44} display="flex" alignItems="center" position={"absolute"} top={"30%"} left={40} right={40}>
  <Typography
    sx={{
      fontSize: 44,
      fontWeight: 800,
      letterSpacing: "0.04em",
      color: "rgba(255,255,255,0.85)",
    }}
  >
    {typedText}
    <span style={{ opacity: 0.4 }}>|</span>
  </Typography>
</Box>


          <AnimatePresence mode="wait">

<Box
  sx={{
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    p: 1.5,

    width: "100vw",
    height: "auto",

    backgroundColor: "#0c0c0c00",

    paddingX: { xs: 1.5, sm: 4 },

    boxSizing: "border-box",

    display: "flex",
    justifyContent: "center",

    zIndex: 10,

    overflow: "hidden",
  }}
>


<Box
  sx={{
    width: "100%",
    maxWidth: 420,   // Controls desktop width
    margin: "0 auto",
    pb: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    backdropFilter: "blur(12px)",
    padding: 4,
  }}
>

            {/* ---------------- SUCCESS PAGE ---------------- */}

{success && (
  <motion.div
    key="success"
    variants={screenMotion}
    initial="initial"
    animate="animate"
    exit="exit"
    style={{ maxWidth: 380, width: "100%" }}
  >
    <Stack spacing={3.5} alignItems="center" textAlign="center">

      {/* AVATAR WITH GLOW */}

      <Avatar
        src={
          userDoc?.photoURL || (currentUser?.uid ? getGradientAvatar(currentUser.uid) : "")
        }
        sx={{
          width: 88,
          height: 88,
          border: "3px solid rgba(255,255,255,0.4)",
        }}
      />

      {/* GREETING */}

      <Stack spacing={0.6}>
        <Typography
          sx={{
            fontSize: 22,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          Hey {userDoc?.name || currentUser?.displayName || "Explorer"}!
        </Typography>

        <Typography
          sx={{
            fontSize: 14,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          You’re in. Bags packed. Vibes set.
        </Typography>
      </Stack>

      {/* USER DETAILS */}

      <Stack spacing={0.4}>
        <Typography
          sx={{
            fontSize: 13,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          Signed in as
        </Typography>

        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
          }}
        >
          {currentUser?.email}
        </Typography>
      </Stack>

      {/* CTA */}

      <Button
        fullWidth
        size="large"
        onClick={() => navigate("/")}
        sx={{
          mt: 1,
          py: 1.6,
          borderRadius: "14px",
          fontWeight: 700,
          letterSpacing: "0.03em",
          background:
            "linear-gradient(135deg,#ffffff,#eaeaea)",
          color: "#000",
          transition: "all 0.25s ease",

          "&:hover": {
            transform: "translateY(-1px)",
          },

          "&:active": {
            transform: "scale(0.97)",
          },
        }}
      >
        {ctaText}
      </Button>

      {/* MICRO COPY */}

      <Typography
        sx={{
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
        }}
      >
        Pro tip: trips are better with friends 😉
      </Typography>

    </Stack>
  </motion.div>
)}


            {/* ---------------- MAIN PAGE ---------------- */}

            {!success && page === "main" && (
              <motion.div
                key="main"
                variants={screenMotion}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Stack spacing={4} alignItems="left">

<Stack
  spacing={0.5}
  alignItems="left"
  textAlign="left"
  sx={{
    mb: { xs: 2.5, sm: 3 },
  }}
>
  {/* Subtitle */}

  <Typography
    sx={{
      fontSize: { xs: 18, sm: 20 },
      fontWeight: 500,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.65)",
    }}
  >
    Welcome to
  </Typography>

  {/* Brand Title */}

  <Typography
    sx={{
      fontSize: { xs: 36, sm: 42, md: 48 },
      fontWeight: 900,
      lineHeight: 1,
      letterSpacing: "-0.02em",

      background:
        "#fffffff7",

      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",

      textShadow: "0 10px 30px rgba(0,0,0,0.4)",
    }}
  >
    BunkMates
  </Typography>
</Stack>


                  {/* TYPEWRITER SLOGAN */}

<Stack
  spacing={2}
  width="100%"
  sx={{
    maxWidth: 420,
    mx: "auto",
  }}
>
  {/* PRIMARY ACTION — CONTINUE WITH EMAIL */}

  <Button
    startIcon={<MailOutlineIcon />}
    onClick={() => {
      haptic(10);
      setPage("email");
    }}
    sx={{
      py: 1.6,
      borderRadius: "14px",
      background: "linear-gradient(135deg,#ffffff,#eaeaea)",
      color: "#000",
      fontWeight: 700,
      letterSpacing: "0.03em",

      boxShadow: "none",

      transition: "all 0.25s ease",

      "&:hover": {
        transform: "translateY(-1px)",
        boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
        background: "linear-gradient(135deg,#ffffff,#f1f1f1)",
      },

      "&:active": {
        transform: "scale(0.97)",
      },
    }}
    fullWidth
  >
    Continue with Email
  </Button>

  {/* DIVIDER WITH TEXT FEEL */}

  <Divider
    sx={{
      borderColor: "rgba(255, 255, 255, 0.46)",
      "&::before, &::after": {
        borderColor: "rgba(255,255,255,0.15)",
      },
    }}
  />

  {/* SECONDARY ACTION — CREATE ACCOUNT */}

  <Button
    startIcon={<MailOutlineIcon />}
    onClick={() => {
      haptic(10);
      navigate("/signup"); // or navigate("/signup")
    }}
    sx={{
      py: 1.5,
      borderRadius: "14px",

      background: "rgba(255, 255, 255, 0.01)",

      border: "1.5px solid rgba(255,255,255,0.35)",

      color: "#ffffff",
      fontWeight: 600,

      transition: "all 0.25s ease",

      "&:hover": {
        background: "rgba(255,255,255,0.1)",
        borderColor: "#ff8a00",
        color: "#ff8a00",
      },

      "&:active": {
        transform: "scale(0.97)",
      },
    }}
    fullWidth
  >
    Create New Account
  </Button>

</Stack>

                </Stack>
              </motion.div>
            )}

            {/* ---------------- EMAIL PAGE ---------------- */}

            {!success && page === "email" && (
              <motion.div
                key="email"
                variants={screenMotion}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Stack spacing={3}>

                  <Typography variant="h5" fontWeight={800} color="#fff" mb={2}>
                    Login to BunkMates
                  </Typography>

                  <form onSubmit={handleEmailLogin}>
<Stack spacing={2}>

<TextField
  label="Email"
  type="email"
  required
  fullWidth
  variant="outlined"
  onChange={(e) =>
    setForm((p) => ({
      ...p,
      email: e.target.value,
    }))
  }
  sx={{
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      background: "rgba(255,255,255,0)",
      color: "#fff",

      "& fieldset": {
        borderColor: "rgba(255,255,255,0.15)",
      },

      "&:hover fieldset": {
        borderColor: "rgba(255,255,255,0.35)",
      },

      "&.Mui-focused fieldset": {
        borderColor: "#ffffff",
      },
    },

    "& .MuiInputLabel-root": {
      color: "rgba(255,255,255,0.6)",
    },

    "& .MuiInputLabel-root.Mui-focused": {
      color: "#ffffff",
    },
  }}
/>

{/* PASSWORD FIELD */}

<TextField
  label="Password"
  type={showPassword ? "text" : "password"}
  required
  fullWidth
  variant="outlined"
  onChange={(e) =>
    setForm((p) => ({
      ...p,
      password: e.target.value,
    }))
  }
  InputProps={{
    endAdornment: (
      <InputAdornment position="end">
        <IconButton
          onClick={() => setShowPassword(!showPassword)}
          edge="end"
          sx={{
            color: "rgba(255,255,255,0.7)",
            "&:hover": {
              color: "#ffffff",
            },
          }}
        >
          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
        </IconButton>
      </InputAdornment>
    ),
  }}
  sx={{
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      background: "rgba(0, 0, 0, 0)",
      color: "#fff",

      "& fieldset": {
        borderColor: "rgba(255,255,255,0.15)",
      },

      "&:hover fieldset": {
        borderColor: "rgba(255,255,255,0.35)",
      },

      "&.Mui-focused fieldset": {
        borderColor: "#ffffff",
      },
    },

    "& .MuiInputLabel-root": {
      color: "rgba(255,255,255,0.6)",
    },

    "& .MuiInputLabel-root.Mui-focused": {
      color: "#ffffff",
    },
  }}
/>


  {/* FORGOT PASSWORD */}

  <Box display="flex" justifyContent="flex-end" mb={1}>
    <Link
      component="button"
      onClick={() => navigate("/forgot-password")}
      sx={{
        fontSize: 13,
        color: "rgba(255,255,255,0.7)",
        textDecoration: "none",
        "&:hover": {
          textDecoration: "underline",
        },
      }}
    >
      Forgot password?
    </Link>
  </Box>

  {/* LOGIN BUTTON */}

  <Button
    type="submit"
    disabled={loading}
    sx={{
      py: 1.5,
      borderRadius: 3,
      fontWeight: 700,
      background:
        "linear-gradient(135deg,#ffffff,#e5e5e5)",
      color: "#000",
      mt: 1,
    }}
    fullWidth
  >
    {loading ? (
      <CircularProgress size={22} color="#000" />
    ) : (
      "Login"
    )}
  </Button>

  {/* ERROR MESSAGE */}

  {error && (
    <Typography
      color="error"
      textAlign="center"
      fontSize={14}
    >
      {error}
    </Typography>
  )}

  {/* BACK BUTTON */}

  <Button
    onClick={() => {
      haptic(10);
      setPage("main");
    }}
    sx={{
      color: "rgba(255,255,255,0.7)",
      fontSize: 14,
    }}
  >
    Back
  </Button>

</Stack>

                  </form>

                </Stack>
              </motion.div>
            )}
</Box>
</Box>

          </AnimatePresence>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
