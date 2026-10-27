import React, { useState, useEffect } from "react";
import {
  Menu,
  MenuItem,
  Box,
  IconButton,
  Typography,
  Chip,
  Divider,
  Button,
} from "@mui/material";
import ReplyIcon from "@mui/icons-material/Reply";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import CopyIcon from "@mui/icons-material/ContentCopy";
import AddIcon from "@mui/icons-material/Add";
import PushPinIcon from "@mui/icons-material/PushPin";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ShortcutRoundedIcon from "@mui/icons-material/ShortcutRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import DoneIcon from "@mui/icons-material/Done";
import FormattedMessageText from "./FormattedMessageText";
import { safeImageUrl } from "../../utils/uiHelpers";
import ChatBudgetCard from "./ChatBudgetCard";
import ChatExpensesCard from "./ChatExpensesCard";
import ChatUserProfileCard from "./ChatUserProfileCard";
import ChatTripPreviewCard from "./ChatTripPreviewCard";
import ChatPlacePreviewCard from "./ChatPlacePreviewCard";
import ChatNotePreviewCard from "./ChatNotePreviewCard";
import ChatChecklistCard from "./ChatChecklistCard";
import ChatTimelineCard from "./ChatTimelineCard";

const QUICK_EMOJIS = ["❤️", "😂", "👍", "😁", "👌"];

function formatDetailedTime(ts) {
  if (!ts) return "Just now";
  try {
    let d;
    if (typeof ts?.toDate === "function") d = ts.toDate();
    else if (ts?.seconds != null) d = new Date(ts.seconds * 1000);
    else if (typeof ts === "string" || typeof ts === "number") d = new Date(ts);
    else if (ts instanceof Date) d = ts;
    if (d && !isNaN(d.getTime())) {
      return (
        d.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        }) +
        " at " +
        d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
      );
    }
  } catch {}
  return "Just now";
}

// 5-minute message edit window limit
function isMessageEditable(msg) {
  if (!msg) return false;
  let ts = msg.timestamp;
  if (ts?.toMillis) ts = ts.toMillis();
  else if (ts?.seconds != null) ts = ts.seconds * 1000;
  else if (typeof ts === "string" || typeof ts === "number") ts = new Date(ts).getTime();
  else if (ts instanceof Date) ts = ts.getTime();
  if (!ts || isNaN(ts)) return true;
  return Date.now() - ts <= 5 * 60 * 1000;
}

// Render rich interactive widgets inside popup & info view
function renderWidgetPreview(msg, isDark, currentUser) {
  if (!msg) return null;
  const type = msg.type;
  const cardData = msg.cardData;

  if (type === "budget" && cardData) {
    return (
      <Box sx={{ mt: 1 }}>
        <ChatBudgetCard
          cardData={cardData}
          currentUser={currentUser}
          isBudgetAllowed={true}
          isDark={isDark}
          messageId={msg.id}
          chatType="direct"
        />
      </Box>
    );
  }

  if (type === "expenses" && cardData) {
    return (
      <Box sx={{ mt: 1 }}>
        <ChatExpensesCard
          cardData={cardData}
          currentUser={currentUser}
          isExpensesAllowed={true}
          isDark={isDark}
          messageId={msg.id}
          chatType="direct"
        />
      </Box>
    );
  }

  if (type === "user_profile" && cardData) {
    return (
      <Box sx={{ mt: 1 }}>
        <ChatUserProfileCard
          cardData={cardData}
          currentUser={currentUser}
          isDark={isDark}
        />
      </Box>
    );
  }

  if ((type === "trip_preview" || type === "trip_share" || type === "trip") && cardData) {
    return (
      <Box sx={{ mt: 1 }}>
        <ChatTripPreviewCard
          cardData={cardData}
          currentUser={currentUser}
          isDark={isDark}
        />
      </Box>
    );
  }

  if ((type === "place_preview" || type === "place_share" || type === "place") && cardData) {
    return (
      <Box sx={{ mt: 1 }}>
        <ChatPlacePreviewCard
          cardData={cardData}
          currentUser={currentUser}
          isDark={isDark}
        />
      </Box>
    );
  }

  if ((type === "note_preview" || type === "note_share" || type === "note") && cardData) {
    return (
      <Box sx={{ mt: 1 }}>
        <ChatNotePreviewCard
          cardData={cardData}
          currentUser={currentUser}
          isDark={isDark}
        />
      </Box>
    );
  }

  if ((type === "checklist" || type === "trip_checklist") && cardData) {
    return (
      <Box sx={{ mt: 1 }}>
        <ChatChecklistCard
          cardData={cardData}
          currentUser={currentUser}
          isDark={isDark}
          messageId={msg.id}
        />
      </Box>
    );
  }

  if ((type === "timeline" || type === "trip_timeline") && cardData) {
    return (
      <Box sx={{ mt: 1 }}>
        <ChatTimelineCard
          cardData={cardData}
          timeline={cardData.timeline || []}
          isDark={isDark}
        />
      </Box>
    );
  }

  if (cardData && Object.keys(cardData).length > 0 && !["text", "image", "image_group"].includes(type)) {
    return (
      <Box
        sx={{
          mt: 1,
          p: 1.2,
          borderRadius: "14px",
          bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.5 }}>
          <Chip
            size="small"
            label={(type || "Widget").replace(/_/g, " ")}
            sx={{
              bgcolor: "rgba(0,183,255,0.18)",
              color: "#00b7ff",
              fontWeight: 700,
              fontSize: "0.72rem",
              height: 22,
            }}
          />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.88rem" }} noWrap>
            {cardData.title || cardData.name || cardData.displayName || cardData.question || "Interactive Card"}
          </Typography>
        </Box>
        {(cardData.destination || cardData.location || cardData.content || cardData.bio) && (
          <Typography variant="caption" sx={{ opacity: 0.75, display: "block", fontSize: "0.76rem" }}>
            {cardData.destination || cardData.location || cardData.content || cardData.bio}
          </Typography>
        )}
      </Box>
    );
  }

  return null;
}

