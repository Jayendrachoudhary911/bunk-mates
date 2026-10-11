// src/components/panels/TripsPanelContent.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  ArrowForward as ArrowIcon,
} from "../../icons";
import { useAuth } from "../../hooks/useAuth";
import { useThemeToggle } from "../../contexts/ThemeToggleContext";
import { useDesktopPanel } from "../../contexts/DesktopPanelContext";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const TripsPanelContent = () => {
  const { user: currentUser } = useAuth();
  const { mode } = useThemeToggle();
  const isDark = mode === "dark";
  const { closePanel } = useDesktopPanel();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, "trips"),
      where("members", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTrips(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          Your Trips ({trips.length})
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon sx={{ fontSize: 16 }} />}
          onClick={() => {
            closePanel();
            navigate("/trips");
          }}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.8rem",
          }}
        >
          New Trip
        </Button>
      </Box>

      {trips.length === 0 ? (
        <Box
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 3,
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)"
            }`,
          }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
            No trips planned yet.
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              closePanel();
              navigate("/trips");
            }}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Create Your First Trip
          </Button>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {trips.map((trip) => (
            <Box
              key={trip.id}
              onClick={() => {
                closePanel();
                navigate(`/trips/${trip.id}`);
              }}
              sx={{
                p: 2,
                borderRadius: 3,
                cursor: "pointer",
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.04)"
                  : "rgba(0, 0, 0, 0.03)",
                border: `1px solid ${
                  isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
                }`,
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.06)",
                  transform: "translateX(2px)",
                },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {trip.destination || trip.name || "Untitled Trip"}
                </Typography>
                <ArrowIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                {trip.startDate && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <CalendarIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {trip.startDate}
                    </Typography>
                  </Box>
                )}
                <Chip
                  label={`${trip.members?.length || 1} members`}
                  size="small"
                  sx={{ height: 20, fontSize: "0.7rem", borderRadius: 1.5 }}
                />
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      <Button
        fullWidth
        variant="outlined"
        onClick={() => {
          closePanel();
          navigate("/trips");
        }}
        sx={{
          borderRadius: 2.5,
          textTransform: "none",
          fontWeight: 600,
          mt: 1,
        }}
      >
        View Full Trips Hub
      </Button>
    </Box>
  );
};

export default TripsPanelContent;
