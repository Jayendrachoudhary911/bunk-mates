import React, { useRef, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, IconButton, Button } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarMonth, NotificationsNone, Check } from "../../icons/LucideIcons";

const REMCARD_WIDTH = 140;
const MAX_VISIBLE = 4;

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

const ProgressRing = ({ progress, color }) => {
  const radius = 14;
  const stroke = 3;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <svg width={radius * 2} height={radius * 2}>
      <circle
        stroke="rgba(0,0,0,0.1)"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
};

const ReminderCard = ({ rem, mode, onToggleComplete }) => {
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
          minWidth: 290,
          height: 160,
          scrollSnapAlign: "start",
          borderRadius: 5,
          p: 2.4,
          position: "relative",
          overflow: "hidden",
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.8,
          background:
            mode === "dark"
              ? `
                linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015)),
                repeating-linear-gradient(
                  0deg,
                  rgba(255,255,255,0.04),
                  rgba(255,255,255,0.04) 1px,
                  transparent 1px,
                  transparent 18px
                ),
                repeating-linear-gradient(
                  90deg,
                  rgba(255,255,255,0.035),
                  rgba(255,255,255,0.035) 1px,
                  transparent 1px,
                  transparent 18px
                )
              `
              : `
                linear-gradient(180deg, #ffffff, #f8fafc),
                repeating-linear-gradient(
                  0deg,
                  rgba(0,0,0,0.035),
                  rgba(0,0,0,0.035) 1px,
                  transparent 1px,
                  transparent 20px
                ),
                repeating-linear-gradient(
                  90deg,
                  rgba(0,0,0,0.03),
                  rgba(0,0,0,0.03) 1px,
                  transparent 1px,
                  transparent 20px
                )
              `,
          border:
            mode === "dark"
              ? "1px dashed rgba(255,255,255,0.18)"
              : "1px dashed rgba(0,0,0,0.12)",
          boxShadow:
            mode === "dark"
              ? "0 10px 26px rgba(0,0,0,0.4)"
              : "0 10px 22px rgba(0,0,0,0.14)",
          opacity: 0.9,
          userSelect: "none",
          cursor: "pointer",
        }}
      >
        <CalendarMonth
          sx={{
            position: "absolute",
            right: -20,
            bottom: -20,
            fontSize: 120,
            opacity: mode === "dark" ? 0.06 : 0.05,
            pointerEvents: "none",
          }}
        />

        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background:
              mode === "dark"
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.06)",
            boxShadow:
              mode === "dark"
                ? "0 0 0 6px rgba(255,255,255,0.04)"
                : "0 0 0 6px rgba(0,0,0,0.04)",
          }}
        >
          <NotificationsNone sx={{ fontSize: 22, opacity: 0.55 }} />
        </Box>

        <Typography
          sx={{
            fontWeight: 800,
            fontSize: 15,
            opacity: 0.85,
          }}
        >
          No reminders yet
        </Typography>

        <Typography
          variant="caption"
          sx={{
            maxWidth: 220,
            textAlign: "center",
            lineHeight: 1.5,
            opacity: 0.6,
          }}
        >
          Your upcoming reminders will appear here once you add one.
        </Typography>

        <Typography
          variant="caption"
          sx={{
            mt: 0.4,
            fontWeight: 600,
            letterSpacing: "0.03em",
            opacity: 0.45,
          }}
        >
          Tap <strong>the card</strong> to create your first reminder
        </Typography>
      </Box>
    );
  }

  const now = Date.now();
  const dueTime = rem?.dueAt ? new Date(rem.dueAt).getTime() : null;
  const createdAt = rem?.createdAt
    ? new Date(rem.createdAt).getTime()
    : now;

  const isOverdue = !isCompleted && dueTime && dueTime < now;
  const isUrgent =
    !isCompleted && dueTime && dueTime - now < 1000 * 60 * 60 * 24;

  const accent = isCompleted
    ? "#22c55e"
    : isOverdue
    ? "#ef4444"
    : isUrgent
    ? "#facc15"
    : "#60a5fa";

  const progress =
    isCompleted || !dueTime
      ? 1
      : Math.min(
          Math.max((now - createdAt) / (dueTime - createdAt), 0),
          1
        );

  return (
    <motion.div
      whileHover={!isCompleted ? { y: -6 } : {}}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      sx={{ backgroundColor: "transparent" }}
    >
      <Box
        sx={{
          minWidth: 180,
          height: 75,
          borderRadius: 5,
          p: 2,
          position: "relative",
          overflow: "hidden",
          background: `
            linear-gradient(
              120deg,
              ${accent}22,
              ${
                mode === "dark"
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(255,255,255,0.85)"
              },
              ${accent}22
            ),
            repeating-linear-gradient(
                0deg,
                rgba(255,255,255,0.04),
                rgba(255,255,255,0.04) 1px,
                transparent 1px,
                transparent 18px
              )
          `,
          backgroundSize: "300% 300%",
          animation: isCompleted ? "none" : "gradientShift 8s ease infinite",
          "@keyframes gradientShift": {
            "0%": { backgroundPosition: "0% 50%" },
            "50%": { backgroundPosition: "100% 50%" },
            "100%": { backgroundPosition: "0% 50%" },
          },
          border:
            mode === "dark"
              ? "1px solid rgba(255,255,255,0.14)"
              : "1px solid rgba(0,0,0,0.08)",
          boxShadow: isOverdue
            ? "0 0 0 1px rgba(239,68,68,0.4), 0 18px 40px rgba(239,68,68,0.25)"
            : "none",
          opacity: isCompleted ? 0.7 : 1,
        }}
      >
        <CalendarMonth
          sx={{
            position: "absolute",
            right: -18,
            bottom: -18,
            fontSize: 120,
            opacity: 0.06,
            pointerEvents: "none",
          }}
        />

        <AnimatePresence>
          {showConfetti &&
            [...Array(10)].map((_, i) => (
              <ConfettiParticle
                key={i}
                x={(Math.random() - 0.5) * 120}
                y={(Math.random() - 1) * 120}
                rotate={Math.random() * 360}
                color={accent}
              />
            ))}
        </AnimatePresence>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <ProgressRing progress={progress} color={accent} />

          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete?.(rem.id, rem.completed);
            }}
            sx={{
              p: 0.6,
              borderRadius: 2.5,
              height: 25,
              background: rem.completed
                ? `${accent}22`
                : mode === "dark"
                ? "rgba(255,255,255,0.08)"
                : "rgba(0, 0, 0, 0.01)",
              border: rem.completed
                ? `1px solid ${accent}55`
                : mode === "dark"
                ? "1px solid rgba(255,255,255,0)"
                : "1px solid rgba(0, 0, 0, 0.11)",
              boxShadow: rem.completed
                ? `0 0 0 3px ${accent}22`
                : "0 2px 8px rgba(0,0,0,0)",
              transition:
                "background .25s ease, box-shadow .25s ease, transform .15s ease",
              "&:hover": {
                background: `${accent}33`,
                transform: "scale(1.08)",
              },
              "&:active": {
                transform: "scale(0.96)",
              },
            }}
          >
            <motion.div
              initial={false}
              animate={{
                scale: rem.completed ? 1.05 : 0.9,
                rotate: rem.completed ? 0 : -20,
              }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
            >
              <Check
                sx={{
                  fontSize: 18,
                  color: rem.completed ? accent : `${accent}cc`,
                  filter: rem.completed
                    ? "drop-shadow(0 0 6px rgba(34,197,94,0.6))"
                    : "none",
                }}
              />
            </motion.div>
          </IconButton>
        </Box>

        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 800,
            textDecoration: isCompleted ? "line-through" : "none",
            mb: 0.6,
          }}
        >
          {rem.text}
        </Typography>

        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          {rem.date} • {rem.time}
        </Typography>
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
  const remindersScrollRef = useRef(null);
  const [, setReminderIndex] = useState(0);

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
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Reminders
        </Typography>

        <Button
          size="small"
          onClick={() => navigate("/reminders")}
          sx={{
            textTransform: "none",
            fontSize: 13,
            fontWeight: 600,
            opacity: 0.7,
          }}
        >
          View all
        </Button>
      </Box>

      {/* Cards Row */}
      <Box sx={{ position: "relative", mt: 1, backgroundColor: "transparent" }}>
        {/* SCROLL CONTAINER */}
        <Box
          ref={remindersScrollRef}
          sx={{
            display: "flex",
            gap: 1,
            pl: 1,
            overflowX: "auto",
            paddingBottom: 1,
            scrollSnapType: "x mandatory",
            backgroundColor: "transparent",
            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
          onScroll={(e) => {
            setReminderIndex(
              Math.round(e.target.scrollLeft / REMCARD_WIDTH)
            );
          }}
        >
          {displayReminders.map((rem, index) => (
            <motion.div
              key={rem?.id ?? "empty-reminder"}
              style={{ scrollSnapAlign: "start" }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{
                type: "spring",
                stiffness: 240,
                damping: 18,
                mass: 0.55,
                delay: index * 0.05,
              }}
            >
              <Box sx={{ backgroundColor: "transparent" }}>
                <ReminderCard
                  rem={rem}
                  mode={mode}
                  onToggleComplete={handleToggleReminderComplete}
                />
              </Box>
            </motion.div>
          ))}

          {/* ➕ GROUPED "+N MORE" CARD */}
          {remainingCount > 0 && (
            <motion.div
              style={{ scrollSnapAlign: "start" }}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 220,
                damping: 16,
                mass: 0.5,
              }}
            >
              <Box
                onClick={() => navigate("/reminders")}
                sx={{
                  minWidth: 240,
                  height: 100,
                  borderRadius: 5,
                  p: 2.5,
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  userSelect: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.6,
                  background:
                    mode === "dark"
                      ? `
                        linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)),
                        repeating-linear-gradient(
                          0deg,
                          rgba(255,255,255,0.04),
                          rgba(255,255,255,0.04) 1px,
                          transparent 1px,
                          transparent 18px
                        )
                      `
                      : `
                        linear-gradient(180deg, #ffffff, #f8fafc),
                        repeating-linear-gradient(
                          0deg,
                          rgba(0,0,0,0.035),
                          rgba(0,0,0,0.035) 1px,
                          transparent 1px,
                          transparent 18px
                        )
                      `,
                  border:
                    mode === "dark"
                      ? "1px dashed rgba(255,255,255,0.18)"
                      : "1px dashed rgba(0,0,0,0.12)",
                  boxShadow:
                    mode === "dark"
                      ? "0 10px 26px rgba(0,0,0,0.4)"
                      : "0 10px 22px rgba(0,0,0,0.14)",
                  transition: "box-shadow .3s ease",
                }}
              >
                <CalendarMonth
                  sx={{
                    position: "absolute",
                    right: -18,
                    bottom: -18,
                    fontSize: 120,
                    opacity: 0.06,
                    pointerEvents: "none",
                  }}
                />

                <Typography fontSize={26} fontWeight={900}>
                  +{remainingCount}
                </Typography>

                <Typography variant="caption" sx={{ opacity: 0.65, fontWeight: 600 }}>
                  more reminders
                </Typography>

                <Typography variant="caption" sx={{ opacity: 0.45 }}>
                  View all →
                </Typography>
              </Box>
            </motion.div>
          )}
        </Box>
      </Box>
    </Box>
  );
}
