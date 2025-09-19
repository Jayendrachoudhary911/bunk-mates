// src/pages/ForgotPassword.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Stack,
  Alert,
} from "@mui/material";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { createTheme, ThemeProvider } from "@mui/material/styles";

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

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox and spam folder.");
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
          <Stack spacing={4} sx={{ mt: "35vh" }}>
            <Typography variant="h4" fontWeight="bold" color="primary" align="left">
              Forgot Password
            </Typography>
            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
              <Stack spacing={2}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  fullWidth
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  sx={{ borderRadius: 3 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ backgroundColor: "#ffffffba", py: 1, fontSize: "1.1rem", borderRadius: 14 }}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Email"}
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

export default ForgotPassword;
