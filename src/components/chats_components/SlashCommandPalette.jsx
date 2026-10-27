// src/components/chats_components/SlashCommandPalette.jsx
import React, { useMemo } from "react";
import { Paper, Box, Typography, Chip } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TimelineIcon from "@mui/icons-material/Timeline";
import ChecklistIcon from "@mui/icons-material/Checklist";
import PollIcon from "@mui/icons-material/Poll";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import { motion, AnimatePresence } from "framer-motion";

const COMMAND_DEFINITIONS = [
  {
    cmd: "/budget",
    syntax: "/budget",
    desc: "Share quick view budget widget (total, spent, remaining)",
    icon: <AccountBalanceWalletIcon sx={{ fontSize: 18, color: "#aaa" }} />,
    requiresTrip: true,
  },
  {
    cmd: "/expenses",
    syntax: "/expenses",
    desc: "Share complete detailed expenses breakdown & ledger",
    icon: <ReceiptLongIcon sx={{ fontSize: 18, color: "#aaa" }} />,
    requiresTrip: true,
  },
  {
    cmd: "/profile",
    syntax: "/profile",
    desc: "Share a user contact profile card in chat",
    icon: <BadgeOutlinedIcon sx={{ fontSize: 18, color: "#aaa" }} />,
  },
  {
    cmd: "/timeline",
    syntax: "/timeline",
    desc: "Share live-synced trip timeline itinerary",
    icon: <TimelineIcon sx={{ fontSize: 18, color: "#aaa" }} />,
    requiresTrip: true,
  },
  {
    cmd: "/checklist",
    syntax: "/checklist",
    desc: "Share group trip packing & tasks checklist",
    icon: <ChecklistIcon sx={{ fontSize: 18, color: "#aaa" }} />,
    requiresTrip: true,
  },
  {
    cmd: "/poll",
    syntax: "/poll",
    desc: "Create an aligned interactive voting poll",
    icon: <PollIcon sx={{ fontSize: 18, color: "#aaa" }} />,
  },
  {
    cmd: "/shrug",
    syntax: "/shrug",
    desc: "Send shrug emoticon: ¯\\_(ツ)_/¯",
    icon: <SentimentSatisfiedAltIcon sx={{ fontSize: 18, color: "#aaa" }} />,
    immediate: true,
  },
  {
    cmd: "/tableflip",
    syntax: "/tableflip",
    desc: "Send tableflip emoticon: (╯°□°)╯︵ ┻━┻",
    icon: <SentimentSatisfiedAltIcon sx={{ fontSize: 18, color: "#aaa" }} />,
    immediate: true,
  },
  {
    cmd: "/clear",
    syntax: "/clear",
    desc: "Clear text input draft",
    icon: <ClearAllIcon sx={{ fontSize: 18, color: "#777" }} />,
    immediate: true,
  },
];

export const getFilteredCommands = (input, hasTrip = false) => {
  if (!input || !input.startsWith("/")) return [];
  const parts = input.slice(1).toLowerCase().split(" ");
  // If user typed a command followed by a space and parameters, don't show palette
  if (parts.length > 1 && parts[1].length > 0) return [];
  const query = parts[0].trim();

  return COMMAND_DEFINITIONS.filter((item) => {
    if (item.requiresTrip && !hasTrip) return false;
    if (!query) return true;
    return (
      item.cmd.slice(1).startsWith(query) ||
      item.desc.toLowerCase().includes(query)
    );
  });
};

const SlashCommandPalette = ({
  input,
  onSelectCommand,
  isDark = true,
  hasTrip = false,
  visible = false,
  selectedIndex = 0,
}) => {
  const filteredCommands = useMemo(() => {
    return getFilteredCommands(input, hasTrip);
  }, [input, hasTrip]);

  if (!visible || filteredCommands.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        style={{
          position: "absolute",
          bottom: "100%",
          left: 12,
          right: 12,
          marginBottom: 8,
          zIndex: 100,
        }}
      >
<Paper
          elevation={0}
          sx={{
            maxHeight: 280,
            overflowY: "auto",
            borderRadius: 8.5,
            bgcolor: isDark ? "rgba(20, 20, 20, 0.17)" : "rgba(255, 255, 255, 0.48)",
            border: `0px solid ${
              isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"
            }`,
            boxShadow: 'none',
            backdropFilter: 'blur(20px)',
            p: 1,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
              borderRadius: "4px",
            },
          }}
        >
          <Box sx={{ px: 1.2, py: 0.6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 750,
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: 0.8,
                color: isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(0, 0, 0, 0.45)",
              }}
            >
              Quick Commands & AI Suggestions
            </Typography>
            <Typography variant="caption" sx={{ fontSize: "0.68rem", opacity: 0.5, fontWeight: 500 }}>
              ↑ / ↓ and Enter to select
            </Typography>
          </Box>

          {filteredCommands.map((c, index) => {
            const isSelected = index === selectedIndex;
            return (
              <Box
                key={c.cmd}
                ref={(el) => {
                  if (isSelected && el) {
                    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCommand(c);
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 1,
                  py: 1,
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "all 180ms ease",
                  bgcolor: isSelected
                    ? isDark
                      ? "rgba(255, 255, 255, 0.12)"
                      : "rgba(0, 0, 0, 0.05)"
                    : isDark
                      ? "rgba(255, 255, 255, 0.035)"
                      : "rgba(0, 0, 0, 0.025)",
                  boxShadow: isSelected
                    ? isDark
                      ? "inset 0 1px 1px rgba(255, 255, 255, 0.16), inset 0 -1px 2px rgba(0,0,0,0.4)"
                      : "inset 0 1px 4px rgba(255, 255, 255, 0.81), inset 0 -1px 4px rgba(0,0,0,0.08)"
                    : 'none',
                  border: "0px solid",
                  transform: isSelected ? "translateX(2px)" : "none",
                  "&:hover": {
                    bgcolor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.07)",
                    boxShadow: "none",
                    transform: "translateX(2px)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1, mr: 1 }}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: isDark
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.03)",
                      color: isDark ? "rgba(255,255,255,0.85)" : "text.secondary",
                      flexShrink: 0,
                      boxShadow: 'none',
                    }}
                  >
                    {c.icon}
                  </Box>

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 750,
                        fontSize: "0.85rem",
                        fontFamily: "monospace",
                        letterSpacing: "-0.2px",
                        color: isDark ? "#fff" : "#111",
                      }}
                      noWrap
                    >
                      {c.cmd}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.72rem",
                        color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.55)",
                        display: "block",
                        lineHeight: 1.3,
                      }}
                      noWrap
                    >
                      {c.desc}
                    </Typography>
                  </Box>
                </Box>

                {c.tag && (
                  <Chip
                    size="small"
                    label={c.tag}
                    sx={{
                      height: 20,
                      fontSize: "0.62rem",
                      fontWeight: 750,
                      borderRadius: 8,
                      bgcolor: c.isAi
                        ? "rgba(0, 183, 255, 0.16)"
                        : isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                      color: c.isAi ? "#00b7ff" : isDark ? "rgba(255,255,255,0.8)" : "text.secondary",
                      border: "0px solid",
                      "& .MuiChip-label": { px: 0.8 },
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Paper>
      </motion.div>
    </AnimatePresence>
  );
};

export default React.memo(SlashCommandPalette);
