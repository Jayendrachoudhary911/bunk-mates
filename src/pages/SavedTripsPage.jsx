import React, { useState, useEffect } from "react";
import { Box, Container, Typography, useTheme, IconButton, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { auth } from "../firebase"; // Import auth to catch active user if prop is missing

// Import your existing SavedTripsView component
import SavedTripsView from "../components/home_components/SavedTripsView";

export default function SavedTripsPage({ user, userData, onPlanTrip, mode }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = mode === "dark" || theme.palette.mode === "dark";

  const [currentUserId, setCurrentUserId] = useState(user?.uid || auth.currentUser?.uid || null);

  useEffect(() => {
    if (user?.uid) {
      setCurrentUserId(user.uid);
    } else if (auth.currentUser?.uid) {
      setCurrentUserId(auth.currentUser.uid);
    }
  }, [user]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#0c0c0c" : "#f8fafc",
        color: isDark ? "#fff" : "#000",
        pb: 12,
        pt: 3,
      }}
    >
      <Container maxWidth="md">
        {/* TOP HEADER WITH BACK NAVIGATION */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 3,
            px: { xs: 1, md: 0 },
          }}
        >
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              color: isDark ? "#fff" : "#000",
              "&:hover": {
                backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
              Saved Destinations
            </Typography>
            <Typography variant="caption" color="text.secondary">
              All your bookmarked places and custom travel spots decoded from your profile
            </Typography>
          </Box>
        </Box>

        {/* SAVED TRIPS GRID VIEW (2x in a row layout) */}
        {currentUserId ? (
          <SavedTripsView
            userId={currentUserId}
            userData={userData}
            onPlanTrip={onPlanTrip}
            mode={mode}
            layout="grid"
          />
        ) : (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress size={28} sx={{ color: "#00d2ff" }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Authenticating user session...
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}