import React, { useState } from "react";
import {
  Box,
  IconButton,
  SwipeableDrawer,
  DialogTitle,
  DialogContent,
  Typography,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { AccessTime } from "../../icons/LucideIcons";

const PRIORITY_COLORS = {
  high: {
    ring: "#ef4444",
    bg: "rgba(239,68,68,0.15)",
  },
  medium: {
    ring: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
  },
  low: {
    ring: "#10b981",
    bg: "rgba(16,185,129,0.15)",
  },
};

const TimeProgressRing = ({ progress, color }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  return (
    <svg width="40" height="40">
      <circle
        cx="20"
        cy="20"
        r={radius}
        stroke="rgba(255, 255, 255, 0.38)"
        strokeWidth="4"
        fill="none"
      />
      <motion.circle
        cx="20"
        cy="20"
        r={radius}
        stroke={color}
        strokeWidth="4"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        strokeLinecap="round"
      />
    </svg>
  );
};

const AlertRow = ({ alert, expanded, onToggle, mode }) => {
  const priority = PRIORITY_COLORS[alert.priority] || PRIORITY_COLORS.low;

  return (
    <motion.div layout>
      <Box
        onClick={onToggle}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1.5,
          borderRadius: 3,
          cursor: "pointer",
          background: priority.bg,
        }}
      >
        <TimeProgressRing progress={alert.progress} color={priority.ring} />

        <Box sx={{ flexGrow: 1 }}>
          <Typography fontWeight={700}>{alert.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {alert.from} → {alert.to}
          </Typography>
        </Box>

        <AccessTime sx={{ color: priority.ring }} />
      </Box>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                mt: 0.5,
                borderRadius: 3,
                background:
                  mode === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.04)",
              }}
            >
              <Typography variant="body2">
                🗺 Route: {alert.from} → {alert.to}
              </Typography>
              <Typography variant="body2">
                ⏰ Starts at:{" "}
                {alert.start ? new Date(alert.start).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }) : "N/A"}
              </Typography>
              <Typography variant="body2">
                📌 Priority: {alert.priority ? alert.priority.toUpperCase() : "LOW"}
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function UpcomingTripsAlerts({
  upcomingAlerts,
  mode,
  isSmallScreen,
}) {
  const [openUpcoming, setOpenUpcoming] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  if (!upcomingAlerts || upcomingAlerts.length === 0) return null;

  return (
    <>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "center",
        }}
      >
        {upcomingAlerts.map((t, index) => (
          <IconButton
            key={t.id}
            onClick={() => setOpenUpcoming(true)}
            sx={{
              width: 64,
              height: 64,
              borderRadius: 6,
              position: "relative",
              overflow: "hidden",
              backdropFilter: "blur(6px)",
              background:
                mode === "dark"
                  ? "linear-gradient(135deg, rgba(158,234,158,0.25), rgba(158,234,158,0.15))"
                  : "linear-gradient(135deg, rgba(0,122,51,0.18), rgba(0,122,51,0.08))",
              border:
                mode === "dark"
                  ? "1px solid rgba(158,234,158,0.35)"
                  : "1px solid rgba(0,122,51,0.28)",
              boxShadow: "none",
              transition:
                "transform 240ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 240ms ease, background 240ms ease",
              animation: `iconFloatIn 280ms ease ${index * 60}ms both`,
              "&:hover": {
                transform: "scale(1.15) rotate(-6deg)",
                boxShadow:
                  mode === "dark"
                    ? "0 10px 28px rgba(0,0,0,0.6)"
                    : "0 10px 28px rgba(0,0,0,0.28)",
                background:
                  mode === "dark"
                    ? "linear-gradient(135deg, rgba(158,234,158,0.38), rgba(158,234,158,0.22))"
                    : "linear-gradient(135deg, rgba(0,122,51,0.28), rgba(0,122,51,0.14))",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            {/* Subtle Pulse Ring */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: 6,
                backgroundColor:
                  mode === "dark"
                    ? "rgba(158,234,158,0.6)"
                    : "rgba(0,122,51,0.5)",
                opacity: 0.25,
                animation: "softPulse 2.2s infinite",
                pointerEvents: "none",
              }}
            />

            {/* Icon */}
            <AccessTime
              sx={{
                position: "relative",
                fontSize: 26,
                color: mode === "dark" ? "#9eea9e" : "#007a33",
              }}
            />
          </IconButton>
        ))}
      </Box>

      {/* Upcoming Alerts Dialog */}
      <AnimatePresence>
        {openUpcoming && (
          <SwipeableDrawer
            anchor="bottom"
            open
            onClose={() => setOpenUpcoming(false)}
            onOpen={() => {}}
            disableSwipeToOpen
            PaperProps={{
              component: motion.div,
              drag: isSmallScreen ? "y" : false,
              dragConstraints: { top: 0, bottom: 320 },
              dragElastic: 0.2,
              onDragEnd: (_, info) => {
                if (info.offset.y > 140) setOpenUpcoming(false);
              },
              initial: {
                y: isSmallScreen ? "100%" : 24,
                opacity: 0,
                scale: isSmallScreen ? 1 : 0.96,
              },
              animate: {
                y: 0,
                opacity: 1,
                scale: 1,
              },
              exit: {
                y: isSmallScreen ? "100%" : 24,
                opacity: 0,
                scale: 0.96,
              },
              transition: {
                duration: 0.38,
                ease: [0.4, 0, 0.2, 1],
              },
              sx: {
                height: isSmallScreen ? "58vh" : "auto",
                maxHeight: "92vh",
                borderRadius: isSmallScreen ? "22px 22px 0 0" : 4,
                overflow: "hidden",
                zIndex: 1300,
                backdropFilter: "blur(18px) saturate(1.6)",
                WebkitBackdropFilter: "blur(18px) saturate(1.6)",
                background:
                  mode === "dark"
                    ? "linear-gradient(180deg, rgba(18, 18, 18, 0.55), rgba(18, 18, 18, 0.55))"
                    : "linear-gradient(180deg, rgba(255, 255, 255, 0.55), rgba(248,250,252,0.55))",
                boxShadow:
                  mode === "dark"
                    ? "0 -24px 60px rgba(0,0,0,0.7)"
                    : "0 -24px 60px rgba(255, 255, 255, 0.25)",
              },
            }}
          >
            {/* Drag Handle */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                pt: 1.2,
                pb: 0.6,
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 4,
                  borderRadius: 999,
                  backgroundColor:
                    mode === "dark"
                      ? "rgba(255,255,255,0.25)"
                      : "rgba(0,0,0,0.25)",
                }}
              />
            </Box>

            {/* Header */}
            <DialogTitle
              sx={{
                fontWeight: 900,
                fontSize: "1.05rem",
                px: 3,
                pb: 1,
                mb: 1,
                letterSpacing: 0.2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom:
                  mode === "dark"
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(0,0,0,0.06)",
              }}
            >
              Upcoming Trips & Alerts
            </DialogTitle>

            {/* Content */}
            <DialogContent
              sx={{
                px: 3,
                pt: 2,
                pb: 3,
                display: "flex",
                flexDirection: "column",
                gap: 1.4,
                overflowY: "auto",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
              }}
            >
              {upcomingAlerts.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  mode={mode}
                  expanded={expandedId === alert.id}
                  onToggle={() =>
                    setExpandedId(expandedId === alert.id ? null : alert.id)
                  }
                />
              ))}
            </DialogContent>
          </SwipeableDrawer>
        )}
      </AnimatePresence>

      <style>
        {`
          @keyframes softPulse {
            0% { transform: scale(1); opacity: 0.25; }
            60% { transform: scale(1.6); opacity: 0; }
            100% { transform: scale(1); opacity: 0.25; }
          }

          @keyframes iconFloatIn {
            from {
              opacity: 0;
              transform: translateY(6px) scale(0.85);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>
    </>
  );
}
