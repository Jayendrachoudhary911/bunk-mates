// src/pages/Login.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Stack,
  Checkbox,
  FormControlLabel,
  Link,
  Fade,
  Drawer,
  Card,
  Avatar,
  Slide,
  IconButton
} from "@mui/material";
// import GoogleIcon from "@mui/icons-material/Google";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  // signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { ArrowBackIos as ArrowBackIcon } from "@mui/icons-material";

// Dark mode theme configuration
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ffffff" },
    background: {
      default: "#121212",
      paper: "#1F1F1F",
    },
    text: {
      primary: "#E0E0E0",
      secondary: "#AAAAAA",
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
});

// Utility function to set cookie
function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

// Greeting helper based on hour
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Working late?";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

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


const Login = () => {
  const navigate = useNavigate();

  // Component state
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState(null); // Firebase Auth user
  const [userData, setUserData] = useState(null); // Firestore user data (includes photoURL)
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [bgGradient, setBgGradient] = useState("");
  const [page, setPage] = useState("landing");
  const [navDir, setNavDir] = useState("forward");


useEffect(() => {
  const random =
    GRADIENT_VARIANTS[
      Math.floor(Math.random() * GRADIENT_VARIANTS.length)
    ];
  setBgGradient(random);
}, []);


  // Listen for auth state changes and subscribe to Firestore user doc in real-time
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);

        // Subscribe to Firestore user doc in real-time
        const unsubscribeUserDoc = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data());
              setUser(firebaseUser);
              setShowDrawer(true);
            } else {
              // If user doc doesn't exist, sign out for safety
              setUser(null);
              setUserData(null);
              setShowDrawer(false);
              auth.signOut();
            }
          },
          (error) => {
            console.error("Error fetching user doc:", error);
            setUser(null);
            setUserData(null);
            setShowDrawer(false);
            auth.signOut();
          }
        );

        // Cleanup subscription on unmount or user change
        return unsubscribeUserDoc;
      } else {
        setUser(null);
        setUserData(null);
        setShowDrawer(false);
      }
    });

    setFadeIn(true);
    return unsubscribeAuth; // Cleanup auth listener on unmount
  }, []);

  // Save user to localStorage if Remember Me is checked
  const saveUserData = (user) => {
    const userStorageData = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
    };
    if (rememberMe) {
      localStorage.setItem("bunkmateuser", JSON.stringify(userStorageData));
    }
  };

  // Form input change handler
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Email/password login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const userRef = doc(db, "users", credential.user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userType = userDoc.data().type || "";
        setCookie("bunkmate_usertype", userType, 30);
        saveUserData(credential.user);
        // userData will get updated via onSnapshot listener
      } else {
        setErrorMessage("User not found, please sign up.");
        await auth.signOut();
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Google login handler
  // const handleGoogleLogin = async () => {
  //   setLoading(true);
  //   setErrorMessage("");
  //   try {
  //     const result = await signInWithPopup(auth, googleProvider);
  //     const googleUser = result.user;
  //     const userRef = doc(db, "users", googleUser.uid);
  //     const userDoc = await getDoc(userRef);

  //     if (!userDoc.exists()) {
  //       // User does not exist in Firestore, create it once
  //       await setDoc(userRef, {
  //         uid: googleUser.uid,
  //         email: googleUser.email,
  //         displayName: googleUser.displayName,
  //         photoURL: googleUser.photoURL || "",
  //         type: "Regular",
  //         createdAt: serverTimestamp(),
  //       });
  //     }
  //     // userData will be updated by onSnapshot listener
  //     saveUserData(googleUser);
  //   } catch (err) {
  //     setErrorMessage(err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Continue button after successful login drawer
  const handleContinue = () => {
    setShowDrawer(false);
    navigate("/");
  };

  // Logout handler
  // const handleLogout = () => {
  //   auth.signOut();
  //   localStorage.removeItem("bunkmateuser");
  //   setUser(null);
  //   setUserData(null);
  //   setShowDrawer(false);
  //   navigate("/login");
  // };

  return (
    <ThemeProvider theme={darkTheme}>
<Box
  sx={{
    minHeight: "96.5vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 2,

    /* --- DARK DOMINANT RADIAL GRADIENT --- */
    background: bgGradient,

    backgroundSize: "140% 140%",
    animation: "darkRadialGlow 24s ease-in-out infinite",
  }}
>

        <Fade in={fadeIn} timeout={100}>
          <Container maxWidth="xs">
                        <Stack spacing={4} sx={{ mt: "35vh", position: "absolute"  }}>

<Slide
  direction={navDir === "forward" ? "right" : "left"}
  in={page === "landing"}
  timeout={350}
  appear
  mountOnEnter
  unmountOnExit
>
  <Stack spacing={4} sx={{ mt: "35vh"}}>

    <Typography variant="h4" fontWeight="bold">
      Welcome Back
    </Typography>

    <Button
      size="large"
      fullWidth
      variant="contained"
      sx={{ borderRadius: 4, py: 1.3 }}
      onClick={() => {
        setNavDir("forward");
        setPage("email");
      }}
    >
      Continue with Email
    </Button>

    <Typography align="center">
      Don’t have an account?{" "}
      <Link href="/signup">Sign Up</Link>
    </Typography>

  </Stack>
</Slide>
</Stack>
            <Stack spacing={4} sx={{ mt: "35vh" }}>
            {/* EMAIL LOGIN PAGE */}

<Slide
  direction={navDir === "forward" ? "left" : "right"}
  in={page === "email"}
  timeout={350}
  appear
  mountOnEnter
  unmountOnExit
>
  <Stack spacing={3} sx={{ mt: "28vh" }}>

    <IconButton
      onClick={() => {
        setNavDir("back");
        setPage("landing");
      }}
    >
      <ArrowBackIcon />
    </IconButton>

    <Typography
      variant="h4"
      fontWeight="bold"
      color="primary"
      align="left"
    >
      Login
    </Typography>

    {/* KEEP YOUR FORM EXACTLY AS IS BELOW */}



              {!user && (
                <>
                  <form onSubmit={handleLogin} style={{ width: "100%" }}>
                    <Stack spacing={2}>
                      <TextField
                        name="email"
                        label="Email"
                        type="email"
                        fullWidth
                        required
                        onChange={handleChange}
                         sx={{
    /* --- FIELD BASE --- */
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(8px)",

    /* --- INPUT TEXT --- */
    "& .MuiInputBase-input": {
      color: "#ffffff",
      padding: "14px 16px",
      fontSize: "0.95rem",
      letterSpacing: "0.02em",
    },

    /* --- LABEL --- */
    "& .MuiInputLabel-root": {
      color: "rgba(255,255,255,0.65)",
      fontWeight: 500,
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#ffffff",
    },

    /* --- OUTLINE --- */
    "& .MuiOutlinedInput-root": {
      borderRadius: 4,

      "& fieldset": {
        borderColor: "rgba(255,255,255,0.15)",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
      },

      "&:hover fieldset": {
        borderColor: "rgba(255, 255, 255, 0.6)",
      },

      "&.Mui-focused fieldset": {
        borderColor: "#ffffff",
        boxShadow: "0 0 0 2px rgba(255,140,26,0.25)",
      },
    },

    /* --- AUTOFILL FIX (Chrome) --- */
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 100px #0c0c0c inset",
      WebkitTextFillColor: "#ffffff",
      caretColor: "#ffffff",
      borderRadius: 4,
    },
  }}
                      />
                      <TextField
                        name="password"
                        label="Password"
                        type="password"
                        fullWidth
                        required
                        onChange={handleChange}
                         sx={{
    /* --- FIELD BASE --- */
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(8px)",

    /* --- INPUT TEXT --- */
    "& .MuiInputBase-input": {
      color: "#ffffff",
      padding: "14px 16px",
      fontSize: "0.95rem",
      letterSpacing: "0.02em",
    },

    /* --- LABEL --- */
    "& .MuiInputLabel-root": {
      color: "rgba(255,255,255,0.65)",
      fontWeight: 500,
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#ffffff",
    },

    /* --- OUTLINE --- */
    "& .MuiOutlinedInput-root": {
      borderRadius: 4,

      "& fieldset": {
        borderColor: "rgba(255,255,255,0.15)",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
      },

      "&:hover fieldset": {
        borderColor: "rgba(255, 255, 255, 0.6)",
      },

      "&.Mui-focused fieldset": {
        borderColor: "#ffffff",
        boxShadow: "0 0 0 2px rgba(255,140,26,0.25)",
      },
    },

    /* --- AUTOFILL FIX (Chrome) --- */
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 100px #0c0c0c inset",
      WebkitTextFillColor: "#ffffff",
      caretColor: "#ffffff",
      borderRadius: 4,
    },
  }}
                      />
                      <Box display={"flex"} justifyContent="space-between" alignItems="center">
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              sx={{ color: "#fff" }}
                            />
                          }
                          label="Remember Me"
                          sx={{
                            color: "#B0BEC5",
                            letterSpacing: "0.05em",
                          }}
                        />
                        <Link href="/forgot-password" underline="hover" color="#ffffff">
                          Forgot password?
                        </Link>
                      </Box>
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{
                          backgroundColor: "#ffffffba",
                          py: 1,
                          fontSize: "1.2rem",
                          borderRadius: 14,
                        }}
                        disabled={loading}
                      >
                        {loading ? "Logging in..." : "Login"}
                      </Button>
                      {/* <Button
                        variant="outlined"
                        startIcon={<GoogleIcon />}
                        onClick={handleGoogleLogin}
                        fullWidth
                        sx={{ py: 1, fontSize: "1.2rem", borderRadius: 14 }}
                        disabled={loading}
                      >
                        Login with Google
                      </Button> */}
                    </Stack>
                  </form>

                  <Stack
                    direction="row"
                    justifyContent="center"
                    width="100%"
                  >
                    <Link href="/signup" underline="hover" color="primary">
                      Don’t have an account? Sign Up
                    </Link>
                  </Stack>

                  {errorMessage && (
                    <Typography color="error" mt={1}>
                      {errorMessage}
                    </Typography>
                  )}
                </>
              )}
              </Stack>
              </Slide>
            </Stack>
          </Container>
        </Fade>
      </Box>

      {/* Fullscreen Drawer after successful login */}
