// src/pages/ResetPassword.js
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Stack,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { auth, db } from "../firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

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

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const [userName, setUserName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);    
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function fetchUserName() {
      if (!oobCode) return;
      try {
        const email = await verifyPasswordResetCode(auth, oobCode);
        // Find user by email in Firestore
        const userQuery = await getDoc(doc(db, "users", email));
        if (userQuery.exists()) {
          setUserName(userQuery.data().name || userQuery.data().displayName || email);
        } else {
          setUserName(email);
        }
      } catch {
        setError("Invalid or expired password reset link.");
      }
    }
    fetchUserName();
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setMessage("Password has been reset successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 2,
          minHeight: "90vh",
        }}
      >
        <Container maxWidth="xs">
          <Stack spacing={4} sx={{ mt: "20vh" }}>
            <Typography variant="h5" fontWeight="bold" color="primary" align="left">
              Reset your password
            </Typography>
            <Typography variant="subtitle1" align="left" sx={{ mb: 2 }}>
              for <b>{userName}</b>
            </Typography>
            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
              <Stack spacing={2}>
                <TextField
                  name="newPassword"
                  label="New password"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  sx={{ borderRadius: 3 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  name="confirmPassword"
                  label="Confirm password"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  sx={{ borderRadius: 3 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ backgroundColor: "#ffffffba", py: 1, fontSize: "1.1rem", borderRadius: 14 }}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </Button>
              </Stack>
            </form>
            {message && <Alert severity="success">{message}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            <Button variant="text" color="primary" onClick={() => navigate("/login")}>Back to Login</Button>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default ResetPassword;
