// src/components/chats_components/PinnedMessageBanner.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Box, Typography, IconButton, Button, Chip, Collapse } from "@mui/material";
import PushPinIcon from "@mui/icons-material/PushPin";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import { safeImageUrl } from "../../utils/uiHelpers";

const formatTimeLeft = (expiresAt) => {
  if (!expiresAt) return "Permanent";
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) {
    const mins = Math.max(1, Math.floor(diff / (1000 * 60)));
    return `${mins}m left`;
  }
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
};

const PinnedMessageBanner = ({
  pinnedMessage,
  pinnedMessages = [],
  onScrollToMessage,
  onViewPinned,
  onUnpin,
  isDark = true,
  canUnpin = true,
}) => {
  // Aggregate active, unexpired pinned messages
  const activePins = useMemo(() => {
    const list = [];
    if (Array.isArray(pinnedMessages) && pinnedMessages.length > 0) {
      list.push(...pinnedMessages);
    } else if (pinnedMessage) {
      list.push(pinnedMessage);
    }

    const now = Date.now();
    return list.filter((p) => {
      if (!p || !p.id) return false;
      if (p.expiresAt && p.expiresAt < now) return false;
      return true;
    });
  }, [pinnedMessages, pinnedMessage]);

  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Keep currentIndex in bounds
  useEffect(() => {
    if (currentIndex >= activePins.length) {
      setCurrentIndex(Math.max(0, activePins.length - 1));
    }
  }, [activePins.length, currentIndex]);

  if (activePins.length === 0) return null;

  const currentPin = activePins[currentIndex] || activePins[0];
  const timeLeftLabel = formatTimeLeft(currentPin.expiresAt);

  const handleJumpToMessage = (msgId) => {
    if (onScrollToMessage) {
      onScrollToMessage(msgId);
    } else if (onViewPinned) {
      onViewPinned(msgId);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        zIndex: 105,
        position: "relative",
      }}
    >
      {/* ─── Main Sticky Banner Header (Toggles Accordion) ─── */}
      <Box
        onClick={() => {
          if (activePins.length > 1) {
            setIsAccordionOpen((prev) => !prev);
          } else {
            handleJumpToMessage(currentPin.id);
          }
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 1.4, sm: 2 },
          py: 0.8,
          bgcolor: isDark ? "rgba(20, 22, 28, 0.94)" : "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${
            isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"
          }`,
          borderLeft: `4px solid ${isDark ? "#00b7ff" : "#0288d1"}`,
          cursor: "pointer",
          transition: "background-color 0.2s ease",
          "&:hover": {
            bgcolor: isDark ? "rgba(26, 30, 40, 0.98)" : "rgba(245, 248, 255, 0.98)",
          },
        }}
      >
        {/* Left: Pin Icon + Current Snippet */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: isDark ? "rgba(0, 183, 255, 0.18)" : "rgba(2, 136, 209, 0.14)",
              color: isDark ? "#00b7ff" : "#0288d1",
              flexShrink: 0,
            }}
          >
            <PushPinIcon sx={{ fontSize: 16, transform: "rotate(45deg)" }} />
          </Box>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 750,
                  fontSize: "0.75rem",
                  color: isDark ? "#00b7ff" : "#0288d1",
                  lineHeight: 1.2,
                }}
              >
                Pinned Messages ({activePins.length})
              </Typography>

              {activePins.length > 1 && (
                <Chip
                  label="Tap to view all"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    bgcolor: isDark ? "rgba(0, 183, 255, 0.15)" : "rgba(2, 136, 209, 0.1)",
                    color: isDark ? "#00b7ff" : "#0288d1",
                    "& .MuiChip-label": { px: 0.6 },
                  }}
                />
              )}

              {timeLeftLabel && (
                <Chip
                  icon={<AccessTimeIcon sx={{ fontSize: "11px !important" }} />}
                  label={timeLeftLabel}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: "0.62rem",
                    bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                    color: isDark ? "#ccc" : "#555",
                    fontWeight: 600,
                    "& .MuiChip-label": { px: 0.5 },
                  }}
                />
              )}
            </Box>

            <Typography
              variant="body2"
              noWrap
              sx={{
                fontSize: "0.82rem",
                fontWeight: 500,
                color: isDark ? "#fff" : "#111",
                opacity: 0.9,
                maxWidth: { xs: 200, sm: 400, md: 560 },
              }}
            >
              {currentPin.text || (currentPin.imageUrl ? "📷 Photo" : currentPin.cardData?.title || "Pinned message")}
            </Typography>
          </Box>
        </Box>

        {/* Right: Accordion Toggle Chevron + Quick Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, flexShrink: 0 }}>
          {activePins.length > 1 && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setIsAccordionOpen((prev) => !prev);
              }}
              sx={{ color: isDark ? "#00b7ff" : "#0288d1" }}
            >
              {isAccordionOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}

          {canUnpin && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onUnpin && onUnpin(currentPin);
              }}
              sx={{
                color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.4)",
                p: 0.5,
                "&:hover": {
                  color: "#ff5252",
                  bgcolor: "rgba(255, 82, 82, 0.1)",
                },
              }}
              title="Unpin"
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* ─── Accordion Expanded Dropdown Section ─── */}
      <Collapse in={isAccordionOpen} timeout="auto" unmountOnExit>
        <Box
          sx={{
            maxHeight: 280,
            overflowY: "auto",
            bgcolor: isDark ? "rgba(16, 18, 24, 0.97)" : "rgba(250, 252, 255, 0.98)",
            backdropFilter: "blur(24px)",
            borderBottom: `2px solid ${
              isDark ? "rgba(0, 183, 255, 0.3)" : "rgba(2, 136, 209, 0.25)"
            }`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            p: 1.2,
            display: "flex",
            flexDirection: "column",
            gap: 0.8,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 0.5, pb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 750, color: isDark ? "#aaa" : "#555", letterSpacing: 0.4 }}>
              ALL PINNED MESSAGES ({activePins.length})
            </Typography>
            <Button
              size="small"
              onClick={() => setIsAccordionOpen(false)}
              sx={{ textTransform: "none", fontSize: "0.72rem", py: 0.2 }}
            >
              Close
            </Button>
          </Box>

          {activePins.map((pin, idx) => (
            <Box
              key={pin.id || idx}
              onClick={() => {
                handleJumpToMessage(pin.id);
                setIsAccordionOpen(false);
              }}
              sx={{
                p: 1.2,
                borderRadius: "14px",
                bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                border: `1px solid ${
                  isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"
                }`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.2,
                cursor: "pointer",
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: isDark ? "rgba(0, 183, 255, 0.12)" : "rgba(2, 136, 209, 0.08)",
                  borderColor: isDark ? "#00b7ff" : "#0288d1",
                  transform: "translateX(3px)",
                },
              }}
            >
              {/* Left thumbnail or pin icon */}
              {pin.imageUrl || pin.dataUri ? (
                <Box
                  component="img"
                  src={safeImageUrl(pin.imageUrl || pin.dataUri)}
                  alt="Thumb"
                  sx={{ width: 38, height: 38, borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    bgcolor: "rgba(0, 183, 255, 0.15)",
                    color: "#00b7ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <PushPinIcon sx={{ fontSize: 16 }} />
                </Box>
              )}

              {/* Text content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? "#00b7ff" : "#0288d1" }}>
                    {pin.senderName || "Member"}
                  </Typography>
                  {pin.expiresAt && (
                    <Typography variant="caption" sx={{ opacity: 0.6, fontSize: "0.68rem" }}>
                      • {formatTimeLeft(pin.expiresAt)}
                    </Typography>
                  )}
                </Box>
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    color: isDark ? "#fff" : "#111",
                  }}
                >
                  {pin.text || (pin.imageUrl ? "Photo message" : pin.cardData?.title || "Pinned item")}
                </Typography>
              </Box>

              {/* Actions */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJumpToMessage(pin.id);
                    setIsAccordionOpen(false);
                  }}
                  sx={{ color: isDark ? "#00b7ff" : "#0288d1" }}
                  title="Jump to message"
                >
                  <LaunchRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>

                {canUnpin && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnpin && onUnpin(pin);
                    }}
                    sx={{
                      color: isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)",
                      "&:hover": { color: "#ff5252" },
                    }}
                    title="Unpin"
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

export default React.memo(PinnedMessageBanner);