<Drawer
  anchor="bottom"
  open={showDrawer}
  onClose={() => {}}
  hideBackdrop
  sx={{ boxShadow: "none" }}
>
  {/* ---------- GRADIENT BACKGROUND ---------- */}
  <Box
    sx={{
      height: "100vh",
      position: "relative",
      p: 2,

      background: bgGradient,

      backgroundSize: "160% 160%",
      animation: "darkRadialGlow 24s ease-in-out infinite",
    }}
  >
    {/* ---------- GLASS CARD ---------- */}
    <Card
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        m: 1.5,

        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",

        px: 3,
        py: 4,
        pb: 3,
        mx: 1.5,
        maxWidth: 480,

        borderRadius: 6,
        backdropFilter: "blur(60px)",
        backgroundColor: "rgba(18, 18, 18, 0.41)",
        boxShadow: "none",
      }}
    >
      {/* ---------- AVATAR ---------- */}
      <Box
        sx={{
          mb: 2,
          p: 0.5,
          borderRadius: "50%",
          background: bgGradient,
        }}
      >
        <Avatar
          src={userData?.photoURL || ""}
          sx={{ width: 106, height: 106 }}
          alt={userData?.displayName || "User"}
        />
      </Box>

      {/* ---------- GREETING ---------- */}
      <Typography variant="h4" fontWeight={700}>
        {getGreeting()},{" "}
        {userData?.displayName?.split(" ")[0] || "Explorer"}!
      </Typography>

      <Typography
        variant="body2"
        sx={{ opacity: 0.75, mt: 0.5 }}
      >
        You’re successfully logged into{" "}
        <b>BunkMate</b>
      </Typography>

      {/* ---------- DETAILS PANEL ---------- */}
      <Box
        sx={{
          mt: 3,
          px: 2,
          py: 1.5,
          width: "100%",
          maxWidth: 420,
          borderRadius: 3,
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      >
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          <strong>Email:</strong>{" "}
          {userData?.email || user?.email}
        </Typography>

        <Typography variant="caption" sx={{ opacity: 0.8, display: "block", mt: 0.5 }}>
          <strong>Login time:</strong>{" "}
          {new Date().toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </Typography>

        {userData?.type && (
          <Typography variant="caption" sx={{ opacity: 0.8, display: "block", mt: 0.5 }}>
            <strong>Account:</strong> {userData.type}
          </Typography>
        )}
      </Box>

      {/* ---------- SECURITY NOTE ---------- */}
      <Typography
        variant="caption"
        sx={{
          mt: 2,
          opacity: 0.6,
          maxWidth: 360,
        }}
      >
        🔒 This session is secured. If this wasn’t you,
        please log out immediately.
      </Typography>

      {/* ---------- CTA ---------- */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleContinue}
        sx={{
          mt: 3,
          borderRadius: 3,
          py: 1.4,
          fontSize: "1rem",
          fontWeight: 600,
          color: "#000",
          background:
            "linear-gradient(135deg, #ffffff, #eaeaea)",
          boxShadow: "none",
          "&:hover": {
            background:
              "linear-gradient(135deg, #ffffff, #ffffff)",
            transform: "scale(1.03)",
          },
          transition: "all 0.25s ease",
        }}
      >
        Continue to BunkMates
      </Button>
    </Card>
  </Box>
</Drawer>

    </ThemeProvider>
  );
};

export default Login;