const MessageActionsMenu = ({
  anchorEl,
  onClose,
  selectedMsg,
  currentUser,
  friendDetails,
  onReaction,
  onReply,
  onEdit,
  onDelete,
  onPinMessage,
  isPinned = false,
  effectiveChatTheme = "dark",
  onOpenEmojiPicker,
  onForward,
  onShareExternal,
  onEnterSelectionMode,
}) => {
  const isDark = effectiveChatTheme === "dark";
  const isOwn = selectedMsg?.senderId === currentUser?.uid;
  const [viewMode, setViewMode] = useState("menu"); // "menu" | "info"

  // Reset view mode on reopen
  useEffect(() => {
    if (Boolean(anchorEl)) {
      setViewMode("menu");
    }
  }, [anchorEl]);

  if (!selectedMsg) return null;

  const reactionsList = Array.isArray(selectedMsg.reactions) ? selectedMsg.reactions : [];
  const reactionCounts = reactionsList.reduce((acc, r) => {
    if (r?.emoji) acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  const handleCopyText = () => {
    if (selectedMsg?.text && navigator.clipboard) {
      navigator.clipboard.writeText(selectedMsg.text);
    }
    onClose();
  };

  return (
    <Menu
      anchorReference="none"
      open={Boolean(anchorEl)}
      onClose={onClose}
      BackdropProps={{
        invisible: false,
        sx: {
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          backgroundColor: isDark
            ? "rgba(0, 0, 0, 0.25)"
            : "rgba(240, 243, 248, 0.41)",
          transition: "backdrop-filter 0.25s ease, background-color 0.25s ease",
        },
      }}
      PaperProps={{
        sx: {
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: 340, sm: 520, md: 720 },
          maxWidth: "96vw",
          maxHeight: "88vh",
          overflowY: "auto",
          borderRadius: "24px",
          backgroundImage: 'none',
          backdropFilter: "blur(0px)",
          WebkitBackdropFilter: "blur(0px)",
          boxShadow: 'none',
          bgcolor: isDark
            ? "rgba(0, 0, 0, 0)"
            : "rgba(255, 255, 255, 0)",
          border: `0px solid ${
            isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)"
          }`,
          p: { xs: 1.2, md: 2 },
          m: 0,
        },
      }}
    >
      {viewMode === "info" ? (
        /* ─── INLINE VIEWED BY / MESSAGE INFO VIEW (inside popup) ─── */
        <Box sx={{ p: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.8 }}>
            <IconButton
              size="small"
              onClick={() => setViewMode("menu")}
              sx={{
                bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                color: isDark ? "#fff" : "#111",
                "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" },
              }}
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: "1.05rem" }}>
              Message Details
            </Typography>
          </Box>

          {/* Complete Message Snapshot inside info view */}
          <Box
            sx={{
              p: 1.4,
              mb: 2,
              borderRadius: "16px",
              maxHeight: 120,
              overflowY: "auto",
              scrollbarWidth: "thin",
              "&::-webkit-scrollbar": { width: "4px" },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                borderRadius: "4px",
              },
              bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
            }}
          >
            {selectedMsg.text && (
              <Box sx={{ color: isDark ? "#fff" : "#111", mb: selectedMsg.imageUrl ? 1 : 0 }}>
                <FormattedMessageText text={selectedMsg.text} isDark={isDark} />
              </Box>
            )}
            {(selectedMsg.imageUrl || selectedMsg.dataUri) && (
              <Box
                component="img"
                src={safeImageUrl(selectedMsg.imageUrl || selectedMsg.dataUri)}
                alt="Media"
                sx={{
                  width: "100%",
                  maxHeight: 90,
                  objectFit: "cover",
                  borderRadius: "12px",
                }}
              />
            )}
            {/* Structured Card / Widget Preview in Info View */}
            {renderWidgetPreview(selectedMsg, isDark, currentUser)}
          </Box>

          {/* Delivery & Read Receipts Timeline */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.8, px: 0.5, mb: 1.5 }}>
            {/* Read status */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.4 }}>
              <Box
                sx={{
                  p: 0.8,
                  borderRadius: "10px",
                  bgcolor: selectedMsg.isRead
                    ? "rgba(0, 183, 255, 0.15)"
                    : isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.05)",
                  color: selectedMsg.isRead ? "#00b7ff" : isDark ? "#888" : "#999",
                }}
              >
                <DoneAllIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.92rem" }}>
                  Read
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }}>
                  {selectedMsg.isRead
                    ? `Read by ${friendDetails?.displayName || friendDetails?.name || "Friend"} • ${formatDetailedTime(selectedMsg.readAt || selectedMsg.timestamp)}`
                    : "Not read yet"}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ opacity: 0.1 }} />

            {/* Delivered status */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.4 }}>
              <Box
                sx={{
                  p: 0.8,
                  borderRadius: "10px",
                  bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                  color: isDark ? "#aaa" : "#666",
                }}
              >
                <DoneIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.92rem" }}>
                  Delivered
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }}>
                  {formatDetailedTime(selectedMsg.timestamp)}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => setViewMode("menu")}
            sx={{
              mt: 1,
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.82rem",
              borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
              color: isDark ? "#fff" : "#111",
            }}
          >
            Back to Actions
          </Button>
        </Box>
      ) : (
        /* ─── TWO-SECTION DESKTOP / SINGLE COLUMN MOBILE LAYOUT ─── */
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 1.5, md: 2.5 },
            alignItems: "start",
          }}
        >
          {/* LEFT SECTION: Selected Message Card Preview */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.2,
            }}
          >

            <Box
              sx={{
                p: 1.6,
                borderRadius: "18px",
                overflowY: "auto",
                scrollbarWidth: "thin",
                "&::-webkit-scrollbar": { width: "4px" },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: 'isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"',
                  borderRadius: "4px",
                },
                bgcolor: 'transparent',
                border: `0px solid ${
                  isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)"
                }`,
                boxShadow: 'none',
              }}
            >
              {/* Forwarded Header */}
              {selectedMsg.forwarded && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    fontStyle: "italic",
                    fontSize: "0.72rem",
                    color: isDark ? "#e6e6e6" : "#3a3a3a",
                    mb: 0.6,
                  }}
                >
                  <ShortcutRoundedIcon sx={{ fontSize: 13 }} />
                  Forwarded {selectedMsg.forwardedFromName ? `from ${selectedMsg.forwardedFromName}` : ""}
                </Typography>
              )}

              {/* Replying To preview if message has replyTo */}
              {selectedMsg.replyTo && (
                <Box
                  sx={{
                    p: "6px 12px",
                    mb: 1,
                    borderRadius: 4,
                    bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                    borderLeft: `0px solid ${isDark ? "#00b7ff" : "#1976d2"}`,
                    fontSize: "0.78rem",
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#797979", display: "block" }}>
                    {selectedMsg.replyTo.senderId === currentUser?.uid ? "You" : "Reply"}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85, display: "block" }} noWrap>
                    {selectedMsg.replyTo.text || "📷 Photo"}
                  </Typography>
                </Box>
              )}

              {/* Full Photo Media Preview */}
              {(selectedMsg.imageUrl || selectedMsg.dataUri) && (
                <Box
                  component="img"
                  src={safeImageUrl(selectedMsg.imageUrl || selectedMsg.dataUri)}
                  alt="Message media"
                  sx={{
                    width: "100%",
                    maxHeight: 140,
                    objectFit: "contain",
                    borderRadius: "12px",
                    bgcolor: isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.05)",
                    mb: selectedMsg.text ? 1 : 0,
                  }}
                />
              )}

              {/* Multi-images gallery grid if images array exists */}
              {Array.isArray(selectedMsg.images) && selectedMsg.images.length > 0 && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: selectedMsg.images.length === 1 ? "1fr" : "repeat(2, 1fr)",
                    gap: 0.8,
                    mb: selectedMsg.text ? 1 : 0,
                  }}
                >
                  {selectedMsg.images.map((imgUri, idx) => (
                    <Box
                      key={idx}
                      component="img"
                      src={safeImageUrl(imgUri)}
                      alt={`Media ${idx + 1}`}
                      sx={{
                        width: "100%",
                        height: 120,
                        objectFit: "cover",
                        borderRadius: "10px",
                      }}
                    />
                  ))}
                </Box>
              )}

              {/* Complete formatted text string */}
              {selectedMsg.text && (
                <Box
                  sx={{
                    color: isDark ? "#fff" : "#111",
                    fontSize: "0.92rem",
                    lineHeight: 1.55,
                  }}
                >
                  <FormattedMessageText text={selectedMsg.text} isDark={isDark} />
                </Box>
              )}

              {/* Structured Card / Interactive Widget Preview */}
              {renderWidgetPreview(selectedMsg, isDark, currentUser)}

              {/* Active Reactions Chips inside preview */}
              {Object.keys(reactionCounts).length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                  {Object.entries(reactionCounts).map(([emoji, count]) => (
                    <Chip
                      key={emoji}
                      size="small"
                      label={`${emoji} ${count > 1 ? count : ""}`}
                      sx={{
                        height: 22,
                        fontSize: "0.76rem",
                        bgcolor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
                        color: isDark ? "#fff" : "#111",
                        borderRadius: "10px",
                      }}
                    />
                  ))}
                </Box>
              )}

              {/* Time & Sender Footer */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: 1,
                  pt: 0.6,
                  borderTop: `1px solid ${
                    isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"
                  }`,
                  color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)",
                  fontSize: "0.72rem",
                }}
              >
                <span>{isOwn ? "You" : selectedMsg.senderName || friendDetails?.displayName || "Friend"}</span>
                <span>{formatDetailedTime(selectedMsg.timestamp)}</span>
              </Box>
            </Box>
          </Box>

          {/* RIGHT SECTION: Quick Reactions & Menu Options */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.2,
            }}
          >
            {/* Quick Reaction Emoji Bar */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 1,
                py: 0.6,
                borderRadius: 8,
                bgcolor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
              }}
            >
              {QUICK_EMOJIS.map((emoji) => {
                const isSelected = reactionsList.some(
                  (r) => r.emoji === emoji && (r.user === currentUser?.uid || r.userId === currentUser?.uid)
                );
                return (
                  <IconButton
                    key={emoji}
                    size="small"
                    onClick={() => {
                      onReaction(emoji, selectedMsg);
                      onClose();
                    }}
                    sx={{
                      fontSize: "1.25rem",
                      p: 0.6,
                      borderRadius: "50%",
                      bgcolor: isSelected
                        ? isDark
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(25, 25, 25, 0.09)"
                        : "transparent",
                      outline: isSelected
                        ? `0px solid ${isDark ? "#00b7ff" : "#0288d1"}`
                        : "none",
                      transform: isSelected ? "scale(1.15)" : "scale(1)",
                      transition: "all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      "&:hover": {
                        transform: isSelected ? "scale(1.25) translateY(-2px)" : "scale(1.35) translateY(-2px)",
                        bgcolor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
                      },
                      "&:active": {
                        transform: "scale(1.1)",
                      },
                    }}
                  >
                    {emoji}
                  </IconButton>
                );
              })}
              <IconButton
                size="small"
                onClick={() => {
                  onOpenEmojiPicker(selectedMsg);
                  onClose();
                }}
                sx={{
                  p: 0.6,
                  color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                  "&:hover": { color: "#ffffff" },
                }}
                title="More Reactions"
              >
                <AddIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>

            {/* Action Menu Items List */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.4,
                width: 220,
              }}
            >
              {(() => {
                const isForwardRestricted = (selectedMsg.forwardCount || 0) >= 15;
                const canEdit = isOwn && Boolean(selectedMsg.text) && isMessageEditable(selectedMsg);

                const menuItemStyle = {
                  borderRadius: 6,
                  py: 0.9,
                  px: 1,
                  gap: 1.4,
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  transition: "all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  "&:hover": {
                    bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                    transform: "translateX(5px)",
                    "& .menu-icon": {
                      transform: "scale(1.18) rotate(3deg)",
                    },
                  },
                  "& .menu-icon": {
                    transition: "transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  },
                };

                return (
                  <>
                    <MenuItem
                      onClick={() => {
                        onReply(selectedMsg);
                        onClose();
                      }}
                      sx={menuItemStyle}
                    >
                      <ReplyIcon className="menu-icon" sx={{ fontSize: 19, color: isDark ? "#dfdfdf" : "#242424" }} />
                      Reply
                    </MenuItem>

                    <MenuItem
                      disabled={isForwardRestricted}
                      onClick={() => {
                        if (isForwardRestricted) return;
                        onForward(selectedMsg);
                        onClose();
                      }}
                      sx={{
                        ...menuItemStyle,
                        opacity: isForwardRestricted ? 0.55 : 1,
                        cursor: isForwardRestricted ? "not-allowed" : "pointer",
                      }}
                    >
                      <ShortcutRoundedIcon
                        className="menu-icon"
                        sx={{ fontSize: 19, color: isForwardRestricted ? "#888" : isDark ? "#dfdfdf" : "#242424" }}
                      />
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <span>Forward Message</span>
                        {isForwardRestricted && (
                          <Typography variant="caption" sx={{ fontSize: "0.68rem", color: "#ff9800", fontWeight: 700 }}>
                            Forward limit reached (15+ times)
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>

                    <MenuItem
                      onClick={() => {
                        onShareExternal(selectedMsg);
                        onClose();
                      }}
                      sx={menuItemStyle}
                    >
                      <IosShareRoundedIcon className="menu-icon" sx={{ fontSize: 19, color: isDark ? "#dfdfdf" : "#242424" }} />
                      Share to Apps...
                    </MenuItem>

                    {selectedMsg.text && (
                      <MenuItem
                        onClick={handleCopyText}
                        sx={menuItemStyle}
                      >
                        <CopyIcon className="menu-icon" sx={{ fontSize: 19, color: isDark ? "#aaa" : "#555" }} />
                        Copy Text
                      </MenuItem>
                    )}

                    <MenuItem
                      onClick={() => setViewMode("info")}
                      sx={menuItemStyle}
                    >
                      <InfoOutlinedIcon className="menu-icon" sx={{ fontSize: 19, color: isDark ? "#dfdfdf" : "#242424" }} />
                      Message Info
                    </MenuItem>

                    <MenuItem
                      onClick={() => {
                        onPinMessage(selectedMsg);
                        onClose();
                      }}
                      sx={menuItemStyle}
                    >
                      <PushPinIcon
                        className="menu-icon"
                        sx={{ fontSize: 19, color: isPinned ? "#ff9800" : isDark ? "#aaa" : "#555" }}
                      />
                      {isPinned ? "Unpin Message" : "Pin Message"}
                    </MenuItem>

                    <MenuItem
                      onClick={() => {
                        onEnterSelectionMode(selectedMsg);
                        onClose();
                      }}
                      sx={menuItemStyle}
                    >
                      <CheckCircleOutlineRoundedIcon className="menu-icon" sx={{ fontSize: 19, color: isDark ? "#dfdfdf" : "#242424" }} />
                      Select Messages
                    </MenuItem>

                    {canEdit && (
                      <MenuItem
                        onClick={() => {
                          onEdit(selectedMsg);
                          onClose();
                        }}
                        sx={menuItemStyle}
                      >
                        <EditIcon className="menu-icon" sx={{ fontSize: 19, color: isDark ? "#dfdfdf" : "#242424" }} />
                        Edit Message
                      </MenuItem>
                    )}

                    {isOwn && (
                      <MenuItem
                        onClick={() => {
                          onDelete(selectedMsg.id);
                          onClose();
                        }}
                        sx={{
                          ...menuItemStyle,
                          color: "#ff5252",
                          "&:hover": {
                            bgcolor: "rgba(255, 82, 82, 0.12)",
                            transform: "translateX(5px)",
                            "& .menu-icon": {
                              transform: "scale(1.18) rotate(3deg)",
                            },
                          },
                        }}
                      >
                        <DeleteIcon className="menu-icon" sx={{ fontSize: 19, color: "#ff5252" }} />
                        Delete Message
                      </MenuItem>
                    )}
                  </>
                );
              })()}
            </Box>
          </Box>
        </Box>
      )}
    </Menu>
  );
};

export default React.memo(MessageActionsMenu);