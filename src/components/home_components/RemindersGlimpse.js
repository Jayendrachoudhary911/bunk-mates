import React, { useRef, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, IconButton } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationsNone, Check, AccessTime } from "../../icons";
import { designTokens, glass } from "../../theme/designSystem";

const MAX_VISIBLE = 4; // Updated to show exactly 4 reminders

const ConfettiParticle = ({ x, y, rotate, color }) => (
  <motion.div
    initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
    animate={{ opacity: 0, scale: 0.6, x, y, rotate }}
    transition={{ duration: 0.9, ease: "easeOut" }}
    style={{
      position: "absolute",
      width: 6,
      height: 10,
      borderRadius: 2,
      background: color,
      top: "50%",
      left: "50%",
      pointerEvents: "none",
    }}
  />
);

const formatDisplayDate = (val) => {
  if (!val) return "";
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? "" : val.toLocaleDateString();
  }
  if (typeof val === "object" && val !== null) {
    if (typeof val.toDate === "function") {
      try {
        const d = val.toDate();
        return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
      } catch {
        return "";
      }
    }
    if (typeof val.seconds === "number") {
      const d = new Date(val.seconds * 1000);
      return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
    }
    return "";
  }
  return String(val);
};

const formatDisplayTime = (val) => {
  if (!val) return "";
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? "" : val.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (typeof val === "object" && val !== null) {
    if (typeof val.toDate === "function") {
      try {
        const d = val.toDate();
        return isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      } catch {
        return "";
      }
    }
    if (typeof val.seconds === "number") {
      const d = new Date(val.seconds * 1000);
      return isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return "";
  }
  return String(val);
};

const ReminderTimelineItem = ({ rem, mode, onToggleComplete, isLast }) => {
  const navigate = useNavigate();
  const prevCompleted = useRef(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const isCompleted = rem?.completed === true;

  useEffect(() => {
    if (!rem) return;

    if (!prevCompleted.current && isCompleted) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 900);
      return () => clearTimeout(t);
    }

    prevCompleted.current = isCompleted;
  }, [isCompleted, rem]);

  if (!rem) {
    return (
      <Box
        onClick={() => navigate("/reminders")}
        sx={{
          width: "100%",
          py: 3,
          px: 2.5,
          borderRadius: designTokens.radii.card,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.8,
          background: mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
          border: mode === "dark" ? "1px dashed rgba(255,255,255,0.15)" : "1px dashed rgba(0,0,0,0.1)",
          cursor: "pointer",
          textAlign: "center",
        }}
      >
        <NotificationsNone sx={{ fontSize: 24, opacity: 0.55, mb: 0.5 }} />
        <Typography sx={{ fontWeight: 800, fontSize: 15, opacity: 0.85 }}>
          No reminders yet
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          Your upcoming reminders will appear here once you add one. Tap to create.
        </Typography>
      </Box>
    );
  }

  const now = Date.now();
  const dueTime = rem?.dueAt ? new Date(rem.dueAt).getTime() : null;
  const isOverdue = !isCompleted && dueTime && dueTime < now;
  const isUrgent = !isCompleted && dueTime && dueTime - now < 1000 * 60 * 60 * 24;

  const accent = isCompleted
    ? "#22c55e"
    : isOverdue
    ? "#ef4444"
    : isUrgent
    ? "#facc15"
    : "#60a5fa";

  const displayDateStr = formatDisplayDate(rem?.date);
  const displayTimeStr = formatDisplayTime(rem?.time);
  const dateTimeLabel = [displayDateStr, displayTimeStr].filter(Boolean).join(" • ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      style={{ width: "100%", position: "relative" }}
    >
      <Box sx={{ display: "flex", alignItems: "stretch", position: "relative" }}>
        
        {/* Timeline Node & Vertical Track Line */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mr: 1,
            position: "relative",
            minWidth: 24,
          }}
        >
          {/* Timeline Dot Indicator */}
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              backgroundColor: rem.completed ? accent : mode === "dark" ? "#f1f1f116" : '#0c0c0c14',
              boxShadow: `0`,
              zIndex: 2,
              mt: 2,
              flexShrink: 0,
            }}
          />

          {/* Vertical Connecting Track Line */}
          {!isLast && (
            <Box
              sx={{
                width: 2,
                flexGrow: 1,
                backgroundColor: mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
                my: 1,
              }}
            />
          )}
        </Box>

        {/* Timeline Content Card */}
        <Box
          sx={{
            flexGrow: 1,
            py: 0.2,
            px: 2,
            mb: 0.5, 
            borderRadius: 4,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            border: "none",
            borderLeft: `0px solid ${accent}`,
            ...glass(mode, {
              background: 'transparent',
            }),
            boxShadow: "none",
            opacity: isCompleted ? 0.65 : 1,
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            "&:hover": {
              transform: "translateX(2px)",
            },
          }}
        >
          <AnimatePresence>
            {showConfetti &&
              [...Array(8)].map((_, i) => (
                <ConfettiParticle
                  key={i}
                  x={(Math.random() - 0.5) * 80}
                  y={(Math.random() - 1) * 80}
                  rotate={Math.random() * 360}
                  color={accent}
                />
              ))}
          </AnimatePresence>

          {/* Text Content */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 14.5,
                fontWeight: 700,
                textDecoration: isCompleted ? "line-through" : "none",
                color: mode === "dark" ? "#fff" : "#111",
                mb: 0.3,
              }}
              noWrap
            >
              {typeof rem?.text === "string" ? rem.text : (rem?.text ? String(rem.text) : (rem?.title ? String(rem.title) : "Reminder"))}
            </Typography>

            {dateTimeLabel && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, opacity: 0.65 }}>
                <AccessTime sx={{ fontSize: 13 }} />
                <Typography variant="caption" noWrap>
                  {dateTimeLabel}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Complete Button */}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete?.(rem.id, rem.completed);
            }}
            sx={{
              p: 0.8,
              borderRadius: "50%",
              width: 32,
              height: 32,
              flexShrink: 0,
              background: rem.completed
                ? `${accent}22`
                : mode === "dark"
                ? "rgba(255,255,255,0.01)"
                : "rgba(0, 0, 0, 0.01)",
              border: rem.completed
                ? `0px solid ${accent}55`
                : mode === "dark"
                ? "1px solid rgba(255,255,255,0.1)"
                : "1px solid rgba(0,0,0,0.08)",
              transition: "all 0.2s ease",
              "&:hover": {
                background: `${accent}33`,
                transform: "scale(1.1)",
              },
            }}
          >
            <Check
              sx={{
                fontSize: 16,
                color: rem.completed ? accent : mode === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)",
                display: rem.completed ? "flex" : 'none'
              }}
            />
          </IconButton>
        </Box>
      </Box>
    </motion.div>
  );
};

