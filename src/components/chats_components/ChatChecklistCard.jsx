// src/components/chats_components/ChatChecklistCard.jsx
import React from "react";
import {
  Box,
  Typography,
  Chip,
  Avatar,
  AvatarGroup,
  Button,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ChecklistIcon from "@mui/icons-material/Checklist";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import { safeImageUrl } from "../../utils/uiHelpers";

const ChatChecklistCard = ({
  cardData = {},
  currentUser,
  memberInfo = {},
  isDark = true,
  onToggleItem,
  messageId,
  onShare = null,
}) => {
  const isAnonymous = Boolean(
    cardData.isAnonymous ||
    cardData.anonymous ||
    cardData.mode === "anonymous" ||
    cardData.mode === "personal"
  );

  const rawItems = Array.isArray(cardData.items) ? cardData.items : [];
  const currentUid = currentUser?.uid;

  const getItemId = (item, idx) => item.id || item.title || item.text || `item_${idx}`;
  const getItemText = (item) =>
    item.title || item.text || item.name || item.task || (typeof item === "string" ? item : "Task item");

  // Determine checked state for current user
  const isItemCheckedByMe = (item) => {
    if (isAnonymous) {
      if (item.personalChecked && item.personalChecked[currentUid] !== undefined) {
        return Boolean(item.personalChecked[currentUid]);
      }
    }
    const checkedList = Array.isArray(item.checkedBy)
      ? item.checkedBy
      : item.completed
      ? [cardData.createdBy || "creator"]
      : [];
    return checkedList.includes(currentUid);
  };

  // Completed items count
  const completedCount = rawItems.filter((it) => isItemCheckedByMe(it)).length;

  return (
    <Box
      sx={{
        mt: 1,
        mb: 1,
        minWidth: { xs: 280, sm: 340 },
        maxWidth: 380,
        width: "100%",
        overflow: "hidden",
        bgcolor: "transparent",
        border: "0px solid",
        boxShadow: "none",
      }}
    >
      {/* Main Checklist Card Container */}
      <Box
        sx={{
          p: 1.8,
          borderRadius: 7,
          mb: 1,
          bgcolor: isDark ? "rgba(97, 97, 97, 0.06)" : "rgb(251, 255, 251)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "none",
          border: `0px solid ${
            isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"
          }`,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ChecklistIcon sx={{ fontSize: 18, color: isDark ? '#aeaeae' : '#242424' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.92rem", color: isDark ? '#e1e1e1' : '#242424' }}>
              {cardData.title || "Trip Checklist"}
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#e1e1e1' : '#242424', fontSize: "0.75rem" }}>
            {completedCount}/{rawItems.length} Done
          </Typography>
        </Box>

        {/* Mode Badge & Batch Mode Button */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.4,
          }}
        >
          <Chip
            icon={
              isAnonymous ? (
                <LockOutlinedIcon sx={{ fontSize: "12px !important", color: "#ffa726 !important" }} />
              ) : (
                <GroupOutlinedIcon sx={{ fontSize: "12px !important", color: isDark ? '#e1e1e1' : '#242424' }} />
              )
            }
            label={isAnonymous ? "Personal Checkmarks" : "Shared to All"}
            size="small"
            sx={{
              height: 20,
              fontSize: "0.64rem",
              fontWeight: 600,
              bgcolor: isAnonymous ? "rgba(255, 167, 38, 0.14)" : "rgba(129, 129, 129, 0.09)",
              color: isAnonymous ? "#ffa726" : isDark ? '#e1e1e1' : '#242424',
              border: "none",
            }}
          />
        </Box>

        {/* Checklist Items List */}
        <Box
          sx={{
            maxHeight: 220,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 0.6,
                  borderRadius: '10px',
            pr: 0.4,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
              borderRadius: 2,
            },
          }}
        >
          {rawItems.map((item, idx) => {
            const itemId = getItemId(item, idx);
            const itemText = getItemText(item);
            const isCheckedByMe = isItemCheckedByMe(item);

            const checkedByList = Array.isArray(item.checkedBy)
              ? item.checkedBy
              : item.completed
              ? [cardData.createdBy || "creator"]
              : [];

            return (
              <Box
                key={itemId}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleItem) {
                    onToggleItem(itemId, !isCheckedByMe, messageId);
                  }
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: "7px 10px",
                  borderRadius: 6,
                  bgcolor: isDark
                    ? isCheckedByMe
                      ? "rgba(76, 175, 80, 0.14)"
                      : "rgba(255, 255, 255, 0.04)"
                    : isCheckedByMe
                    ? "rgba(76, 175, 80, 0.16)"
                    : "rgba(0, 0, 0, 0.03)",
                  border: `0px solid ${
                    isCheckedByMe
                      ? "rgba(76, 175, 80, 0.35)"
                      : "transparent"
                  }`,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.05)",
                  },
                }}
              >
                {/* Left: Icon + Text */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    minWidth: 0,
                    flex: 1,
                    mr: 1,
                  }}
                >
                  {isCheckedByMe ? (
                    <CheckCircleIcon sx={{ fontSize: 18, color: "#4caf50", flexShrink: 0 }} />
                  ) : (
                    <UncheckedIcon sx={{ fontSize: 18, opacity: 0.5, flexShrink: 0 }} />
                  )}

                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      textDecoration: isCheckedByMe ? "line-through" : "none",
                      opacity: isCheckedByMe ? 0.75 : 1,
                      wordBreak: "break-word",
                    }}
                  >
                    {itemText}
                  </Typography>
                </Box>

                {/* Right: Member Avatars (ONLY shown if shared and NOT anonymous) */}
                {!isAnonymous && checkedByList.length > 0 && (
                  <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                    <AvatarGroup
                      max={3}
                      sx={{
                        "& .MuiAvatar-root": {
                          width: 18,
                          height: 18,
                          fontSize: "0.58rem",
                          border: `1.5px solid ${isDark ? "#282828" : "#fff"}`,
                        },
                      }}
                    >
                      {checkedByList.map((uid) => {
                        const u = memberInfo?.[uid];
                        const isMe = uid === currentUid;
                        return (
                          <Avatar
                            key={uid}
                            src={safeImageUrl(u?.photoURL)}
                            alt={u?.displayName || "Member"}
                            title={isMe ? "Checked by You" : `Checked by ${u?.displayName || "Member"}`}
                            sx={{ bgcolor: isMe ? "#4caf50" : "#555" }}
                          >
                            {(u?.displayName || u?.name)?.[0] || "?"}
                          </Avatar>
                        );
                      })}
                    </AvatarGroup>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Action Footer Buttons (Batch Select / Toggle & Share) */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", px: 0.5 }}>

        {onShare && (
          <Button
            variant="contained"
            size="small"
            startIcon={<ShareOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={(e) => {
              e.stopPropagation();
              onShare(cardData);
            }}
            sx={{
              py: 0.8,
              px: 1.6,
              borderRadius: 8,
              bgcolor:  isDark ? "rgba(13, 66, 0, 0.25)" : "rgb(245, 255, 242)",
              color: "#4caf50",
              textTransform: "none",
              boxShadow: 'none',
              fontWeight: 600,
              fontSize: "0.8rem",
              whiteSpace: "nowrap",
              transition: "all 150ms ease",
              "&:hover": {
                bgcolor: isDark ? "rgba(8, 39, 0, 0.41)" : "rgb(230, 255, 224)",
                boxShadow: "none",
              },
            }}
          >
            Share
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default React.memo(ChatChecklistCard);