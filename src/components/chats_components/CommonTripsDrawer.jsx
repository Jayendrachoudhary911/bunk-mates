import React, { useState } from "react";
import {
  SwipeableDrawer,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  LinearProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocationOn from "@mui/icons-material/LocationOn";
import AccessTime from "@mui/icons-material/AccessTime";
import { useNavigate } from "react-router-dom";

const CommonTripsDrawer = ({
  open,
  onClose,
  commonTrips = [],
  timelineStatsMap = {},
  effectiveChatTheme = "dark",
}) => {
  const isDark = effectiveChatTheme === "dark";
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = commonTrips.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          bgcolor: isDark
            ? "rgba(18, 18, 18, 0.94)"
            : "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(24px)",
          color: isDark ? "#fff" : "#111",
          maxWidth: 480,
          mx: "auto",
          p: 2,
          height: "85vh",
        },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 4,
          bgcolor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
          borderRadius: 2,
          mx: "auto",
          mb: 2,
        }}
      />

      <Typography
        variant="h6"
        sx={{ textAlign: "center", fontWeight: 700, mb: 1.5 }}
      >
        Common Trips ({commonTrips.length})
      </Typography>

      <TextField
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search shared trips..."
        fullWidth
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon
                sx={{
                  color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                  fontSize: 20,
                }}
              />
            </InputAdornment>
          ),
          sx: {
            borderRadius: "14px",
            bgcolor: isDark
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(0, 0, 0, 0.04)",
            color: isDark ? "#fff" : "#111",
            "& fieldset": { border: "none" },
          },
        }}
        sx={{ mb: 2 }}
      />

      <Box sx={{ maxHeight: "calc(85vh - 140px)", overflowY: "auto" }}>
        {filtered.map((trip) => {
          const stats = timelineStatsMap[trip.id];
          return (
            <Card
              key={trip.id}
              onClick={() => {
                onClose();
                navigate(`/trips/${trip.id}`);
              }}
              sx={{
                bgcolor: isDark
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.03)",
                color: isDark ? "#fff" : "#111",
                borderRadius: "16px",
                mb: 1.5,
                boxShadow: "none",
                cursor: "pointer",
                transition: "transform 0.15s ease",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {trip.name}
                  </Typography>
                  {stats && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: isDark
                          ? "rgba(255,255,255,0.6)"
                          : "rgba(0,0,0,0.6)",
                      }}
                    >
                      {stats.completed}/{stats.total} done
                    </Typography>
                  )}
                </Box>

                {stats && (
                  <LinearProgress
                    variant="determinate"
                    value={stats.percent || 0}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      mb: 1.5,
                      bgcolor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.08)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: isDark ? "#00b7ff" : "#0288d1",
                      },
                    }}
                  />
                )}

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    fontSize: "0.8rem",
                    color: isDark
                      ? "rgba(255,255,255,0.6)"
                      : "rgba(0,0,0,0.6)",
                  }}
                >
                  {trip.location && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <LocationOn sx={{ fontSize: 16 }} />
                      <Typography variant="caption">{trip.location}</Typography>
                    </Box>
                  )}
                  {trip.startDate && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <AccessTime sx={{ fontSize: 16 }} />
                      <Typography variant="caption">
                        {trip.startDate} - {trip.endDate || "Ongoing"}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              py: 4,
              color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
            }}
          >
            No common trips found.
          </Typography>
        )}
      </Box>
    </SwipeableDrawer>
  );
};

export default React.memo(CommonTripsDrawer);