export default function RemindersGlimpse({
  reminders,
  mode,
  handleToggleReminderComplete,
}) {
  const navigate = useNavigate();

  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() ?? new Date(a.createdAt).getTime();
      const tb = b.createdAt?.toMillis?.() ?? new Date(b.createdAt).getTime();
      return tb - ta; // latest first
    });
  }, [reminders]);

  const visibleReminders = sortedReminders.slice(0, MAX_VISIBLE);
  const remainingCount = Math.max(sortedReminders.length - MAX_VISIBLE, 0);

  const displayReminders = reminders.length === 0 ? [null] : visibleReminders;

  return (
    <Box sx={{ width: "100%", mt: 1 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Reminders Timeline
        </Typography>
      </Box>

      {/* Timeline Container */}
      <Box sx={{ display: "flex", flexDirection: "column", pl: 0.5 }}>
        {displayReminders.map((rem, index) => (
          <ReminderTimelineItem
            key={rem?.id ?? "empty-reminder"}
            rem={rem}
            mode={mode}
            onToggleComplete={handleToggleReminderComplete}
            isLast={index === displayReminders.length - 1 && remainingCount === 0}
          />
        ))}

        {/* Remaining Count Footer if more than MAX_VISIBLE */}
        {remainingCount > 0 && (
          <Box
            onClick={() => navigate("/reminders")}
            sx={{
              ml: 4.2,
              py: 1.2,
              textAlign: "center",
              cursor: "pointer",
              borderRadius: 8,
              boxShadow: mode === "dark" ? 'inset 0 1px 1px rgba(255, 255, 255, 0.08)' : 'inset 0 1px 4px rgba(0, 0, 0, 0.04)',
              background: mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
              transition: "background 0.2s ease",
              "&:hover": {
                background: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              },
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.8, color: "#7c7c7c" }}>
              +{remainingCount} more reminder{remainingCount > 1 ? "s" : ""} in timeline — View all →
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}