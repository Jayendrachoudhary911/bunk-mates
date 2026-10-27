import React, { useRef, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  AvatarGroup,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CallRoundedIcon from "@mui/icons-material/CallRounded";
import PhoneMissedIcon from "@mui/icons-material/PhoneMissed";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import UncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import LooksOneRoundedIcon from "@mui/icons-material/LooksOneRounded";
import ShortcutRoundedIcon from "@mui/icons-material/ShortcutRounded";
import AddReactionOutlinedIcon from "@mui/icons-material/AddReactionOutlined";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import ChatReactionPopup from "../chats_components/ChatReactionPopup";
import { motion } from "framer-motion";
import { formatMessageTime } from "../../utils/chatCache";
import { safeImageUrl } from "../../utils/uiHelpers";
import { useCall } from "../../contexts/CallContext";
import LinkPreviewCard from "../chats_components/LinkPreviewCard";
import ChatBudgetCard from "../chats_components/ChatBudgetCard";
import ChatExpensesCard from "../chats_components/ChatExpensesCard";
import ChatUserProfileCard from "../chats_components/ChatUserProfileCard";
import ChatTripPreviewCard from "../chats_components/ChatTripPreviewCard";
import ChatPlacePreviewCard from "../chats_components/ChatPlacePreviewCard";
import ChatNotePreviewCard from "../chats_components/ChatNotePreviewCard";
import ChatChecklistCard from "../chats_components/ChatChecklistCard";
import ChatTimelineCard from "../chats_components/ChatTimelineCard";
import FormattedMessageText from "../chats_components/FormattedMessageText";
import { extractUrls, isEmojiOnly } from "../../utils/chatHelpers";

const GroupMessageItem = ({
  msg,
  isOwn,
  borderRadius,
  showTimestamp,
  effectiveChatTheme = "dark",
  currentUser,
  memberInfo = {},
  groupInfo = null,
  timeline = [],
  onReply,
  onForward,
  onImageClick,
  onOpenReactions,
  onReaction,
  onAddReaction,
  onContextMenu,
  onScrollToMessage,
  onVotePoll,
  onToggleChecklist,
  isHighlighted,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect = null,
  onShareCard = null,
}) => {
  const isDark = effectiveChatTheme === "dark";
  const { startCall } = useCall();
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const bubbleRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [reactionPopup, setReactionPopup] = useState({ open: false, coords: null });

  // 1. Grouped reactions
  const reactionCounts = React.useMemo(() => {
    if (!Array.isArray(msg.reactions) || msg.reactions.length === 0) return null;
    const counts = {};
    msg.reactions.forEach((r) => {
      if (r?.emoji) {
        counts[r.emoji] = (counts[r.emoji] || 0) + 1;
      }
    });
    return Object.keys(counts).length > 0 ? counts : null;
  }, [msg.reactions]);

  // Current user's reactions on this message
  const currentUserReactions = React.useMemo(() => {
    if (!Array.isArray(msg.reactions) || !currentUser?.uid) return [];
    return msg.reactions
      .filter((r) => r && (r.user === currentUser.uid || r.userId === currentUser.uid))
      .map((r) => r.emoji)
      .filter(Boolean);
  }, [msg.reactions, currentUser?.uid]);

  // 2. Identify message type
  const isSystem =
    msg.type === "system" ||
    msg.senderId === "system" ||
    msg.isSystem ||
    msg.system === true ||
    msg.type === "notification";

  const isCall =
    msg.type === "call" ||
    msg.type === "video_call" ||
    msg.type === "voice_call" ||
    msg.type === "missed_call" ||
    Boolean(msg.callType) ||
    Boolean(msg.cardData?.type === "call") ||
    (typeof msg.text === "string" &&
      (msg.text.toLowerCase().includes("missed call") ||
        msg.text.toLowerCase().includes("call ended") ||
        msg.text.toLowerCase().includes("started a call") ||
        msg.text.toLowerCase().includes("voice call") ||
        msg.text.toLowerCase().includes("video call")));

  const isPoll = msg.type === "poll" && msg.cardData;
  const isChecklist = (msg.type === "checklist" || msg.type === "trip_checklist") && msg.cardData;
  const isTimeline = (msg.type === "timeline" || msg.type === "trip_timeline") && msg.cardData;
  const isBudget = msg.type === "budget" && msg.cardData;
  const isExpense = msg.type === "expenses" && msg.cardData;
  const isUserProfile = msg.type === "user_profile" && msg.cardData;
  const isTripPreview =
    (msg.type === "trip_preview" || msg.type === "trip_share" || msg.cardData?.type === "trip_preview") &&
    msg.cardData;
  const isPlacePreview =
    (msg.type === "place_preview" || msg.type === "place_share" || msg.cardData?.type === "place_preview") &&
    msg.cardData;
  const isNotePreview =
    (msg.type === "note_preview" || msg.type === "note_share" || msg.cardData?.type === "note_preview") &&
    msg.cardData;
  const isAiPlaces = msg.type === "ai_places" && msg.cardData;
  const isAiAssistant = msg.type === "ai_assistant" && msg.cardData;

  const isStructuredCard = Boolean(
    isPoll ||
    isChecklist ||
    isTimeline ||
    isBudget ||
    isExpense ||
    isUserProfile ||
    isTripPreview ||
    isPlacePreview ||
    isNotePreview ||
    isAiPlaces ||
    isAiAssistant ||
    isCall
  );

  // Security permit for trip budget
  const isBudgetAllowed = React.useMemo(() => {
    if (!isBudget) return false;
    const allowed = msg.cardData?.allowedMembers;
    if (Array.isArray(allowed) && allowed.length > 0) {
      return (
        allowed.includes(currentUser?.uid) ||
        msg.senderId === currentUser?.uid ||
        groupInfo?.createdBy === currentUser?.uid
      );
    }
    return true;
  }, [isBudget, msg.cardData, currentUser?.uid, msg.senderId, groupInfo?.createdBy]);

  // Security permit for trip detailed expenses
  const isExpensesAllowed = React.useMemo(() => {
    if (!isExpense) return false;
    const allowed = msg.cardData?.allowedMembers;
    if (Array.isArray(allowed) && allowed.length > 0) {
      return (
        allowed.includes(currentUser?.uid) ||
        msg.senderId === currentUser?.uid ||
        groupInfo?.createdBy === currentUser?.uid
      );
    }
    return true;
  }, [isExpense, msg.cardData, currentUser?.uid, msg.senderId, groupInfo?.createdBy]);

  // Detected URLs for link previews
  const detectedUrls = React.useMemo(() => {
    if (typeof msg.text !== "string") return [];
    return extractUrls(msg.text);
  }, [msg.text]);

  // Extract Mentioned Users from text (e.g., @username)
  const mentionedUsers = React.useMemo(() => {
    if (typeof msg.text !== "string") return [];
    const mentionRegex = /@([a-zA-Z0-9_.-]+)/g;
    const matches = [...msg.text.matchAll(mentionRegex)];
    if (matches.length === 0) return [];

    const usernames = matches.map((m) => m[1].toLowerCase());
    const matchedProfiles = [];

    // Search through memberInfo to find matching username or display names
    Object.values(memberInfo || {}).forEach((member) => {
      const uName = (member?.username || "").toLowerCase();
      const dName = (member?.displayName || member?.name || "").toLowerCase();
      if (usernames.some((u) => uName.includes(u) || dName.includes(u))) {
        matchedProfiles.push({
          uid: member.uid || member.id,
          name: member.displayName || member.name || "User",
          photoURL: safeImageUrl(member.photoURL || member.avatar),
        });
      }
    });

    return matchedProfiles;
  }, [msg.text, memberInfo]);

  // 3. Sender profile from Firestore users doc (via memberInfo)
  const senderUser = memberInfo?.[msg.senderId];
  const senderAvatarUrl = safeImageUrl(senderUser?.photoURL || msg.senderPhoto);
  const senderDisplayName =
    senderUser?.displayName || senderUser?.name || msg.senderName || "Member";

  // 4. Determine images for stacked group
  const imagesList = React.useMemo(() => {
    if (Array.isArray(msg.images) && msg.images.length > 0) {
      return msg.images.filter(Boolean);
    }
    if (Array.isArray(msg.imageUrls) && msg.imageUrls.length > 0) {
      return msg.imageUrls.filter(Boolean);
    }
    if (msg.imageUrl || msg.dataUri) {
      return [msg.imageUrl || msg.dataUri];
    }
    return [];
  }, [msg.images, msg.imageUrls, msg.imageUrl, msg.dataUri]);

  const hasImages = imagesList.length > 0;
  const isViewOnceMedia = Boolean(msg.viewOnce && hasImages);
  const hasDefaultActionButtons = hasImages || isCall || isStructuredCard || isTimeline || isChecklist;

  // 5. Detect if message contains only emojis
  const isEmoji =
    !hasImages &&
    !isStructuredCard &&
    !isCall &&
    !msg.replyTo &&
    isEmojiOnly(msg.text);

  // Touch and interaction handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const deltaX = touchCurrentX.current - touchStartX.current;
    if (deltaX > 60) {
      onReply(msg);
    }
    touchStartX.current = 0;
    touchCurrentX.current = 0;
  };

  const handleTouchMove = (e) => {
    touchCurrentX.current = e.touches[0].clientX;
  };

  const getReplyContentType = (replyTo) => {
    if (!replyTo) return "text";
    const replyImages = Array.isArray(replyTo.images)
      ? replyTo.images.filter(Boolean)
      : Array.isArray(replyTo.imageUrls)
      ? replyTo.imageUrls.filter(Boolean)
      : [replyTo.imageUrl || replyTo.dataUri].filter(Boolean);

    if (replyImages.length > 0) return "photo";
    if (replyTo.text && isEmojiOnly(replyTo.text)) return "emoji";
    if (replyTo.type === "trip_preview" || replyTo.type === "trip_share" || replyTo.cardData?.destination) return "trip";
    if (replyTo.type === "place_preview" || replyTo.type === "place_share" || replyTo.cardData?.placeName || replyTo.cardData?.name) return "place";
    if (replyTo.type === "checklist" || replyTo.type === "trip_checklist") return "checklist";
    if (replyTo.type === "timeline" || replyTo.type === "trip_timeline") return "timeline";
    if (replyTo.type === "user_profile" || replyTo.cardData?.type === "user_profile") return "profile";
    if (replyTo.type === "budget" || replyTo.cardData?.type === "budget") return "budget";
    if (replyTo.type === "expenses" || replyTo.cardData?.type === "expenses") return "expenses";
    if (replyTo.type === "note_preview" || replyTo.type === "note_share") return "note";

    return "text";
  };

  // ─── A. Centered System Message ───
  if (isSystem) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          my: 1.2,
          px: 2,
        }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.8,
            px: 1.8,
            py: 0.6,
            borderRadius: "20px",
            bgcolor: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.06)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            maxWidth: "85%",
            textAlign: "center",
            boxShadow: "none",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.76rem",
              fontWeight: 500,
              color: isDark ? "rgba(255, 255, 255, 0.78)" : "rgba(0, 0, 0, 0.68)",
              wordBreak: "break-word",
            }}
          >
            {msg.text || msg.content || "System update"}
          </Typography>
        </Box>
      </Box>
    );
  }

  // ─── Call Handler ───
  const isVideoCall =
    msg.type === "video_call" ||
    msg.callType === "video" ||
    (typeof msg.text === "string" && msg.text.toLowerCase().includes("video"));

  const isMissed =
    msg.type === "missed_call" ||
    (typeof msg.text === "string" && msg.text.toLowerCase().includes("missed"));

  const handleStartCall = (e, mode = "audio") => {
    e.stopPropagation();
    if (!startCall) return;
    const gName = groupInfo?.name || groupInfo?.id || "Group Call";
    startCall(
      {
        id: groupInfo?.id || msg.senderId || "group",
        uid: groupInfo?.id || msg.senderId || "group",
        name: gName,
        photoURL: safeImageUrl(groupInfo?.iconURL) || "",
        isGroup: true,
      },
      mode
    );
  };

  // ─── View Once Widget Renderer ───
  const renderViewOnceWidget = () => {
    if (!isViewOnceMedia) return null;
    const isAlreadyOpened = Boolean(msg.viewedOnce);
    return (
      <Box
        onClick={(e) => {
          e.stopPropagation();
          if (!isAlreadyOpened && onImageClick) {
            onImageClick(imagesList[0], imagesList, { isViewOnce: true, msgId: msg.id });
          }
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 1.5,
          py: 1.2,
          my: 0.2,
          width: "fit-content",
          minWidth: { xs: 180, sm: 200 },
          maxWidth: "100%",
          boxSizing: "border-box",
          borderRadius: 5,
          bgcolor: isAlreadyOpened
            ? (isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)")
            : isDark ? "rgba(0, 183, 255, 0.12)" : "rgba(0, 122, 255, 0.08)",
          border: `1px solid ${
            isAlreadyOpened
              ? (isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)")
              : (isDark ? "rgba(0, 183, 255, 0.35)" : "rgba(0, 122, 255, 0.25)")
          }`,
          cursor: isAlreadyOpened ? "default" : "pointer",
          transition: "all 200ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          "&:hover": isAlreadyOpened ? {} : { bgcolor: isDark ? "rgba(0, 183, 255, 0.2)" : "rgba(0, 122, 255, 0.14)", transform: "scale(1.01)" },
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: isAlreadyOpened ? (isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)") : "#007aff",
            color: isAlreadyOpened ? (isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)") : "#fff",
            flexShrink: 0,
          }}
        >
          {isAlreadyOpened ? <CheckCircleRoundedIcon sx={{ fontSize: 22 }} /> : <LooksOneRoundedIcon sx={{ fontSize: 22 }} />}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: isAlreadyOpened ? (isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(0, 0, 0, 0.45)") : (isDark ? "#fff" : "#1c1c1e") }}>
            {isAlreadyOpened ? "Photo • Opened" : "Photo • View once"}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: "0.76rem", color: isAlreadyOpened ? (isDark ? "rgba(255, 255, 255, 0.35)" : "rgba(0, 0, 0, 0.35)") : (isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.65)"), display: "block", mt: 0.2 }}>
            {isAlreadyOpened ? "This photo has expired" : "Tap to open photo"}
          </Typography>
        </Box>
      </Box>
    );
  };

  // ─── Stacked Image Group Renderer ───
  const renderStackedImages = () => {
    if (!hasImages || isViewOnceMedia) return null;

    if (imagesList.length === 1) {
      return (
        <Box
          component="img"
          src={imagesList[0]}
          alt="group media"
          onClick={(e) => { e.stopPropagation(); onImageClick(imagesList[0], imagesList); }}
          sx={{ width: "100%", maxWidth: 320, maxHeight: 320, borderRadius: "14px", objectFit: "cover", display: "block", cursor: "zoom-in" }}
        />
      );
    }

    if (imagesList.length === 2) {
      return (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", width: "100%", maxWidth: 320, borderRadius: "14px", overflow: "hidden" }}>
          {imagesList.map((img, idx) => (
            <Box key={idx} component="img" src={img} alt={`group media ${idx}`} onClick={(e) => { e.stopPropagation(); onImageClick(img, imagesList); }} sx={{ width: "100%", height: 150, objectFit: "cover", display: "block", cursor: "zoom-in" }} />
          ))}
        </Box>
      );
    }

    if (imagesList.length === 3) {
      return (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", width: "100%", maxWidth: 320, borderRadius: "14px", overflow: "hidden" }}>
          <Box component="img" src={imagesList[0]} alt="group media 0" onClick={(e) => { e.stopPropagation(); onImageClick(imagesList[0], imagesList); }} sx={{ gridColumn: "1 / -1", width: "100%", height: 140, objectFit: "cover", display: "block", cursor: "zoom-in" }} />
          {imagesList.slice(1, 3).map((img, idx) => (
            <Box key={idx} component="img" src={img} alt={`group media ${idx + 1}`} onClick={(e) => { e.stopPropagation(); onImageClick(img, imagesList); }} sx={{ width: "100%", height: 110, objectFit: "cover", display: "block", cursor: "zoom-in" }} />
          ))}
        </Box>
      );
    }

    const displayList = imagesList.slice(0, 4);
    const extraCount = imagesList.length - 4;

    return (
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", width: "100%", maxWidth: 320, borderRadius: "14px", overflow: "hidden" }}>
        {displayList.map((img, idx) => {
          const isFourth = idx === 3;
          return (
            <Box key={idx} sx={{ position: "relative", width: "100%", height: 115, overflow: "hidden", cursor: "zoom-in" }} onClick={(e) => { e.stopPropagation(); onImageClick(img, imagesList); }}>
              <Box component="img" src={img} alt={`group media ${idx}`} sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              {isFourth && extraCount > 0 && (
                <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0, 0, 0, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1.25rem" }}>
                  +{extraCount}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  const renderDetachedReactions = () => {
    if (!reactionCounts) return null;
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 0.5,
          mt: "-5px",
          mb: 0.1,
          zIndex: 2,
          px: 0.6,
          alignSelf: isOwn ? "flex-end" : "flex-start",
          pointerEvents: "auto",
        }}
      >
        <Box
          onClick={(e) => {
            e.stopPropagation();
            onOpenReactions?.(msg);
          }}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.3,
            p: "2px 2px",
            borderRadius: "16px",
            backgroundImage: "none",
            bgcolor: isDark ? "rgba(35, 35, 35, 0.44)" : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            border: `1px solid ${isDark ? "#0c0c0c86" : "#0c0c0c0d"}`,
            boxShadow: "none",
            cursor: "pointer",
            transition: "transform 150ms ease, box-shadow 150ms ease",
            "&:hover": {
              transform: "scale(1.03)",
              boxShadow: isDark
                ? "0 4px 12px rgba(0, 0, 0, 0.55)"
                : "0 4px 12px rgba(0, 0, 0, 0.15)",
            },
          }}
          title="View reactions"
        >
          {Object.entries(reactionCounts).map(([emoji, count]) => {
            const userReacted =
              Array.isArray(msg.reactions) &&
              msg.reactions.some(
                (r) => r.emoji === emoji && (r.user === currentUser?.uid || r.userId === currentUser?.uid)
              );
            return (
              <Box
                key={emoji}
                component="button"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenReactions?.(msg);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenReactions?.(msg);
                }}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.4,
                  px: 0.2,
                  py: 0.35,
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "0.8rem",
                  lineHeight: 1.1,
                  bgcolor: userReacted
                    ? isDark
                      ? "rgba(233, 233, 233, 0.2)"
                      : "rgba(87, 87, 87, 0.12)"
                    : "transparent",
                  color: userReacted
                    ? isDark
                      ? "#4fc3f7"
                      : "#0288d1"
                    : isDark
                    ? "#f0f0f0"
                    : "#222",
                  outline: "none",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    transform: "scale(1.1)",
                    bgcolor: isDark
                      ? "rgba(255, 255, 255, 0.12)"
                      : "rgba(0, 0, 0, 0.06)",
                  },
                  "&:active": {
                    transform: "scale(0.95)",
                  },
                }}
                title={
                  userReacted
                    ? `You reacted with ${emoji} (tap to view reactions)`
                    : `${count} reacted with ${emoji} (tap to view reactions)`
                }
              >
                <span>{emoji}</span>
                {count > 1 && (
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "0.72rem",
                      opacity: userReacted ? 1 : 0.8,
                    }}
                  >
                    {count}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  return (
    <motion.div
      layout="position"
      id={`msg-${msg.id}`}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        backgroundColor: isHighlighted
          ? "rgba(0, 183, 255, 0.15)"
          : isSelected
          ? "rgba(0, 183, 255, 0.1)"
          : "transparent",
      }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: isOwn ? "flex-end" : "flex-start",
        alignItems: "center",
        margin: "2px 0",
        padding: "0 10px",
        borderRadius: "14px",
        cursor: isSelectionMode ? "pointer" : "default",
      }}
      onClick={(e) => {
        if (isSelectionMode) {
          e.preventDefault();
          e.stopPropagation();
          onToggleSelect?.(msg.id, msg);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => {
        if (isSelectionMode) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        onContextMenu(e, msg, bubbleRef.current || e.currentTarget);
      }}
    >
      {/* Selection Mode Checkbox */}
      {isSelectionMode && (
        <Box
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.(msg.id, msg);
          }}
          sx={{
            cursor: "pointer",
            p: 0.5,
            order: isOwn ? 2 : -1,
            ml: isOwn ? 1 : 0,
            mr: isOwn ? 0 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isSelected ? (
            <CheckCircleRoundedIcon sx={{ fontSize: 24, color: "#00b7ff" }} />
          ) : (
            <RadioButtonUncheckedRoundedIcon
              sx={{
                fontSize: 24,
                color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)",
              }}
            />
          )}
        </Box>
      )}

      {/* Sender Avatar for incoming group messages (position unchanged) */}
      {!isOwn && (
        <Avatar
          src={senderAvatarUrl}
          alt={senderDisplayName}
          sx={{
            width: 28,
            height: 28,
            fontSize: "0.75rem",
            bgcolor: "#333",
            mr: 1,
            alignSelf: "flex-end",
            mb: 0.5,
            border: `1.5px solid ${
              isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"
            }`,
          }}
        >
          {senderDisplayName?.[0] || "?"}
        </Avatar>
      )}

      {/* Action Toolbar on Hover */}
      {!isSelectionMode && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.2,
            mr: isOwn ? 1 : 0,
            ml: isOwn ? 0 : 1,
            order: isOwn ? -1 : 2,
            opacity: isHovered || hasDefaultActionButtons ? 1 : 0,
            pointerEvents: isHovered || hasDefaultActionButtons ? "auto" : "none",
            transition: "opacity 150ms ease",
          }}
        >
          <Tooltip title="Reply">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onReply(msg);
              }}
              sx={{
                bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgb(255, 255, 255)",
                color: isDark ? "#ffffffa1" : "#767676",
                padding: "6px",
              }}
            >
              <ReplyRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Add Reaction">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setReactionPopup({
                  open: true,
                  coords: {
                    top: rect.top,
                    bottom: rect.bottom,
                    left: rect.left,
                    right: rect.right,
                    width: rect.width,
                    height: rect.height,
                  },
                });
              }}
              sx={{
                bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgb(255, 255, 255)",
                color: isDark ? "#ffffffa1" : "#767676",
                padding: "6px",
              }}
            >
              <AddReactionOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          {isHovered && (
            <>
              <Tooltip title="Forward">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onForward?.(msg);
                  }}
                  sx={{
                    bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgb(255, 255, 255)",
                    color: isDark ? "#ffffffa1" : "#767676",
                    padding: "6px",
                  }}
                >
                  <ShortcutRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="More options">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onContextMenu(e, msg, bubbleRef.current || e.currentTarget);
                  }}
                  sx={{
                    bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgb(255, 255, 255)",
                    color: isDark ? "#ffffffa1" : "#767676",
                    padding: "6px",
                  }}
                >
                  <MoreVertRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      )}

      {/* Embedded Reaction Popup component */}
      <ChatReactionPopup
        open={reactionPopup.open}
        anchorPosition={reactionPopup.coords}
        userReactions={currentUserReactions}
        isDark={isDark}
        onSelectEmoji={(emoji) => {
          if (onReaction) {
            onReaction(emoji, msg);
          } else if (onAddReaction) {
            onAddReaction(emoji, msg);
          } else if (onOpenReactions) {
            onOpenReactions(msg, emoji);
          }
        }}
        onClose={() => setReactionPopup({ open: false, coords: null })}
      />

      <Box sx={{ display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start", maxWidth: "100%" }}>
        {/* Sender name label for incoming message */}
        {!isOwn && (
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              fontSize: "0.72rem",
              color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
              ml: 1,
              mb: 0.3,
            }}
          >
            {senderDisplayName}
          </Typography>
        )}

        {/* Small Profile Card Widget above message bubble if mentioned */}
        {mentionedUsers.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.4,
              mb: 0.6,
              width: "100%",
            }}
          >
            {mentionedUsers.map((user) => (
              <Box
                key={user.uid}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.2,
                  py: 0.5,
                  borderRadius: "12px",
                  bgcolor: isDark ? "rgba(0, 183, 255, 0.12)" : "rgba(0, 122, 255, 0.08)",
                  border: `1px solid ${isDark ? "rgba(0, 183, 255, 0.25)" : "rgba(0, 122, 255, 0.2)"}`,
                  width: "fit-content",
                }}
              >
                <Avatar
                  src={user.photoURL}
                  alt={user.name}
                  sx={{ width: 22, height: 22, fontSize: "0.65rem" }}
                >
                  {user.name?.[0] || "U"}
                </Avatar>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    color: isDark ? "#4fc3f7" : "#0288d1",
                  }}
                >
                  @{user.name}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* View Once or Stacked Images */}
        {isViewOnceMedia && renderViewOnceWidget()}
        {!isViewOnceMedia && hasImages && renderStackedImages()}

        {/* Reply Preview */}
        {msg.replyTo && (() => {
          const contentType = getReplyContentType(msg.replyTo);
          const isComplexReply = contentType !== "text";

          return (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start", mb: 0.5, maxWidth: { xs: "88%", sm: "75%" }, width: "100%" }}>
              {!isComplexReply && (
                <Box
                  onClick={(e) => { e.stopPropagation(); if (msg.replyTo.id) onScrollToMessage(msg.replyTo.id); }}
                  sx={{ p: "6px 10px", borderRadius: 4, bgcolor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)", borderLeft: `0px solid ${isOwn ? "#00b7ff" : "#007aff"}`, fontSize: "0.8rem", cursor: "pointer", width: "fit-content", backdropFilter: "blur(10px)", opacity: 0.7 }}
                >
                  <Typography variant="caption" noWrap sx={{ opacity: 0.9, display: "block", fontSize: "0.8rem", color: isDark ? "rgba(255, 255, 255, 0.71)" : "rgba(0, 0, 0, 0.51)" }}>
                    {msg.replyTo.text || "Message"}
                  </Typography>
                </Box>
              )}

              {isComplexReply && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, width: "100%", opacity: 0.6 }}>
                  <Box onClick={(e) => { e.stopPropagation(); if (msg.replyTo.id) onScrollToMessage(msg.replyTo.id); }} sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 0.8, py: 0.3, cursor: "pointer", minWidth: "fit-content" }}>
                    <ShortcutRoundedIcon sx={{ fontSize: 13, color: isDark ? "rgba(255, 255, 255, 0.71)" : "rgba(0, 0, 0, 0.51)", transform: "scaleX(-1)" }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.75rem", color: isDark ? "rgba(255, 255, 255, 0.71)" : "rgba(0, 0, 0, 0.51)" }}>
                      Replying to {msg.replyTo.senderId === currentUser?.uid ? "yourself" : "friend"}
                    </Typography>
                  </Box>

                  {contentType === "emoji" && (
                    <Box onClick={(e) => { e.stopPropagation(); if (msg.replyTo.id) onScrollToMessage(msg.replyTo.id); }} sx={{ cursor: "pointer", width: "fit-content", py: 0.2 }}>
                      <Typography sx={{ fontSize: "2rem", lineHeight: 1.2 }}>{msg.replyTo.text}</Typography>
                    </Box>
                  )}

                  {contentType === "photo" && (() => {
                    const replyImages = Array.isArray(msg.replyTo.images) ? msg.replyTo.images.filter(Boolean) : [msg.replyTo.imageUrl || msg.replyTo.dataUri].filter(Boolean);
                    return (
                      <Box
                        onClick={(e) => { e.stopPropagation(); if (onImageClick && replyImages[0]) onImageClick(replyImages[0], replyImages); }}
                        component="img"
                        src={replyImages[0]}
                        alt="reply preview"
                        sx={{ width: "100%", maxWidth: 240, maxHeight: 180, borderRadius: "12px", objectFit: "cover", cursor: "pointer", border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}` }}
                      />
                    );
                  })()}

                  {contentType === "trip" && <Box sx={{ width: "100%", maxWidth: 300, pointerEvents: "none" }}><ChatTripPreviewCard cardData={msg.replyTo.cardData} currentUser={currentUser} isDark={isDark} /></Box>}
                  {contentType === "place" && <Box sx={{ width: "100%", maxWidth: 300, pointerEvents: "none" }}><ChatPlacePreviewCard cardData={msg.replyTo.cardData} currentUser={currentUser} isDark={isDark} /></Box>}
                  {contentType === "checklist" && <Box sx={{ width: "100%", maxWidth: 300, pointerEvents: "none" }}><ChatChecklistCard cardData={msg.replyTo.cardData} currentUser={currentUser} isDark={isDark} messageId={msg.replyTo.id} /></Box>}
                  {contentType === "timeline" && <Box sx={{ width: "100%", maxWidth: 300, pointerEvents: "none" }}><ChatTimelineCard cardData={msg.replyTo.cardData} timeline={timeline} isDark={isDark} /></Box>}
                  {contentType === "profile" && <Box sx={{ width: "100%", maxWidth: 300, pointerEvents: "none" }}><ChatUserProfileCard cardData={msg.replyTo.cardData} currentUser={currentUser} isDark={isDark} /></Box>}
                  {contentType === "budget" && <Box sx={{ width: "100%", maxWidth: 300, pointerEvents: "none" }}><ChatBudgetCard cardData={msg.replyTo.cardData} currentUser={currentUser} isBudgetAllowed={true} isDark={isDark} messageId={msg.replyTo.id} /></Box>}
                  {contentType === "expenses" && <Box sx={{ width: "100%", maxWidth: 300, pointerEvents: "none" }}><ChatExpensesCard cardData={msg.replyTo.cardData} currentUser={currentUser} isExpensesAllowed={true} isDark={isDark} messageId={msg.replyTo.id} /></Box>}
                  {contentType === "note" && <Box sx={{ width: "100%", maxWidth: 300, pointerEvents: "none" }}><ChatNotePreviewCard cardData={msg.replyTo.cardData} currentUser={currentUser} isDark={isDark} /></Box>}
                </Box>
              )}
            </Box>
          );
        })()}

        {/* Link Previews */}
        {detectedUrls.length > 0 && (
          <Box sx={{ mb: 1, display: "flex", flexDirection: "column", gap: 1, width: "100%", maxWidth: { xs: "88%", sm: "75%" } }}>
            {detectedUrls.map((url) => (
              <LinkPreviewCard key={url} url={url} isDark={isDark} />
            ))}
          </Box>
        )}

        {/* Emoji Only Message */}
        {isEmoji ? (
          <Box
            ref={bubbleRef}
            onContextMenu={(e) => {
              if (isSelectionMode) { e.preventDefault(); return; }
              e.preventDefault();
              e.stopPropagation();
              onContextMenu(e, msg, bubbleRef.current || e.currentTarget);
            }}
            onClick={(e) => {
              if (isSelectionMode) {
                e.preventDefault();
                e.stopPropagation();
                onToggleSelect?.(msg.id, msg);
                return;
              }
              if (e.detail === 2) {
                onReply(msg);
              }
            }}
            sx={{
              width: "fit-content",
              cursor: "pointer",
              py: 0.5,
              userSelect: "none",
              transition: "transform 150ms ease",
              "&:active": { transform: "scale(1.08)" },
            }}
          >
            <Typography sx={{ fontSize: "2.8rem", lineHeight: 1.2 }}>
              {msg.text}
            </Typography>
          </Box>
        ) : isCall ? (
          /* Standalone Call Card */
          <Box
            ref={bubbleRef}
            onContextMenu={(e) => {
              if (isSelectionMode) { e.preventDefault(); return; }
              e.preventDefault();
              e.stopPropagation();
              onContextMenu(e, msg, bubbleRef.current || e.currentTarget);
            }}
            onClick={(e) => handleStartCall(e, isVideoCall ? "video" : "audio")}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              minWidth: { xs: 160, sm: 160 },
              p: 1.2,
              borderRadius: 8,
              bgcolor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgb(255, 255, 255)",
              border: "0px solid",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isMissed
                    ? "rgba(244, 67, 54, 0.12)"
                    : isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.06)",
                  color: isMissed ? "#f44336" : isDark ? "#e0e0e0" : "#303030",
                  flexShrink: 0,
                }}
              >
                {isMissed ? (
                  <PhoneMissedIcon sx={{ fontSize: 22 }} />
                ) : isVideoCall ? (
                  <VideocamRoundedIcon sx={{ fontSize: 22 }} />
                ) : (
                  <CallRoundedIcon sx={{ fontSize: 20 }} />
                )}
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: isDark ? "#fff" : "#1c1c1e",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {isMissed ? "Missed Call" : isVideoCall ? "Video Call" : "Voice Call"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    opacity: 0.7,
                    fontSize: "0.76rem",
                    display: "block",
                    mt: 0.2,
                    color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                  }}
                >
                  {msg.duration
                    ? `Duration: ${msg.duration}s`
                    : isMissed
                    ? "Tap to call back"
                    : "Call ended"}
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : (
          /* Regular Message Bubble */
          (!hasImages || isStructuredCard || msg.text) && (!hasImages || isStructuredCard) && (
            <Paper
              ref={bubbleRef}
              elevation={0}
              onContextMenu={(e) => {
                if (isSelectionMode) { e.preventDefault(); return; }
                e.preventDefault();
                e.stopPropagation();
                onContextMenu(e, msg, bubbleRef.current || e.currentTarget);
              }}
              sx={{
                width: "fit-content",
                minWidth: isStructuredCard ? { xs: "100%", sm: 340 } : "fit-content",
                maxWidth: isStructuredCard ? { xs: "98%", sm: "88%", md: "78%" } : { xs: "88%", sm: "75%" },
                boxSizing: "border-box",
                borderRadius: borderRadius || (isOwn ? "20px 20px 4px 20px" : "20px 20px 20px 4px"),
                bgcolor: isStructuredCard ? "transparent" : isOwn ? (isDark ? "#305ae4" : "#c8d6ec") : (isDark ? "rgba(40, 40, 40, 0.75)" : "rgb(255, 255, 255)"),
                color: isOwn ? (isDark ? "#fff" : "#1c1c1e") : (isDark ? "#fff" : "#1c1c1e"),
                backdropFilter: isStructuredCard ? "none" : "blur(20px)",
                WebkitBackdropFilter: isStructuredCard ? "none" : "blur(20px)",
                boxShadow: isStructuredCard ? "none" : (isOwn ? (isDark ? "inset 0 1px 1px rgba(255, 255, 255, 0.25)" : "inset 0 1px 3px rgba(255, 255, 255, 0.9)") : (isDark ? "inset 0 1px 1px rgba(255, 255, 255, 0.13)" : "inset 0 1px 3px rgba(255, 255, 255, 0.9)")),
                border: isStructuredCard ? "none" : (isOwn ? "none" : `0px solid ${isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)"}`),
                p: isStructuredCard ? 0 : "10px 14px",
                position: "relative",
                cursor: "pointer",
                userSelect: "text",
              }}
              onClick={(e) => {
                if (isSelectionMode) {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleSelect?.(msg.id, msg);
                  return;
                }
                if (e.detail === 2) {
                  onReply(msg);
                }
              }}
            >
              {/* Forwarded Header Tag */}
              {msg.forwarded && (
                <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5, fontStyle: "italic", fontSize: "0.72rem", color: isOwn ? (isDark ? "#b9b9b9" : "#727272") : (isDark ? "#a8a8a8" : "#767676"), mb: 0.5 }}>
                  <ShortcutRoundedIcon sx={{ fontSize: 13 }} /> Forwarded
                </Typography>
              )}

              {/* Text Content */}
              {msg.text && (
                <Box sx={{ width: "100%", boxSizing: "border-box" }}>
                  <FormattedMessageText text={msg.text} isDark={isDark} hasImages={false} isOwn={isOwn} />
                </Box>
              )}

              {/* Structured Cards */}
              {isBudget && <ChatBudgetCard cardData={msg.cardData} currentUser={currentUser} isBudgetAllowed={isBudgetAllowed} isDark={isDark} messageId={msg.id} chatId={groupInfo?.id || groupInfo?.groupName || groupInfo?.name} onShare={(data) => onShareCard?.("budget", data || msg.cardData)} />}
              {isExpense && <ChatExpensesCard cardData={msg.cardData} currentUser={currentUser} isExpensesAllowed={isExpensesAllowed} isDark={isDark} messageId={msg.id} chatId={groupInfo?.id || groupInfo?.groupName || groupInfo?.name} onShare={(data) => onShareCard?.("expenses", data || msg.cardData)} />}
              {isUserProfile && <ChatUserProfileCard cardData={msg.cardData} currentUser={currentUser} isDark={isDark} onShare={(data) => onShareCard?.("user", data || msg.cardData)} />}
              {isTripPreview && <ChatTripPreviewCard cardData={msg.cardData} currentUser={currentUser} isDark={isDark} onShare={(data) => onShareCard?.("trip", data || msg.cardData)} />}
              {isPlacePreview && <ChatPlacePreviewCard cardData={msg.cardData} currentUser={currentUser} isDark={isDark} onShare={(data) => onShareCard?.("place", data || msg.cardData)} />}
              {isNotePreview && <ChatNotePreviewCard cardData={msg.cardData} currentUser={currentUser} isDark={isDark} onShare={(data) => onShareCard?.("note", data || msg.cardData)} />}
              {isChecklist && <ChatChecklistCard cardData={msg.cardData} currentUser={currentUser} memberInfo={memberInfo} isDark={isDark} onToggleItem={onToggleChecklist} messageId={msg.id} onShare={(data) => onShareCard?.("checklist", data || msg.cardData)} />}
              {isTimeline && <ChatTimelineCard cardData={msg.cardData} timeline={timeline} isDark={isDark} />}

              {/* Poll Card */}
              {isPoll && (
                <Box sx={{ mt: 1, minWidth: { xs: 260, sm: 300 }, maxWidth: 380, width: "100%" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 0.5 }}>
                    📊 {msg.cardData?.question}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6, mb: 1 }}>
                    <Chip size="small" label={msg.cardData?.allowMultiple ? "☑️ Multi-choice" : "🔘 Single-choice"} sx={{ height: 18, fontSize: "0.65rem", bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }} />
                    {msg.cardData?.creatorOnlyResults && <Chip size="small" label="🔒 Creator-only results" sx={{ height: 18, fontSize: "0.65rem", bgcolor: "rgba(255, 152, 0, 0.12)", color: "#ff9800", fontWeight: 600 }} />}
                  </Box>
                  {(() => {
                    const options = msg.cardData?.options || [];
                    const totalVotes = options.reduce((sum, o) => sum + (o.votes?.length || 0), 0);
                    const isCreator = currentUser?.uid === msg.senderId;
                    const hideResults = Boolean(msg.cardData?.creatorOnlyResults && !isCreator);

                    return (
                      <>
                        <Typography variant="caption" sx={{ opacity: 0.65, display: "block", mb: 1.2 }}>
                          {hideResults ? "Votes are hidden (visible only to poll creator)" : `${totalVotes} ${totalVotes === 1 ? "vote" : "votes"} • Tap to vote`}
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
                          {options.map((opt, optIdx) => {
                            const votes = opt.votes || [];
                            const percent = totalVotes > 0 ? Math.round((votes.length / totalVotes) * 100) : 0;
                            const hasVoted = votes.includes(currentUser?.uid);

                            return (
                              <Box
                                key={optIdx}
                                onClick={(e) => { e.stopPropagation(); onVotePoll(msg.id, optIdx); }}
                                sx={{
                                  position: "relative",
                                  borderRadius: "10px",
                                  overflow: "hidden",
                                  border: `1.5px solid ${hasVoted ? (isDark ? "#00b7ff" : "#0288d1") : (isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)")}`,
                                  bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                {!hideResults && (
                                  <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${percent}%`, bgcolor: hasVoted ? (isDark ? "rgba(0, 183, 255, 0.28)" : "rgba(2, 136, 209, 0.2)") : (isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"), zIndex: 0 }} />
                                )}
                                <Box sx={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.5, py: 1, minHeight: 44 }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 0, mr: 1.5 }}>
                                    {hasVoted ? <RadioButtonCheckedIcon sx={{ fontSize: 18, color: isDark ? "#00b7ff" : "#0288d1", flexShrink: 0 }} /> : <UncheckedIcon sx={{ fontSize: 18, opacity: 0.5, flexShrink: 0 }} />}
                                    <Typography variant="body2" sx={{ fontWeight: hasVoted ? 700 : 500, fontSize: "0.88rem", wordBreak: "break-word" }}>{opt.text}</Typography>
                                  </Box>
                                  {!hideResults ? (
                                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", minWidth: 54, flexShrink: 0 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: "monospace", fontSize: "0.85rem", lineHeight: 1.1 }}>{percent}%</Typography>
                                      <Typography variant="caption" sx={{ fontSize: "0.68rem", opacity: 0.65, mt: 0.2 }}>{votes.length} {votes.length === 1 ? "vote" : "votes"}</Typography>
                                    </Box>
                                  ) : (
                                    hasVoted && <Chip size="small" label="Selected" sx={{ height: 18, fontSize: "0.65rem", bgcolor: "rgba(0, 183, 255, 0.15)", color: isDark ? "#00b7ff" : "#0288d1", fontWeight: 600 }} />
                                  )}
                                </Box>
                                {!hideResults && votes.length > 0 && (
                                  <Box sx={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", px: 1.5, pb: 0.8, pt: 0 }}>
                                    <AvatarGroup max={4} sx={{ "& .MuiAvatar-root": { width: 17, height: 17, fontSize: "0.58rem", border: `1.5px solid ${isDark ? "#282828" : "#fff"}` } }}>
                                      {votes.map((uid) => {
                                        const u = memberInfo?.[uid];
                                        return (
                                          <Avatar key={uid} src={safeImageUrl(u?.photoURL)} alt={u?.displayName || "Member"} title={uid === currentUser?.uid ? "You" : u?.displayName || "Member"}>
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
                      </>
                    );
                  })()}
                </Box>
              )}
            </Paper>
          )
        )}

        {/* Detached Reaction Emojis Floating Outside Message Bubble */}
        {renderDetachedReactions()}

        {/* Timestamp */}
        {showTimestamp && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mt: 0.2, mb: 0.4, px: 0.5 }}>
            <Typography variant="caption" sx={{ fontSize: "0.68rem", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)" }}>
              {formatMessageTime(msg.timestamp)}
            </Typography>

            {msg.edited && (
              <Typography variant="caption" sx={{ fontSize: "0.65rem", fontStyle: "italic", color: isDark ? "#777" : "#aaa" }}>
                edited
              </Typography>
            )}

            {isOwn && <DoneAllIcon sx={{ fontSize: 14, color: isDark ? "#777" : "#aaa" }} />}
          </Box>
        )}
      </Box>
    </motion.div>
  );
};

export default React.memo(GroupMessageItem, (prev, next) => {
  return (
    prev.isSelectionMode === next.isSelectionMode &&
    prev.isSelected === next.isSelected &&
    prev.msg.id === next.msg.id &&
    prev.msg.text === next.msg.text &&
    prev.msg.dataUri === next.msg.dataUri &&
    prev.msg.imageUrl === next.msg.imageUrl &&
    prev.msg.images?.length === next.msg.images?.length &&
    prev.msg.edited === next.msg.edited &&
    prev.isOwn === next.isOwn &&
    prev.borderRadius === next.borderRadius &&
    prev.showTimestamp === next.showTimestamp &&
    prev.isHighlighted === next.isHighlighted &&
    prev.effectiveChatTheme === next.effectiveChatTheme &&
    prev.timeline?.length === next.timeline?.length &&
    JSON.stringify(prev.msg.reactions || []) ===
      JSON.stringify(next.msg.reactions || []) &&
    JSON.stringify(prev.msg.cardData) === JSON.stringify(next.msg.cardData) &&
    prev.memberInfo?.[prev.msg.senderId]?.photoURL ===
      next.memberInfo?.[next.msg.senderId]?.photoURL
  );
});