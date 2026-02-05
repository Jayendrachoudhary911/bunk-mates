import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Slide,
  IconButton,
  InputAdornment,
  Snackbar,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { auth, googleProvider, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";

const transition = (props) => <Slide direction="up" {...props} />;

/**
 * 🎨 Generate an abstract gradient avatar via DiceBear
 * Using the `gradient` style with a random or UID-based seed
 */
const getGradientAvatar = (seed) => {
  const s = seed || Math.random().toString(36).substring(2, 10);
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(
    s
  )}&backgroundType=gradientLinear&radius=50&size=150`;
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

const inputStyles = {
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
};


// ---- PASSWORD RULE CHECK ----
const checkPasswordRules = (password) => ({
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  number: /[0-9]/.test(password),
  symbol: /[^A-Za-z0-9]/.test(password),
});

// ---- PASSWORD STRENGTH ----
const getPasswordStrength = (password) => {
  const rules = checkPasswordRules(password);
  const passed = Object.values(rules).filter(Boolean).length;

  if (passed <= 1)
    return { label: "Weak", color: "#ef4444", value: 25 };
  if (passed === 2 || passed === 3)
    return { label: "Moderate", color: "#f59e0b", value: 60 };
  return { label: "Strong", color: "#22c55e", value: 100 };
};


const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    mobile: "",
    email: "",
    type: "Regular",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [passwordStrength, setPasswordStrength] = useState(null);
const [passwordRules, setPasswordRules] = useState({});
const [checkingUsername, setCheckingUsername] = useState(false);
const [usernameAvailable, setUsernameAvailable] = useState(null);


  const [bgGradient, setBgGradient] = useState("");
  
  useEffect(() => {
    const random =
      GRADIENT_VARIANTS[
        Math.floor(Math.random() * GRADIENT_VARIANTS.length)
      ];
    setBgGradient(random);
  }, []);
  
const handleChange = async (e) => {
  const { name, value } = e.target;

  setFormData((prev) => ({ ...prev, [name]: value }));

  if (name === "password") {
    setPassword(value);
    setPasswordRules(checkPasswordRules(value));
    setPasswordStrength(getPasswordStrength(value));
  }

  if (name === "confirmPassword") {
    setConfirmPassword(value);
  }

  // ---- ASYNC USERNAME CHECK ----
  if (name === "username" && value.length >= 3) {
    setCheckingUsername(true);
    setUsernameAvailable(null);

    const q = query(
      collection(db, "users"),
      where("username", "==", value)
    );

    const snap = await getDocs(q);
    setUsernameAvailable(snap.empty);
    setCheckingUsername(false);
  }
};

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const checkUsernameExists = async (username) => {
    const q = query(collection(db, "users"), where("username", "==", username));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setSnackbar({
        open: true,
        message: "Passwords do not match",
        severity: "error",
      });
      return;
    }

    const usernameExists = await checkUsernameExists(formData.username);
    if (usernameExists) {
      setErrorMessage("Username already taken. Try another.");
      setOpenDialog(true);
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // 🎨 Generate gradient avatar based on UID (unique & consistent)
      const avatarUrl = getGradientAvatar(userCred.user.uid);

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

      setSnackbar({
        open: true,
        message: "Signup successful!",
        severity: "success",
      });
      setTimeout(() => (window.location.href = "/"), 1200);
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Use Google photoURL or generate gradient avatar
      const avatarUrl = user.photoURL || getGradientAvatar(user.uid);
      const usernameExists = await checkUsernameExists(user.displayName);

      if (!usernameExists) {
        if (!user.photoURL)
          await updateProfile(user, { photoURL: avatarUrl });

        await setDoc(doc(db, "users", user.uid), {
          name: user.displayName,
          username: user.displayName,
          mobile: "",
          email: user.email,
          type: "Regular",
          photoURL: avatarUrl,
        });
        setSnackbar({
          open: true,
          message: "Signed up with Google!",
          severity: "success",
        });
        setTimeout(() => (window.location.href = "/"), 1200);
      } else {
        setErrorMessage("Username already taken. Try another.");
        setOpenDialog(true);
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  const handleCreateUsername = async (newUsername) => {
    const user = auth.currentUser;
    if (!user) return;
    const avatarUrl = user.photoURL || getGradientAvatar(user.uid);

    await setDoc(doc(db, "users", user.uid), {
      name: user.displayName,
      username: newUsername,
      mobile: "",
      email: user.email,
      type: "Regular",
      photoURL: avatarUrl,
    });
    if (!user.photoURL) await updateProfile(user, { photoURL: avatarUrl });
    setOpenDialog(false);
    window.location.href = "/";
  };

  return (
    <Box
      sx={{
    minHeight: "95vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 2,

    background: bgGradient,

    backgroundSize: "140% 140%",
    animation: "darkRadialGlow 24s ease-in-out infinite",
      }}
    >
      
                <Container maxWidth="xs">
                  <Stack spacing={4} sx={{ mt: "25vh" }}>

<Box component="form" onSubmit={handleSignup}>
  <Stack spacing={2.5}>
    {/* ---------- TITLE ---------- */}
    <Box>
      <Typography variant="h5" fontWeight={600} color="#fff">
        Create your account
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: "rgba(255,255,255,0.65)", mt: 0.5 }}
      >
        Join BunkMate and start planning smarter trips
      </Typography>
    </Box>

    {/* ---------- BASIC FIELDS ---------- */}
    {["name", "mobile", "email"].map((field) => (
      <TextField
        key={field}
        name={field}
        label={field.charAt(0).toUpperCase() + field.slice(1)}
        fullWidth
        required
        onChange={handleChange}
        variant="outlined"
        sx={inputStyles}
      />
    ))}

    <TextField
  name="username"
  label="Username"
  fullWidth
  required
  onChange={handleChange}
  error={usernameAvailable === false}
  helperText={
    checkingUsername
      ? "Checking availability..."
      : usernameAvailable === false
      ? "Username already taken"
      : usernameAvailable === true
      ? "Username available"
      : ""
  }
  sx={inputStyles}
/>


    {/* ---------- PASSWORD ---------- */}
    <TextField
      name="password"
      label="Password"
      type={showPassword ? "text" : "password"}
      required
      onChange={handleChange}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => setShowPassword((p) => !p)}
              edge="end"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      sx={inputStyles}
    />

    {/* ---------- PASSWORD STRENGTH ---------- */}
{password && (
  <Stack spacing={0.5} sx={{ mt: 1 }}>
    {[
      { label: "At least 8 characters", ok: passwordRules.length },
      { label: "One uppercase letter", ok: passwordRules.uppercase },
      { label: "One number", ok: passwordRules.number },
      { label: "One symbol", ok: passwordRules.symbol },
    ].map((rule) => (
      <Typography
        key={rule.label}
        variant="caption"
        sx={{
          color: rule.ok ? "#22c55e" : "rgba(255,255,255,0.5)",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        {rule.ok ? "✔" : "○"} {rule.label}
      </Typography>
    ))}
  </Stack>
)}
{password && passwordStrength && (
  <Box sx={{ mt: 1 }}>
    <Box
      sx={{
        height: 6,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.15)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          height: "100%",
          width: `${passwordStrength.value}%`,
          backgroundColor: passwordStrength.color,
          transition: "width 0.3s ease",
        }}
      />
    </Box>
    <Typography
      variant="caption"
      sx={{ color: passwordStrength.color, mt: 0.5 }}
    >
      Password strength: {passwordStrength.label}
    </Typography>
  </Box>
)}


    {/* ---------- CONFIRM PASSWORD ---------- */}
    <TextField
      name="confirmPassword"
      label="Confirm Password"
      type={showConfirm ? "text" : "password"}
      required
      onChange={handleChange}
      error={confirmPassword && password !== confirmPassword}
      helperText={
        confirmPassword && password !== confirmPassword
          ? "Passwords do not match"
          : ""
      }
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => setShowConfirm((p) => !p)}
              edge="end"
            >
              {showConfirm ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      sx={inputStyles}
    />

    {/* ---------- SUBMIT ---------- */}
<Button
  type="submit"
  variant="contained"
  fullWidth
  disabled={
    passwordStrength?.label !== "Strong" ||
    password !== confirmPassword ||
    usernameAvailable !== true
  }
  sx={{
    backgroundColor: "#ffffffba",
    color: "#000",
    borderRadius: 14,
    py: 1.5,
    opacity:
      passwordStrength?.label !== "Strong" ||
      password !== confirmPassword ||
      usernameAvailable !== true
        ? 0.7
        : 1,
    transition: "all 0.2s ease",
  }}
>
  Sign Up
</Button>


    {/* ---------- FOOTER ---------- */}
    <Typography variant="body2" align="center" sx={{ color: "#fff" }}>
      Already have an account?{" "}
      <Link href="/login" underline="hover" color="#00BFA6">
        Login
      </Link>
    </Typography>
  </Stack>
</Box>


      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        TransitionComponent={transition}
      >
        <DialogTitle>{errorMessage}</DialogTitle>
        <DialogContent>
          <TextField
            label="Enter New Username"
            fullWidth
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={() => handleCreateUsername(formData.username)}
            color="primary"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />

      </Stack>
      </Container>
    </Box>
  );
};

export default Signup;