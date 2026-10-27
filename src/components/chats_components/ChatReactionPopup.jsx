import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  IconButton,
  Portal,
  Tooltip,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { motion, AnimatePresence } from "framer-motion";

const QUICK_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🔥", "👏", "🎉"];
const EXTENDED_EMOJIS = [
  "😍", "🎉", "💩", "🙏", "🚀", "👀", "💯", "👍", "👎", 
  "😎", "🤔", "💡", "👑", "⭐", "🍻", "🥳", "😭", "🔥"
];

const ChatReactionPopup = ({
  open,
  anchorPosition,
  userReactions = [],
  isDark,
  onSelectEmoji,
  onClose,
}) => {
  const [showExtended, setShowExtended] = useState(false);
  const popupRef = useRef(null);

  // Viewport dimensions with dynamic resize tracking
  const [viewport, setViewport] = useState({
    vw: typeof window !== "undefined" ? window.innerWidth : 800,
    vh: typeof window !== "undefined" ? window.innerHeight : 600,
  });

  useEffect(() => {
    if (!open) return;
    const handleResize = () => {
      setViewport({
        vw: window.innerWidth,
        vh: window.innerHeight,
      });
    };
    const handleScroll = (e) => {
      if (popupRef.current && popupRef.current.contains(e.target)) return;
      onClose();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, onClose]);

  // Normalize userReactions to an array of emoji strings
  const activeReactions = React.useMemo(() => {
    if (Array.isArray(userReactions)) return userReactions;
    if (typeof userReactions === "string") return [userReactions];
    return [];
  }, [userReactions]);

  if (!open) return null;

  const vw = viewport.vw;
  const vh = viewport.vh;

  // Calculate anchor geometry
  const anchorTop = anchorPosition?.top ?? 200;
  const anchorBottom =
    anchorPosition?.bottom ?? (anchorTop + (anchorPosition?.height || 36));
  const anchorCenterX = anchorPosition?.width
    ? anchorPosition.left + anchorPosition.width / 2
    : (anchorPosition?.left ?? vw / 2);

  // Dimensions & Horizontal Clamping
  const popupWidth = Math.min(410, vw - 24);
  const halfWidth = popupWidth / 2;
  const clampedCenterX = Math.max(
    halfWidth + 12,
    Math.min(vw - halfWidth - 12, anchorCenterX)
  );

  // Vertical placement awareness approximation (base bar vs expanded accordion)
  const estimatedHeight = showExtended ? 240 : 64;
  const spaceAbove = anchorTop;
  const spaceBelow = vh - anchorBottom;

  let placeAbove = spaceAbove >= estimatedHeight + 12;
  if (!placeAbove && spaceBelow < estimatedHeight + 12) {
    placeAbove = spaceAbove >= spaceBelow;
  }

  let topPos = placeAbove ? anchorTop - estimatedHeight - 8 : anchorBottom + 8;
  topPos = Math.max(12, Math.min(vh - estimatedHeight - 12, topPos));

  return (
    <Portal>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          pointerEvents: "auto",
          bgcolor: "transparent",
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <motion.div
          ref={popupRef}
          initial={{ opacity: 0, scale: 0.9, x: "-50%", y: placeAbove ? 8 : -8 }}
          animate={{ opacity: 1, scale: 1, x: "-50%", y: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: "-50%", y: placeAbove ? 8 : -8 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: `${topPos}px`,
            left: `${clampedCenterX}px`,
            width: "max-content",
            maxWidth: `${popupWidth}px`,
          }}
        >
          <Paper
            elevation={12}
            sx={{
              display: "flex",
              flexDirection: "column",
              borderRadius: "26px",
              bgcolor: isDark
                ? "rgba(0, 0, 0, 0.59)"
                : "rgba(255, 255, 255, 0.59)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: `1px solid ${
                isDark ? "#0c0c0c9c" : "#f1f1f1"
              }`,
              boxShadow: 'none',
              overflow: "hidden",
            }}
          >
            {/* Quick Emoji Bar Container */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.3,
                px: 1,
                py: 0.8,
                width: "100%",
              }}
            >
              {QUICK_EMOJIS.map((emoji) => {
                const isSelected = activeReactions.includes(emoji);
                return (
                  <Tooltip
                    key={emoji}
                    title={
                      isSelected
                        ? `Your reaction: ${emoji} (tap to remove)`
                        : `React with ${emoji}`
                    }
                    arrow
                    placement={placeAbove ? "top" : "bottom"}
                  >
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEmoji(emoji);
                        onClose();
                      }}
                      sx={{
                        width: 38,
                        height: 38,
                        fontSize: "1.25rem",
                        position: "relative",
                        borderRadius: "50%",
                        flexShrink: 0,
                        bgcolor: isSelected
                          ? isDark
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(0, 0, 0, 0.05)"
                          : "transparent",
                        border: isSelected
                          ? `1.5px solid ${isDark ? "#2b2b2b" : "#e9e9e9"}`
                          : "1.5px solid transparent",
                        boxShadow: "none",
                        transform: isSelected ? "scale(1.08)" : "scale(1)",
                        transition:
                          "all 180ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                        "&:hover": {
                          transform: "scale(1.18)",
                          bgcolor: isDark
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(0, 0, 0, 0.05)",
                        },
                        "&:active": {
                          transform: "scale(0.95)",
                        },
                      }}
                    >
                      {emoji}
                      {isSelected && (
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 1,
                            right: 1,
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: isDark ? "#646464" : "#8a8a8a",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: `0px solid ${
                              isDark ? "#1c1c20" : "#ffffff"
                            }`,
                            boxShadow: "none",
                          }}
                        />
                      )}
                    </IconButton>
                  </Tooltip>
                );
              })}

              <Tooltip
                title={showExtended ? "Less emojis" : "More reactions"}
                arrow
                placement={placeAbove ? "top" : "bottom"}
              >
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowExtended(!showExtended);
                  }}
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    flexShrink: 0,
                    bgcolor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.05)",
                    color: isDark ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.7)",
                    transition: "all 200ms ease",
                    ml: 0.4,
                    "&:hover": {
                      transform: "scale(1.08)",
                      bgcolor: isDark
                        ? "rgba(255, 255, 255, 0.15)"
                        : "rgba(0, 0, 0, 0.09)",
                      color: isDark ? "#fff" : "#000",
                    },
                  }}
                >
                  <AddRoundedIcon
                    sx={{
                      fontSize: 18,
                      transform: showExtended ? "rotate(45deg)" : "none",
                      transition: "transform 220ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Smooth Accordion Expansion for Extended Emojis */}
            <AnimatePresence initial={false}>
              {showExtended && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] }}
                  style={{ overflow: "hidden" }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(6, 1fr)",
                      gap: 0.6,
                      p: 1,
                      maxHeight: 170,
                      overflowY: "auto",
                      borderTop: `1px solid ${
                        isDark
                          ? "rgba(255, 255, 255, 0.08)"
                          : "rgba(0, 0, 0, 0.06)"
                      }`,
                      "&::-webkit-scrollbar": {
                        width: "4px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        borderRadius: "4px",
                        bgcolor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.15)",
                      },
                    }}
                  >
                    {EXTENDED_EMOJIS.map((emoji, idx) => {
                      const isSelected = activeReactions.includes(emoji);
                      return (
                        <IconButton
                          key={`${emoji}-${idx}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEmoji(emoji);
                            onClose();
                          }}
                          sx={{
                            width: 38,
                            height: 38,
                            fontSize: "1.2rem",
                            position: "relative",
                            borderRadius: "50%",
                            flexShrink: 0,
                            bgcolor: isSelected
                              ? isDark
                                ? "rgba(255, 255, 255, 0.1)"
                                : "rgba(0, 0, 0, 0.07)"
                              : "transparent",
                            border: isSelected
                              ? `0px solid ${isDark ? "#00b7ff" : "#0288d1"}`
                              : "0px solid transparent",
                            transform: isSelected ? "scale(1.06)" : "scale(1)",
                            transition: "all 150ms ease",
                            "&:hover": {
                              transform: "scale(1.16)",
                              bgcolor: isDark
                                ? "rgba(255, 255, 255, 0.1)"
                                : "rgba(0, 0, 0, 0.05)",
                            },
                          }}
                          title={
                            isSelected
                              ? `Selected (tap to remove)`
                              : `React with ${emoji}`
                          }
                        >
                          {emoji}
                          {isSelected && (
                            <Box
                          sx={{
                            position: "absolute",
                            bottom: 1,
                            right: 1,
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: isDark ? "#646464" : "#8a8a8a",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: `0px solid ${
                              isDark ? "#1c1c20" : "#ffffff"
                            }`,
                            boxShadow: "none",
                          }}
                            />
                          )}
                        </IconButton>
                      );
                    })}
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Paper>
        </motion.div>
      </Box>
    </Portal>
  );
};

export default ChatReactionPopup;