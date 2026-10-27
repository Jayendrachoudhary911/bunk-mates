// src/components/chats_components/SearchInChatDrawer.jsx
import React, { useState, useMemo } from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { formatMessageTime } from "../../utils/chatCache";
import { safeImageUrl } from "../../utils/uiHelpers";

const SearchInChatDrawer = ({
  open,
  onClose,
  messages = [],
  onScrollToMessage,
  isDark = true,
  memberInfo = {},
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const results = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return messages.filter((m) => {
      const textMatch = m.text && m.text.toLowerCase().includes(q);
      const cardTitleMatch =
        m.cardData?.title && m.cardData.title.toLowerCase().includes(q);
      const pollQuestionMatch =
        m.cardData?.question && m.cardData.question.toLowerCase().includes(q);
      const senderMatch =
        m.senderName && m.senderName.toLowerCase().includes(q);
      return textMatch || cardTitleMatch || pollQuestionMatch || senderMatch;
    });
  }, [searchQuery, messages]);

  const handleSelectMessage = (msgId) => {
    if (onScrollToMessage) {
      onScrollToMessage(msgId);
    }
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 400 },
          maxWidth: "100vw",
          bgcolor: isDark ? "#121212" : "#fdfdfd",
          color: isDark ? "#fff" : "#111",
          p: 0,
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* ─── Top Header ─── */}
      <Box
        sx={{
          px: 2,
          py: 1.8,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderBottom: `1px solid ${
            isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
          }`,
        }}
      >
        <IconButton onClick={onClose} size="small" sx={{ color: "inherit" }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
          Search in Chat
        </Typography>
      </Box>

      {/* ─── Search Bar ─── */}
      <Box sx={{ p: 2 }}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder="Search messages, links, cards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: isDark ? "#aaa" : "#666", fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery("")}>
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
            sx: {
              borderRadius: "14px",
              bgcolor: isDark
                ? "rgba(255, 255, 255, 0.06)"
                : "rgba(0, 0, 0, 0.04)",
              color: isDark ? "#fff" : "#111",
            },
          }}
        />

        {searchQuery.trim() && (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 1,
              px: 0.5,
              opacity: 0.7,
              fontSize: "0.75rem",
            }}
          >
            {results.length} {results.length === 1 ? "result" : "results"} found
          </Typography>
        )}
      </Box>

      {/* ─── Search Results List ─── */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 2, pb: 3 }}>
        {searchQuery.trim() && results.length === 0 && (
          <Box sx={{ py: 6, textAlign: "center", opacity: 0.5 }}>
            <Typography variant="body2">No messages match your search.</Typography>
          </Box>
        )}

        {!searchQuery.trim() && (
          <Box sx={{ py: 6, textAlign: "center", opacity: 0.5 }}>
            <Typography variant="body2">Type to search within this chat stream.</Typography>
          </Box>
        )}

        {results.map((m) => {
          const senderUser = memberInfo?.[m.senderId];
          const senderAvatar = safeImageUrl(senderUser?.photoURL || m.senderPhoto);
          const senderName =
            senderUser?.displayName || senderUser?.name || m.senderName || "Member";

          return (
            <Paper
              key={m.id}
              elevation={0}
              onClick={() => handleSelectMessage(m.id)}
              sx={{
                p: 1.4,
                mb: 1,
                borderRadius: "14px",
                bgcolor: isDark
                  ? "rgba(255, 255, 255, 0.04)"
                  : "rgba(0, 0, 0, 0.03)",
                border: `1px solid ${
                  isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)"
                }`,
                cursor: "pointer",
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.06)",
                  borderColor: isDark ? "#00b7ff" : "#1976d2",
                  transform: "translateX(2px)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.6 }}>
                <Avatar
                  src={senderAvatar}
                  sx={{ width: 22, height: 22, fontSize: "0.7rem" }}
                >
                  {senderName?.[0] || "?"}
                </Avatar>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, fontSize: "0.76rem", flex: 1 }}
                  noWrap
                >
                  {senderName}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.5, fontSize: "0.68rem" }}>
                  {formatMessageTime(m.timestamp)}
                </Typography>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.85rem",
                  color: isDark ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.85)",
                  lineHeight: 1.35,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {m.text ||
                  m.cardData?.title ||
                  m.cardData?.question ||
                  (m.imageUrl ? "📷 Photo" : "Media message")}
              </Typography>
            </Paper>
          );
        })}
      </Box>
    </Drawer>
  );
};

export default React.memo(SearchInChatDrawer);
